#!/usr/bin/env python3
"""Writes sections/outer_road_2/people.json and gen/sections/outer_road_2/seats.json: every painted figure and every
painted animal of S4 part 2 (S4b, u 12600-15500, map/text/S4b.md) at its mapped spot (sections/outer_road_2/layout.json,
read on every run: the area builder regenerates it with recorded moves, crew moving with their boats), doing what it is
painted doing, and nobody else (map/BUILDING.md). The casting is gen/expand/outer_road_2_needs.md ("Casting"), cast only
from the 22 existing characters (no new character this run: Meshy credits are scarce), checked against what each
character really has in web/public/assets/chars/characters.json today.

Kept as a script, as gen/sections/outer_road/make_people.py is, so the cast is redone as the workshop delivers:
- each figure names the character its dress calls for (CAST); a character that doesn't exist yet (the boatman) plays
  its stand_in (STAND_IN), and the page casts the real one as soon as it lands;
- each action step lists the clip the painting wants first and the nearest clips after it; the first one the playing
  character has is played, and the rest goes to clips_why;
- a figure painted SEATED whose character can't sit yet is played by the nearest look that can (RECAST, cast_why),
  until the character gets a seated clip: then this script casts it back by itself;
- carried props are switched on only when the playing character's GLB has the prop_<name> part and the figure plays
  the clip that holds it (characters/props.json);
- nudges and walks are computed here, each with its reason, against the kit's real sizes (vehicles, animals, seats,
  the clips' own hip and foot positions), the buildings, the props, the water and each other; the checks are printed.

Seats (map/BUILDING.md rule 3: the seat of a figure painted seated is part of it): a seated clip puts the hips at a
fixed place relative to the character's root, measured per clip (HIPS, from tools/char_props.mjs --probe on the raw
GLBs: Meshy's library chair sit (33) on the original rigs keeps the root under the feet with the hips 0.23-0.31 m
behind and 0.15 m to the left; the locally retargeted sits keep the root under the hips with the feet 0.3-0.4 m ahead).
A figure on a mapped seat (bench, stool, chair) has its hips put on that seat; a figure on a seat the map lacks (the
ground, a cart bed, a deck, a roof, a hidden stool) gets its seat in seats.json, for the builder to build inside the
figure's entity.
    python3 gen/sections/outer_road_2/make_people.py
"""
import json
import math
import os
import struct

HERE = os.path.dirname(os.path.abspath(__file__))
QM = os.path.abspath(os.path.join(HERE, '../../..'))


def J(p, default=None):
    full = os.path.join(QM, p)
    if default is not None and not os.path.exists(full):
        return default
    return json.load(open(full, encoding='utf-8'))


L = J('sections/outer_road_2/layout.json')
S4 = J('sections/outer_road/layout.json')            # part 1: the official hall, the willow the bird sits in
CHOICES = J('sections/outer_road_2/build_choices.json', {})
REG = J('web/public/assets/chars/characters.json')
ANI = J('web/public/assets/animals/animals.json')
PROPS = J('characters/props.json')
for _m, _c in REG.items():   # the registry's own props {name: clip} (the workshop's last batch) win over props.json
    for _n, _clip in (_c.get('props') or {}).items():
        PROPS.setdefault(_m, {})[_n] = {**PROPS.get(_m, {}).get(_n, {}), 'clip': _clip}
FIG = {f['id']: f for f in L['figures']}
E = L['entities']
ANIMALS = {k.split('.')[-1]: e for k, e in E.items() if e['kind'] == 'animal'}
SLUG = lambda k: k.split('.')[-1]


def glb_parts(c):
    """Names of the optional prop_<name> parts in a character's web GLB (empty when it isn't built)."""
    if c not in REG:
        return set()
    b = open(os.path.join(QM, 'web/public', REG[c]['file']), 'rb').read()
    n = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + n])
    return {x.get('name', '') for x in j.get('nodes', []) + j.get('meshes', []) if x.get('name', '').startswith('prop_')}


def height(c):
    return REG[c]['height_m']


# ---------------------------------------------------------------- casting (by dress: the needs list's table)
CAST = {
    # the official hall and its front (part 1's hall, S4.bld.official_hall_12530)
    'official_seated_12728': 'official', 'man_dark_cap_by_stair_12700': 'idler',
    'dark_figure_or_garment_12825': 'inspector', 'man_seated_front_of_hall_12866': 'robed_man',
    'man_standing_by_hall_12942': 'sightseer',
    # the first palm-covered cart, the shop table behind it, the sedan chair set down
    'small_figure_cart_rear_12706': 'child', 'seated_in_cart_front_12995': 'idler',
    'customer_light_12990': 'scholar', 'customer_dark_hat_13027': 'townsman', 'sedan_attendant_13160': 'robed_man',
    # the open shop hall
    'figure_in_shop_13242': 'carter', 'counter_man_leaning_13325': 'idler',
    # the crowd round the seated man (13 standing, the seated man)
    'seated_man_13240': 'storyteller', 'man_in_shed_13220': 'scholar', 'onlooker_grey_jacket_13152': 'idler',
    'small_onlooker_13180': 'child', 'onlooker_light_robe_13200': 'scholar', 'onlooker_dark_robe_13222': 'townsman',
    'youth_onlooker_13265': 'youth', 'tall_onlooker_leaning_13290': 'scholar',
    'bearded_onlooker_13350': 'robed_man', 'onlooker_back_view_13332': 'porter', 'young_onlooker_13387': 'sightseer',
    'onlooker_profile_13382': 'scholar', 'onlooker_behind_13428': 'camel_driver', 'onlooker_dark_robe_13425': 'townsman',
    # the top street: the stall, the pack mules
    'stall_keeper_13415': 'scholar', 'muleteer_13560': 'idler', 'man_behind_tree_13850': 'scholar',
    # below the crowd, the open square
    'porter_tall_load_13402': 'porter', 'porter_pole_bundle_13537': 'porter',
    # the saddled horse and the small dark donkey
    'man_in_white_at_horse_13360': 'scholar', 'man_bowed_at_horse_13410': 'inspector',
    'man_bending_to_donkey_13440': 'scholar', 'man_behind_donkey_13512': 'idler', 'man_bending_sack_13607': 'porter',
    # the wheelwright's yard and the goods stall under its shed
    'wheelwright_bending_13620': 'idler', 'man_wide_hat_13760': 'official_rider', 'stall_keeper_seated_13940': 'carter',
    'figure_behind_rail_13995': 'townsman',
    # the second palm-covered cart (名画记 pin 27): its porter, carter and driver; the small horse behind it
    'porter_at_cart_rear_13090': 'idler', 'carter_at_shaft_ox_13243': 'idler', 'cart_driver_13303': 'idler',
    'man_big_hat_12895': 'official_rider', 'man_white_jacket_12773': 'idler', 'seated_in_bottom_shop_12792': 'idler',
    # the road south of the tea house
    'man_looking_up_13755': 'robed_man',
    # the bank, the gate, the gangplank
    'small_companion_14654': 'child', 'man_on_bank_14686': 'townsman', 'man_at_gate_post_14540': 'robed_man',
    'figure_behind_roof_14583': 'porter', 'porter_baskets_14778': 'porter', 'man_on_bank_14928': 'idler',
    # the tea house (小铺闲坐?)
    'customer_bent_14420': 'inspector', 'customer_hat_14462': 'townsman', 'customer_white_14560': 'robed_man',
    'customer_cap_14785': 'sightseer', 'figure_at_front_rail_14752': 'idler', 'man_east_bay_14958': 'scholar',
    # the two men on the road at the tea house's east end
    'man_dark_cap_15075': 'sightseer', 'man_frame_or_hat_15125': 'robed_man',
    # the five crew on the moored boats: a boatman (not made: S4b paints none at a usable size) plays a stand-in
    'seated_boatman_stern_15372': 'boatman', 'boatman_dark_cap_15046': 'boatman', 'boatman_light_hat_15066': 'straw_hat',  # catalogue 10 (restart run, the lead)
   
    'seated_man_cabin_roof_15012': 'boatman', 'head_in_cabin_door_15097': 'boatman',
}
# a character not made yet plays its stand-in (people.json stand_in; web/src/world.js casts it)
STAND_IN = {
    'seated_boatman_stern_15372': ('idler', 'dark hair or cap, seated by the stern: the idler (hemp jacket, dark '
                                   'head-wrap) sits cross-legged on the deck (sit_floor)'),
    'boatman_dark_cap_15046': ('porter', 'a dark cap over a robe or jacket, standing on the long boat\'s deck: the '
                               'porter (hemp jacket, indigo trousers)'),
    'boatman_light_hat_15066': ('hat_traveller', 'a light hat beside him: the hat traveller\'s light straw hat'),
    'seated_man_cabin_roof_15012': ('scholar', 'light robe, bare head or close cap, seated on the cabin roof with his '
                                    'knees drawn up: the scholar (pale robe) has knees_up; the robed man, the needs '
                                    'list\'s cast if he is a passenger, has no floor sit'),
    'head_in_cabin_door_15097': ('porter', 'only a dark round head shows in the cabin door: the porter'),
}
# painted SEATED, but the character their dress calls for has no seated clip yet: the nearest look that can sit plays
# them, so they sit on their painted seats (cast_why); rerun when the workshop gives the right one a seated clip
RECAST = {
    'customer_dark_hat_13027': ('scholar', 'seated at the shop table, a dark round hat over light clothes: the '
                                'townsman has no sit yet; the scholar (pale robe, dark futou) sits'),
    'customer_hat_14462': ('fortune_teller', 'seated on the chair at the tea table\'s west end in a dark hat and a robe '
                           '(the restyle paints it blue), leaning over the table toward the man in white: the townsman '
                           'has no sit yet; the fortune-teller (ink-blue robe, futou) sits at a table with his forearms '
                           'on it, talking (tell_fortune), and his root stays under his hips, clear of the table top'),
    'customer_cap_14785': ('official', 'seated on a stool in a dark cap and a robe (grey in the restyle), both forearms '
                           'on the table: the sightseer has no sit yet; the official (warm-grey robe, black futou) sits '
                           'at a desk with his forearms on it (write), his root under his hips'),
    'seated_man_13240': ('sightseer', 'seated on the ground at the heart of the crowd, dark cap and dark long robe, '
                         'bearded: the storyteller is his look but has no seated clip; the sightseer (cornflower robe, '
                         'futou) sits on the ground with his knees up (knees_up) until the storyteller gets sit_floor'),
}
CAST_WHY = {
    'porter_at_cart_rear_13090': 'idler, not the needs list\'s porter: both wear the short jacket and trousers he is '
                                 'painted in, and only the idler has push_flank (both arms out against something big '
                                 'at chest height), the nearest clip to his arms raised to the cart\'s underside',
    'bearded_onlooker_13350': 'robed_man as listed, playing crane, not listen: the robed man\'s listen is the seated '
                              'sit_listen, and he is painted standing, looking down at the seated man',
    'seated_in_cart_front_12995': 'idler, not the needs list\'s carter: the scan paints him in light clothes (the '
                                  'orange-brown jacket is the restyle\'s), and the parked palm cart\'s seat is a plank on the '
                                  'bed\'s front with the jutting frame for his feet only 0.11 m lower (kit_outer_road_2.palm_cart): '
                                  'a floor sit, which the idler has (sit_floor) and the carter hasn\'t',
    'muleteer_13560': 'idler as listed; his folded arms are the idler\'s lean_wall (the lean_wall_idle take: arms '
                      'crossed, glancing round), the same take the inspector plays as arms_folded',
}

# What each figure is painted doing: steps (candidates, seconds); the first candidate the playing character has is
# played, so the action the painting wants comes first and the nearest existing clips after it. Seated figures play
# only seated clips that keep the hips in one place (HIPS), so they stay on their seats.
DO = {
    'official_seated_12728': [(['write', 'sit'], 20)],
    'man_dark_cap_by_stair_12700': [(['sit_floor'], 30)],
    'dark_figure_or_garment_12825': [(['chin', 'idle'], 8), (['idle'], 5)],
    'man_seated_front_of_hall_12866': [(['listen', 'sit'], 16)],
    'man_standing_by_hall_12942': [(['idle'], 7), (['look'], 5)],
    'small_figure_cart_rear_12706': [(['look'], 7), (['idle'], 5)],
    'seated_in_cart_front_12995': [(['sit_floor'], 30)],
    'customer_light_12990': [(['drink', 'sit'], 16)],
    'customer_dark_hat_13027': [(['sit'], 16)],
    'sedan_attendant_13160': [(['idle'], 8), (['talk'], 4)],
    'figure_in_shop_13242': [(['sit'], 16)],
    'counter_man_leaning_13325': [(['lean_chin', 'lean_over'], 14), (['idle'], 4)],
    'seated_man_13240': [(['show_goods_seated', 'sit_floor', 'knees_up'], 30)],
    'man_in_shed_13220': [(['look'], 7), (['idle'], 5)],
    'onlooker_grey_jacket_13152': [(['look'], 8), (['idle'], 4)],
    'small_onlooker_13180': [(['look'], 8), (['idle'], 4)],
    'onlooker_light_robe_13200': [(['crane', 'look'], 8), (['idle'], 4)],
    'onlooker_dark_robe_13222': [(['crane', 'look'], 8), (['look'], 4)],
    'youth_onlooker_13265': [(['chin', 'look'], 8), (['look'], 5)],
    'tall_onlooker_leaning_13290': [(['crane', 'look'], 9), (['idle'], 3)],
    'bearded_onlooker_13350': [(['crane', 'look'], 8), (['idle'], 4)],
    'onlooker_back_view_13332': [(['look', 'idle'], 10)],
    'young_onlooker_13387': [(['look'], 8), (['crane', 'idle'], 4)],
    'onlooker_profile_13382': [(['look'], 8), (['idle'], 4)],
    'onlooker_behind_13428': [(['look'], 8), (['idle'], 4)],
    'onlooker_dark_robe_13425': [(['look'], 8), (['crane', 'idle'], 4)],
    'stall_keeper_13415': [(['idle'], 8), (['look'], 4)],
    'muleteer_13560': [(['arms_folded', 'lean_wall', 'idle'], 12), (['look', 'idle'], 4)],
    'man_behind_tree_13850': [(['look'], 8), (['idle'], 4)],
    'porter_tall_load_13402': [(['rest_on_stick', 'idle'], 12)],
    'porter_pole_bundle_13537': [(['idle'], 6)],          # a walker (carry_pole); this is his stand when he can't walk
    'man_in_white_at_horse_13360': [(['bridle', 'idle'], 8), (['look', 'idle'], 4)],
    'man_bowed_at_horse_13410': [(['girth', 'push_flank', 'lean_over'], 10), (['idle'], 3)],
    'man_bending_to_donkey_13440': [(['lean_over', 'idle'], 8), (['look', 'idle'], 4)],
    'man_behind_donkey_13512': [(['point'], 6), (['idle'], 5)],
    'man_bending_sack_13607': [(['bend_goods', 'hold_tray'], 10), (['idle'], 3)],
    'wheelwright_bending_13620': [(['wheelwright', 'bend_goods', 'bucket_lift'], 10), (['browse', 'idle'], 5)],
    'man_wide_hat_13760': [(['look', 'crane'], 7), (['idle'], 5)],
    'stall_keeper_seated_13940': [(['sit'], 16)],
    'figure_behind_rail_13995': [(['idle'], 8), (['look'], 4)],
    'porter_at_cart_rear_13090': [(['reach_up_load', 'push_flank'], 9), (['idle'], 3)],
    'carter_at_shaft_ox_13243': [(['steer', 'bridle'], 7), (['look'], 5)],
    'cart_driver_13303': [(['drive_team', 'point'], 6), (['idle'], 5)],
    'man_big_hat_12895': [(['bridle', 'idle'], 10)],
    'man_white_jacket_12773': [(['look'], 7), (['idle'], 5)],
    'seated_in_bottom_shop_12792': [(['sit'], 16)],
    'man_looking_up_13755': [(['look_up', 'look', 'idle'], 10)],
    'small_companion_14654': [(['reach'], 7), (['idle'], 5)],
    'man_on_bank_14686': [(['talk'], 8), (['idle'], 4)],
    'man_at_gate_post_14540': [(['idle'], 10)],
    'figure_behind_roof_14583': [(['idle'], 6)],           # a walker (walk)
    'porter_baskets_14778': [(['idle'], 6)],               # a walker (carry_pole)
    'man_on_bank_14928': [(['point'], 6), (['idle'], 5)],
    'customer_bent_14420': [(['lean_over'], 10), (['idle'], 3)],
    'customer_hat_14462': [(['listen', 'tell_fortune', 'sit'], 10), (['sit'], 6)],
    'customer_white_14560': [(['knee_on_stool', 'listen', 'sit'], 16)],
    'customer_cap_14785': [(['listen', 'write', 'sit'], 16)],
    'figure_at_front_rail_14752': [(['crouch'], 12)],
    'man_east_bay_14958': [(['knees_up'], 20)],
    'man_dark_cap_15075': [(['chat'], 8), (['idle'], 4)],
    'man_frame_or_hat_15125': [(['talk'], 8), (['idle'], 4)],
    'seated_boatman_stern_15372': [(['tiller_seated', 'sit_floor'], 30)],
    'boatman_dark_cap_15046': [(['idle'], 10)],
    'boatman_light_hat_15066': [(['idle'], 10)],
    'seated_man_cabin_roof_15012': [(['knees_up'], 30)],
    'head_in_cabin_door_15097': [(['idle'], 10)],
}
SEATED_CLIPS = {'sit', 'sit_talk', 'write', 'drink', 'listen', 'tell_fortune', 'knees_up', 'sit_floor', 'sit_one_knee',
                'doze_knees', 'kneel_sleep', 'sleep_side'}
# what each wanted clip is (the workshop's names where it made them: characters/motions.json, prompts/motion_*.txt);
# "free" = a local retarget (tools/retarget_local.mjs, t2m:/from:), "NEW" = a new Text to Motion take (10 credits)
WANT = {
    'crane': 'leaning forward from the waist to see and hear (free: t2m:crane_listen)',
    'look': 'the townsman\'s Long Breathe and Look Around (free: from:townsman/look)',
    'sit': 'the chair sit (free: from:scholar/sit)',
    'listen': 'seated on a low bench, leaning toward a speaker, forearms on the knees (free: t2m:sit_listen)',
    'sit_floor': 'sitting cross-legged on the ground (free: from:idler/sit_floor)',
    'bridle': 'holding an animal\'s bridle at its head (free: t2m:hold_bridle)',
    'lean_over': 'leaning forward over a waist-high edge, both hands on it (free: t2m:lean_over)',
    'bend_goods': 'bent double at the waist over goods on the ground (free: t2m:bend_goods)',
    'push_flank': 'bending forward against a big animal\'s flank, both arms along it (free: t2m:push_flank)',
    'steer': 'walking between a cart\'s shafts gripping them (free: t2m:steer_shafts; a walk: it plays only if the '
             'cart is ever made to move)',
    'drive_team': 'walking behind a team with the reins (free: t2m:drive_team; a walk, as steer)',
    'arms_folded': 'standing with folded arms (free: from:inspector/arms_folded; the idler\'s lean_wall is the same take)',
    'show_goods_seated': 'NEW: seated cross-legged on the ground, bending forward, both hands reaching down to small '
                         'goods on a mat before him, lifting one to show it, talking up at the men round him',
    'wheelwright': 'NEW: bent from the waist over a big wheel lying flat on the ground, the left hand on its rim, the '
                   'right swinging a short mallet down onto the rim or a spoke in short strokes, shifting along it '
                   '(车铺劳作); with a new prop mallet',
    'reach_up_load': 'NEW: standing under the back of a cart bed, both arms raised above the head, steadying a load '
                     'and easing it down',
    'rest_on_stick': 'NEW (optional): standing still under a tall back load, resting it on a waist-high T-shaped stick '
                     '(打杵) held behind him; with new props back_tall_bundle and t_stick',
    'knee_on_stool': 'NEW (optional): seated on a low stool, one knee drawn up onto the seat, talking across a table',
    'look_up': 'NEW (optional): standing with the head tilted back, looking up and to one side',
    'girth': 'NEW (optional): tightening a saddle girth, head bowed against the horse\'s flank, both hands under the '
             'saddle',
    'tiller_seated': 'NEW (optional): seated on a stern deck, one hand on the tiller',
    'knees_up': 'sitting on the ground, knees drawn up, arms round the shins (free: t2m:sit_knees_up)',
    'write': 'seated writing at a desk (the official\'s write_at_desk; free: t2m)',
    'drink': 'Sit and Drink (library 343; free: from:scholar/drink)',
    'tell_fortune': 'seated behind a table, forearms on it, talking (free: t2m:tell_fortune)',
    'chin': 'thoughtful, a hand at the chin (free: t2m:chin_watch)',
    'point': 'pointing and arguing (free: t2m:point_and_argue)',
    'reach': 'reaching both arms out (free: t2m:child_reach)',
    'talk': 'talking (free: from:townsman/talk)',
    'chat': 'Stand and Chat (library 56; free: from:sightseer/chat)',
}
# carried props as painted (needs list "Props carried by figures"); shown only with the clip that holds them
PROP_OF = {'porter_pole_bundle_13537': 'pole_bundle', 'porter_baskets_14778': 'pole_baskets'}
PROP_WANTED = {
    'cart_driver_13303': 'stick (the porter\'s 1.5 m stick) on the idler, held in a standing clip: the stick or lead '
                         'rope in his right hand',
    'wheelwright_bending_13620': 'NEW mallet: a short-handled wooden mallet in the right hand (with the wheelwright '
                                 'action)',
    'man_bending_sack_13607': 'NEW open_sack: a pale cloth sack held open by its mouth in both hands at knee height '
                              '(he plays hold_tray without its tray until then)',
    'stall_keeper_13415': 'NEW lidded_basket: a round lidded basket with a loop handle, held down at his right side',
    'man_white_jacket_12773': 'NEW cloth_bag: a cloth or small bag hanging from his hand at his west side',
    'man_on_bank_14686': 'NEW (optional) cloth_bag: a small bag at his west side, where the small figure\'s hand meets it',
    'porter_tall_load_13402': 'NEW back_tall_bundle + t_stick (conf low): a tall dark cylindrical bundle with a pale '
                              'band on a back frame, and a waist-high T-shaped stick (打杵)',
    'man_frame_or_hat_15125': 'NEW back_chair_frame (reading a): a wooden frame, chair or pedlar\'s rack carried on the '
                              'back; the monk\'s back_frame (笈) is the fallback, but it is the monk\'s and he plays '
                              'it only walking (back_load)',
}
NEEDS_PROP = {'carry_pole': None}
WALK_CLIPS = {'walk', 'carry_pole', 'fan_walk', 'back_load', 'stride_stick', 'quick', 'stroll', 'walk_whip'}

# children: painted height against the adults painted next to them (needs list), turned into a scale of the child
# model (people.js scale multiplies the character's own height)
CHILD = {
    'small_figure_cart_rear_12706': (0.5, 1.70, 'the adults near him (head 13 px against their 20; about 75-80 px tall '
                                     'where adults paint 150-170)'),
    'small_onlooker_13180': (0.71, 1.70, 'the crowd round him (about 100 px against the adults\' 140)'),
    'small_companion_14654': (0.83, 'townsman', 'the man in the long robe beside him (57 px against 69)'),
    'youth_onlooker_13265': (0.78, 1.70, 'the men round him (99 px against 127 for the tall man bent beside him)'),
}
# facings the map gives that the real-size scene can't keep, each with its reason
FACING = {
    'seated_in_bottom_shop_12792': (90, 'painted seated at the west end of the tray table, hunched and facing east (conf '
                                    'low); he sits on S4b.prop.bench_12835, which the builder lays east-west in front '
                                    'of the table: facing east along it, his chair sit would run his legs through the '
                                    'bench, so he faces the table he is painted at (north), his legs under its west end'),
    'wheelwright_bending_13620': (225, 'the map reads him facing west (his head at the west end, his back to the east), '
                                       'bending over the big wheel that lies flat to his south at real size (the kit\'s '
                                       'R 0.85 wheel centred on S4b.prop.loose_wheel_13665); turned south-west so his '
                                       'bent hands reach its west rim, as painted'),
}
# painted mid-stride or carrying a load, and not held to a cart, a sedan, an animal or the load at its feet
WALKERS = ['porter_pole_bundle_13537', 'porter_baskets_14778', 'figure_behind_roof_14583', 'muleteer_13560']
WALK_CLIP = {'porter_pole_bundle_13537': 'carry_pole', 'porter_baskets_14778': 'carry_pole',
             'figure_behind_roof_14583': 'walk', 'muleteer_13560': 'walk'}
MIN_WALK = 2.0      # a painted walker with less room than this stands (skill characters: "A painted walker with no room
#                     stands")
HELD = {
    'drivers': 'carter_at_shaft_ox_13243 and cart_driver_13303 are painted walking with the second palm-covered cart, '
               'which is built standing in its team\'s harness: they stay with it, at their painted spots',
    'porter_at_cart_rear_13090': 'painted carrying, his arms raised to the second cart\'s underside, lifting a load '
                                 'down or steadying it: he stays at the cart',
}

# ---------------------------------------------------------------- seated clips: where the hips and the feet are
# (left, forward) metres from the character's root, and the hips' height above the soles: tools/char_props.mjs --probe
# <clip> 4 on gen/characters/<c>/<c>_raw.glb (2026-10-12; steady through each clip). Library chair sits (33) on the
# original rigs keep the root at the feet; local retargets keep it under the hips.
HIPS = {   # (character, clip): (hips_left, hips_fwd, feet_left, feet_fwd, seat_h)
    ('official', 'sit'): (0.16, -0.27, 0.16, 0.08, 0.50), ('official', 'sit_talk'): (-0.15, -0.25, -0.16, 0.09, 0.63),
    ('official', 'write'): (0.0, 0.03, 0.02, 0.27, 0.46), ('scholar', 'sit'): (0.15, -0.23, 0.14, 0.13, 0.52),
    ('scholar', 'drink'): (0.0, 0.02, -0.02, 0.33, 0.45), ('robed_man', 'listen'): (0.02, 0.03, -0.01, 0.38, 0.49),
    ('carter', 'listen'): (0.01, -0.01, -0.02, 0.40, 0.50), ('carter', 'sit'): (0.17, -0.30, 0.17, 0.06, 0.49),
    ('idler', 'sit'): (-0.01, 0.03, -0.02, 0.40, 0.48), ('inspector', 'sit'): (-0.02, 0.02, -0.01, 0.41, 0.48),
    ('fortune_teller', 'sit'): (-0.01, 0.04, -0.01, 0.32, 0.49),
    ('fortune_teller', 'tell_fortune'): (0.02, 0.02, -0.01, 0.11, 0.48), ('elder', 'sit'): (0.16, -0.31, 0.16, 0.05, 0.48),
    ('soldier', 'sit'): (-0.02, -0.03, -0.01, 0.37, 0.48), ('child', 'listen'): (0.0, -0.01, -0.02, 0.26, 0.29),
    ('idler', 'sit_floor'): (0.0, 0.0, 0.0, 0.26, 0.0), ('scholar', 'knees_up'): (0.0, 0.04, 0.0, 0.56, 0.0),
    ('sightseer', 'knees_up'): (0.0, 0.0, 0.0, 0.53, 0.0), ('idler', 'sit_one_knee'): (0.0, 0.01, 0.0, 0.53, 0.0),
}
FLOOR_CLIPS = {'sit_floor', 'knees_up', 'sit_one_knee', 'doze_knees', 'kneel_sleep', 'sleep_side'}


def hips_of(model, clip):
    """HIPS for a character's seated clip; one not measured yet (a clip the workshop adds later) is taken as a local
    retarget (tools/retarget_local.mjs keeps the root under the hips): the hips at the root, the feet 0.38 m ahead
    (0.3 m for a floor sit), the seat 0.48 m (0 for a floor sit). Re-probe it (tools/char_props.mjs --probe) and add it."""
    if (model, clip) in HIPS:
        return HIPS[(model, clip)]
    print(f'  note: {model} {clip} not probed yet: taken as a local retarget (hips over the root)')
    return (0.0, 0.0, 0.0, 0.3, 0.0) if clip in FLOOR_CLIPS else (0.0, 0.02, 0.0, 0.38, 0.48)
# where each seated figure sits. 'mapped': on a mapped seat (its hips on the prop; not in seats.json). 'feet': on a seat
# the map lacks, the painted point read as the feet (the map's "foot est"); 'seat': the painted point is the seat.
# Floor sits sit on their support itself (the ground, a floor, a deck, a roof): nothing to build.
SEAT = {
    'official_seated_12728': ('seat', 'a low stool hidden behind the official hall\'s front railing, on its raised floor '
                              '(part 1\'s S4.bld.official_hall_12530, H 0.45): the map\'s "seat est at the robe\'s foot"; '
                              'no desk is painted, so none is built'),
    'man_dark_cap_by_stair_12700': ('feet', 'the ground at the foot of the official hall\'s stair, behind the big jar'),
    'man_seated_front_of_hall_12866': ('feet', 'a low bench or stool on the ground in front of the hall\'s railing (the '
                                       'map: "seated on a bench on the ground", hidden by the first cart\'s roof)'),
    'seated_man_13240': ('feet', 'the ground at the heart of the crowd, west of his goods (S4b.prop.goods_on_mat_13282): '
                         '"seated on the ground (no stool shows)"'),
    'customer_light_12990': ('feet', 'a stool at the west end of the shop table (hidden by the first cart\'s thatch)'),
    'customer_dark_hat_13027': ('feet', 'a stool at the south side of the shop table (hidden by the first cart\'s '
                                'thatch)'),
    'seated_in_bottom_shop_12792': ('mapped', 'S4b.prop.bench_12835'),
    'seated_in_cart_front_12995': ('cart', 'the first palm-covered cart\'s own seat: the plank across its sills just past '
                                   'the bed\'s front, under the thatch hood (kit_outer_road_2.palm_cart, parked)'),
    'figure_in_shop_13242': ('feet', 'a stool at the back of the open shop (dim)'),
    'stall_keeper_seated_13940': ('feet', 'a stool behind the goods table under the wheelwright shed\'s east end (faint)'),
    'man_east_bay_14958': ('feet', 'the tea house floor (H 0.18) at the back of its east bay, knees drawn up'),
    'customer_hat_14462': ('mapped', 'S4b.prop.chair_14458'),
    'customer_white_14560': ('mapped', 'S4b.prop.stool_14595'),
    'customer_cap_14785': ('mapped', 'S4b.prop.stool_14840'),
    'seated_boatman_stern_15372': ('crew', 'the arched-awning boat\'s stern deck, under the awning\'s east end'),
    'seated_man_cabin_roof_15012': ('crew', 'the big boat\'s west cabin roof, at its north edge'),
}
# the palm-covered carts at the area kit's real sizes (blender/kit_outer_road_2.py palm_cart defaults: body 3.9 x 1.3 m,
# wheel_at 0.56, R 0.85, the wheels' track hw + 0.33; its hidden collider from 0.3 m behind the body to 0.04 m past its
# front, and the track + 0.12 m to each side; parked (hitched=False): a seat plank across the sills at bx1 + 0.32, its
# top z_sill + 0.18 = 1.08 m, the jutting frame's crossbar at bx1 + 0.80; hitched: shafts from bx1 + 0.25 to the yoke)
CART_KIT = dict(body_len=3.9, body_w=1.3, wheel_at=0.56, R=0.85, plank_at=0.32, plank_top=1.08)
# the sedan chair set down as blender/outer_road_2_scene.py vehicles() builds it (kit_vehicles.sedan_chair
# carried=False: cabin d 0.92 along, w 0.78 across, its collider 0.05 / 0.12 proud; poles 0.465 m off its axis at
# 0.74 m from 0.2 m west of its painted rear to the painted crossbar at u ~13273; cabin_at min(0.45, 0.6 / length))
SEDAN_KIT = dict(d=0.92, w=0.78, pole_off=0.465, pole_east_u=13273)
TEA_FLOOR = 0.18


BUILDER_NAMES = {}


def builder_furniture():
    """The furniture as the area builder builds it (blender/outer_road_2_scene.py props(): table(eid, L, W, yaw, ht),
    bench(eid, L, yaw), stool(eid), chair(eid, yaw, back)), parsed on every run so the casting follows the builder's
    real sizes; {eid: dict(kind, L, W, yaw, ht)}. Falls back to empty (the default sizes below) without the builder."""
    import re
    path = os.path.join(QM, 'blender/outer_road_2_scene.py')
    if not os.path.exists(path):
        return {}
    src = open(path, encoding='utf-8').read()
    names = {'TEA_FLOOR': TEA_FLOOR}
    for n, eid in re.findall(r'^[ \t]*(\w+) = front_frame\("([^"]+)"\)\[1\]', src, re.M):
        if eid in E and E[eid].get('footprint'):
            sw, se = E[eid]['footprint'][0], E[eid]['footprint'][1]
            names[n] = math.degrees(math.atan2(se[1] - sw[1], se[0] - sw[0]))
    for n, v in re.findall(r'^[ \t]*(\w+) = (-?[\d.]+)\b', src, re.M):
        names.setdefault(n, float(v))
    ev = lambda x: float(eval(x, {'__builtins__': {}}, names))
    out = {}
    for kind, eid, args in re.findall(r'^[ \t]*(table|bench|stool|chair)\("(S4b\.prop\.[^"]+)"(.*)\)[ \t]*$', src, re.M):
        a = [x.strip() for x in args.split(',') if x.strip()]
        try:
            if kind == 'table':
                kw = dict(x.split('=', 1) for x in a[3:] if '=' in x)
                out[eid] = dict(kind=kind, L=ev(a[0]), W=ev(a[1]), yaw=ev(a[2]), ht=ev(kw.get('ht', '0.78')))
            elif kind == 'bench':
                out[eid] = dict(kind=kind, L=ev(a[0]), W=0.26, yaw=ev(a[1]), ht=0.45)
            elif kind == 'stool':
                out[eid] = dict(kind=kind, L=0.32, W=0.32, yaw=0.0, ht=0.42)
            else:
                out[eid] = dict(kind=kind, L=0.44, W=0.44, yaw=ev(a[0]), ht=0.45)
        except Exception:
            continue
    BUILDER_NAMES.update(names)
    return out


FURN = builder_furniture()
# the counters (kit_inner_city.counter along p0 -> p1, d deep to the left), as props() builds them
COUNTERS = {'S4b.prop.back_counter_13175': (1.8, 0.45, 0.9), 'S4b.prop.table_bowls_13275': (1.2, 0.45, 0.85)}

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


def fwd_left(facing):
    a = math.radians(facing)
    return (math.cos(a), math.sin(a)), (-math.sin(a), math.cos(a))


def at(p, facing, left, fwd):
    f, l = fwd_left(facing)
    return (p[0] + f[0] * fwd + l[0] * left, p[1] + f[1] * fwd + l[1] * left)


def axis(rear, front):
    dx, dy = front[0] - rear[0], front[1] - rear[1]
    n = math.hypot(dx, dy)
    return (dx / n, dy / n), n


def frame_ux(u, D):
    """X of scan column u at depth D (frame F1: u = ox + 77 X + dx D)."""
    F = L['frames'][0]
    return (u - F['origin'][0] - F['dx_knots'][0][1] * D) / F['x'][0]


def frame_pt(u, v, H=0.0):
    F = L['frames'][0]
    D = (F['origin'][1] - v - F['h'] * H) / -F['d'][1]
    return (frame_ux(u, D), D)


# ---------------------------------------------------------------- vehicles at real size
def cart_body(eid, hitched):
    """A palm-covered cart as kit_outer_road_2.palm_cart builds it from its layout points (CART_KIT)."""
    pts = E[eid]['pts']
    rear, front, wheel = pts['rear'][:2], pts['front'][:2], pts['wheel0'][:2]
    f, length = axis(rear, front)
    lft = (-f[1], f[0])
    s_w = (wheel[0] - rear[0]) * f[0] + (wheel[1] - rear[1]) * f[1]
    bx0 = s_w - CART_KIT['wheel_at'] * CART_KIT['body_len']
    bx1 = bx0 + CART_KIT['body_len']
    hw = CART_KIT['body_w'] / 2
    track = hw + 0.33
    P = lambda s, t: (rear[0] + f[0] * s + lft[0] * t, rear[1] + f[1] * s + lft[1] * t)
    c0, c1, side = bx0 - 0.3, bx1 + 0.04, track + 0.12
    out = dict(rear=rear, f=f, left=lft, ang=math.degrees(math.atan2(f[1], f[0])), bx0=bx0, bx1=bx1, s_w=s_w, hw=hw,
               track=track, side=side, length=length, P=P,
               collider=[P(c0, -side), P(c1, -side), P(c1, side), P(c0, side)])
    if hitched:   # the shafts from under the bed past its front to the shaft ox's yoke (about the painted front point)
        out['shafts'] = [P(bx1 + 0.04, -hw), P(length, -hw), P(length, hw), P(bx1 + 0.04, hw)]
    else:         # the sills jutting past the front to their carved ends, the crossbar on its prop
        out['jut'] = [P(bx1 + 0.04, -hw), P(bx1 + 0.98, -hw), P(bx1 + 0.98, hw), P(bx1 + 0.04, hw)]
        out['plank'] = P(bx1 + CART_KIT['plank_at'], 0.0)
    return out


def along_across(cart, p):
    d = (p[0] - cart['rear'][0], p[1] - cart['rear'][1])
    return d[0] * cart['f'][0] + d[1] * cart['f'][1], d[0] * cart['left'][0] + d[1] * cart['left'][1]


CART1 = cart_body('S4b.veh.palm_cart_13070', hitched=False)
CART2 = cart_body('S4b.veh.palm_cart_13455', hitched=True)
_sp = E['S4b.veh.sedan_chair_13140']['pts']
_yc = (_sp['front'][1] + _sp['rear'][1]) / 2
_xr, _xf = _sp['rear'][0] - 0.2, frame_ux(SEDAN_KIT['pole_east_u'], _yc)
_cab = min(0.9, max(0.1, min(0.45, 0.6 / max(0.1, _xf - _xr))))
SED_C = (_xr + (_xf - _xr) * _cab, _yc)
SED_E = SED_C[0] + SEDAN_KIT['d'] / 2 + 0.05                       # the cabin collider's east face (it faces east)
SED_POLE_E = _xf
SEDAN = dict(cabin=rect(SED_C, 0, SEDAN_KIT['d'] / 2 + 0.05, SEDAN_KIT['w'] / 2 + 0.12),
             poles=[[(_xr, _yc + sg * SEDAN_KIT['pole_off']), (_xf, _yc + sg * SEDAN_KIT['pole_off'])] for sg in (-1, 1)])

# ---------------------------------------------------------------- animals
# species, tack and load as painted (map/text/S4b.md; needs list "Animals"); the registry's coats and tack, with the
# fallbacks where it lacks what is painted (animals_why)
ANIMAL_SPEC = {
    'ox_shaft_13442': dict(model='ox', load='draught', do=[['idle', 10]]),
    'ox_lead_13458': dict(model='ox', load='draught', do=[['idle', 10]]),
    'horse_saddled_13378': dict(model='horse', load='saddle', do=[['head_low', 9], ['idle', 4]]),
    'horse_12862': dict(model='horse', scale=0.85, do=[['head_low', 9], ['idle', 4]]),
    'donkey_13474': dict(model='donkey', do=[['graze', 8], ['idle', 4]]),
    'mule_pack_head_down_13612': dict(model='mule', load='pack_saddle', do=[['graze', 8], ['idle', 4]]),
    'mule_pack_head_up_13645': dict(model='mule', load='pack_saddle', do=[['idle', 10]]),
    'mule_pack_east_13752': dict(model='mule', load='pack_saddle', do=[['graze', 8], ['idle', 4]]),
    'mule_pack_behind_13787': dict(model='mule', load='pack_saddle', do=[['idle', 10]]),
    'bird_12827': dict(model='bird', do=[['idle', 10]]),
}
# a team in harness gets its facing written out (the builder's harness reads the same value): from hind to fore hooves
TEAM = ('ox_shaft_13442', 'ox_lead_13458')
MULES = ['mule_pack_head_down_13612', 'mule_pack_head_up_13645', 'mule_pack_east_13752', 'mule_pack_behind_13787']
LOAD_W = {'pack_saddle': 0.8, 'pannier_charcoal': 0.8}   # loads wider than the body


def hoof_facing(slug):
    a = ANIMALS[slug]['pts']
    return math.degrees(math.atan2(a['fore'][1] - a['hind'][1], a['fore'][0] - a['hind'][0]))


def animal_body(slug, spec, nudge=None):
    e = ANIMALS[slug]
    info = ANI.get(spec['model'], {'length_m': 0.3, 'width_m': 0.12})
    k = spec.get('scale', 1)
    w = LOAD_W.get(spec.get('load'), info['width_m'])
    ang = spec.get('facing_deg', hoof_facing(slug))
    nx, nd = nudge if nudge is not None else spec.get('nudge', [0, 0])
    c = (e['pos'][0] + nx, e['pos'][1] + nd)
    return dict(c=c, ang=ang, hl=info['length_m'] * k / 2, hw=w * k / 2, H=e.get('H', 0),
                poly=rect(c, ang, info['length_m'] * k / 2, w * k / 2))


for s in TEAM:
    ANIMAL_SPEC[s]['facing_deg'] = round(hoof_facing(s), 1)

# ---------------------------------------------------------------- obstacles at the builder's real sizes
BLOCK = []   # (name, polygon): buildings and structures with footprints (this section's and part 1's that reach in)
for k, e in E.items():
    if e['kind'] in ('building', 'structure') and e.get('footprint'):
        BLOCK.append((k, e['footprint']))
for k in ('S4.bld.official_hall_12530', 'S4.bld.south_hall_12350'):
    BLOCK.append((k, S4['entities'][k]['footprint']))
def builder_rects():
    """Buildings the area builder squares to the frame with its own numbers (`eid = "..."` then `x0, x1, yf, yb = a, b, c,
    d`, e.g. the shop hall): their real walls, which replace the layout footprint in the checks."""
    import re
    path = os.path.join(QM, 'blender/outer_road_2_scene.py')
    if not os.path.exists(path):
        return {}
    src = open(path, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r'eid = "(S4b\.bld\.[^"]+)"((?:\n[^\n]*){0,8}?)\n[ \t]*x0, x1, yf, yb = (-?[\d.]+), (-?[\d.]+), '
                         r'(-?[\d.]+), (-?[\d.]+)\s*$', src, re.M):
        x0, x1, y0, y1 = (float(v) for v in m.groups()[2:])
        out[m.group(1)] = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    return out


BUILDER_RECTS = builder_rects()
BLOCK = [(n, BUILDER_RECTS.get(n, poly)) for n, poly in BLOCK]
VEH = [('S4b.veh.palm_cart_13070', CART1['collider']), ('S4b.veh.palm_cart_13070 jutting frame', CART1['jut']),
       ('S4b.veh.palm_cart_13455', CART2['collider']), ('S4b.veh.palm_cart_13455 shafts', CART2['shafts']),
       ('S4b.veh.sedan_chair_13140 cabin', SEDAN['cabin'])]
# the water: east of the near shore (shore_s), closed round the river to the seam and the silk's top
_shore = E['S4b.water.bian_river']['lines']['shore_s']
WATER = [tuple(p) for p in _shore] + [(_shore[-1][0] + 8, _shore[-1][1]), (_shore[-1][0] + 8, 40), (_shore[0][0], 40)]
# rectangles: (name, centre, L, W, yaw, top above its support, support H, collides-from-above); the builder's tables,
# benches, stools, chairs (FURN, parsed from props()), its counters, and the props it builds at a size (props())
RECTS = []
for k, fu in FURN.items():
    if k in E:
        RECTS.append((k, tuple(E[k]['pos'][:2]), fu['L'], fu['W'], fu['yaw'], fu['ht'], E[k].get('H', 0),
                      fu['kind'] == 'table'))
_hy = BUILDER_NAMES.get('hy', 0.0)
for k, (Lc, Dc, Hc) in COUNTERS.items():
    if k in E:
        c = tuple(E[k]['pos'][:2])
        _f, _l = fwd_left(_hy)
        RECTS.append((k, (c[0] + _l[0] * Dc / 2, c[1] + _l[1] * Dc / 2), Lc, Dc, _hy, Hc, 0, True))
for k, Lr, Wr, yaw, ht in (('S4b.prop.goods_on_mat_13282', 1.3, 0.9, 0, 0.3), ('S4b.prop.stall_13480', 1.2, 0.6, 25, 0.95),
                           ('S4b.prop.counter_frame_12655', 1.2, 0.45, 0, 1.1), ('S4b.prop.bundle_heap_14680', 2.8, 0.9, 0, 0.45),
                           ('S4b.prop.bundle_heap_14970', 2.8, 0.9, 0, 0.45), ('S4b.prop.slatted_crate_12819', 0.6, 0.45, 0, 0.45),
                           ('S4b.prop.slatted_rack_12732', 1.1, 0.4, 0, 0.5), ('S4b.prop.small_box_14915', 0.4, 0.35, 0, 0.35),
                           ('S4b.prop.striped_load_13684', 0.8, 0.6, 30, 0.6), ('S4b.prop.reed_mat_13870', 0.9, 0.15, 10, 2.1)):
    if k in E:
        RECTS.append((k, tuple(E[k]['pos'][:2]), Lr, Wr, yaw, ht, E[k].get('H', 0), True))
DISCS = []   # (name, centre, radius, is_seat, H)
for k, r in (('S4b.prop.big_jar_12707', 0.42), ('S4b.prop.funnel_vessel_12884', 0.3), ('S4b.prop.barrel_12677', 0.3),
             ('S4b.prop.round_basket_or_drum_14795', 0.25), ('S4b.prop.round_basket_13840', 0.5),
             ('S4b.prop.sacks_under_table_13890', 0.3), ('S4b.prop.jug_12833', 0.12), ('S4b.prop.mooring_post_14737', 0.11),
             ('S4b.prop.round_canopy_14905', 0.06), ('S4b.prop.leaning_poles_13775', 0.15),
             ('S4b.prop.loose_wheel_13665', 0.85), ('S4b.prop.tool_on_ground_13632', 0.1)):
    if k in E:
        DISCS.append((k, tuple(E[k]['pos'][:2]), r, False, E[k].get('H', 0)))
if 'S4b.prop.pole_frame_basket_13690' in E:     # its two legs, 1.5 m apart along yaw 30
    c = E['S4b.prop.pole_frame_basket_13690']['pos']
    for sg in (-1, 1):
        DISCS.append(('S4b.prop.pole_frame_basket_13690 leg', (c[0] + sg * 0.75 * math.cos(math.radians(30)),
                                                             c[1] + sg * 0.75 * math.sin(math.radians(30))), 0.08, False, 0))
BLOCK.append(('S4b.prop.timber_pile_13745', E['S4b.prop.timber_pile_13745']['footprint']))
for t in L['trees']:          # trunks: the builder gives every tree over 3 m a 0.3 m trunk collider (x its scale)
    if t.get('support') != 'far bank' and (t.get('height_m') or 0) >= 3.0:
        DISCS.append((t['map_id'], (t['X'], t['D']), 0.3 * t.get('scale', 1), False, 0))
# the tea house's posts as blender/outer_road_2_scene.py tea_house() stands them (its choice), for the checks
_tw = E['S4b.bld.tea_house_14531']['footprint']
_yf = (_tw[0][1] + _tw[1][1]) / 2 + 0.05
_g0, _g1 = frame_ux(14465, _yf), frame_ux(14742, _yf)
TEA_POSTS = [(x_, y_) for x_ in (_g0 - 2.2, _g0, _g1, _tw[1][0] - 0.1 - 2.6, _tw[1][0] - 0.1) for y_ in (_yf + 0.05, 11.35 - 0.25)]
for q in TEA_POSTS:
    DISCS.append(('S4b.bld.tea_house_14531 post', q, 0.1, False, TEA_FLOOR))


def rect_poly(r_):
    name, c, Lr, Wr, yaw, ht, H, top = r_
    return rect(c, yaw, Lr / 2, Wr / 2)


SOLID = [(r_[0], rect_poly(r_)) for r_ in RECTS if r_[0] not in FURN or FURN[r_[0]]['kind'] == 'table']
SEATS_P = [(r_[0], rect_poly(r_)) for r_ in RECTS if r_[0] in FURN and FURN[r_[0]]['kind'] != 'table']

# ---------------------------------------------------------------- who plays whom
def sit_ok(model, slug):
    clips = REG.get(model, {}).get('clips', [])
    return any(c in clips for cands, _ in DO[slug] for c in cands if c in SEATED_CLIPS)


def playing(slug):
    c = CAST[slug]
    if c not in REG:
        return STAND_IN[slug][0], 'stand_in'
    if FIG[slug]['pose'] == 'seated' and not sit_ok(c, slug):
        return RECAST[slug][0], 'recast'
    return c, None


wanted = {}       # clip -> {character: [figures]}


def steps_for(slug, c, model):
    out = []
    for cands, secs in DO[slug]:
        have = [x for x in cands if x in REG[model]['clips']
                and not (NEEDS_PROP.get(x) and f'prop_{NEEDS_PROP[x]}' not in glb_parts(model))]
        clip = have[0] if have else 'idle'
        if cands[0] not in REG.get(c, {}).get('clips', []) or clip != cands[0]:
            if cands[0] != 'idle':
                wanted.setdefault(cands[0], {}).setdefault(c, []).append(slug)
        if out and out[-1][0] == clip:          # two steps that play the same clip are one
            out[-1][1] += secs
        else:
            out.append([clip, secs])
    return out


MODEL = {s: playing(s) for s in FIG}
assert not [s for s in FIG if s not in CAST], f'figures without a cast: {[s for s in FIG if s not in CAST]}'
assert not [s for s in CAST if s not in FIG], f'cast for figures not in the layout: {[s for s in CAST if s not in FIG]}'
assert not [s for s in FIG if s not in DO], 'figures without actions'
STEPS = {s: steps_for(s, CAST[s], MODEL[s][0]) for s in FIG if s not in WALKERS}
CREW = {s for s in FIG if FIG[s]['support'].startswith('boat')}   # placed by the page on their boats: never nudged here

# ---------------------------------------------------------------- figures: nudges (each with its reason)
NUDGE = {}
EXTRA = {}       # seated figures: the computed seat (for seats.json and the checks)


def nudge(slug, v, why):
    assert slug not in CREW, f'{slug} is crew: its place is the layout\'s (the boats\' recorded moves)'
    NUDGE[slug] = ([round(v[0], 2), round(v[1], 2)], why)


def add_nudge(slug, v, why):
    n0 = NUDGE.get(slug, ([0, 0], ''))
    nudge(slug, (n0[0][0] + v[0], n0[0][1] + v[1]), (n0[1] + '; then ' if n0[1] else '') + why)


def spot(slug):
    f = FIG[slug]
    n = NUDGE.get(slug, ([0, 0],))[0]
    return (f['X'] + n[0], f['D'] + n[1])


def facing_of(slug):
    return FACING.get(slug, (FIG[slug]['facing_deg'],))[0]


# seated figures: the root from the seat (or the painted feet) through the clip's own hip and foot positions
for slug, (kind, what) in SEAT.items():
    f = FIG[slug]
    model = MODEL[slug][0]
    clip = STEPS[slug][0][0]
    hl, hf, fl, ff, seat_h = hips_of(model, clip)
    fac = facing_of(slug)
    p = (f['X'], f['D'])
    why = None
    if kind == 'mapped':
        c = tuple(E[what]['pos'][:2])
        fu = FURN.get(what, {})
        if fu.get('kind') == 'bench':     # on the bench where it passes his painted spot
            bf, _ = fwd_left(fu['yaw'])
            t_ = max(-fu['L'] / 2 + 0.2, min(fu['L'] / 2 - 0.2, (p[0] - c[0]) * bf[0] + (p[1] - c[1]) * bf[1]))
            seat = (c[0] + bf[0] * t_, c[1] + bf[1] * t_)
        else:
            seat = c
        root = at(seat, fac, -hl, -hf)
        feet = at(root, fac, fl, ff)
        why = (f'seated on {what} (a mapped {fu.get("kind", "seat")}, {fu.get("ht", 0.45):.2f} m high as the builder '
               f'makes it), as painted: {model}\'s {clip} keeps the hips {math.hypot(hl, hf):.2f} m from the root, so '
               f'the root stands where the hips land on the seat; the feet then fall {math.dist(feet, p):.2f} m from the '
               f'painted foot point')
    elif kind == 'seat':
        seat = p
        root = at(seat, fac, -hl, -hf)
        feet = at(root, fac, fl, ff)
        why = (f'painted seated, the map\'s point his seat ("seat est"); {model}\'s {clip} keeps the hips '
               f'{math.hypot(hl, hf):.2f} m from the root, so the root stands where the hips land on that seat '
               f'(seats.json)')
    elif kind == 'cart':     # the parked palm cart's own seat plank; a floor sit keeps the root under the hips
        seat = CART1['plank']
        root = at(seat, fac, -hl, -hf)
        feet = at(root, fac, fl, ff)
        why = (f'seated on the first palm cart\'s seat, as painted under its thatch hood: the plank the area kit lays '
               f'across the sills {CART_KIT["plank_at"]} m past the bed\'s front (top {CART_KIT["plank_top"]} m; '
               f'kit_outer_road_2.palm_cart, parked), cross-legged (sit_floor keeps the root under the hips): at real size '
               f'the cart\'s front is {math.dist(seat, p):.2f} m from his painted point')
    elif kind == 'crew':     # on a boat: the page puts him on its deck or roof below his layout spot; nothing moves here
        seat = root = feet = p
    else:   # 'feet': the painted point is where the feet are
        feet = p
        root = at(feet, fac, -fl, -ff)
        seat = at(root, fac, hl, hf)
        why = (f'painted seated with his feet at the painted point (the map\'s foot est); {model}\'s {clip} keeps its '
               f'root {math.hypot(fl, ff):.2f} m from the feet and the hips {math.hypot(hl, hf):.2f} m from the root, so the '
               f'root stands there and his seat goes under the hips (seats.json)')
    EXTRA[slug] = dict(kind=kind, what=what, model=model, clip=clip, seat=seat, root=root, feet=feet, seat_h=seat_h,
                       facing=fac)
    if kind != 'crew' and math.dist(root, p) > 0.01:
        nudge(slug, (root[0] - p[0], root[1] - p[1]), why)

# man in the dark cap by the stair: he sits behind (north of) the big jar that hides his lower body
f = FIG['man_dark_cap_by_stair_12700']
jar = E['S4b.prop.big_jar_12707']['pos']
need = 0.42 + 0.24
if math.dist(spot('man_dark_cap_by_stair_12700'), jar) < need:
    tgt = (f['X'], jar[1] + need)
    EXTRA['man_dark_cap_by_stair_12700'].update(root=tgt, seat=tgt, feet=at(tgt, 180, 0, 0.26))
    nudge('man_dark_cap_by_stair_12700', (0, tgt[1] - f['D']),
          f'his foot point is {math.dist((f["X"], f["D"]), jar):.2f} m from the big jar\'s centre (0.84 m across at '
          f'real size, the builder\'s kit_outer_road_2.big_jar; it hides his lower body in the painting, so it stands in '
          f'front of him, toward the viewer): he sits on the ground just behind (north of) it, facing west to the stair')

# the small boy at the first cart's west end: out of the cart's real-size body, behind its tail
f = FIG['small_figure_cart_rear_12706']
al, ac = along_across(CART1, (f['X'], f['D']))
if al > CART1['bx0'] - 0.3 - 0.3 and abs(ac) < CART1['side'] + 0.3:
    tgt = CART1['P'](CART1['bx0'] - 0.3 - 0.3, ac)
    nudge('small_figure_cart_rear_12706', (tgt[0] - f['X'], tgt[1] - f['D']),
          f'painted under the fringe of the first palm cart\'s thatch at its west end; at real size the cart\'s body '
          f'(3.9 m, centred on its painted wheel) and its collider reach X {CART1["P"](CART1["bx0"] - 0.3, 0)[0]:.2f}, '
          f'{CART1["bx0"] - 0.3 - al:+.2f} m past his spot: he stands just behind its tail, where he is painted')

# the porter reaching up under the second cart's rear half: against its near side, at his painted place along it
f = FIG['porter_at_cart_rear_13090']
al, ac = along_across(CART2, (f['X'], f['D']))
side = CART2['side'] + 0.3
if abs(ac) > side + 0.05:
    tgt = CART2['P'](al, math.copysign(side, ac))
    nudge('porter_at_cart_rear_13090', (tgt[0] - f['X'], tgt[1] - f['D']),
          f'painted with both arms raised to the second palm cart\'s underside at its rear half (his hands against its '
          f'bed); at real size (the area kit\'s body 1.3 m wide, its wheels\' collider {CART2["side"]:.2f} m off the '
          f'axis) his painted spot is {abs(ac) - CART2["side"]:.2f} m off its side, so he steps in to stand against it, '
          f'{al:.2f} m along it as painted')

# the sedan attendant: between the poles at the set-down chair's east end, clear of the cabin
f = FIG['sedan_attendant_13160']
tgt = (max(f['X'], SED_E + 0.3), SED_C[1])
nudge('sedan_attendant_13160', (tgt[0] - f['X'], tgt[1] - f['D']),
      f'painted standing between the set-down sedan chair\'s two poles at its east end, facing us; at real size the north '
      f'pole ({SEDAN_KIT["pole_off"]} m off the chair\'s axis, 0.74 m up, as the builder runs it to the crossbar at X '
      f'{SED_POLE_E:.2f}) runs through his painted spot and the cabin\'s east face (with its collider) is at X '
      f'{SED_E:.2f}: he stands on the axis between the poles, just east of the cabin')

# ---------------------------------------------------------------- walks
WALK_LEN = 7.0
BODY_R = 0.26        # people.js: everyone is a 0.26 m cylinder


def gangplank():
    """The mat-cargo boat's gangplank: its foot on the bank (the builder's kit option, build_choices.json boats, else its
    painted bank end at scan (14760, 402)) and its direction up to the boat (toward the boat's bow, layout front)."""
    b = (CHOICES.get('boats') or {}).get('S4b.veh.boat_mat_cargo_14900', {})
    g = (b.get('kit') or {}).get('gangplank')
    foot, why = ((g[0], g[1]), 'the gangplank\'s foot the builder sets (build_choices.json boats '
                 'S4b.veh.boat_mat_cargo_14900 kit.gangplank)') if g else \
        (frame_pt(14760, 402), 'the gangplank\'s painted bank end (scan 14760, 402)')
    bow = E['S4b.veh.boat_mat_cargo_14900']['pts']['front'][:2]
    d, n = axis(foot, bow)
    return foot, d, why


def standing_people(exclude=()):
    return {s: spot(s) for s in FIG if s not in WALKING and s not in CREW and s not in exclude}


def clearance(p, people=True, me=None):
    """Room from p to the nearest building, structure, vehicle, prop, trunk, animal, standing figure, the water or the
    painted area's edge."""
    d, who = -poly_dist(p, AREA), 'the painted area\'s edge'
    for name, poly in BLOCK + VEH + SOLID + SEATS_P + [(f'animal {s}', b['poly']) for s, b in BODY.items() if b['H'] < 1] + \
            [('the river (its near shore)', WATER)]:
        dd = poly_dist(p, poly)
        if dd < d:
            d, who = dd, name
    for name, c, r, _, _ in DISCS:
        dd = math.hypot(p[0] - c[0], p[1] - c[1]) - r
        if dd < d:
            d, who = dd, name
    if people:
        for s, q in standing_people(exclude=(me,)).items():
            dd = math.hypot(p[0] - q[0], p[1] - q[1]) - BODY_R
            if dd < d:
                d, who = dd, f'figure {s}'
    return d, who


def run_from(o, d, limit, me):
    best, stop = 0.0, ''
    for i in range(1, 200):
        s_ = i * 0.05
        if s_ > limit:
            break
        c, who = clearance((o[0] + d[0] * s_, o[1] + d[1] * s_), me=me)
        if c < BODY_R + 0.04:
            stop = who
            break
        best = s_
    return best, stop


def walk_path(slug):
    f = FIG[slug]
    if slug == 'porter_baskets_14778':
        foot, pd, foot_why = gangplank()
        end = (foot[0] - pd[0] * 0.35, foot[1] - pd[1] * 0.35)
        back = math.degrees(math.atan2(-pd[1], -pd[0]))
        best = (0.0, '', back)
        for off in (0, -15, 15, -30, 30, -45, 45, -60, -75, -90):
            a = math.radians(back + off)
            ln, stop = run_from(end, (math.cos(a), math.sin(a)), WALK_LEN, slug)
            if ln > best[0] + 1e-6:
                best = (ln, stop, back + off)
            if ln >= 4.0:
                break
        ln, stop, ang = best
        a = math.radians(ang)
        path = [[round(end[0] + math.cos(a) * ln, 2), round(end[1] + math.sin(a) * ln, 2)], [round(end[0], 2), round(end[1], 2)]]
        why = (f'up the bank to the mat-cargo boat\'s gangplank, as painted (stepping down it with his baskets): from '
               f'{ln:.1f} m out on the bank (heading {(ang + 180) % 360:.0f} deg toward the plank' +
               (f'; {stop} beyond' if stop else '') + f') to 0.35 m short of {foot_why}, ({foot[0]:.2f}, {foot[1]:.2f}); '
               f'the plank itself is the boat kit\'s, so he turns there and walks back')
        return path, ln, why
    o = (f['X'], f['D'])
    a = math.radians(f['facing_deg'])
    d = (math.cos(a), math.sin(a))
    fwd, stop = run_from(o, d, WALK_LEN, slug)
    back, bstop = run_from(o, (-d[0], -d[1]), WALK_LEN - fwd, slug)
    cap = PATH_CAP.get(slug)
    if cap and abs(d[1]) > 1e-6:
        # the boats are not in clearance(): a raked bow overhanging the bank stops a walker short of it (area agent)
        lim, cap_why = cap
        fwd = min(fwd, max(0.0, (lim - o[1]) / d[1])) if d[1] > 0 else fwd
        stop = cap_why
    path = [[round(o[0] - d[0] * back, 2), round(o[1] - d[1] * back, 2)],
            [round(o[0] + d[0] * fwd, 2), round(o[1] + d[1] * fwd, 2)]]
    why = (f'{fwd:.1f} m along his painted facing ({f["facing_deg"]} deg)' + (f' to {stop}' if stop else '')
           + (f', and {back:.1f} m back behind his spot' + (f' to {bstop}' if bstop else '') if back > 0.05 else ''))
    return path, fwd + back, why


# walks that would climb onto a boat's bow where it overhangs the bank (QA, 2026-10-12): the northern limit (D) of the
# path and the reason
PATH_CAP = {'figure_behind_roof_14583': (19.0, "D 19.0, short of the arched-awning boat's bow, which overhangs the bank "
                                               "from D 19.25 (its boarding bridges)")}


WALKING = set(WALKERS)
BODY = {s: animal_body(s, sp) for s, sp in ANIMAL_SPEC.items()}

# the porter at the gangplank: his place is now the plank's foot (the builder moved the plank to the boat's north side)
f = FIG['porter_baskets_14778']
foot, pd, foot_why = gangplank()
tgt = (foot[0] - pd[0] * 0.35, foot[1] - pd[1] * 0.35)
if math.dist(tgt, (f['X'], f['D'])) > 0.05:
    NUDGE['porter_baskets_14778'] = ([round(tgt[0] - f['X'], 2), round(tgt[1] - f['D'], 2)],
                                     f'painted stepping onto the mat-cargo boat\'s gangplank at its bank end (scan 14760, '
                                     f'402); at real size the boat lies moved outward (build_choices.json moves) and its '
                                     f'plank lands on its north side, foot at ({foot[0]:.2f}, {foot[1]:.2f}) ({foot_why}): '
                                     f'his place is 0.35 m short of that foot, where his walk turns (the page starts a '
                                     f'walker on the path point nearest his painted spot)')

# ---------------------------------------------------------------- animals: real size against painted place
# the four pack mules are painted overlapping far up the silk (drawn at about 0.6 of the street's scale); at real size
# (2.09 m long, the packs 0.8 m wide) they run into each other and the hipped roof behind the trees. The least total
# move that frees them, keeping each one's painted heading and their order along the street, is searched on a 0.1 m
# grid (coordinate descent), as part 1 did for its pack donkeys; the muleteer and the man behind the tree stay clear.


def mule_cost(nudges):
    bodies = {s: animal_body(s, ANIMAL_SPEC[s], nudges[s]) for s in MULES}
    pen = 0.0
    people_ = list(standing_people().values()) + [spot(s) for s in WALKING]
    for i, a in enumerate(MULES):
        A = rect(bodies[a]['c'], bodies[a]['ang'], bodies[a]['hl'] + 0.05, bodies[a]['hw'] + 0.05)
        for b in MULES[i + 1:]:
            if polys_overlap(A, bodies[b]['poly']):
                pen += 100
        for name, poly in BLOCK + SOLID:
            if polys_overlap(A, poly):
                pen += 100
        for q in people_:
            if poly_dist(q, A) < 0.3:
                pen += 50
    cx = [bodies[m]['c'][0] for m in MULES]
    cd = [bodies[m]['c'][1] for m in MULES]
    # the painted order: the first two at the train's west end, the last two east of them; the second and the fourth
    # each behind (north of) the one before it
    pen += 30 * sum(1 for ok in (cx[0] <= cx[2], cx[1] <= cx[3], cd[1] >= cd[0] - 0.05, cd[3] >= cd[2] - 0.05) if not ok)
    return pen + sum(v[0] ** 2 + v[1] ** 2 for v in nudges.values())


nud = {m: [0.0, 0.0] for m in MULES}
grid = [i * 0.1 for i in range(-20, 21)]
for _ in range(6):
    changed = False
    for m in MULES:
        best = (mule_cost(nud), tuple(nud[m]))
        for dx in grid:
            for dd in grid:
                c = mule_cost({**nud, m: [dx, dd]})
                if c < best[0] - 1e-9:
                    best = (c, (dx, dd))
        if tuple(nud[m]) != best[1]:
            nud[m] = list(best[1])
            changed = True
    if not changed:
        break
MULE_COST = mule_cost(nud)
for m in MULES:
    if math.hypot(*nud[m]) > 0.01:
        ANIMAL_SPEC[m]['nudge'] = [round(nud[m][0], 2), round(nud[m][1], 2)]
ANIMAL_WHY = {}
# a free animal whose real-size body runs into a building or a solid prop slides back along its own heading, the least
# that frees it (its painted heading and its place in its group kept)
for a in ('horse_saddled_13378', 'horse_12862', 'donkey_13474'):
    sp = ANIMAL_SPEC[a]
    b0 = animal_body(a, sp)
    hits = [n for n, poly in BLOCK + VEH + SOLID if polys_overlap(b0['poly'], poly)]
    if not hits:
        continue
    fa, _ = fwd_left(b0['ang'])
    for k_ in range(1, 31):
        for sg in (-1, 1):
            v = (sg * fa[0] * 0.05 * k_, sg * fa[1] * 0.05 * k_)
            b1 = animal_body(a, sp, v)
            if not any(polys_overlap(b1['poly'], poly) for n, poly in BLOCK + VEH + SOLID):
                break
        else:
            continue
        break
    sp['nudge'] = [round(v[0], 2), round(v[1], 2)]
    ANIMAL_WHY[a] = (f'at real size ({2 * b0["hl"]:.2f} m long against its painted {ANIMALS[a].get("length_m", 0):.2f} m) '
                     f'its body ran into {", ".join(hits)}: it steps {0.05 * k_:.2f} m '
                     f'{"back" if sg < 0 else "forward"} along its own heading, keeping its painted place in its group')
BODY = {s: animal_body(s, sp) for s, sp in ANIMAL_SPEC.items()}
WALK_STAND = {}
for s in WALKERS:     # a painted walker with no room stands (skill characters); decided before the nudges
    path, length, why = walk_path(s)
    if length < MIN_WALK:
        WALK_STAND[s] = (length, why)
        WALKING.discard(s)
        STEPS[s] = steps_for(s, CAST[s], MODEL[s][0])



def push_off(slug, body, clear=0.28):
    """Nudge a figure straight out from an animal's flank (or its end) so it stands against it."""
    p = spot(slug)
    a = math.radians(body['ang'])
    fwd, nrm = (math.cos(a), math.sin(a)), (-math.sin(a), math.cos(a))
    rel = (p[0] - body['c'][0], p[1] - body['c'][1])
    s_al, s_ac = rel[0] * fwd[0] + rel[1] * fwd[1], rel[0] * nrm[0] + rel[1] * nrm[1]
    if abs(s_al) > body['hl'] + clear or abs(s_ac) > body['hw'] + clear:
        return None
    m_ac = body['hw'] + clear - abs(s_ac)
    m_al = body['hl'] + clear - abs(s_al)
    if m_ac <= m_al:
        sg = 1 if s_ac >= 0 else -1
        return (sg * nrm[0] * m_ac, sg * nrm[1] * m_ac), 'flank', m_ac
    sg = 1 if s_al >= 0 else -1
    return (sg * fwd[0] * m_al, sg * fwd[1] * m_al), 'head' if sg > 0 else 'rump', m_al


ANIMAL_NAMES = {'horse_saddled_13378': 'the saddled horse', 'donkey_13474': 'the small dark donkey',
                'horse_12862': 'the small horse', 'ox_shaft_13442': 'the shaft ox', 'ox_lead_13458': 'the lead ox'}
for s in FIG:
    if s in WALKING or s in CREW:
        continue
    for a, b in BODY.items():
        if b['H'] >= 1:
            continue
        r = push_off(s, b)
        if r:
            (vx, vy), part, m = r
            add_nudge(s, (vx, vy), f'painted against {ANIMAL_NAMES.get(a, a.replace("_", " "))} ({ANIMAL_SPEC[a]["model"]}, '
                      f'{2 * b["hl"]:.2f} m long and {2 * b["hw"]:.2f} m wide at real size), his spot fell inside its '
                      f'body: he steps {m:.2f} m straight out from its {part}, on the side he is painted')

# ---------------------------------------------------------------- figures out of buildings, vehicles and props
EXPECTED_INSIDE = {   # painted inside an open front, a shed or a hall: the builder's opening or floor
    ('counter_man_leaning_13325', 'S4b.bld.shop_hall_13170'): 'under the small shed at the shops\' east end',
    ('figure_in_shop_13242', 'S4b.bld.shop_hall_13170'): 'at the back of the open shop',
    ('official_seated_12728', 'S4.bld.official_hall_12530'): 'on the hall\'s raised floor',
    ('stall_keeper_seated_13940', 'S4b.bld.wheelwright_shed_13840'): 'under the shed\'s east end',
    ('figure_behind_rail_13995', 'S4b.bld.wheelwright_shed_13840'): 'behind the rail in the shed\'s open front',
    ('man_in_shed_13220', 'S4b.bld.crowd_shop_13180'): 'in the railed shed\'s open front',
    ('customer_bent_14420', 'S4b.bld.tea_house_14531'): 'in the tea house\'s open hall',
    ('customer_hat_14462', 'S4b.bld.tea_house_14531'): 'in the tea house\'s open hall',
    ('customer_white_14560', 'S4b.bld.tea_house_14531'): 'in the tea house\'s open hall',
    ('customer_cap_14785', 'S4b.bld.tea_house_14531'): 'in the tea house\'s open hall',
    ('man_east_bay_14958', 'S4b.bld.tea_house_14531'): 'in the tea house\'s east bay',
    ('man_east_bay_14958', 'S4b.bld.mat_shed_15038'): 'in the tea house\'s east bay under the mat shed',
    ('man_at_gate_post_14540', 'S4b.str.bank_shed_14445'): 'at the roofed gate\'s east post',
    ('wheelwright_bending_13620', 'S4b.prop.loose_wheel_13665'): 'bending over the wheel\'s rim',
    ('seated_in_cart_front_12995', 'S4b.veh.palm_cart_13070 jutting frame'): 'on the cart\'s own seat plank',
    ('seated_in_cart_front_12995', 'S4b.veh.palm_cart_13070'): 'on the cart\'s own seat plank, just past its collider',
    ('counter_man_leaning_13325', 'S4b.prop.table_bowls_13275'): 'leaning on the counter\'s east end',
    ('seated_in_bottom_shop_12792', 'S4b.prop.table_tray_12845'): 'seated at the table, his legs under it',
    ('stall_keeper_seated_13940', 'S4b.prop.goods_table_13892'): 'seated behind the goods table',
    ('sedan_attendant_13160', 'S4b.veh.sedan_chair_13140 cabin'): 'between the poles at the cabin\'s east face',
}
SEATED_FIXED = set(SEAT)
for s in FIG:
    if s in WALKING or s in SEATED_FIXED or s in CREW:
        continue
    for name, poly in BLOCK + VEH + SOLID:
        if (s, name) in EXPECTED_INSIDE:
            continue
        p = spot(s)
        dd = poly_dist(p, poly)
        if dd >= 0.3:
            continue
        # straight out from the nearest edge, the least that gives 0.3 m
        best = None
        for i_ in range(len(poly)):
            a_, b_ = poly[i_], poly[(i_ + 1) % len(poly)]
            ex, ey = b_[0] - a_[0], b_[1] - a_[1]
            n = math.hypot(ex, ey)
            for nx, ny in ((ey / n, -ex / n), (-ey / n, ex / n)):
                for mv in [k_ * 0.02 for k_ in range(1, 80)]:
                    q = (p[0] + nx * mv, p[1] + ny * mv)
                    if poly_dist(q, poly) >= 0.3:
                        if best is None or mv < best[0]:
                            best = (mv, (nx * mv, ny * mv))
                        break
        if best:
            what_ = ('as the builder squares it (its own walls, blender/outer_road_2_scene.py)' if name in BUILDER_RECTS
                     else 'at the builder\'s size' if name in FURN or name in COUNTERS or name.startswith('S4b.prop')
                     else 'at real size (its mapped footprint)')
            add_nudge(s, best[1], f'his spot lies {"inside" if dd < 0 else "within 0.3 m of"} {name} {what_}: he steps '
                      f'{best[0]:.2f} m straight out of it, to stand clear of it')
    for name, c, r, is_seat, H in DISCS:
        if (s, name) in EXPECTED_INSIDE:
            continue
        p = spot(s)
        d = math.dist(p, c) - r
        if d < 0.2:
            v = (p[0] - c[0], p[1] - c[1])
            n = math.hypot(*v) or 1
            mv = 0.2 - d
            add_nudge(s, (v[0] / n * mv, v[1] / n * mv), f'his spot is {max(0.0, r + d):.2f} m from the centre of {name} '
                      f'({r:.2f} m in radius at real size): he steps {mv:.2f} m out from it')

# anyone painted closer than two bodies (people.js: 0.26 m each): pushed apart along the line between them, each half
# the overlap; a seated figure on its seat stays and the other moves. Crew are never moved here: their places are the
# layout's, which carries their boats' recorded moves (the area builder, 2026-10-12)
ANCHORED = set(SEATED_FIXED) | {'sedan_attendant_13160', 'porter_at_cart_rear_13090'}
scale_of = {}
for s, (r, ref, why) in CHILD.items():
    h_ref = ref if isinstance(ref, float) else height(ref)
    scale_of[s] = round(r * h_ref / height(MODEL[s][0]), 2)


def body_r(s):
    return BODY_R * min(1.0, scale_of.get(s, 1.0))


for it in range(60):
    moved = False
    pts = {s: spot(s) for s in FIG if s not in WALKING and s not in CREW}
    ids = sorted(pts)
    for i, a in enumerate(ids):
        for b in ids[i + 1:]:
            if abs(FIG[a]['H'] - FIG[b]['H']) > 0.3:
                continue
            need = body_r(a) + body_r(b) - 0.02
            d = math.dist(pts[a], pts[b])
            if d >= need:
                continue
            v = ((pts[b][0] - pts[a][0]) / d, (pts[b][1] - pts[a][1]) / d) if d > 1e-6 else (1, 0)
            gap = need - d + 0.005
            wa = 0 if a in ANCHORED else (1 if b in ANCHORED else 0.5)
            wb = 0 if b in ANCHORED else (1 if a in ANCHORED else 0.5)
            if wa == wb == 0:
                continue
            for s, w, sg in ((a, wa, -1), (b, wb, 1)):
                if w == 0:
                    continue
                n0 = NUDGE.get(s, ([0, 0], ''))
                why = n0[1] if 'closer to a neighbour' in n0[1] else ((n0[1] + '; then ' if n0[1] else '') +
                      'painted closer to a neighbour than two bodies (0.26 m each, people.js): pushed apart along the '
                      'line between them')
                nudge(s, (n0[0][0] + sg * v[0] * gap * w, n0[0][1] + sg * v[1] * gap * w), why)
            moved = True
            pts = {s: spot(s) for s in FIG if s not in WALKING and s not in CREW}
    if not moved:
        break

# ---------------------------------------------------------------- people.json
props_note = {}


def props_for(slug, model, clips):
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
    'about': 'Who the outer road\'s part 2 people and animals are and what they do: every painted figure and animal of '
             'S4b (map/text/S4b.md, u 12600-15500) at its mapped spot (layout.json, with its recorded moves), and '
             'nobody else (map/BUILDING.md). Written by gen/sections/outer_road_2/make_people.py (the casting of '
             'gen/expand/outer_road_2_needs.md, from the 22 existing characters, at the area builder\'s real sizes); '
             'rerun it after a layout move, a build or a workshop delivery. figures: character (a character not made '
             'yet plays its stand_in; a seated figure whose character has no seated clip yet is played by the nearest '
             'look that can sit: cast_why), do = [clip, seconds] cycles with clips the playing character has '
             '(clips_why: what is still to make), nudge = [dX, dD] (nudge_why), facing_deg where the real-size scene '
             'needs another (facing_why), scale for children (scale_why), props = carried prop_<name> parts '
             '(props_why). The five crew stand on their moored boats by their layout support (boat deck:/boat roof:) at '
             'their layout spots (which carry their boats\' moves) and are never nudged; no boat moves or is worked, '
             'so there is no `boats` block. walkers: figures painted mid-stride or carrying a load, walking along their '
             'painted direction and back (walkers_why). animals: each painted animal at its map position facing hind '
             'to fore, model and load from web/public/assets/animals/animals.json (animals_why: what stands in for an '
             'unmade coat or tack). Seats the map lacks: gen/sections/outer_road_2/seats.json, for the builder. wanted: '
             'what S4b would take from the catalogue later. No traffic.',
    'figures': {}, 'nudge_why': {}, 'walkers': [], 'walkers_why': {}, 'animals': {}, 'animals_why': {},
    'clips_why': {}, 'scale_why': {}, 'facing_why': {}, 'cast_why': {}, 'props_why': {}, 'wanted': {},
    'builder_notes': {},
}

for s, (r, ref, why) in CHILD.items():
    h_ref = ref if isinstance(ref, float) else height(ref)
    m = MODEL[s][0]
    people['scale_why'][s] = (f'painted about {r} of {why}: {r} x {h_ref:.2f} m / the {m} model\'s {height(m):.2f} m = '
                              f'{scale_of[s]} ({scale_of[s] * height(m):.2f} m tall)')
people['scale_why']['about'] = ('people.js scale multiplies the playing character\'s own height, so each child\'s '
                                'painted ratio to its neighbouring adults becomes a scale of the child model')

for slug in sorted(FIG, key=lambda s: FIG[s]['X']):
    c = CAST[slug]
    model, how = MODEL[slug]
    if slug in WALKING:
        path, length, why = walk_path(slug)
        w = {'id': slug, 'figure': slug, 'character': c}
        if how == 'stand_in':
            w['stand_in'] = model
        clip = WALK_CLIP[slug]
        pr = props_for(slug, model, [clip]) if clip != 'walk' else None
        if clip == 'carry_pole' and not pr:
            clip = 'walk'              # never a carry clip without its load
        if pr:
            w['props'] = pr
        w.update({'clip': clip, 'speed': 0.85 if clip == 'carry_pole' else 1.0, 'pause': ['idle', 3], 'path': path})
        if slug in scale_of:
            w['scale'] = scale_of[slug]
        if slug in NUDGE:
            w['nudge'] = NUDGE[slug][0]
            people['nudge_why'][slug] = NUDGE[slug][1]
        people['walkers'].append(w)
        people['walkers_why'][slug] = why
        continue
    if slug in WALK_STAND:
        ln, why = WALK_STAND[slug]
        people['walkers_why'][slug] = (f'painted walking, but there is room for only {ln:.1f} m along his painted way '
                                       f'({why}): he stands at his spot (skill characters: a painted walker with no room '
                                       f'stands)')
    spec = {'character': c if how != 'recast' else model}
    if how == 'stand_in':
        spec['stand_in'] = model
    spec['do'] = STEPS[slug]
    pr = props_for(slug, model, [x[0] for x in spec['do']])
    if pr:
        spec['props'] = pr
    if slug in scale_of:
        spec['scale'] = scale_of[slug]
    if slug in FACING:
        spec['facing_deg'] = FACING[slug][0]
        people['facing_why'][slug] = FACING[slug][1]
    if slug in NUDGE and math.hypot(*NUDGE[slug][0]) > 0.005:
        spec['nudge'] = NUDGE[slug][0]
        people['nudge_why'][slug] = NUDGE[slug][1]
    people['figures'][slug] = spec
people['walkers_why']['held'] = HELD

cw = {f'stand_in {s}': f'{CAST[s]} (not made) plays {STAND_IN[s][0]}: {STAND_IN[s][1]}' for s in STAND_IN}
for s, (m, why) in RECAST.items():
    if MODEL[s][1] == 'recast':
        cw[f'recast {s}'] = f'{CAST[s]} is his look; played by {m} until {CAST[s]} has a seated clip: {why}'
people['cast_why'] = {**cw, **CAST_WHY, 'about': 'by dress (needs list "Casting"): short jackets and trousers are the '
                      'idler or the porter, long light robes with a dark cap the scholar, a light robe without a cap '
                      'the robed man, dark long robes the townsman or the inspector, blue robes the sightseer, wide '
                      'hats the hat traveller'}
people['props_why'] = dict(props_note)
people['props_why']['wanted'] = PROP_WANTED
people['props_why']['about'] = ('carried props as painted (needs list "Props carried by figures"), switched on only when '
                                'the playing character\'s GLB has prop_<name> and the figure plays the clip that holds '
                                'it (characters/props.json): never a carry clip without its load, never a prop in the '
                                'wrong hands')

for s, sp in ANIMAL_SPEC.items():
    people['animals'][s] = {k: v for k, v in sp.items()}
people['animals_why'] = {
    'models': 'species as painted (map/text/S4b.md): 2 oxen (the second palm cart\'s team), 2 horses (the saddled dark '
              'horse, the small light horse at the second cart\'s rear), a small dark donkey, 4 pack mules on the top '
              'street (125 px nose to rump against the 99 px muleteer: mules, not donkeys) and a small dark bird',
    'teams': 'the second palm-covered cart\'s shaft ox (facing 40) and lead ox (facing 134, seen from behind walking '
             'north-west, head turned west) stand in their harness, which belongs to the cart (the builder\'s harness '
             'reads the same positions and facing_deg): idle, none walking on the spot, none nudged here (a move goes '
             'through build_choices.json and the layout)',
    'loads': 'the oxen wear the draught tack (girth band, breast strap, nose rope; the yoke is the cart\'s); the saddled '
             'horse its saddle; the mules the pack saddle; the small horse, the donkey and the bird nothing',
    'fallbacks': {
        'horse_saddled_13378': 'painted DARK with a dark saddle cloth hanging down its side (the restyle: blue under a '
                               'red saddle); the registry horse is pale grey-white and its saddle has no long cloth, so '
                               'it stands as the pale horse with the saddle until a dark coat (body_from horse + tone, '
                               'free) and a dark-cloth saddle variant exist',
        'horse_12862': 'small and light with a long dark tail, mane and forelock, a dark band across its middle (a girth '
                       'or a short cloth): the pale horse at scale 0.85 (choice: painted pony-sized, its back 110 px '
                       'beside a 170 px man), no tack until a girth-only variant exists',
        'donkey_13474': 'small and DARK, no load: the grey-dun donkey until a dark tone variant exists (free)',
        'mules': 'each carries a pack saddle heaped with a DARK hatched load (sacks or bundles under a dark cloth); the '
                 'registry mule\'s pack_saddle carries white side bundles, so it stands in until a dark heaped load '
                 'variant exists (the donkey\'s pannier_charcoal palette has the colours)',
        'ox_lead_13458': 'long curved horns pointing up; the registry ox has short horns (a horn variant, optional)',
    },
    'doing': 'the saddled horse (head lowered at the man in white\'s shoulder) and the small horse (head held low toward '
             'the cart\'s underside) hold their heads low (head_low); the donkey and the two head-down mules graze; the '
             'others stand; the bird perches',
    'perched': 'the bird sits among the sprays of part 1\'s S4.tree.willow_12588 above the official hall, 5.29 m up '
               '(layout H, support perched), tail to the west; S4b\'s people.json places it, so it shows when S4b is '
               'loaded',
    'nudges': dict(ANIMAL_WHY),
}
for m in MULES:
    if ANIMAL_SPEC[m].get('nudge'):
        people['animals_why']['nudges'][m] = (
            'the four pack mules are painted overlapping far up the silk (about 0.6 of the street\'s scale); at real '
            'size (2.09 m long, packs 0.8 m wide) they ran into each other and the hipped roof behind the trees, so each '
            'steps the least that frees them all (searched on a 0.1 m grid), keeping its painted heading and the '
            'train\'s painted order (the first two at its west end, the second and the fourth each behind the one '
            'before it), clear of the muleteer and the man behind the tree')

# clips_why: what is still to make (or retarget), per clip and character
cwh = {}
for clip, by in sorted(wanted.items()):
    for c, slugs in sorted(by.items()):
        now = sorted({people['figures'][s]['do'][0][0] for s in slugs if s in people['figures']})
        plan_clips = set(J(f'characters/{c}.json', {}).get('clips', {})) if c in REG else set()
        state = 'being made' if clip in plan_clips else ('NEW' if WANT.get(clip, '').startswith('NEW') else 'to make')
        cwh.setdefault(clip, []).append(f'{c} [{state}]: {", ".join(slugs)}' + (f' (plays {"/".join(now)} now)' if now else ''))
people['clips_why'] = {
    'about': 'Actions the painting needs that the character its dress calls for lacks. "to make": a free local retarget '
             '(t2m:/from:, tools/retarget_local.mjs) onto that character; "NEW": a new Text to Motion take (10 credits); '
             '"being made": already in characters/<name>.json. Rerun make_people.py when they land; until then each '
             'figure plays the nearest clip its playing character has.',
    **{clip: f'{WANT.get(clip, "")} -- ' + '; '.join(v) for clip, v in cwh.items()},
}

# ---------------------------------------------------------------- seats.json (the seats the map lacks)
seats = {'about': 'Seats the map lacks, for the area builder (map/BUILDING.md rule 3: the seat of a figure painted seated '
                  'is part of it), written by gen/sections/outer_road_2/make_people.py from the layout, the builder\'s '
                  'real sizes and the playing clip (rerun after a layout move). Keys are figure map IDs. X, D: the '
                  'seat\'s centre, under the hips (build it there, not a step behind); H: the height it stands on (its '
                  'support: the ground 0, part 1\'s official hall floor 0.45, the tea house floor 0.18, the cart\'s '
                  'sills, a deck or a roof); seat_h: its top above H (0: the figure sits on the support itself); '
                  'facing_deg: the way the figure faces (0 = east, 90 = north); root: [X, D, H] where people.js stands '
                  'the figure (its nudged spot) and the height of the surface it must find there (people.js drops rays '
                  'from the layout H + 1.2 m at X and X +- 0.12 and stands on the highest hit, so no colliding table '
                  'top, cart bed or box may lie under them, and a seat in the air needs a hidden block under the root); '
                  'what: prefixed by what holds it ("stool:", "ground:", "floor:", "cart:", "boat deck:", "boat roof:"); '
                  'build: what the builder adds; clip: who plays it, with what. Figures on mapped benches, stools and '
                  'chairs are not listed: their nudges put their hips on those props (seated_in_bottom_shop_12792 on '
                  'bench_12835, customer_hat_14462 on chair_14458, customer_white_14560 on stool_14595, '
                  'customer_cap_14785 on stool_14840).'}
for slug, x in EXTRA.items():
    if x['kind'] == 'mapped':
        continue
    f = FIG[slug]
    sup = f['support']
    root = spot(slug) if slug not in CREW else (f['X'], f['D'])
    if x['kind'] == 'cart':
        H, seat_h, root_h = CART_KIT['plank_top'] - 0.04, 0.04, CART_KIT['plank_top']
        what = (f'cart: {x["what"]}; the plank (top {CART_KIT["plank_top"]} m) is the cart\'s and doesn\'t collide; '
                f'{x["model"]}\'s {x["clip"]} sits cross-legged on it')
        build = (f'a hidden block under the root, top at {root_h} m, about 0.4 m square (as inner_city_scene.seat_support '
                 f'does for its drivers), inside {f["map_id"]}: without it people.js drops him to the ground')
        kind = 'none (the cart\'s plank)'
    elif x['clip'] in FLOOR_CLIPS:
        H, seat_h, root_h = f['H'], 0.0, f['H']
        pre = 'boat roof' if sup.startswith('boat roof') else 'boat deck' if sup.startswith('boat deck') else \
            'floor' if 'floor' in sup else 'ground'
        what = f'{pre}: {x["what"]}; a floor sit ({x["model"]} {x["clip"]})'
        build = ('nothing: the boat kit\'s deck/roof collider grounds him, and he rides with the boat' if pre.startswith('boat')
                 else 'nothing: he sits on the ' + ('floor' if pre == 'floor' else 'ground') + ' itself')
        kind = 'none'
    else:
        H = f['H']
        seat_h = round(min(0.5, max(0.42, x['seat_h'])), 2)
        root_h = H
        what = (f'stool: {x["what"]}; choice: a stool 0.32 m square, its top {seat_h} m (the {x["model"]}\'s {x["clip"]} '
                f'puts the hips {x["seat_h"]} m above the soles)')
        build = f'a stool (kit_inner_city.stool, h {seat_h}, s 0.32) centred on X, D, inside {f["map_id"]}'
        kind = 'stool'
    seats[f['map_id']] = {
        'X': round(x['seat'][0], 2), 'D': round(x['seat'][1], 2), 'H': round(H, 2), 'facing_deg': round(x['facing'] % 360, 1),
        'seat_h': seat_h, 'kind': kind, 'what': what, 'build': build, 'support': sup,
        'root': [round(root[0], 2), round(root[1], 2), round(root_h, 2)],
        'clip': f'{x["model"]} {x["clip"]}',
    }
json.dump(seats, open(os.path.join(HERE, 'seats.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- the catalogue wish list (for the lead)
people['wanted'] = {
    'about': 'What S4b would take from the catalogue later, each with the figures (map ID slugs) it is for; nothing here '
             'is needed to show the section (every figure is cast and acts).',
    'characters': {
        'boatman': 'the river\'s crew, for all five here (seated_boatman_stern_15372, boatman_dark_cap_15046, '
                   'boatman_light_hat_15066, seated_man_cabin_roof_15012, head_in_cabin_door_15097); S4b paints them '
                   '38-54 px and faint, so take the model figure from S3 or S2 (a sweep crew painted at full size); '
                   'its best here is seated_man_cabin_roof_15012, crop [15000, 500, 15045, 558]',
        'hat_traveller dark-hat variant': 'a big round black or wide flat dark hat on the hat traveller (a texture '
                                          'variant): man_big_hat_12895 (crop [12855, 1515, 12975, 1700]), '
                                          'man_wide_hat_13760 (crop [13705, 630, 13780, 790]); customer_hat_14462\'s '
                                          'broad dark hat too',
    },
    'actions_new': {k: WANT[k] + ' -- ' + ', '.join(sorted({s for c in wanted.get(k, {}).values() for s in c}))
                    for k in ('wheelwright', 'show_goods_seated', 'reach_up_load', 'rest_on_stick', 'knee_on_stool',
                              'look_up', 'girth', 'tiller_seated') if k in wanted},
    'actions_free': {k: v for k, v in people['clips_why'].items() if k != 'about' and not WANT.get(k, '').startswith('NEW')},
    'props': PROP_WANTED,
    'animals': people['animals_why']['fallbacks'],
    'not_needed_here': 'no poling, sweep, oar or hauling: every boat in S4b is moored and nobody works a sweep, an oar '
                       'or a pole (the sweeps are at rest or shipped raised); S3 and S2 will want them',
}

# ---------------------------------------------------------------- builder notes (what the casting assumes of the build)
foot, pd, foot_why = gangplank()
tbl_hits, post_hits = [], []
for s in people['figures']:
    if s in CREW:
        continue
    p = spot(s)
    for k, c, Lr, Wr, yaw, ht, H, top in RECTS:
        if not top or abs(H - FIG[s]['H']) > 0.3:
            continue
        poly = rect(c, yaw, Lr / 2, Wr / 2)
        if any(inside((p[0] + dx, p[1]), poly) for dx in (-0.12, 0, 0.12)):
            if (s, k) not in EXPECTED_INSIDE or SEAT.get(s):
                tbl_hits.append(f'{s} (root {p[0]:.2f}, {p[1]:.2f}) over {k}')
    for q in TEA_POSTS:
        if math.dist(p, q) < 0.36 and abs(FIG[s]['H'] - TEA_FLOOR) < 0.1:
            post_hits.append(f'{s} (root {p[0]:.2f}, {p[1]:.2f}) {math.dist(p, q):.2f} m from the post at ({q[0]:.2f}, {q[1]:.2f})')
for k, fu in FURN.items():
    if fu['kind'] != 'table' and k in E:
        for q in TEA_POSTS:
            if math.dist(E[k]['pos'][:2], q) < 0.3:
                post_hits.append(f'{k} ({E[k]["pos"][0]:.2f}, {E[k]["pos"][1]:.2f}) {math.dist(E[k]["pos"][:2], q):.2f} m '
                                 f'from the post at ({q[0]:.2f}, {q[1]:.2f})')
people['builder_notes'] = {
    'about': 'What this casting assumes of blender/outer_road_2_scene.py (read on every run: its furniture sizes, the '
             'palm carts of kit_outer_road_2, the sedan), and what it found.',
    'seats_json': 'seats.json X, D is the seat\'s centre under the hips: build each stool there (outer_road_2_scene.seats() '
                  'steps 0.15 m back from it); the cart sitter needs a hidden block under his root (seats.json build)',
    'table_tops': 'people.js stands a figure on the highest surface under rays at X and X +- 0.12 from H + 1.2 m, and '
                  'song_kit.table\'s top collides; roots over a table top at the builder\'s sizes: ' +
                  ('; '.join(tbl_hits) if tbl_hits else 'none'),
    'tea_house_posts': 'the tea house\'s front posts (tea_house(): x gx0 - 2.2, gx0, gx1, hx1 - 2.6, hx1 at D yf + 0.05) '
                       'against the seated customers and their seats: ' + ('; '.join(post_hits) if post_hits else 'clear'),
    'gangplank': f'porter_baskets_14778 walks to 0.35 m short of {foot_why}, ({foot[0]:.2f}, {foot[1]:.2f}), arriving '
                 f'along the plank\'s line toward the boat\'s bow; his path follows kit.gangplank on every run',
    'palm_carts': 'both palm carts as kit_outer_road_2.palm_cart builds them (CART_KIT: body 3.9 x 1.3 m, wheel_at 0.56, '
                  'R 0.85, collider bx0 - 0.3 to bx1 + 0.04, +-(hw + 0.45) across; the parked cart\'s seat plank at bx1 + '
                  '0.32, top 1.08 m); change CART_KIT if the kit changes',
    'sedan': f'the sedan attendant stands on the set-down chair\'s axis between its poles, just east of the cabin (its '
             f'collider\'s east face at X {SED_E:.2f}, the cabin centred at X {SED_C[0]:.2f} as vehicles() sets cabin_at)',
    'bird': 'the bird is placed by this people.json at H 5.29 in part 1\'s willow S4.tree.willow_12588 (its card is '
            'part 1\'s)',
    'crew': 'the five crew are at their layout spots (with their boats\' recorded moves) and are never nudged here: the '
            'two on the long boat (boatman_dark_cap_15046, boatman_light_hat_15066) are painted 0.22 m apart, closer '
            'than two bodies (0.52 m); the boats page places both on the deck below their spots, so they overlap unless '
            'a recorded move (build_choices.json, with their boat) separates them',
}
out = os.path.join(QM, 'sections/outer_road_2/people.json')
json.dump(people, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- checks
from collections import Counter
nf, nw = len(people['figures']), len(people['walkers'])
print(f'{nf} figures at their spots, {nw} walkers ({nf + nw} of {len(FIG)}), {len(people["animals"])} animals '
      f'(of {len(ANIMALS)}); stand-ins {sum(1 for f in people["figures"].values() if f.get("stand_in"))}, '
      f'recast {sum(1 for s in FIG if MODEL[s][1] == "recast")}; furniture read from the builder: {len(FURN)}')
print('cast (playing):', dict(Counter((f.get('stand_in') or f['character']) for f in people['figures'].values()) +
                               Counter(w.get('stand_in') or w['character'] for w in people['walkers'])))
for w in people['walkers']:
    print(f'  walk {w["id"]}: {w["clip"]} {math.dist(*w["path"]):.1f} m {w["path"]}  {people["walkers_why"][w["id"]]}')
for s, (ln, why) in WALK_STAND.items():
    print(f'  stands {s}: {ln:.1f} m of room ({why})')
pos = {s: spot(s) for s in FIG if s not in WALKING}
issues, expected = [], []
ids = sorted(pos)
for i, a in enumerate(ids):
    for b in ids[i + 1:]:
        if FIG[a]['support'] != FIG[b]['support'] and (a in CREW or b in CREW):
            continue
        d = math.dist(pos[a], pos[b])
        if d < body_r(a) + body_r(b) - 0.03 and abs(FIG[a]['H'] - FIG[b]['H']) < 0.3:
            issues.append(f'figures {a} and {b} {d:.2f} m apart' + (' (crew: placed by the boats page)' if a in CREW else ''))
for s in ids:
    if s in CREW:
        continue
    p = pos[s]
    for a, b in BODY.items():
        if b['H'] < 1 and poly_dist(p, b['poly']) < 0.15:
            issues.append(f'figure {s} {poly_dist(p, b["poly"]):+.2f} m from animal {a}')
    for name, poly in BLOCK + VEH + SOLID:
        dd = poly_dist(p, poly)
        if dd < 0.1:
            (expected if (s, name) in EXPECTED_INSIDE else issues).append(
                f'figure {s} {dd:+.2f} m from {name}' + (f' ({EXPECTED_INSIDE[(s, name)]})' if (s, name) in EXPECTED_INSIDE else ''))
    for name, c, r, is_seat, H in DISCS:
        dd = math.dist(p, c) - r
        if dd < 0.05:
            (expected if (s, name) in EXPECTED_INSIDE else issues).append(f'figure {s} {dd:+.2f} m from {name}')
    if poly_dist(p, AREA) > -0.26:
        issues.append(f'figure {s} {poly_dist(p, AREA):+.2f} m from the painted area\'s edge (outside if +)')
    if poly_dist(p, WATER) < 0.2:
        issues.append(f'figure {s} {poly_dist(p, WATER):+.2f} m from the water')
for w in people['walkers']:
    for q in w['path']:
        if poly_dist(q, WATER) < 0.25:
            issues.append(f'walker {w["id"]} path end {q} {poly_dist(q, WATER):+.2f} m from the water')
an = sorted(BODY)
for i, a in enumerate(an):
    for b in an[i + 1:]:
        if BODY[a]['H'] < 1 and BODY[b]['H'] < 1 and polys_overlap(BODY[a]['poly'], BODY[b]['poly']):
            issues.append(f'animals {a} and {b} overlap (real size)')
    for name, poly in BLOCK + VEH + SOLID:
        if BODY[a]['H'] < 1 and polys_overlap(BODY[a]['poly'], poly):
            (expected if a in TEAM and 'palm_cart_13455' in name else issues).append(
                f'animal {a} overlaps {name} (real size)' + (' (the cart\'s team at its shafts: the builder\'s harness)'
                                                             if a in TEAM and 'palm_cart_13455' in name else ''))
print('expected (painted so):')
for x in expected:
    print('   ', x)
print('checks:', 'none' if not issues else '')
for x in issues:
    print('   ', x)
print('table tops under roots:', tbl_hits or 'none')
print('tea house posts:', post_hits or 'clear')
print('nudges:', len(people['nudge_why']), ' animal nudges:', {m: ANIMAL_SPEC[m].get('nudge') for m in ANIMAL_SPEC if ANIMAL_SPEC[m].get('nudge')})
print('to make (free) / NEW:', ', '.join(k for k in people['clips_why'] if k != 'about'))
print('props:', json.dumps(props_note, ensure_ascii=False))
print('seats.json:', len(seats) - 1, 'seats;', 'wrote', os.path.relpath(out, QM))
