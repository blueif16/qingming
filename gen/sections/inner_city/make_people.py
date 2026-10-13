#!/usr/bin/env python3
"""Writes sections/inner_city/people.json: every painted figure and animal of S6 (map/text/S6.md) at its painted spot,
cast from gen/sections/inner_city/cast.json (the casting of gen/expand/inner_city_needs.md), with what it is painted
doing. Kept as a script so the cast can be redone when the workshop's new characters and actions arrive; the
choices (actions, nudges, walks) are written here with their reasons and copied into people.json.
    python3 gen/sections/inner_city/make_people.py
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
QM = os.path.abspath(os.path.join(HERE, '../../..'))
L = json.load(open(os.path.join(QM, 'sections/inner_city/layout.json')))
cast = json.load(open(os.path.join(HERE, 'cast.json')))
char_of = {s: c for c, lst in cast.items() for s in lst.split()}
figs = {f['id']: f for f in L['figures']}
WORLD = {e['id']: e for e in json.load(open(os.path.join(QM, 'map/world/S6.json')))['entities']}
MOVED = L.get('moved') or {}
PREV = {}
try:
    PREV = json.load(open(os.path.join(QM, 'sections/inner_city/people.json')))
except (OSError, ValueError):
    pass

CH = json.load(open(os.path.join(QM, 'web/public/assets/chars/characters.json')))
# a new character plays an existing one until the workshop delivers it (people.json stand_in); all ten S6 asked for
# are delivered (2026-10-12), so none is left
STAND_IN = {k: v for k, v in {'child': 'idler', 'child_robed': 'idler', 'woman': 'official', 'monk': 'townsman',
            'bearer': 'porter', 'storyteller': 'inspector', 'butcher': 'idler', 'scholar': 'sightseer',
            'elder': 'townsman', 'archer': 'carter'}.items() if k not in CH}
# painted seated, but the character of their look has no sit clip yet (requested in clips_why): cast as the nearest
# look that can sit, so they sit on their painted seats; and a man with a pole cast as the porter, who holds a stick
# (the idler and the inspector have sit since 2026-10-12: the man on the stool and the man on the high seat play the
# characters of their dress again)
RECAST = {          'jie_listener_west_2062': ('official', 'painted seated in a dark robe: the sightseer (cornflower robe) has no sit clip; the official (dark robe) sits'),
          'pole_walker_2341': ('porter', 'painted striding with a long thin pole held upright: the porter carries a stick in his walk (prop stick); the idler has no pole')}
for _s, (_c, _w) in RECAST.items():
    char_of[_s] = _c
# children: painted height as a fraction of an adult's (~2.4 m painted; far ones on the top street by eye); people.js
# scales the character's own model, so the fraction is rebased below on the child model's height (x 1.70 m adult / its
# height_m)
FRAC = {'boy_5050': 0.72, 'child_on_shoulders_4977': 0.5, 'boy_from_behind_4630': 0.7, 'child_3885': 0.66,
         'child_listener_3812': 0.56, 'child_ring_edge_3577': 0.72, 'servant_boy_bundle_3270': 0.66, 'small_child_3035': 0.46,
         'child_by_dark_robe_2880': 0.66, 'child_on_back_2795': 0.5, 'boy_dark_robe_2380': 0.7, 'boy_short_jacket_2229': 0.72,
         'jie_child_2143': 0.45}
SCALE, SCALE_WHY = {}, {}
for _s, _f in FRAC.items():
    _h = CH[char_of[_s]]['height_m']
    SCALE[_s] = round(_f * 1.70 / _h, 2)
    SCALE_WHY[_s] = f'painted {_f} of an adult: {_f} x 1.70 m / the {char_of[_s]} model\'s {_h} m = {SCALE[_s]} ({_f * 1.70:.2f} m tall)'

# what each figure is painted doing: [clip, seconds] cycles. Clips the character lacks fall back to idle (people.js),
# so a requested action (gen/expand/inner_city_needs.md, "Actions") plays as soon as the workshop adds it
SIT = [['sit', 10], ['sit_talk', 6]]
FLOOR = [['sit_floor', 14]]
DO = {
    # 孙羊正店
    'drinker_upper_5547': [['drink', 8], ['sit', 6]], 'drinker_upper_5140': [['drink', 7], ['sit_talk', 6]],
    'upper_storey_figure_4810': [['sit', 9], ['drink', 6]], 'upper_standing_5452': [['talk', 6], ['idle', 5]],
    'shop_interior_seated_4752': SIT, 'shop_interior_faint_4905': [['idle', 6], ['look', 5]],
    'doorman_5015': [['idle', 7], ['talk', 4]], 'capped_man_5090': [['idle', 6], ['talk', 5]],
    'man_hands_raised_5180': [['adjust_cap', 6], ['idle', 5]],
    'seated_man_stool_4441': [['sit', 12], ['sit_talk', 5]], 'basket_man_4590': [['talk', 6], ['argue', 4], ['idle', 3]],
    'old_man_tall_hat_4666': [['talk', 6], ['idle', 5]], 'young_man_white_robe_4705': [['look', 6], ['idle', 5]],
    'boy_from_behind_4630': [['idle', 6], ['look', 5]], 'man_black_hat_4742': [['look', 6], ['idle', 5]],
    'man_dark_robe_greeting_4772': [['bow', 5], ['talk', 6]], 'man_back_turned_4845': [['bow', 5], ['look', 6]],
    'man_black_cap_from_behind_4878': [['look', 7], ['idle', 4]], 'man_behind_stooping_4925': [['look', 6], ['idle', 5]],
    'youth_hair_bun_stick_4950': [['idle', 12]], 'man_child_on_shoulders_4975': [['carry_child', 12]],
    'child_on_shoulders_4977': [['ride', 10]],
    # the sedans
    'sedan_passenger_4362': [['sit', 14]],
    'sedan_bearer_far_4462': [['carry_pole', 10]], 'sedan_bearer_near_4530': [['carry_pole', 10]],
    'sedan_rear_bearer_4195': [['carry_pole', 10]], 'sedan_bearer_rear_near_4668': [['carry_pole', 10]],
    'sedan_bearer_rear_far_4735': [['carry_pole', 10]], 'sedan_bearer_front_near_4907': [['carry_pole', 10]],
    'sedan_bearer_front_far_4943': [['carry_pole', 10]], 'sedan_attendant_4590': [['idle', 6], ['look', 5]],
    'sedan_attendant_4255': [['idle', 6], ['look', 5]], 'man_below_sedan_4343': [['look', 6], ['idle', 5]],
    # the sack cart and its team, the depot, the south edge
    'donkey_leader_5088': [['lead', 9], ['idle', 3]], 'tall_carter_5385': [['lean_wall', 10], ['idle', 4]],
    'bearded_carter_5428': [['idle', 6], ['look', 5]], 'dark_figure_5440': [['idle', 8]],
    'walking_carter_5537': [['idle', 6], ['look', 5]], 'archer_waistguard_5465': [['tie_sash', 8], ['idle', 4]],
    'pole_man_5578': [['stand_pole', 10], ['idle', 3]], 'crouching_dark_5515': [['crouch', 12]], 'groom_5290': [['hold_bridle', 9], ['idle', 3]],
    'rider_5335': [['ride', 10]], 'head_behind_ridge_5103': [['look', 7], ['idle', 5]],
    # the stalls before 孙羊店 and the 正店's west end
    'seated_man_highseat_4070': SIT, 'young_man_4108': [['idle', 6], ['talk', 5]], 'man_bending_tray_4190': [['bend_goods', 8], ['idle', 3]],
    'man_red_jar_4005': [['idle', 6], ['look', 5]], 'youth_umbrella_4028': [['idle', 8], ['talk', 4]],
    'round_face_man_4092': [['talk', 6], ['idle', 5]], 'man_by_boxes_4115': [['look', 8], ['idle', 4]],
    # the corner shop: the butcher, the storyteller and his ring
    'butcher_3920': [['chop', 8], ['idle', 3]], 'storyteller_3822': [['tell', 16], ['point', 4]],
    'ring_bending_3668': [['listen_lean', 10], ['look', 4]], 'ring_bending_hat_3748': [['listen_lean', 10], ['look', 4]],
    'ring_fan_cap_3688': [['fan', 8], ['look', 5]], 'listener_purple_robe_3958': [['look', 8], ['idle', 4]],
    # the top street (the far row)
    'robed_man_3808': [['bow', 5], ['talk', 6]], 'light_jacket_man_3845': [['chat', 6], ['idle', 5]],
    'doorway_man_4026': [['idle', 7], ['look', 4]], 'shop_person_3991': [['idle', 8]], 'child_3885': [['idle', 6], ['look', 5]],
    'cloth_shop_seated_3752': SIT, 'cloth_shop_seated_3640': SIT, 'cloth_shop_standing_3686': [['idle', 6], ['look', 5]],
    'barrow_pusher_3390': [['steer', 9], ['idle', 3]], 'top_edge_figure_3332': [['idle', 8]],
    'lattice_frame_west_3092': [['lift', 8], ['idle', 3]], 'lattice_frame_east_3180': [['lift', 8], ['idle', 3]],
    # the crossroads: the wagon, the rider, the scholars, the greeting, the porters
    'wagon_shaft_carter_3642': [['steer_wagon', 9], ['idle', 3]], 'wagon_top_rider_3740': [['sit', 12]],
    'wagon_side_man_3796': [['idle', 6], ['look', 5]], 'upper_team_driver_3450': [['drive_team', 10], ['idle', 3]],
    'rider_3375': [['ride', 10]], 'groom_whip_3452': [['hold_whip', 8], ['idle', 4]],
    'scholar_front_3240': [['talk', 7], ['idle', 5]], 'scholar_back_3203': [['talk', 6], ['look', 5]],
    'young_man_case_3340': [['hand_over', 6], ['idle', 5]], 'bowing_dark_robe_3470': [['bow', 6], ['idle', 4]],
    'bearded_light_robe_3508': [['bow', 5], ['talk', 5]], 'dark_robe_reaching_3570': [['hand_over', 6], ['idle', 5]],
    'pointing_man_3405': [['point', 6], ['idle', 5]], 'ridge_dark_robe_3575': [['idle', 8]], 'ridge_reclining_3530': [['lie', 14]],
    'child_ring_edge_3577': [['idle', 8]],
    # the inn upstairs
    'scholar_upstairs_3912': [['write', 12], ['sit', 6]], 'window_face_4155': [['look', 8], ['idle', 4]],
    'seated_cap_man_3905': SIT, 'crouching_man_3890': [['crouch', 12]], 'fan_man_3972': [['fan', 8], ['idle', 4]],
    # the incense shop and the umbrella crowd
    'handcart_man_3130': [['steer', 9], ['idle', 3]], 'tray_vendor_3050': [['hold_tray', 8], ['talk', 4]],
    'white_jacket_stand_3072': [['idle', 7], ['chat', 5]], 'arms_folded_2993': [['arms_folded', 9], ['look', 4]],
    'small_child_3035': [['idle', 8]], 'garment_seller_3100': [['show_garment', 8], ['talk', 4]], 'monk_3060': [['talk', 6], ['idle', 5]],
    'dark_robe_cap_3022': [['look', 6], ['talk', 5]], 'light_robe_2965': [['talk', 6], ['idle', 5]], 'robed_hat_3002': [['talk', 6], ['idle', 5]],
    'man_carrying_child_2790': [['carry_child', 12]], 'child_on_back_2795': [['idle', 10]],
    'dark_coat_2700': [['hand_over', 6], ['talk', 5]], 'round_face_robe_2641': [['hand_over', 5], ['talk', 6]],
    'child_by_dark_robe_2880': [['cling', 10]], 'wine_cart_driver_2945': [['drive_cart', 10], ['sit', 4]],
    'young_man_cart_rear_2675': [['push_flank', 9], ['idle', 3]], 'bending_man_2638': [['bend_goods', 8], ['idle', 4]],
    'man_behind_tree_3040': [['crane', 8], ['idle', 5]], 'seated_by_pole_2970': FLOOR,
    # the paper stall, the 解 ring, the rider, the well
    'paper_stall_seller_2565': [['tend_stall', 8], ['talk', 5]], 'robed_pointing_2528': [['point', 6], ['talk', 6]],
    'robed_clasped_2420': [['idle', 7], ['look', 5]], 'robed_back_2482': [['idle', 7], ['talk', 5]],
    'tall_hat_man_2285': [['hand_chin', 8], ['look', 4]], 'boy_dark_robe_2380': [['hand_chin', 8], ['idle', 4]],
    'jie_seated_back_2105': SIT, 'jie_young_seated_2100': SIT, 'jie_listener_west_2062': SIT, 'jie_pale_cap_2175': SIT,
    'jie_seated_tan_2283': SIT, 'jie_old_man_2138': SIT, 'jie_smiling_capped_2160': FLOOR,
    'jie_faded_pale_2245': [['look', 8], ['idle', 4]], 'jie_dark_robe_back_2242': [['look', 8], ['idle', 4]],
    'jie_young_standing_2168': [['look', 7], ['idle', 5]], 'folded_arms_2338': [['lean_wall', 10], ['look', 4]],
    'leaning_over_awning_2168': [['lean_over', 10], ['look', 4]], 'crouching_dark_2028': [['crouch', 12]],
    'donkey_rider_2308': [['ride', 10]], 'donkey_groom_pale_2200': [['hold_bridle', 9], ['idle', 3]],
    'donkey_groom_jacket_2252': [['hold_bridle', 8], ['idle', 4]],
    'well_rope_drawer_2097': [['draw_water', 10], ['idle', 3]], 'well_bucket_lifter_2032': [['heave_bucket', 8], ['idle', 3]],
    'well_bucket_hauler_2196': [['lift_bucket', 9], ['idle', 3]],
}
DEFAULT = {'standing': [['idle', 7], ['look', 5]], 'seated': SIT, 'leaning': [['look', 8], ['idle', 4]]}
for s in figs:
    if s.startswith(('listener', 'ring_', 'child_listener')) and s not in DO:
        DO[s] = [['listen', 8], ['idle', 5]]

# a requested action the character lacks plays the nearest one it has (first in the chain); what is still wanted is
# written to people.json clips_why for the workshop
ALIAS = {
    'look': ['look', 'idle'], 'listen': ['listen', 'crane', 'look', 'idle'], 'talk': ['talk', 'chat', 'idle'],
    'chat': ['chat', 'talk', 'idle'], 'argue': ['argue', 'talk', 'chat', 'idle'], 'sit_talk': ['sit_talk', 'sit'],
    'sit': ['sit', 'idle'], 'sit_floor': ['sit_floor', 'knees_up', 'sit_one_knee', 'crouch', 'idle'], 'drink': ['drink', 'sit'],
    'write': ['write', 'sit'], 'point': ['point', 'tell', 'idle'], 'carry_pole': ['carry_pole', 'sedan_carry', 'idle'],
    'carry_child': ['carry_child', 'hold_child', 'idle'], 'push_flank': ['push_flank', 'push', 'idle'], 'listen_lean': ['crane', 'listen', 'idle'], 'hold_bridle': ['bridle', 'lead', 'idle'],
    'lead': ['lead', 'bridle', 'idle'], 'adjust_cap': ['tie_kerchief', 'idle'], 'tie_sash': ['bind', 'idle'],
    'bend_goods': ['bend_goods', 'browse', 'idle'], 'steer_wagon': ['steer', 'idle'], 'lie': ['sleep_side', 'crouch', 'idle'],
    'lean_over': ['lean_over', 'lean_chin', 'idle'], 'lift': ['bucket_lift', 'idle'], 'tend_stall': ['browse', 'talk', 'idle'],
    'cling': ['reach', 'idle'], 'hand_chin': ['chin', 'lean_chin', 'idle'], 'lift_bucket': ['bucket_lift', 'idle'],
    'heave_bucket': ['bucket_lift', 'idle'], 'crouch': ['crouch', 'squat_sleeves', 'idle'],
    'lean_wall': ['lean_wall', 'arms_folded', 'idle'], 'arms_folded': ['arms_folded', 'lean_wall', 'idle'],
    'show_garment': ['show_garment', 'hand_over', 'idle'], 'crane': ['crane', 'listen', 'idle'],
}
WANTED = {}


def fit(s, char, steps):
    have = CH[char]['clips']
    out = []
    for clip, secs in steps:
        got = next((c for c in ALIAS.get(clip, [clip, 'idle']) if c in have), 'idle')
        if got != clip:
            WANTED.setdefault(clip, {}).setdefault(char, []).append(f'{s} ({got})')
        if out and out[-1][0] == got:
            out[-1][1] += secs
        else:
            out.append([got, secs])
    return out


# what a figure holds (the character's prop_<name> parts, characters/props.json), as painted
PROPS = {'butcher_3920': ['cleaver'], 'ring_fan_cap_3688': ['fan_round'], 'fan_man_3972': ['fan_round'],
         'pole_man_5578': ['staff'], 'porter_baskets_2588': ['pole_baskets'], 'basket_porter_3370': ['pole_baskets'],
         'porter_topknot_2605': ['pole_bundle'], 'box_pole_porter_3745': ['pole_boxes'], 'itinerant_monk_2078': ['back_frame'],
         'servant_boy_bundle_3270': ['back_bundle'], 'fan_man_3225': ['fan_round'], 'pole_walker_2341': ['stick']}
PROPS_WHY = {
    'butcher_3920': 'cleaver (butcher, held in chop)', 'ring_fan_cap_3688': 'fan_round (scholar, held in fan): painted holding a dark fan up beside his face',
    'fan_man_3972': 'fan_round (elder, held in fan)', 'pole_man_5578': 'staff (porter, held in stand_pole): painted holding a shoulder pole upright before his chin',
    'porter_baskets_2588': 'pole_baskets (porter, carry_pole): a big round basket at each end', 'basket_porter_3370': 'pole_baskets (porter, carry_pole)',
    'porter_topknot_2605': 'pole_bundle (porter, carry_pole): one tall load at the pole\'s west end, as painted (a tall cylindrical basket; the bundle is the nearest prop)',
    'box_pole_porter_3745': 'pole_boxes (porter, carry_pole)', 'itinerant_monk_2078': 'back_frame (monk, back_load): the 笈 piled with bundles',
    'servant_boy_bundle_3270': 'back_bundle (child, back_load)', 'fan_man_3225': 'fan_round (sightseer, fan_walk): the 便面 screening his face',
    'pole_walker_2341': 'stick (porter, held in walk): the long thin pole he holds upright',
    'youth_hair_bun_stick_4950': 'staff (scholar, held in idle): the long upright stick he holds before him',
    'box_shoulder_porter_3405': 'box_shoulder (porter, shoulder_box): the long flat box on his shoulder, tilted over his head',
    'tray_vendor_3050': 'tray (porter, hold_tray): the long flat tray across his waist (the small lattice box at its east end is not on the prop)',
    'groom_whip_3452': 'whip_hold (inspector, hold_whip): the long curved whip held up in his right hand',
    'wine_cart_driver_2945': 'whip (carter, held in drive_cart): seated at the cart\'s front with the whip raised',
    'man_child_on_shoulders_4975': 'child_on_shoulders (townsman, carry_child): the child on his shoulders (child_on_shoulders_4977, carried_by)',
    'man_carrying_child_2790': 'child_on_back (idler, carry_child): the child riding on his back (child_on_back_2795, carried_by)',
}
PROPS.update({'youth_hair_bun_stick_4950': ['staff'], 'box_shoulder_porter_3405': ['box_shoulder'], 'tray_vendor_3050': ['tray'],
              'groom_whip_3452': ['whip_hold'], 'wine_cart_driver_2945': ['whip'], 'man_child_on_shoulders_4975': ['child_on_shoulders'],
              'man_carrying_child_2790': ['child_on_back']})
# carried children have no body of their own: the carrier's prop draws them (people.json carried_by; world.js)
CARRIED = {'child_on_shoulders_4977': 'man_child_on_shoulders_4975', 'child_on_back_2795': 'man_carrying_child_2790'}

# figures that walk: painted mid-stride or carrying a load, not held to a cart, a sedan, an animal or a child; each
# walks along its painted direction from its spot and back, the path cut short where a building, a vehicle or the
# edge of the painted area stops it (people.js turns at the ends)
WALKERS = ['porter_baskets_2588', 'porter_topknot_2605', 'basket_porter_3370', 'box_pole_porter_3745', 'box_shoulder_porter_3405',
           'itinerant_monk_2078', 'fan_man_3225', 'servant_boy_bundle_3270', 'white_walker_2990', 'bearded_walker_2916',
           'young_man_walking_2570', 'pole_walker_2341', 'stooping_walker_4893']
# a walker plays its walk clip all the way: the porters with their poles and loads (carry_pole), the monk and the boy
# with their back loads (back_load), the man with the fan before his face (fan_walk); the rest walk
WALK_CLIP = {'box_shoulder_porter_3405': 'shoulder_box', 'porter_baskets_2588': 'carry_pole', 'basket_porter_3370': 'carry_pole', 'porter_topknot_2605': 'carry_pole',
             'box_pole_porter_3745': 'carry_pole', 'itinerant_monk_2078': 'back_load', 'servant_boy_bundle_3270': 'back_load',
             'fan_man_3225': 'fan_walk'}
# painted mid-stride but held where they are: the boy's way west is the east sedan; the box carrier's way east is the
# parked wheelbarrow on the top street
DO_HELD = {'boy_5050': [['play', 8], ['idle', 4]], 'box_carrier_3272': [['idle', 8], ['look', 4]]}
PROPS['box_carrier_3272'] = ['back_boxes']
PROPS_WHY['box_carrier_3272'] = 'back_boxes (townsman, back_load): the tall banded box on his back; he stands (no room to walk), the box on his back all the same'
DO.update(DO_HELD)

# nudges: carried children stand beside their carriers until people.js can carry them (requested); figures whose
# painted spot falls inside a model
NUDGE = {         'man_hands_raised_5180': ([0.0, 0.45], 'painted just behind (north of) the dark donkey at the door; at real size the donkey\'s body (0.4 x 1.5 m) covers his spot'),
         'butcher_3920': ([0.15, 0.55], 'his painted spot (D 15.1) is on the meat counter, which at real size covers D 14.9-15.4: he stands just behind it, at the back of the chopping block'),
         'paper_stall_seller_2565': ([0.0, 0.65], 'his painted spot is inside the paper stall\'s table, on its goods tray, at real size: he stands behind the table (north), facing his customers'),
         'sedan_passenger_4362': ([0.15, -0.17], 'her painted spot is 0.23 m off the west sedan\'s axis, outside its box at real size: she sits at the box\'s centre'),
         'doorman_5015': ([-0.3, 0.1], 'painted in the 正店\'s doorway beside the gardenia lamp: at real size the lamp\'s stand is at his hip; he stands 0.3 m west of it'),
         'upper_storey_figure_4810': ([0.0, -0.35], 'his spot (D 15.74) is in the gallery\'s window wall (choice: 1.15 m behind the balustrade, D 15.83): he sits in the gallery in front of it'),
         'drinker_upper_5547': ([-0.9, 0.0], 'the 正店\'s east room ends at the wine depot\'s west wall (X -47.1, see build_choices.json): he sits at its table, moved 0.9 m west with it'),
         'upper_standing_5452': ([-0.9, 0.0], 'the 正店\'s east room ends at the wine depot\'s west wall (X -47.1): he stands at its table, moved 0.9 m west with it'),
         'window_face_4155': ([0.0, 0.35], 'his spot lies in the inn\'s upper south wall (he looks out of a window in it): he stands 0.35 m inside'),
         'well_rope_drawer_2097': ([0.0, 0.8], 'painted standing on the back beam of the well\'s cover; his estimated foot (D 12.5) falls in the open well: he stands on the curb\'s back timber (D 13.3)'),
         'well_bucket_lifter_2032': ([0.0, 0.62], 'painted standing on the back beam of the well\'s cover; his estimated foot (D 12.68) falls in the open well: he stands on the curb\'s back timber (D 13.3)'),
         'cloth_shop_seated_3752': ([0.0, 0.81], 'painted seated at the second counter facing the street; at real size the counter (0.45 m deep, its top at 0.92 m) covers his spot: he sits just behind it (north)'),
         'walking_carter_5537': ([-0.4, -0.65], 'painted walking west past the front of the sack cart\'s near wheel; at real size his spot is in the wheel\'s plane: he walks 0.45 m outside it'),
         'white_jacket_stand_3072': ([-0.18, -0.09], 'painted beside the folding stand: at real size its frame (0.4 m round) reaches into his body; he stands 0.2 m further from it'),
         'seated_by_pole_2970': ([-0.2, 0.0], 'painted sitting beside the low table under the umbrella: at real size the table reaches his knees; he sits 0.2 m further west'),
         'head_behind_ridge_5103': ([0.0, 0.15], 'his spot is 0.26 m north of house_south_4839\'s street wall (choice: its front at D -0.4): he stands 0.15 m further out, on the street'),
         'shop_person_3991': ([0.0, 0.2], 'painted behind the clinic\'s counter: he stands 0.2 m further back, clear of it (the counter is built 0.45 m deep behind the front line)'),
         'handcart_man_3130': ([0.9, -1.25], 'he pushes the barrow with casks, which moves 1.8 m south-east out of the big wagon\'s team (build_choices.json); he moves with it, 0.35 m further back so he stands behind its handles, not in its deck')}


def _axis(eid):
    pts = WORLD[eid]['pts']
    m = MOVED.get(eid, {})
    f = (pts['front'][0] + m.get('dX', 0), pts['front'][1] + m.get('dD', 0))
    r = (pts['rear'][0] + m.get('dX', 0), pts['rear'][1] + m.get('dD', 0))
    L_ = math.hypot(f[0] - r[0], f[1] - r[1])
    d = ((f[0] - r[0]) / L_, (f[1] - r[1]) / L_)
    return r, d, (-d[1], d[0])     # rear, forward, left


def beside(fig, eid, along, lateral, why):
    r, d, lf = _axis(eid)
    x, y = r[0] + d[0] * along + lf[0] * lateral, r[1] + d[1] * along + lf[1] * lateral
    NUDGE[fig] = ([round(x - figs[fig]['X'], 2), round(y - figs[fig]['D'], 2)], why)


# painted on a vehicle (the kit's vehicles have a hidden walker collider over the bed and no seat yet: requested), so
# they stand beside it; the shaft carter walks beside the big wagon's shafts, which now run out to its team
# painted seated on a vehicle: on the kit's driver's seat (blender/inner_city_scene.py writes the seats the kit returns
# to seats.json). The figure stands at the footboard, where an invisible block 5 cm above it is what people.js
# grounds him on, and his sit clip puts the hips on the seat 0.4 m behind, facing the cart's heading
FACE = {}
SEATS = json.load(open(os.path.join(HERE, 'seats.json')))


def seated(fig, eid, why):
    fx, fy, fz = SEATS[eid]['feet']
    NUDGE[fig] = ([round(fx - figs[fig]['X'], 2), round(fy - figs[fig]['D'], 2)], why)
    FACE[fig] = round(SEATS[eid]['seat'][3] % 360)


seated('wagon_top_rider_3740', 'S6.veh.taiping_wagon_3600', 'painted seated on the front of the big wagon\'s bed, looking west: he sits on the kit\'s driver\'s seat at the box\'s front, his feet on the footboard (seats.json)')
seated('wine_cart_driver_2945', 'S6.veh.wine_cart_3090', 'painted seated at the front of the wine cart with the whip raised toward the donkeys: he sits on the kit\'s driver\'s seat across the shafts, his feet on the footboard (seats.json)')
beside('wagon_shaft_carter_3642', 'S6.veh.taiping_wagon_3600', 2.9, 1.1, 'painted gripping the shafts at the wagon\'s front: his spot is inside the box at real size; he walks just outside the south-east shaft, behind the team')
beside('upper_team_driver_3450', 'S6.veh.hidden_wagon_3400', 2.85, 1.0, 'painted walking behind the upper mule team with the reins, the traces beside him: at real size the shafts fill the space between the wagon\'s front and the team, and the shed tables stand south of it, so he walks just outside the north shaft')
beside('bearded_carter_5428', 'S6.veh.sack_cart_5412', 4.0, -1.15, 'painted standing at the front of the sack cart: at real size the shaft tips and the swingletree are at his spot, the donkeys just ahead; he stands 0.45 m outside the north shaft')


def inside(p, poly):
    c = False
    j = len(poly) - 1
    for i in range(len(poly)):
        (xi, yi), (xj, yj) = poly[i], poly[j]
        if (yi > p[1]) != (yj > p[1]) and p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi:
            c = not c
        j = i
    return c


blocks = [e['footprint'] for e in L['entities'].values() if e['kind'] == 'building' and e.get('footprint')]
for eid, e in L['entities'].items():
    if e['kind'] == 'vehicle':
        f, r = e['pts']['front'][:2], e['pts']['rear'][:2]     # layout.json carries the recorded moves
        dx, dy = f[0] - r[0], f[1] - r[1]
        n = math.hypot(dx, dy) or 1
        ox, oy = -dy / n * 1.0, dx / n * 1.0     # the kit's box and wheels reach past its front/rear points: 0.6 m more
        ex, ey = dx / n * 0.6, dy / n * 0.6
        r, f = (r[0] - ex, r[1] - ey), (f[0] + ex, f[1] + ey)
        blocks.append([(r[0] + ox, r[1] + oy), (f[0] + ox, f[1] + oy), (f[0] - ox, f[1] - oy), (r[0] - ox, r[1] - oy)])
blocks.append(L['entities']['S6.str.square_well_2000']['footprint'])
REG = json.load(open(os.path.join(QM, 'web/public/assets/animals/animals.json')))
for eid, e in L['entities'].items():
    if not eid.startswith('S6.ani.') or eid == 'S6.ani.dog_4335':   # the dog walks; walkers pass round it
        continue
    sl = eid[len('S6.ani.'):]
    f, hd = e['pts']['fore'], e['pts']['hind']
    face = (PREV.get('animals', {}).get(sl) or {}).get('facing_deg')
    ang = math.radians(face) if face is not None else math.atan2(f[1] - hd[1], f[0] - hd[0])
    kind = sl.split('_')[0]
    ln, w = REG[kind]['length_m'] / 2 + 0.1, REG[kind]['width_m'] / 2 + 0.1
    cx, cy = e['pos']
    ca, sa = math.cos(ang), math.sin(ang)
    blocks.append([(cx - ca * ln + sa * w, cy - sa * ln - ca * w), (cx + ca * ln + sa * w, cy + sa * ln - ca * w),
                   (cx + ca * ln - sa * w, cy + sa * ln + ca * w), (cx - ca * ln - sa * w, cy - sa * ln + ca * w)])
area = L['painted_area']['corners']
# props standing on the ground (the builder makes their feet and bodies collide): a walker's path stops short of them
# by its body (0.26 m); thin ones (poles, umbrella and lamp posts, signboards) as 0.12 m, the rest as 0.4 m round
THIN = ('pole', 'umbrella', 'parasol', 'sunshade', 'sign', 'lamp', 'banner', 'curved')
round_props = []
for eid, e in L['entities'].items():
    if e['kind'] != 'prop' or e.get('support') != 'ground' or eid.split('.')[-1].startswith(('mat_roof', 'mat_awning')):
        continue
    if e.get('footprint'):
        blocks.append(e['footprint'])
        continue
    r_ = 0.12 if any(t in eid for t in THIN) else 0.4
    round_props.append((e['pos'][0], e['pos'][1], r_ + 0.3))


def clear(p):
    return (inside(p, area) and not any(inside(p, b) for b in blocks)
            and all(math.hypot(p[0] - x, p[1] - y) > r for x, y, r in round_props))


# walkers whose painted way runs straight into a standing crowd stop short of it (two bodies and a gap, 0.62 m from
# each standing figure's spot) rather than thread it: people.js steers round one body, not through a packed ring
# (the S7 join's QA, 2026-10-12: the servant boy brushed grey_back_2862 and child_by_dark_robe_2880 at 0.01-0.12 m)
STOP_AT_CROWD = {'servant_boy_bundle_3270': 'painted walking south-west straight into the crowd round the stall at '
                 'X -75..-78, D 9.5-11.7 (seven standing figures across his line): he walks to its edge and back'}


def standing_spots():
    return [(figs[s]['X'] + NUDGE.get(s, ([0, 0],))[0][0], figs[s]['D'] + NUDGE.get(s, ([0, 0],))[0][1])
            for s in figs if s not in WALKERS and s not in CARRIED]


def walk_path(f, length=7.0):
    a = math.radians(f['facing_deg'])
    d = (math.cos(a), math.sin(a))
    crowd = [p for p in standing_spots() if math.hypot(p[0] - f['X'], p[1] - f['D']) > 0.05] if f['id'] in STOP_AT_CROWD else []
    best = 0.0
    for i in range(1, 36):
        s = i * 0.2
        if s > length:
            break
        q = (f['X'] + d[0] * s, f['D'] + d[1] * s)
        if not clear(q) or any(math.hypot(q[0] - x, q[1] - y) < 0.62 for x, y in crowd):
            break
        best = s
    back = 0.0
    for i in range(1, 6):   # a little room behind the spot, so the walk turns there
        s = i * 0.2
        if not clear((f['X'] - d[0] * s, f['D'] - d[1] * s)):
            break
        back = s
    end = (round(f['X'] + d[0] * max(best - 0.3, 0.5), 2), round(f['D'] + d[1] * max(best - 0.3, 0.5), 2))
    start = (round(f['X'] - d[0] * back * 0.5, 2), round(f['D'] - d[1] * back * 0.5, 2))
    return [list(start), list(end)], best


people = {
    'about': 'Who the inner city\'s people are and what they do: every painted figure of the scroll map (map/text/S6.md), at its painted spot, and nobody else (map/BUILDING.md). Written by gen/sections/inner_city/make_people.py from gen/sections/inner_city/cast.json (the casting in gen/expand/inner_city_needs.md). figures: character (cast in cast.json, recasts in cast_why), do = [clip, seconds] cycles from the character\'s own clips (a requested action it lacks plays the nearest one it has: clips_why), props = the character\'s prop parts it holds (props_why), nudge = [dX, dD] (reasons in nudge_why), scale for children (times the child model: scale_why). walkers: figures painted mid-stride or carrying a load, walking along their painted direction from their spot and back, cut short at buildings, carts and the painted area\'s edge. animals: each painted animal at its map position (model and load from web/public/assets/animals/animals.json); riders are figures with ride = their animal\'s slug.',
    'figures': {}, 'nudge_why': {}, 'walkers': [], 'animals': {}, 'animals_why': {},
}
walk_why = {}
for s, f in figs.items():
    c = char_of[s]
    spec = {'character': c}
    if s in CARRIED:
        spec.update({'carried_by': CARRIED[s], 'do': [['idle', 10]]})
        if s in SCALE:
            spec['scale'] = SCALE[s]
        people['figures'][s] = spec
        continue
    if c in STAND_IN:
        spec['stand_in'] = STAND_IN[c]
    if s in SCALE:
        spec['scale'] = SCALE[s]
    if s in WALKERS:
        path, L_ = walk_path(f)
        w = {'id': s, 'figure': s, 'character': c, 'clip': WALK_CLIP.get(s, 'walk'), 'speed': 0.9 if s in WALK_CLIP else 1.1,
             'pause': ['idle', 3], 'path': path}
        if s in PROPS:
            w['props'] = PROPS[s]
        if c in STAND_IN:
            w['stand_in'] = STAND_IN[c]
        if s in SCALE:
            w['scale'] = SCALE[s]
        people['walkers'].append(w)
        walk_why[s] = f'{L_:.1f} m clear along its painted direction ({f["facing_deg"]} deg)' + (f'; {STOP_AT_CROWD[s]}' if s in STOP_AT_CROWD else '')
        continue
    spec['do'] = fit(s, c, DO.get(s) or DEFAULT.get(f['pose'], [['idle', 7], ['look', 5]]))
    if s in PROPS:
        spec['props'] = PROPS[s]
    if s in FACE:
        spec['facing_deg'] = FACE[s]
    if s in NUDGE:
        spec['nudge'] = NUDGE[s][0]
        people['nudge_why'][s] = NUDGE[s][1]
    people['figures'][s] = spec

# figures painted closer than two bodies (0.26 m radius each) are pushed apart to 0.54 m along the line between them
KEEP = {'child_on_shoulders_4977', 'child_on_back_2795', 'man_child_on_shoulders_4975', 'man_carrying_child_2790'}
spots = {sid: [figs[sid]['X'] + people['figures'][sid].get('nudge', [0, 0])[0], figs[sid]['D'] + people['figures'][sid].get('nudge', [0, 0])[1]]
         for sid in people['figures'] if sid not in KEEP}
for _ in range(6):
    ids = list(spots)
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            a, b = spots[ids[i]], spots[ids[j]]
            dx, dy = b[0] - a[0], b[1] - a[1]
            dd = math.hypot(dx, dy)
            if dd < 0.54:
                ux_, uy_ = (dx / dd, dy / dd) if dd > 1e-6 else (1.0, 0.0)
                push = (0.54 - dd) / 2
                a[0] -= ux_ * push; a[1] -= uy_ * push
                b[0] += ux_ * push; b[1] += uy_ * push
for sid, (x, y) in spots.items():
    f = figs[sid]
    nd = [round(x - f['X'], 2), round(y - f['D'], 2)]
    if math.hypot(*nd) > 0.03 and 'nudge' not in people['figures'][sid]:
        people['figures'][sid]['nudge'] = nd
        people['nudge_why'][sid] = 'painted closer to a neighbour than two bodies (0.26 m each): pushed apart along the line between them'

# riders sit on their painted animals
RIDE = {'rider_3375': 'horse_3445', 'rider_5335': 'horse_5262', 'donkey_rider_2308': 'donkey_2285'}
for s, a in RIDE.items():
    people['figures'][s]['ride'] = a

# the animals: species, tack and load as painted (map/text/S6.md), what each is doing
A = {
    'donkey_team_near_5270': ('donkey', 'collar', [['graze', 8], ['idle', 5]]),
    'donkey_team_dark_5300': ('donkey', 'collar', [['idle', 9]]),
    'donkey_team_pale_5285': ('donkey', 'collar', [['idle', 9]]),
    'donkey_door_5150': ('donkey', None, [['graze', 7], ['idle', 5]]),
    'donkey_head_down_5565': ('donkey', None, [['graze', 9], ['idle', 4]]),
    'donkey_wine_cart_3191': ('donkey', 'collar', [['idle', 9]]),
    'donkey_wine_cart_3105': ('donkey', 'collar', [['idle', 9]]),
    'donkey_2285': ('donkey', 'saddle_cloth', [['idle', 10]]),
    'horse_3445': ('horse', 'saddle', [['idle', 10]]),
    # details pass (fix-inner): painted with its head lowered, wearing a bridle, ridden: head_low (its held lowered
    # head), not graze (the muzzle to the ground, its back moving under the rider: his seat stood 4.5 cm off it)
    'horse_5262': ('horse', 'saddle', [['head_low', 9], ['idle', 4]]),
    'mule_lower_1_3427': ('mule', 'collar', [['idle', 9]]),
    'mule_lower_2_3462': ('mule', 'collar', [['graze', 6], ['idle', 5]]),
    'mule_lower_3_3498': ('mule', 'collar', [['idle', 9]]),
    'mule_lower_shaft_3560': ('mule', 'collar', [['idle', 9]]),
    'mule_upper_1_3585': ('mule', 'collar', [['graze', 6], ['idle', 5]]),
    'mule_upper_2_3620': ('mule', 'collar', [['graze', 6], ['idle', 5]]),
    'mule_upper_3_3655': ('mule', 'collar', [['idle', 9]]),
    'mule_upper_lead_3690': ('mule', 'collar', [['idle', 9]]),
    'dog_4335': ('dog', None, [['walk', 4], ['idle', 6]]),
}
# a team painted crowded (the painter overlaps the animals) is set out as a real team round its painted centre and
# heading: ranks 2.4 m apart, pairs 0.66 m apart side by side (animals are real size: a mule 2.1 x 0.55 m, a donkey
# 1.5 x 0.4 m)
reg = json.load(open(os.path.join(QM, 'web/public/assets/animals/animals.json')))
ANUDGE, AWHY = {}, {}


WORLD = {e['id']: e for e in json.load(open(os.path.join(QM, 'map/world/S6.json')))['entities']}


def team_formation(slots, heading, why):
    pos = {sl: WORLD['S6.ani.' + sl]['pos'] for sl, _, _ in slots}
    cx = sum(p[0] for p in pos.values()) / len(pos)
    cy = sum(p[1] for p in pos.values()) / len(pos)
    a = math.radians(heading)
    d, lf = (math.cos(a), math.sin(a)), (-math.sin(a), math.cos(a))
    for sl, rank, side in slots:
        tx = cx + d[0] * rank + lf[0] * side
        ty = cy + d[1] * rank + lf[1] * side
        ANUDGE[sl] = [round(tx - pos[sl][0], 2), round(ty - pos[sl][1], 2)]
        AWHY[sl] = why


# the big wagon's team: painted overlapping and only ~1 m ahead of the wagon's front; at real size the rear pair (the
# shaft mule and mule 3) stands ahead of the shafts on the wagon's axis (220 deg: the kit's shafts end 0.3 m behind
# them, at least 1.0 m past the box) and the lead pair 2.4 m further on, turned 10 deg further south as the team
# swings out of the cross street onto the main street; turned further west (as painted, 195) the lead pair's heads
# would stand in the incense shop's scaffold. The barrow with casks painted beside the lead mules moves out of their
# way (build_choices.json moves).
FACING = {}
TP = WORLD['S6.veh.taiping_wagon_3600']['pts']
_fr, _rr = TP['front'], TP['rear']
H1 = math.degrees(math.atan2(_fr[1] - _rr[1], _fr[0] - _rr[0])) % 360
H2 = H1 + 10


def set_out(sl, centre, heading, side, why):
    a = math.radians(heading)
    lf = (-math.sin(a), math.cos(a))
    p = WORLD['S6.ani.' + sl]['pos']
    ANUDGE[sl] = [round(centre[0] + lf[0] * side - p[0], 2), round(centre[1] + lf[1] * side - p[1], 2)]
    AWHY[sl] = why
    FACING[sl] = round(heading)


_d1 = (math.cos(math.radians(H1)), math.sin(math.radians(H1)))
_r1 = (_fr[0] + _d1[0] * 2.0, _fr[1] + _d1[1] * 2.0)
_dm = (math.cos(math.radians((H1 + H2) / 2)), math.sin(math.radians((H1 + H2) / 2)))
_r2 = (_r1[0] + _dm[0] * 2.4, _r1[1] + _dm[1] * 2.4)
WHY_LOWER = ('the wagon\'s team (four mules painted overlapping, ~1 m ahead of the wagon) set out at real size: the rear pair '
             '(shaft mule, mule 3) on the wagon\'s axis just ahead of its shafts, the lead pair 2.4 m further on turning '
             '10 deg south as the team swings onto the main street (painted heading 195 would put their heads in the '
             'incense shop\'s scaffold)')
set_out('mule_lower_3_3498', _r1, H1, 0.33, WHY_LOWER)
set_out('mule_lower_shaft_3560', _r1, H1, -0.33, WHY_LOWER)
set_out('mule_lower_1_3427', _r2, H2, 0.33, WHY_LOWER)
set_out('mule_lower_2_3462', _r2, H2, -0.33, WHY_LOWER)

# the upper team: four mules painted in one overlapping line ahead of the hidden wagon, heading east; set out at real
# size as two ranks of two on the wagon's axis, the rear pair 2.35 m ahead of its front point (the kit's shafts and
# their crossbar end 0.3 m behind them; the wagon has no painted wheel, so its box sits further forward than the big
# wagon's) and the lead pair 2.4 m further on
HP = WORLD['S6.veh.hidden_wagon_3400']['pts']
_fu, _ru = HP['front'], HP['rear']
HU = math.degrees(math.atan2(_fu[1] - _ru[1], _fu[0] - _ru[0])) % 360
_du = (math.cos(math.radians(HU)), math.sin(math.radians(HU)))
_u1 = (_fu[0] + _du[0] * 2.35, _fu[1] + _du[1] * 2.35)
_u2 = (_u1[0] + _du[0] * 2.4, _u1[1] + _du[1] * 2.4)
WHY_UPPER = ('the upper team (four mules painted overlapping in one line ahead of the hidden wagon) set out at real size as '
             'two ranks of two on the wagon\'s axis, the rear pair just ahead of its shafts, the lead pair 2.4 m further on')
set_out('mule_upper_1_3585', _u1, HU, -0.33, WHY_UPPER)
set_out('mule_upper_2_3620', _u1, HU, 0.33, WHY_UPPER)
set_out('mule_upper_3_3655', _u2, HU, -0.33, WHY_UPPER)
set_out('mule_upper_lead_3690', _u2, HU, 0.33, WHY_UPPER)
for sl, dd in (('donkey_wine_cart_3191', [0.0, -0.25]), ('donkey_wine_cart_3105', [0.0, 0.3]), ('donkey_team_dark_5300', [0.0, 0.12])):
    ANUDGE[sl] = dd
    AWHY[sl] = 'painted two abreast but overlapping; set 0.5 m apart side by side (real bodies)'
for s, (m, load, do) in A.items():
    spec = {'model': m, 'do': do}
    if s == 'dog_4335':
        # painted walking west under the parasol beside the west sedan, nobody leading it: it trots along its painted
        # line and back, from beside the sedan's front bearer (0.7 m off) to the parasol's pole (0.57 m off), short of
        # the attendant at the sedan's rear
        spec['path'] = [[-51.55, 3.45], [-53.7, 3.29]]
    if load:
        spec['load'] = load
    if s in FACING:
        spec['facing_deg'] = FACING[s]
    people['animals'][s] = spec
# the animals' moves go into build_choices.json (moves), so layout.json carries them: the page places the animal and
# the builder hitches the vehicle's harness to the same spot (tools/map_layout.mjs applies them)
bc_path = os.path.join(QM, 'sections/inner_city/build_choices.json')
bc = json.load(open(bc_path))
bc['moves'] = {k: v for k, v in bc.get('moves', {}).items() if not k.startswith('S6.ani.')}
for sl, (dx, dy) in ANUDGE.items():
    bc['moves']['S6.ani.' + sl] = {'dX': dx, 'dD': dy, 'why': AWHY[sl]}
json.dump(bc, open(bc_path, 'w'), ensure_ascii=False, indent=1)
people['animals_why'] = {
    'models': 'species as painted (map/text/S6.md): 8 donkeys, 8 mules (the two four-mule teams at the crossroads), 2 horses, a dog (the workshop\'s dog is coming: the page skips it until then)',
    'loads': 'as painted: collars on every animal in a team (the sack cart\'s, the wine cart\'s, both wagons\'), saddles on the two ridden horses, a saddle cloth under the young man\'s donkey; the donkey at the door and the one by the depot carry nothing painted',
    'doing': 'the head-down ones graze (near team donkey, the door donkey, the depot donkey, the mule with its head lowered); the rest stand in harness; the dog walks on the spot it is painted walking',
}
people['animals_why']['moves'] = 'teams painted overlapping are set out as real teams: build_choices.json moves (applied in layout.json)'
people['walkers_why'] = walk_why
people['clips_why'] = {'about': 'Actions the painting asks for that the playing character lacks (gen/expand/inner_city_needs.md): requested clip -> character -> figures (the clip each plays now, the nearest it has). Rerun make_people.py when the workshop adds them.'}
for clip in sorted(WANTED):
    people['clips_why'][clip] = {ch: figs_ for ch, figs_ in sorted(WANTED[clip].items())}
people['props_why'] = PROPS_WHY
people['scale_why'] = SCALE_WHY
people['cast_why'] = {k: v[1] for k, v in RECAST.items()}
# the details pass's contact fixes (sections/inner_city/contact_fixes.json: solved nudges and turns, recasts, IK clip
# variants, seats; gen/details/contacts/fix_standard.md), applied last so a rerun of the casting keeps them
sys.path.insert(0, os.path.join(QM, 'tools'))
from contact_fixes import apply as apply_contact_fixes
apply_contact_fixes(people, 'inner_city')
json.dump(people, open(os.path.join(QM, 'sections/inner_city/people.json'), 'w'), ensure_ascii=False, indent=1)
print(len(people['figures']), 'figures,', len(people['walkers']), 'walkers,', len(people['animals']), 'animals')
for w in people['walkers']:
    print(' ', w['id'], w['path'], walk_why[w['id']])
