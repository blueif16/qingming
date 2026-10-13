#!/usr/bin/env python3
"""Writes sections/outer_road/people.json: every painted figure and every painted animal of S4 part 1 (u 9400-12600,
map/text/S4.md) at its mapped spot (sections/outer_road/layout.json), doing what it is painted doing, and nobody else
(map/BUILDING.md). The casting is gen/expand/outer_road_needs.md with the lead's calls of 2026-10-12.

Kept as a script so the cast is redone as the workshop delivers: each action step lists the clip the painting wants
first and the nearest clips that exist after it; the script plays the first one the character (or, until it exists,
its stand-in) has in web/public/assets/chars/characters.json, and lists in clips_why what is still to make. Carried
props are switched on only when the playing character's GLB has the prop_<name> part and the figure plays the clip
that holds it (characters/props.json). Nudges and walks are computed here, each with its reason, against the animals,
the vehicles (the kit's real sizes, placed as blender/outer_road_scene.py and gate_scene.py place them), the
buildings, the props and each other; the checks are printed.
    python3 gen/sections/outer_road/make_people.py
"""
import json
import math
import os
import struct

HERE = os.path.dirname(os.path.abspath(__file__))
QM = os.path.abspath(os.path.join(HERE, '../../..'))
J = lambda p: json.load(open(os.path.join(QM, p), encoding='utf-8'))
L = J('sections/outer_road/layout.json')
GATE = J('sections/gate/layout.json')
REG = J('web/public/assets/chars/characters.json')
ANI = J('web/public/assets/animals/animals.json')
PROPS = J('characters/props.json')
for _m, _c in REG.items():   # the registry's own props {name: clip} (the workshop's last batch) win over props.json
    for _n, _clip in (_c.get('props') or {}).items():
        PROPS.setdefault(_m, {})[_n] = {**PROPS.get(_m, {}).get(_n, {}), 'clip': _clip}
FIG = {f['id']: f for f in L['figures']}
E = L['entities']
ANIMALS = {k.split('.')[-1]: e for k, e in E.items() if e['kind'] == 'animal'}


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


# ---------------------------------------------------------------- casting
# the area's new characters play an existing one until the workshop delivers (the lead, 2026-10-12)
STAND_IN = {'soldier': 'idler', 'robed_man': 'scholar', 'fortune_teller': 'official', 'hat_traveller': 'elder'}
STAND_IN_FIG = {'rider_fan_10285': 'sightseer',      # the elder has no ride clip; the sightseer rides
                'man_with_staff_9852': 'inspector'}  # the inspector carries the workshop's staff (prop_staff, talk)
STAND_IN_WHY = {
    'soldier': 'idler (labourer in a hemp jacket and dark head-wrap, the nearest to the belted jacket and dark cap; it '
               'already has the workshop\'s sit_one_knee and squat_sleeves, and the floor sit and crouch)',
    'robed_man': 'scholar (pale long robe, as painted); the man with the staff plays the inspector, whose GLB has the '
                 'workshop\'s staff (prop_staff, held in talk), so the staff he is painted holding shows now',
    'fortune_teller': 'official (seated behind a desk in a dark robe and cap: sit_talk fits him at his table)',
    'hat_traveller': 'elder for the two standing men in dark hats (his tall black hat reads as a dark hat); the rider '
                     'rider_fan_10285 plays the sightseer, which has the ride clip (the elder has only ride_side)',
}
CAST = {
    # the mat-awning stall and the parasol-and-basket stall (behind S5's covered cart)
    'awning_stall_man_9495': 'idler', 'awning_stall_man_arm_raised_9625': 'idler', 'parasol_man_9875': 'idler',
    'dark_robed_man_9885': 'townsman', 'child_by_basket_9915': 'child', 'basket_leaner_10078': 'idler',
    'bearded_man_10142': 'idler', 'waving_man_10155': 'idler', 'crouching_man_10135': 'idler',
    # the talkers at the bottom edge
    'man_with_staff_9852': 'robed_man', 'child_bottom_9885': 'child', 'young_man_bottom_9937': 'carter',
    'seated_man_bottom_9680': 'townsman', 'walker_in_willows_9712': 'robed_man',
    # S5's covered cart: its drivers (the cart and its harness are the gate builder's)
    'ox_driver_seated_9815': 'carter', 'ox_walker_9902': 'robed_man', 'ox_leader_10050': 'carter',
    'striding_man_10148': 'porter',
    # the rider with the fan, the groom with the dark horse
    'rider_fan_10285': 'hat_traveller', 'groom_rider_10255': 'idler', 'groom_10420': 'idler',
    # the second covered cart
    'ox_driver_10635': 'idler', 'carter_whip_10380': 'carter', 'carter_front_10525': 'carter',
    'man_cart_tail_10405': 'idler', 'ox_leader_11017': 'robed_man',
    # the two sedan chairs carried west
    'bearer_bending_10440': 'bearer', 'bearer_straining_10728': 'bearer', 'bearer_east_10982': 'bearer',
    'man_behind_bearer_10755': 'bearer', 'man_long_robe_10605': 'robed_man', 'young_man_canopy_10558': 'idler',
    'walker_behind_sedan_10822': 'porter',
    # the porters at the road's north edge
    'porter_two_bundles_11085': 'porter', 'man_beside_porter_11066': 'porter', 'youth_bending_11138': 'porter',
    # the side road: the pack donkeys' stall, the shop, the temple, the far ground
    'porter_baskets_10347': 'porter', 'person_with_child_10430': 'woman', 'child_in_arms_10430': 'child',
    'drover_10578': 'porter', 'shopkeeper_10425': 'idler', 'monk_side_door_10208': 'monk', 'far_figure_9563': 'porter',
    'man_behind_roof_10068': 'robed_man',
    # the courier post's soldiers (懒兵候主)
    'soldier_lying_11430': 'soldier', 'soldier_hugging_knees_11488': 'soldier', 'soldier_behind_box_11580': 'soldier',
    'soldier_on_stool_11630': 'soldier', 'soldier_knee_up_11792': 'soldier', 'soldier_slumped_11885': 'soldier',
    'soldier_asleep_on_box_12022': 'soldier',
    # the south side: the eating house, the doorway, the man behind the bare tree
    'figure_under_eave_11382': 'robed_man', 'doorway_figure_11738': 'robed_man', 'man_behind_roof_11165': 'robed_man',
    # the fortune-teller (临街神算) and his crowd
    'fortune_teller_12232': 'fortune_teller', 'client_seated_12185': 'robed_man', 'onlooker_cap_12040': 'idler',
    'onlooker_hat_12084': 'hat_traveller', 'onlooker_gesturing_12112': 'idler', 'onlooker_back_12089': 'inspector',
    'onlooker_east_12368': 'robed_man', 'figure_in_shed_back_12382': 'townsman', 'man_behind_roof_12164': 'hat_traveller',
    'man_seated_by_tree_12512': 'idler', 'child_at_table_12597': 'child',
}
CAST_WHY = {
    'bearers': 'the bearer (sedan_carry) for the painted bearers (the lead, 2026-10-12), not the needs list\'s porter',
    'man_behind_bearer_10755': 'bearer, not the needs list\'s idler: the map reads him as perhaps the second bearer of '
                               'the pole, and the east chair, built carried, runs its north pole over his right '
                               'shoulder at his painted spot (pole at D 14.80, 1.3 m up)',
    'man_seated_by_tree_12512': 'idler as listed; he plays the workshop\'s sit_one_knee (one knee up, one leg out): the '
                                'map\'s long wedge from his right knee may be his stretched-out leg',
}

# What each figure is painted doing: steps (candidates, seconds); the first candidate the playing character has is
# used, so the action the painting wants comes first and the nearest existing clips after it.
DO = {
    'awning_stall_man_9495': [(['idle'], 7), (['chat'], 5)],
    'awning_stall_man_arm_raised_9625': [(['hail', 'point'], 6), (['chat'], 5)],
    'parasol_man_9875': [(['idle'], 7), (['chat'], 5)],
    'dark_robed_man_9885': [(['look'], 7), (['idle'], 5)],
    'child_by_basket_9915': [(['idle'], 10)],
    'basket_leaner_10078': [(['browse'], 10), (['idle'], 3)],
    'bearded_man_10142': [(['browse'], 8), (['idle'], 4)],
    'waving_man_10155': [(['hail', 'point'], 6), (['chat'], 5)],
    'crouching_man_10135': [(['squat_sleeves', 'crouch'], 14)],
    'man_with_staff_9852': [(['talk'], 7), (['idle'], 5)],
    'child_bottom_9885': [(['idle'], 10)],
    'young_man_bottom_9937': [(['hand_over'], 6), (['idle'], 5)],
    'seated_man_bottom_9680': [(['squat_sleeves', 'crouch'], 14)],
    'ox_driver_seated_9815': [(['sit'], 8), (['drive_cart'], 8)],
    'ox_walker_9902': [(['idle'], 8), (['talk'], 4)],
    'ox_leader_10050': [(['bridle', 'idle'], 10)],
    'rider_fan_10285': [(['ride_fan', 'ride'], 10)],
    'groom_rider_10255': [(['bridle'], 10), (['idle'], 3)],
    'groom_10420': [(['bridle'], 8), (['idle'], 5)],
    'ox_driver_10635': [(['push_flank', 'push'], 9), (['idle'], 3)],
    'carter_whip_10380': [(['stand_whip', 'idle'], 8), (['idle'], 4)],
    'carter_front_10525': [(['idle'], 10)],
    'man_cart_tail_10405': [(['push'], 9), (['idle'], 3)],
    'ox_leader_11017': [(['hold_rope', 'idle'], 10)],
    'bearer_bending_10440': [(['sedan_carry'], 10)],
    'bearer_straining_10728': [(['sedan_carry'], 10)],
    'bearer_east_10982': [(['sedan_carry'], 10)],
    'man_behind_bearer_10755': [(['sedan_carry'], 10)],
    'man_long_robe_10605': [(['idle'], 9), (['talk'], 4)],
    'young_man_canopy_10558': [(['idle'], 8), (['chat'], 4)],
    'walker_behind_sedan_10822': [(['idle'], 10)],
    'man_beside_porter_11066': [(['idle'], 10)],
    'youth_bending_11138': [(['lift_pole', 'idle'], 8), (['idle'], 4)],
    'person_with_child_10430': [(['hold_child', 'idle'], 12)],
    'child_in_arms_10430': [(['idle'], 10)],
    'drover_10578': [(['idle'], 10)],
    'shopkeeper_10425': [(['idle'], 7), (['chat'], 5)],
    'monk_side_door_10208': [(['idle'], 10)],
    'far_figure_9563': [(['idle'], 10)],
    'man_behind_roof_10068': [(['idle'], 10)],
    'soldier_lying_11430': [(['sleep_side', 'sit_floor'], 30)],
    'soldier_hugging_knees_11488': [(['doze_knees', 'knees_up', 'sit_floor'], 30)],
    'soldier_behind_box_11580': [(['squat_sleeves', 'crouch'], 20)],
    'soldier_on_stool_11630': [(['sit', 'sit_floor'], 24)],
    'soldier_knee_up_11792': [(['sit_one_knee', 'sit_floor'], 24)],
    'soldier_slumped_11885': [(['doze_knees', 'knees_up', 'sit_floor'], 30)],
    'soldier_asleep_on_box_12022': [(['kneel_sleep', 'crouch'], 30)],
    'figure_under_eave_11382': [(['idle'], 10)],
    'doorway_figure_11738': [(['tie_kerchief', 'idle'], 10)],
    'man_behind_roof_11165': [(['idle'], 10)],
    'fortune_teller_12232': [(['tell_fortune', 'sit_talk'], 12), (['sit'], 5)],
    'client_seated_12185': [(['listen', 'sit'], 12)],
    'onlooker_cap_12040': [(['lean_wall', 'arms_folded'], 12), (['idle'], 4)],
    'onlooker_hat_12084': [(['crane', 'idle'], 9), (['idle'], 5)],
    'onlooker_gesturing_12112': [(['hail', 'point'], 7), (['idle'], 4)],
    'onlooker_back_12089': [(['idle'], 8), (['talk'], 4)],
    'onlooker_east_12368': [(['crane'], 7), (['idle'], 6)],
    'figure_in_shed_back_12382': [(['look'], 8), (['idle'], 5)],
    'man_behind_roof_12164': [(['idle'], 10)],
    'man_seated_by_tree_12512': [(['sit_one_knee', 'sit_floor'], 16)],
    'child_at_table_12597': [(['reach', 'idle'], 10)],
}
# what each wanted clip is (the workshop's names where it made them: characters/motions.json, prompts/motion_*.txt)
WANT = {
    'sleep_side': 'lying asleep on the right side, head on the bent arm (workshop motion sleep_side)',
    'doze_knees': 'sitting, knees up, arms folded on them, head bowed onto the arms, asleep (workshop motion doze_knees)',
    'sit_one_knee': 'sitting on the ground, one leg out, the other knee hugged (workshop motion sit_one_knee)',
    'squat_sleeves': 'squatting on the heels, hands in the sleeves at the chest (workshop motion squat_sleeves)',
    'kneel_sleep': 'kneeling curled forward asleep, head and arms on a low box (workshop motion kneel_sleep)',
    'sit': 'the library chair sit (Meshy 33)',
    'tell_fortune': 'seated behind a table, forearms on it, tapping the papers, talking (workshop motion tell_fortune)',
    'listen': 'seated, leaning forward with the forearms on the knees, listening (motion sit_listen)',
    'hail': 'one arm raised high, hailing and calling out (workshop motion hail)',
    'tie_kerchief': 'both hands raised to the head, tying a kerchief (workshop motion tie_kerchief)',
    'reach': 'a small child at a table reaching both arms across it (workshop motion child_reach)',
    'ride_fan': 'riding with a round fan before the face (workshop motion ride_fan)',
    'lift_pole': 'bending to grip a carrying pole low and straining to lift it to the shoulder (workshop motion '
                 'lift_pole)',
    'crane': 'leaning forward from the waist to see and hear (motion crane_listen), retargeted',
    'stand_whip': 'NEW: standing beside a cart with a long whip raised overhead, shouting at the oxen; feet planted '
                  '(the carter\'s walk_whip walks, and his whip is held in drive_cart, a seated clip). Pairs with the '
                  'carter\'s prop_whip',
    'hold_rope': 'NEW: standing ahead of an ox, its halter rope held low behind him in the right hand, glancing back; '
                 'feet planted (the robed man\'s lead walks, and his ox stands in its harness)',
    'push_flank': 'NEW: bending forward against an ox\'s flank, both arms along its body, pushing it on, feet planted '
                  '(the library push, Meshy 261, walks in place meanwhile)',
    'stride_stick': 'NEW (optional): striding with both arms flung out, a long stick in one hand; a walk, in place '
                    '(he walks with walk and the stick now)',
}
NOTES = {
    'hold_child': 'the woman plays hold_child with prop_child_in_arms, and her child (child_in_arms_10430) is '
                  'carried_by her: the page draws it as her prop, so it has no body of its own (the lead, 2026-10-12)',
    'seats': 'fortune_teller_12232 (tell_fortune, sit) and ox_driver_seated_9815 (sit, drive_cart) play chair sits '
             'with no seat mapped under them (map: "feet est under the table"; the driver sits on the front of S5\'s '
             'cart\'s shafts, H 0.9); map/BUILDING.md rule 3 makes a painted-seated figure\'s seat part of it, and no '
             'builder makes these yet, so they sit on air until one does (the driver\'s: the gate builder\'s cart, '
             'whose draught pole passes under him; people.js stands his feet on whatever is under his foot point). '
             'soldier_on_stool_11630 sits on the mapped stool beside him (nudge_why)',
}
# carried props as painted (needs list "Props carried by figures"); shown only with the clip that holds them
PROP_OF = {
    'porter_baskets_10347': 'pole_shallow_baskets', 'porter_two_bundles_11085': 'pole_bundles',
    'ox_driver_seated_9815': 'goad', 'carter_whip_10380': 'whip_stand', 'man_with_staff_9852': 'staff',
    'striding_man_10148': 'stick_stride', 'rider_fan_10285': 'fan_round', 'ox_leader_11017': 'lead_rope',
    'person_with_child_10430': 'child_in_arms',
}
# clips that hold a prop: played only when the playing character's GLB has the prop (never a carry clip without its load)
NEEDS_PROP = {'ride_fan': 'fan_round', 'hold_child': 'child_in_arms', 'stand_whip': 'whip_stand', 'hold_rope': 'lead_rope',
              'stride_stick': 'stick_stride', 'carry_pole': None}
WALK_CLIPS = {'walk', 'carry_pole', 'fan_walk', 'back_load', 'stride_stick', 'quick', 'stroll', 'walk_whip'}

# children: painted height against the adults painted next to them (needs list), turned into a scale of the child
# model (people.js scale multiplies the character's own height; the child is 1.15 m)
CHILD = {
    'child_at_table_12597': (0.55, 1.70, 'the road\'s adults (~155 px against his 84 px)'),
    'child_bottom_9885': (0.45, 'robed_man', 'the man with the staff beside him (~195 px against ~85 px)'),
    'child_by_basket_9915': (0.60, 'townsman', 'the man in the dark robe beside him (~170 px against ~106 px)'),
}
SCALE_ADULT = {'man_beside_porter_11066': (0.85, 'a smaller face beside the porter, possibly a youth (needs list)')}
# figures the map gives no facing: read on the scan beside the restyle (tools/scroll_inspect.mjs outer_road)
FACING = {
    'child_bottom_9885': (260, 'faces the viewer between the two men, turned a little toward the man with the staff'),
    'man_behind_roof_10068': (120, 'seen from behind, his face turned west over his left shoulder'),
    'far_figure_9563': (270, 'too faint to read: faces the viewer, as the restyle paints him'),
}
# painted mid-stride or carrying a load, and not held to a cart, a sedan, an animal or the load at its feet
WALKERS = ['porter_baskets_10347', 'porter_two_bundles_11085', 'walker_in_willows_9712', 'striding_man_10148']
HELD = {
    'youth_bending_11138': 'painted bending to lift the tied bundle at his feet (the map prop S4.prop.tied_bundle_11205, '
                           'built where it is painted), not walking: he stays and lifts (lift_pole)',
    'bearers': 'bearer_bending_10440, bearer_straining_10728, bearer_east_10982, man_behind_bearer_10755 and '
               'walker_behind_sedan_10822 stay with the two chairs, which are built carried and do not move (the lead, '
               '2026-10-12)',
    'drivers': 'ox_walker_9902, carter_whip_10380, carter_front_10525, ox_leader_11017 and groom_rider_10255 are painted '
               'walking with their cart or animal, which stands in its harness or under its rider: they stay with it',
    'drover_10578': 'walks among his pack donkeys, which stand: he stays with them',
}

# ---------------------------------------------------------------- geometry
AREA = L['painted_area']['corners']


def inside(p, poly):
    c, j = False, len(poly) - 1
    for i in range(len(poly)):
        (xi, yi), (xj, yj) = poly[i], poly[j]
        if (yi > p[1]) != (yj > p[1]) and p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi:
            c = not c
        j = i
    return c


def seg_dist(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = 0 if dx == dy == 0 else max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)))
    return math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)


def poly_dist(p, poly):
    """Distance from p to a polygon's boundary, negative inside."""
    d = min(seg_dist(p, poly[i], poly[(i + 1) % len(poly)]) for i in range(len(poly)))
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


def axis(rear, front):
    dx, dy = front[0] - rear[0], front[1] - rear[1]
    n = math.hypot(dx, dy)
    return (dx / n, dy / n), n


# the covered ox carts as the kit builds them (blender/kit_vehicles.py covered_ox_cart defaults: body_len 3.9, body_w
# 1.24, wheel_at 0.56, R 0.85; the body centred on the painted wheel, so its real-size ends run past the painted ones)
CART_KIT = dict(body_len=3.9, body_w=1.24, wheel_at=0.56, R=0.85)


def cart_body(pts):
    rear, front, wheel = pts['rear'][:2], pts['front'][:2], pts['wheel0'][:2]
    f, _ = axis(rear, front)
    s_w = (wheel[0] - rear[0]) * f[0] + (wheel[1] - rear[1]) * f[1]
    bx0 = s_w - CART_KIT['wheel_at'] * CART_KIT['body_len']
    bx1 = bx0 + CART_KIT['body_len']
    mid = (bx0 + bx1) / 2
    ang = math.degrees(math.atan2(f[1], f[0]))
    body = rect((rear[0] + f[0] * mid, rear[1] + f[1] * mid), ang, CART_KIT['body_len'] / 2 + 0.2, CART_KIT['body_w'] / 2)
    wheels = rect((rear[0] + f[0] * s_w, rear[1] + f[1] * s_w), ang, CART_KIT['R'], CART_KIT['body_w'] / 2 + 0.35)
    return dict(rear=rear, f=f, bx0=bx0, bx1=bx1, body=body, wheels=wheels)


CART4 = cart_body(E['S4.veh.covered_ox_cart_10550']['pts'])
CART5 = cart_body(GATE['entities']['S5.veh.covered_ox_cart_9800']['pts'])

# the sedan chairs as blender/outer_road_scene.py vehicles() places them: each chair's poles at their painted ends
# (SEDAN_POLES), its cabin at its painted place on them (the kit's cabin_at); the kit's cabin
# (0.92 along, 0.78 across, its collider 0.05 / 0.12 proud) and its poles at +-(0.39 + 0.075) across, 1.3 m up
KN = L['frames'][0]['dx_knots']


def ux(u, D):
    dx = KN[-1][1]
    if u <= KN[0][0]:
        dx = KN[0][1]
    else:
        for (u0, d0), (u1, d1) in zip(KN, KN[1:]):
            if u <= u1:
                dx = d0 + (d1 - d0) * (u - u0) / (u1 - u0)
                break
    return (u - L['frames'][0]['origin'][0] - dx * D) / 77.0


SEDAN = {}
SEDAN_POLES = {'S4.veh.sedan_chair_10623': (10500, 10725), 'S4.veh.sedan_chair_10810': (10725, 11005)}   # painted u (west
# chair's front end 40 px short of its painted u 10460: its front bearer then stands clear of the dark horse beside him;
# both chairs' poles meet at u 10725 over the middle bearers: blender/outer_road_scene.py vehicles(), fix-S4 2026-10-13)
for eid, (u0, u1) in SEDAN_POLES.items():
    p = E[eid]['pts']
    xc, yc = (p['front'][0] + p['rear'][0]) / 2, (p['front'][1] + p['rear'][1]) / 2
    SEDAN[eid] = dict(xc=xc, yc=yc, x0=ux(u0, yc), x1=ux(u1, yc), poles=(yc - 0.465, yc + 0.465),
                      cabin=[(xc - 0.51, yc - 0.51), (xc + 0.51, yc - 0.51), (xc + 0.51, yc + 0.51), (xc - 0.51, yc + 0.51)])
SW, SE = SEDAN['S4.veh.sedan_chair_10623'], SEDAN['S4.veh.sedan_chair_10810']


def right_of(facing):
    a = math.radians(facing)
    return (math.sin(a), -math.cos(a))


def left_of(facing):
    a = math.radians(facing)
    return (-math.sin(a), math.cos(a))


SHOULDER = 0.18   # sedan_carry holds the pole on the right shoulder, about this far right of the body's centre line


def bearer_on_pole(slug, chair, pole, end=None):
    """Nudge putting a bearer's right shoulder under one of the chair's poles (0 south, 1 north) and, given end ('x0'
    or 'x1'), 0.15 m inside that end of the pole."""
    f = FIG[slug]
    r = right_of(f['facing_deg'])
    x = {'x0': chair['x0'] + 0.15, 'x1': chair['x1'] - 0.15}.get(end, f['X'])
    return [round(x - f['X'], 2), round(chair['poles'][pole] - SHOULDER * r[1] - f['D'], 2)]


# ---------------------------------------------------------------- animals
# species, tack and load as painted (map/text/S4.md); teams stand in their harness; nobody walks on the spot
ANIMAL_SPEC = {
    'ox_shaft_9972': dict(model='ox', do=[['idle', 10]]),
    'ox_far_10045': dict(model='ox', do=[['idle', 10]]),
    'ox_lead_10235': dict(model='ox', do=[['idle', 10]]),
    'ox_shaft_10712': dict(model='ox', do=[['idle', 10]]),
    'ox_lead_10872': dict(model='ox', do=[['idle', 10]]),
    'horse_rider_10205': dict(model='horse', load='saddle', do=[['idle', 9], ['graze', 3]]),
    'horse_dark_10372': dict(model='horse', do=[['graze', 7], ['idle', 5]]),
    'white_horse_lying_11840': dict(model='horse_white', do=[['lie', 12]]),
    'donkey_10190': dict(model='donkey', do=[['graze', 7], ['idle', 5]]),
    'pack_donkey_10487': dict(model='donkey', load='pannier_charcoal', do=[['idle', 9]]),
    'pack_donkey_10571': dict(model='donkey', load='pannier_charcoal', do=[['idle', 9]]),
    'pack_donkey_10632': dict(model='donkey', load='pannier_charcoal', do=[['graze', 7], ['idle', 5]]),
    'pig_10185': dict(model='pig', do=[['graze', 8], ['idle', 4]]),
    'pig_10236': dict(model='pig', do=[['idle', 7], ['graze', 4]]),
    'pig_10262': dict(model='pig', do=[['idle', 7], ['graze', 4]]),
    'pig_dark_10282': dict(model='pig', do=[['idle', 8], ['graze', 3]]),
    'bird_12433': dict(model='bird', do=[['idle', 10]]),
}
# real size against painted place: the pack donkeys and the pig herd are painted overlapping far up the silk (drawn at
# about 0.55 of the street's scale), so at real size their bodies ran into each other. The least total move that
# frees them (searched on a 0.05-0.1 m grid, 5 cm apart, keeping each one's painted heading and the porter's way up
# the side road open) is used
DONKEY_WHY = ('the three pack donkeys are painted overlapping (far up the silk); at real size (1.49 m long, panniers '
              '0.8 m wide) their bodies ran into each other, so they spread the least that frees them, keeping their '
              'painted order and headings and the porter\'s way up the side road')
PIG_WHY = ('the four pigs are painted half over each other; at real size (1.13 m long) the rooting pig and the dark '
           'one at the front ran into the grey-brown pig between them, so those two step the least that frees them')
ANIMAL_NUDGE = {'pack_donkey_10487': [-0.2, -0.1], 'pack_donkey_10571': [0.2, 0.1], 'pack_donkey_10632': [0.9, 0.1],
                'pig_10185': [-0.1, -0.15], 'pig_dark_10282': [0.35, 0.05]}
for s, n in ANIMAL_NUDGE.items():
    ANIMAL_SPEC[s]['nudge'] = n


def animal_body(slug, spec):
    e = ANIMALS[slug]
    model = {'horse_white': 'horse'}.get(spec['model'], spec['model'])
    info = ANI.get(model, {'length_m': 0.3, 'width_m': 0.12})
    k = spec.get('scale', 1)
    w = 0.8 if spec.get('load') == 'pannier_charcoal' else info['width_m']
    fo, hi = e['pts']['fore'], e['pts']['hind']
    ang = spec.get('facing_deg', math.degrees(math.atan2(fo[1] - hi[1], fo[0] - hi[0])))
    nx, nd = spec.get('nudge', [0, 0])
    c = (e['pos'][0] + nx, e['pos'][1] + nd)
    return dict(c=c, ang=ang, hl=info['length_m'] * k / 2, hw=w * k / 2, H=e.get('H', 0),
                poly=rect(c, ang, info['length_m'] * k / 2, w * k / 2))


BODY = {s: animal_body(s, sp) for s, sp in ANIMAL_SPEC.items()}


def push_off(slug, body, clear=0.24):
    """Nudge a figure straight out from an animal's flank so it stands against it (clear = its half-depth + a gap)."""
    f = FIG[slug]
    a = math.radians(body['ang'])
    nrm = (-math.sin(a), math.cos(a))
    side = (f['X'] - body['c'][0]) * nrm[0] + (f['D'] - body['c'][1]) * nrm[1]
    need = body['hw'] + clear
    if abs(side) >= need:
        return None, side
    s = 1 if side >= 0 else -1
    return [round(s * nrm[0] * (need - abs(side)), 2), round(s * nrm[1] * (need - abs(side)), 2)], side


# ---------------------------------------------------------------- figures: nudges (each with its reason)
NUDGE = {}


def nudge(slug, v, why):
    NUDGE[slug] = ([round(v[0], 2), round(v[1], 2)], why)


for slug, beast, who in (('ox_walker_9902', 'ox_shaft_9972', 'the shaft ox'),
                         ('groom_rider_10255', 'horse_rider_10205', 'the rider\'s horse'),
                         ('groom_10420', 'horse_dark_10372', 'the dark horse')):
    v, side = push_off(slug, BODY[beast])
    if v:
        nudge(slug, v, f'painted against {who}\'s flank: his spot is {abs(side):.2f} m from its centre line, inside the '
                       f'real-size {ANIMAL_SPEC[beast]["model"]} (half-width {BODY[beast]["hw"]:.2f} m), so he steps '
                       f'{math.hypot(*v):.2f} m straight out to stand against the flank, on the side he is painted')

f = FIG['man_cart_tail_10405']
along = (f['X'] - CART4['rear'][0]) * CART4['f'][0] + (f['D'] - CART4['rear'][1]) * CART4['f'][1]
m = (CART4['bx0'] - 0.55) - along
nudge('man_cart_tail_10405', (CART4['f'][0] * m, CART4['f'][1] * m),
      f'bent double under the second cart\'s rear door: the kit\'s real-size body (3.9 m, centred on the painted wheel) '
      f'ends {-CART4["bx0"]:.2f} m behind the painted rear point, so his spot was {along - CART4["bx0"]:.2f} m inside '
      f'it; he stands 0.55 m behind its tail, on the cart\'s axis line, his hands on it')

nudge('bearer_bending_10440', bearer_on_pole('bearer_bending_10440', SW, 1, 'x0'),
      f'the front bearer, painted bending east to the west chair\'s pole ends: the builder\'s poles (2.9 m, centred on '
      f'the cabin) end at X {SW["x0"]:.2f}, {SW["x0"] - FIG["bearer_bending_10440"]["X"]:.2f} m east of his spot; he '
      f'stands under their ends, right shoulder under the north pole, carrying them as built')
nudge('bearer_straining_10728', bearer_on_pole('bearer_straining_10728', SE, 0),
      'the middle bearer, painted under the poles between the two chairs: the north poles rest on the second bearer '
      '(man_behind_bearer_10755, whose right shoulder is under them at his painted spot), so he takes the south poles, '
      'his right shoulder under them')
nudge('bearer_east_10982', bearer_on_pole('bearer_east_10982', SE, 1, 'x1'),
      'the rear bearer of the east chair, painted with the pole on his right shoulder: his spot was between the two '
      'poles and just past their east end, so he stands with his right shoulder under the north pole, 0.15 m inside '
      'its end')
f = FIG['man_long_robe_10605']
if f['X'] > SW['cabin'][0][0] - 0.28:
    nudge('man_long_robe_10605', (SW['cabin'][0][0] - 0.28 - f['X'], 0),
          f'stands at the west end of the west chair with a hand on its frame; at real size the cabin (centred at X '
          f'{SW["xc"]:.2f}) reaches his spot, so he stands just west of its west face, between its poles')
f = FIG['walker_behind_sedan_10822']
nudge('walker_behind_sedan_10822', (0, SE['cabin'][2][1] + 0.28 - f['D']),
      'only his legs show beneath the east chair, on its far side: his spot fell inside the cabin, so he stands just '
      'north of it, beside its north pole')
f = FIG['young_man_canopy_10558']
bb = (f['X'], 0)
bx = FIG['bearer_bending_10440']['X'] + NUDGE['bearer_bending_10440'][0][0]
bd = FIG['bearer_bending_10440']['D'] + NUDGE['bearer_bending_10440'][0][1]
need_d = max(SW['poles'][1] + 0.33, bd + math.sqrt(max(0.0, 0.5 ** 2 - (f['X'] - bx) ** 2)))
nudge('young_man_canopy_10558', (0, need_d - f['D']),
      'painted just behind (north of) the west chair\'s north pole, which at his spot ran through his chest at 1.3 m; '
      'he stands clear of it and of the front bearer at its end, under the arched canopy')
f = FIG['soldier_on_stool_11630']
st = E['S4.prop.stool_11662']['pos']
# the soldier's sit is a local retarget whose root (the figure's spot) is under the hips, not at the feet: measured on
# the page (people.js, ?batch=0, 2026-10-12, the S4b join), its Hips bone sits 0.027 m behind the root and 0.013 m to
# its right, 0.62 m above it (hipsY 0.58 after the clip's grounding; the stool's top is 0.45 m: the hip joint rides
# about 0.17 m above the seat), and the feet 0.32-0.42 m in front, facing the figure's facing. The root goes where it
# puts the hips over the stool's centre. (The old nudge took the hips to be 0.4 m behind the feet, as in the chair
# sit of Meshy's action 33, and sat him 0.37 m in front of the stool.)
HIPS_BACK, HIPS_RIGHT = 0.027, 0.013
fa = math.radians(f['facing_deg'])
fwd, right = (math.cos(fa), math.sin(fa)), (math.sin(fa), -math.cos(fa))
root = (st[0] + fwd[0] * HIPS_BACK - right[0] * HIPS_RIGHT, st[1] + fwd[1] * HIPS_BACK - right[1] * HIPS_RIGHT)
nudge('soldier_on_stool_11630', (root[0] - f['X'], root[1] - f['D']),
      'painted seated (seat hidden) at the east end of the document box, by the low stool S4.prop.stool_11662 0.28 m '
      'east of him; the soldier\'s sit is a chair sit, and with nothing under him he would sit on air, so he sits on '
      'that stool (as the restyle reads it), facing the viewer: his sit clip\'s root is under its hips (0.03 m in '
      'front of them), so his spot is the stool\'s centre and his feet rest 0.3-0.4 m in front of it')
nudge('man_beside_porter_11066', (0, 0.55),
      'only his face shows, above the slatted box, and his spot is 0.12 m from its centre; he stands just behind '
      '(north of) it, where the painting hides his body')
nudge('shopkeeper_10425', (-0.2, 0.7),
      'painted behind his tray stand, but his foot point lies in front of it (the builder stands the stand at D '
      '24.43-24.83, X 16.6-17.0); he stands just behind it, inside the shop\'s open front')
CARRIED = {'child_in_arms_10430': ('person_with_child_10430',
                                   'carried at the woman\'s shoulder, as painted: drawn by her child_in_arms prop while she '
                                   'plays hold_child (people.json carried_by), so it has no body of its own (lead, '
                                   '2026-10-12)')}
nudge('onlooker_hat_12084', (-0.08, 0), 'stands 0.36 m from the gesturing man on the map; each steps 0.08 m aside so '
      'their bodies do not overlap')
nudge('onlooker_gesturing_12112', (0.08, 0), 'stands 0.36 m from the man in the dark hat on the map; each steps 0.08 m '
      'aside so their bodies do not overlap')
nudge('child_at_table_12597', (-0.3, 0), 'his foot point is 0.04 m inside the painted area\'s east edge (u 12600, the '
      'edge wall); he steps 0.3 m west so his body stands inside it, reaching east toward the table beyond the seam')
# the driver seated on the front of S5's covered cart: kit_vehicles.covered_ox_cart now builds a driver's seat and a
# footboard and returns .seat; for S5's cart (built by gate_scene.py) it is (17.823, 2.965, 1.07, facing -1.8) (the
# lead, 2026-10-12). He sits there with a sit clip; with outer_road loaded alone the cart (S5's) is absent and he sits
# in the air (accepted).
SEAT5 = (17.823, 2.965, 1.07, -1.8)
f = FIG['ox_driver_seated_9815']
nudge('ox_driver_seated_9815', (SEAT5[0] - f['X'], SEAT5[1] - f['D']),
      'seated on the driver\'s seat the vehicle kit builds on the front of S5.veh.covered_ox_cart_9800 (its .seat: '
      'X 17.823, D 2.965, 1.07 m up, facing east): the gate builder makes the cart at real size from its painted wheel, '
      'so its front, and the seat, end 1.4 m short of his painted spot on the footboard')
mid, east = BODY['pack_donkey_10571'], BODY['pack_donkey_10632']
f = FIG['drover_10578']
nudge('drover_10578', ((mid['c'][0] + east['c'][0]) / 2 - f['X'], max(mid['c'][1], east['c'][1]) + 0.8 - f['D']),
      'painted as a head between the loads of the middle and east donkeys, his spot on the middle donkey; at real '
      'size he stands in the gap behind (north of) their loads')

# ---------------------------------------------------------------- obstacles for walks and checks
BLOCK = []   # (name, polygon)
for k, e in E.items():
    if e['kind'] in ('building', 'structure') and e.get('footprint'):
        BLOCK.append((k, e['footprint']))
for k in ('S4.prop.table_11292', 'S4.prop.table_12183'):
    BLOCK.append((k, E[k]['footprint']))
dl = E['S4.grd.ditch_11570']['lines']
BLOCK.append(('S4.grd.ditch_11570', dl['bank_n'] + dl['bank_s_e'][::-1] + dl['bank_s_w'][::-1]))
BLOCK += [('S4.veh.covered_ox_cart_10550', CART4['body']), ('S4.veh.covered_ox_cart_10550 wheels', CART4['wheels']),
          ('S5.veh.covered_ox_cart_9800', CART5['body']), ('S5.veh.covered_ox_cart_9800 wheels', CART5['wheels']),
          ('S4.veh.sedan_chair_10623', SW['cabin']), ('S4.veh.sedan_chair_10810', SE['cabin'])]
DISCS = []   # (name, centre, radius): point props, the stall's posts, the trunks the builder gives colliders
R_PROP = {'big_basket_10000': 0.75, 'parasol': 0.06, 'mat_awning': None, 'mat_canopy': None, 'sign_': None,
          'spear': 0.05, 'banner': 0.06, 'red_pole': 0.06, 'guardian': 0.5, 'stall_shed': None, 'table_': None,
          'cone': None, 'stick_on_road': None, 'hanging_goods': None}
for k, e in E.items():
    if e['kind'] != 'prop':
        continue
    s, r = k.split('.')[-1], 0.3
    for key, rr in R_PROP.items():
        if s.startswith(key) or key in s:
            r = rr
    if r:
        DISCS.append((k, tuple(e['pos']), r))
for p in E['S4.prop.stall_shed_10470']['footprint']:
    DISCS.append(('S4.prop.stall_shed_10470 post', tuple(p), 0.08))
for t in L['trees']:
    if t.get('scale', 1) >= 1.0:
        DISCS.append((f'S4.tree.{t["id"]}', (t['X'], t['D']), 0.35))
for t in GATE['trees']:
    if t['X'] > 10:
        DISCS.append((f'S5.tree.{t["id"]}', (t['X'], t['D']), 0.35))


def standing():
    """Where every figure that isn't a walker stands (its spot plus its nudge)."""
    return {s: (FIG[s]['X'] + NUDGE.get(s, ([0, 0],))[0][0], FIG[s]['D'] + NUDGE.get(s, ([0, 0],))[0][1])
            for s in FIG if s not in WALKERS and s != 'rider_fan_10285'}


def clearance(p, people=True):
    """Room from p to the nearest building, structure, vehicle, prop, trunk, animal, standing figure or the edge."""
    d, who = -poly_dist(p, AREA), 'the painted area\'s edge'
    for name, poly in BLOCK + [(f'animal {s}', b['poly']) for s, b in BODY.items() if b['H'] < 1]:
        dd = poly_dist(p, poly)
        if dd < d:
            d, who = dd, name
    for name, c, r in DISCS + ([(f'figure {s}', q, 0.0) for s, q in standing().items()] if people else []):
        dd = math.hypot(p[0] - c[0], p[1] - c[1]) - r
        if dd < d:
            d, who = dd, name
    return d, who


# ---------------------------------------------------------------- walks
BODY_R = 0.3
WALK_LEN = 7.0
WALK_START = {
    'porter_two_bundles_11085': ((0.45, 0.0), 'his spot is 0.24 m from the slatted box\'s centre (the box stands in '
                                 'front of his legs), so his walk south starts 0.45 m east of it, past the box'),
}


def walk_path(slug):
    f = FIG[slug]
    a = math.radians(f['facing_deg'])
    d = (math.cos(a), math.sin(a))
    sh = WALK_START.get(slug, ((0, 0), ''))[0]
    o = (f['X'] + sh[0], f['D'] + sh[1])

    def run(sign, limit):
        best, stop = 0.0, ''
        for i in range(1, 200):
            s = i * 0.05
            if s > limit:
                break
            c, who = clearance((o[0] + sign * d[0] * s, o[1] + sign * d[1] * s))
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
    if slug in WALK_START:
        why += '; ' + WALK_START[slug][1]
    return path, fwd + back, why


# ---------------------------------------------------------------- people.json
def playing(slug, c):
    return c if c in REG else (STAND_IN_FIG.get(slug) or STAND_IN[c])


wanted = {}       # clip -> {character: [figures]}
props_note = {}


def steps_for(slug, c, model):
    out = []
    for cands, secs in DO[slug]:
        have = [x for x in cands if x in REG[model]['clips']
                and not (NEEDS_PROP.get(x) and f'prop_{NEEDS_PROP[x]}' not in glb_parts(model))]
        clip = have[0] if have else 'idle'
        if cands[0] not in REG.get(c, {}).get('clips', []) or clip != cands[0]:
            wanted.setdefault(cands[0], {}).setdefault(c, []).append(slug)
        if out and out[-1][0] == clip:          # two steps that play the same clip are one
            out[-1][1] += secs
        else:
            out.append([clip, secs])
    return out


def props_for(slug, model, clips):
    """The figure's painted prop, if the playing character's GLB has it and one of the figure's clips holds it."""
    p = PROP_OF.get(slug)
    if not p:
        return None
    spec = PROPS.get(model, {}).get(p)
    if f'prop_{p}' not in glb_parts(model) or not spec:
        props_note[slug] = f'{p}: off ({model} has no prop_{p} yet)'
        return None
    if spec.get('clip') not in clips:
        props_note[slug] = f'{p}: off ({model} holds it in {spec.get("clip")}, which this figure does not play)'
        return None
    props_note[slug] = f'{p}: on ({model}, held in {spec["clip"]})'
    return [p]


people = {
    'about': 'Who the outer road\'s people and animals are and what they do: every painted figure and animal of S4 part 1 '
             '(map/text/S4.md, u 9400-12600) at its mapped spot (layout.json), and nobody else (map/BUILDING.md). '
             'Written by gen/sections/outer_road/make_people.py (the casting of gen/expand/outer_road_needs.md and the '
             'lead\'s calls of 2026-10-12); rerun it when the workshop delivers characters, clips and props. figures: '
             'character (a new one plays its stand_in until it exists), do = [clip, seconds] cycles with clips the '
             'playing character has (clips_why: what is still to make), nudge = [dX, dD] (nudge_why), facing_deg where '
             'the map gives none (facing_why), scale for children (scale_why), ride = the animal a rider sits on, '
             'props = carried prop_<name> parts (props_why). walkers: figures painted mid-stride or carrying a load, '
             'walking along their painted direction from their spot and back (walkers_why). animals: each painted '
             'animal at its map position facing hind to fore, model and load from '
             'web/public/assets/animals/animals.json (horse_white, bird and the pannier_charcoal load are being made: '
             'the page skips them until then). No traffic.',
    'figures': {}, 'nudge_why': {}, 'walkers': [], 'walkers_why': {}, 'animals': {}, 'animals_why': {},
    'clips_why': {}, 'scale_why': {}, 'facing_why': {}, 'cast_why': {}, 'props_why': {},
}
assert not [s for s in FIG if s not in CAST], 'figures without a cast'
assert not [s for s in CAST if s not in FIG], 'cast for figures not in the layout'

scale_of = {}
for s, (r, ref, why) in CHILD.items():
    h_ref = ref if isinstance(ref, float) else height(ref)
    scale_of[s] = round(r * h_ref / height('child'), 2)
    people['scale_why'][s] = (f'painted about {r} of {why}: {r} x {h_ref:.2f} m / the child model\'s '
                              f'{height("child"):.2f} m = {scale_of[s]} ({scale_of[s] * height("child"):.2f} m tall)')
for s, (k, why) in SCALE_ADULT.items():
    scale_of[s] = k
    people['scale_why'][s] = f'{k} of the porter: {why}'
people['scale_why']['about'] = ('people.js scale multiplies the playing character\'s own height, so each child\'s painted '
                                'ratio to its neighbouring adults becomes a scale of the 1.15 m child model')

for slug in sorted(FIG, key=lambda s: FIG[s]['X']):
    c = CAST[slug]
    model = playing(slug, c)
    if slug in WALKERS:
        path, length, why = walk_path(slug)
        w = {'id': slug, 'figure': slug, 'character': c}
        if c not in REG:
            w['stand_in'] = model
        pspec = PROPS.get(model, {}).get(PROP_OF.get(slug, ''), {})
        clip = pspec.get('clip') if pspec.get('clip') in WALK_CLIPS else 'walk'
        pr = props_for(slug, model, [clip])
        if not pr:
            clip = 'walk'
        else:
            w['props'] = pr
        w.update({'clip': clip, 'speed': 0.85 if clip == 'carry_pole' else 1.0, 'pause': ['idle', 3], 'path': path})
        if slug in scale_of:
            w['scale'] = scale_of[slug]
        if slug == 'striding_man_10148' and clip != 'stride_stick':
            wanted.setdefault('stride_stick', {}).setdefault(c, []).append(slug)
        people['walkers'].append(w)
        people['walkers_why'][slug] = why
        continue
    spec = {'character': c}
    if slug in CARRIED:
        spec['carried_by'] = CARRIED[slug][0]
        people['nudge_why'][slug] = CARRIED[slug][1]
    if c not in REG:
        spec['stand_in'] = model
    spec['do'] = steps_for(slug, c, model)
    pr = props_for(slug, model, [x[0] for x in spec['do']])
    if pr:
        spec['props'] = pr
    if slug in scale_of:
        spec['scale'] = scale_of[slug]
    if slug in FACING:
        spec['facing_deg'] = FACING[slug][0]
        people['facing_why'][slug] = FACING[slug][1]
    if slug in NUDGE:
        spec['nudge'] = NUDGE[slug][0]
        people['nudge_why'][slug] = NUDGE[slug][1]
    people['figures'][slug] = spec

people['figures']['rider_fan_10285']['ride'] = 'horse_rider_10205'
people['walkers_why']['held'] = HELD
people['cast_why'] = {**{f'stand_in {c}': w for c, w in STAND_IN_WHY.items()}, **CAST_WHY}
people['props_why'] = dict(props_note)
PROP_WANTED = {
    'man_with_staff_9852': 'prop_staff on the robed_man, held in talk (as the inspector\'s)',
    'rider_fan_10285': 'prop_fan_round on the hat_traveller, held in ride_fan (he rides with ride until it is on)',
    'carter_whip_10380': 'the carter\'s prop_whip held in a standing clip (stand_whip, clips_why)',
    'youth_bending_11138': 'a plain carrying pole (no load) held in the porter\'s lift_pole: its far end rests on the map '
                           'prop S4.prop.tied_bundle_11205, built where it is painted',
}
people['props_why']['wanted'] = {s: t for s, t in PROP_WANTED.items()
                                 if s not in PROP_OF or props_note.get(s, 'off').split(': ', 1)[-1].startswith('off')}
people['props_why']['about'] = ('carried props as painted (needs list "Props carried by figures"), switched on only when '
                                'the playing character\'s GLB has prop_<name> and the figure plays the clip that holds '
                                'it (characters/props.json): never a carry clip without its load, never a prop in the '
                                'wrong hands')

for s, sp in ANIMAL_SPEC.items():
    people['animals'][s] = dict(sp)
    if s.startswith('pig'):
        a = ANIMALS[s]['pts']
        (fx, fd, _), (hx, hd, _) = a['fore'], a['hind']
        Lh = math.hypot(fx - hx, fd - hd)
        nx, nd = sp.get('nudge', [0, 0])
        x0, d0 = ANIMALS[s]['pos'][0] + nx, ANIMALS[s]['pos'][1] + nd
        people['animals'][s]['path'] = [[round(x0, 2), round(d0, 2)],
                                        [round(x0 + 3.2 * (fx - hx) / Lh, 2), round(d0 + 3.2 * (fd - hd) / Lh, 2)]]
people['animals_why'] = {
    'models': 'species as painted (map/text/S4.md): 5 oxen, 3 horses (the fan rider\'s, the dark one held by the groom, '
              'the white one lying in the courier post\'s yard: horse_white), 4 donkeys, 4 pigs and a small black bird '
              'in the big willow (bird)',
    'teams': 'S5\'s covered cart\'s three oxen (ox_shaft_9972, ox_far_10045, ox_lead_10235; the gate builder\'s harness '
             'reaches to their map spots) and the second cart\'s two (ox_shaft_10712, ox_lead_10872) stand in their '
             'harness with an idle; none walks on the spot, and none is nudged, since each cart\'s harness is built to '
             'their map spots',
    'loads': 'the fan rider\'s horse carries a saddle (hidden behind the groom and the cart in the painting; the rider '
             'sits on it); the three pack donkeys carry the wicker pannier frames heaped with dark lumpy goods '
             '(pannier_charcoal); the grey donkey, the dark horse, the white horse and the pigs carry '
             'nothing painted',
    'doing': 'the head-down ones graze (the grey donkey, the east pack donkey, the dark horse, the rooting pig); the fan '
             'rider\'s horse, painted with its head hanging low, lowers it now and then; the white horse lies; the pack '
             'donkeys stand and root on the spot',
    'pigs': 'the pig herd is painted walking east along the top road: each pig walks 3.2 m along its painted heading and '
            'back (lead, 2026-10-12)',
    'perched': 'the bird sits 9.5 m up in the big willow (layout H, support perched; the page places a perched animal at '
               'its H)',
    'nudges': {**{s: DONKEY_WHY for s in ANIMAL_NUDGE if 'donkey' in s}, **{s: PIG_WHY for s in ANIMAL_NUDGE if 'pig' in s}},
}

# clips_why: what is still to make (or retarget), per clip and character
plans = {c: set(plan(c).get('clips', {})) for c in CAST.values()}
cw = {}
for clip, by in sorted(wanted.items()):
    for c, slugs in sorted(by.items()):
        now = sorted({people['figures'][s]['do'][0][0] for s in slugs if s in people['figures']})
        if clip in REG.get(c, {}).get('clips', []) and NEEDS_PROP.get(clip):
            state = f'has it; needs prop_{NEEDS_PROP[clip]} held in it'
        elif clip in plans.get(c, set()):
            state = f'being made (characters/{c}.json)'
        else:
            state = 'to make'
        cw.setdefault(clip, []).append(f'{c} [{state}]: {", ".join(slugs)}' + (f' (plays {"/".join(now)} now)' if now else ''))
people['clips_why'] = {
    'about': 'Actions the painting needs that the playing character lacks. "being made": the workshop has it in the '
             'character\'s characters/<name>.json; "to make": nobody has it for that character yet (NEW: a new action; '
             'otherwise a retarget of an existing motion). Rerun make_people.py when they land; until then each figure '
             'plays the nearest clip its character, or stand-in, has.',
    **{clip: f'{WANT.get(clip, "")} -- ' + '; '.join(v) for clip, v in cw.items()},
    'notes': NOTES,
}

# the details pass's contact fixes (sections/outer_road/contact_fixes.json: solved nudges and turns, recasts, IK clip
# variants; gen/details/contacts/fix_standard.md) are applied last, and the checks below see them
import sys
sys.path.insert(0, os.path.join(QM, 'tools'))
from contact_fixes import apply as apply_contact_fixes
apply_contact_fixes(people, 'outer_road')
for _s, _f in people['figures'].items():
    if _f.get('nudge') and _f['nudge'] != NUDGE.get(_s, ([0, 0],))[0]:
        NUDGE[_s] = (_f['nudge'], people['nudge_why'].get(_s, ''))

out = os.path.join(QM, 'sections/outer_road/people.json')
json.dump(people, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- checks
nf, nw = len(people['figures']), len(people['walkers'])
print(f'{nf} figures at their spots, {nw} walkers ({nf + nw} of {len(FIG)}), '
      f'{sum(1 for f in people["figures"].values() if f.get("ride"))} rider, {len(people["animals"])} animals '
      f'(of {len(ANIMALS)})')
for w in people['walkers']:
    L_ = math.dist(*w['path'])
    print(f'  walk {w["id"]}: {w["clip"]} {L_:.1f} m {w["path"]}  {people["walkers_why"][w["id"]]}')
pos = dict(standing())
pos['rider_fan_10285'] = None
for w in people['walkers']:
    sh = WALK_START.get(w['id'], ((0, 0),))[0]
    pos[w['id']] = (FIG[w['id']]['X'] + sh[0], FIG[w['id']]['D'] + sh[1])
EXPECTED_INSIDE = {   # painted inside a building or at a table: the builder's opening or the seat's place
    ('shopkeeper_10425', 'S4.bld.shop_house_10400'): 'in the shop\'s open front',
    ('figure_under_eave_11382', 'S4.bld.south_hall_11450'): 'at the back of the eating house\'s open front',
    ('doorway_figure_11738', 'S4.bld.south_pavilion_11760'): 'in its doorway',
    ('client_seated_12185', 'S4.prop.table_12183'): 'feet under the table\'s end, seated at it',
    ('fortune_teller_12232', 'S4.prop.table_12183'): 'feet under the table, seated behind it',
}
issues, expected = [], []
scl = lambda s: people['figures'].get(s, {}).get('scale', 1)
ids = sorted(s for s in pos if pos[s])
for i, a in enumerate(ids):
    for b in ids[i + 1:]:
        d = math.dist(pos[a], pos[b])
        if d < 0.23 * (scl(a) + scl(b)) and {a, b} != {'person_with_child_10430', 'child_in_arms_10430'}:
            issues.append(f'figures {a} and {b} {d:.2f} m apart')
for s in ids:
    p = pos[s]
    for a, b in BODY.items():
        if b['H'] < 1 and poly_dist(p, b['poly']) < 0.15:
            issues.append(f'figure {s} {poly_dist(p, b["poly"]):+.2f} m from animal {a}')
    for name, poly in BLOCK:
        dd = poly_dist(p, poly)
        if dd < 0.1:
            (expected if (s, name) in EXPECTED_INSIDE else issues).append(
                f'figure {s} {dd:+.2f} m from {name}' + (f' ({EXPECTED_INSIDE[(s, name)]})' if (s, name) in EXPECTED_INSIDE else ''))
    if poly_dist(p, AREA) > -0.26:
        issues.append(f'figure {s} {-poly_dist(p, AREA):.2f} m inside the painted area\'s edge')
an = sorted(BODY)
for i, a in enumerate(an):
    for b in an[i + 1:]:
        if BODY[a]['H'] < 1 and BODY[b]['H'] < 1 and polys_overlap(BODY[a]['poly'], BODY[b]['poly']):
            issues.append(f'animals {a} and {b} overlap (real size)')
    for name, poly in BLOCK:
        if BODY[a]['H'] < 1 and polys_overlap(BODY[a]['poly'], poly):
            issues.append(f'animal {a} overlaps {name} (real size)')
print('expected (painted so):')
for x in expected:
    print('   ', x)
print('checks:', 'none' if not issues else '')
for x in issues:
    print('   ', x)
print('to make / being made:', ', '.join(k for k in people['clips_why'] if k not in ('about', 'notes')))
print('props:', json.dumps(props_note, ensure_ascii=False))
print('wrote', os.path.relpath(out, QM))
