#!/usr/bin/env python3
"""Writes sections/canal/people.json, gen/sections/canal/seats.json and gen/sections/canal/cast/notes_cast.md: every
painted figure and every painted animal of S2, the canal wharves (u 20500-29050, map/text/S2.md), at its mapped spot
(sections/canal/layout.json, read on every run: the river plan's and the boats' recorded moves are in it), doing what
it is painted doing, and nobody else (map/BUILDING.md). The casting is gen/expand/canal_needs.md ("Casting: 140
figures"), from the 22 existing characters, checked against what each character really has today in
web/public/assets/chars/characters.json.

Kept as a script (as gen/sections/outer_road_2/make_people.py, the S4b pilot), so the cast is redone as the others
deliver. Rerun it after: a layout change (map_layout.mjs S2), a build (blender/canal_scene.py, its inside.json), the
boats agent's gen/sections/canal/boats_people.json, or a workshop delivery (characters.json, animals.json):
- each figure names the character its dress calls for: the needs list's, or the new character the catalogue
  (gen/expand/round2/catalogue.md 1b) makes for it (boatman 38, grain_porter 8, straw_hat 6, tracker 4, youth 2,
  dark_hat 1), cast as `character` with its present cast as `stand_in` while it isn't made (web/src/world.js and
  tools/budget_check.mjs play the stand-in; loyalty_check doesn't read characters), and playing its own clips the
  day characters.json has it;
- each action step lists the take the painting wants first and the nearest clips after it (`clip+prop`: only with
  that carried prop, bound to that clip in the character's GLB); the first one the playing character has is played,
  and what is still wanted goes to clips_why / wanted;
- a figure whose pose would be lost (seated, crouching, kneeling, lying, riding, leaning at work, at the sweep,
  pushing the barrow, the handshake) while its character lacks every take for it is played by the nearest look that
  has one (RECAST: cast_why), and cast back by itself when its character gets the clip;
- walkers (painted mid-stride or carrying, not held to a cart, a boat or an animal) walk a short way along their
  painted direction and back, cut at buildings, furniture, vehicles, animals, people, the bank top and the silk's
  edges; the trackers haul with 逆水行舟 (the boats agent's `haul`; their clips are the casting's);
- seats: a figure painted seated sits on its mapped bench, stool or sack pile, at a table, on a deck or floor, or on a
  seat the map lacks (seats.json, for the builder);
- nudges only with reasons: the builder's inside.json (walls, counters, vehicles), furniture and animals at real size,
  two bodies closer than people.js allows.
    python3 gen/sections/canal/make_people.py
"""
import json
import math
import os
import re
import struct
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
QM = os.path.abspath(os.path.join(HERE, '../../..'))
S, FOLDER = 'S2', 'canal'


def J(p, default=None):
    full = os.path.join(QM, p)
    if default is not None and not os.path.exists(full):
        return default
    return json.load(open(full, encoding='utf-8'))


L = J('sections/canal/layout.json')
REG = J('web/public/assets/chars/characters.json')
ANI = J('web/public/assets/animals/animals.json')
PROPS = J('characters/props.json')
for _m, _c in REG.items():   # the registry's own props {name: clip} (the workshop's last build) win over props.json
    if isinstance(_c, dict):
        for _n, _clip in (_c.get('props') or {}).items():
            PROPS.setdefault(_m, {})[_n] = {**PROPS.get(_m, {}).get(_n, {}), 'clip': _clip}
BOATS_PEOPLE = J('gen/sections/canal/boats_people.json', {})          # the boats agent's (motion, crew work, haul, tow)
INSIDE = J('gen/sections/canal/build/inside.json', [])                 # the builder's: figures inside walls etc.
RIVER = J('gen/sections/canal/river_plan.json', {})                    # the boats agent's: banks and shores as built
FURN_JSON = J('gen/sections/canal/build/furniture.json', {})           # the builder's furniture sizes, if it writes them
CHOICES = J('sections/canal/build_choices.json', {})
BUILDER = os.path.join(QM, 'blender/canal_scene.py')
FIG = {f['id']: f for f in L['figures']}
E = L['entities']
MOVED = L.get('moved') or {}
ANIMALS = {k.split('.')[-1]: e for k, e in E.items() if e['kind'] == 'animal'}
CREW_RE = re.compile(r'^boat (deck|roof): ')                           # what web/src/boats.js host() and loyalty read
BOAT_RE = re.compile(r'^boat [a-z ]+: (S2\.veh\.\w+)')                 # every boat support the map uses
SLUG = lambda k: k.split('.')[-1]


def glb_parts(c, _cache={}):
    """Names of the optional prop_<name> parts in a character's web GLB (empty when it isn't built)."""
    if c not in _cache:
        out = set()
        if isinstance(REG.get(c), dict) and REG[c].get('file') and os.path.exists(os.path.join(QM, 'web/public', REG[c]['file'])):
            b = open(os.path.join(QM, 'web/public', REG[c]['file']), 'rb').read()
            n = struct.unpack('<I', b[12:16])[0]
            j = json.loads(b[20:20 + n])
            out = {x.get('name', '') for x in j.get('nodes', []) + j.get('meshes', []) if x.get('name', '').startswith('prop_')}
        _cache[c] = out
    return _cache[c]


def made(c):
    return isinstance(REG.get(c), dict) and bool(REG[c].get('file'))


# takes the workshop marked NOT TO USE (gen/expand/round2/workshop_progress.md, take review 18:36): their stand-ins
# are the next candidates in each figure's steps (pole_boat -> stand_pole + long_pole; chase_run -> run)
NOT_TO_USE = set()  # both retaken and passed on msy_VYNl (workshop_progress.md, restart run); the bar stays for the next


def clips_of(c):
    return (set(REG[c].get('clips', [])) - NOT_TO_USE) if made(c) else set()


def height(c):
    return REG[c]['height_m']


# ---------------------------------------------------------------- the cast (the needs list's table, by dress)
# slug: (dress character, crew [boatman], steps, pose-keeping alternates, worn props)
# steps "a|b+prop|c:secs; d:secs": candidates in order of preference, `+prop` = only with that carried prop bound to
# that clip. Alternates: who plays the figure while its character lacks every candidate of its first step (only for
# figures whose painted pose would otherwise be lost); empty = keep the character and fall back to its nearest clip.
CAST = {
    # idler (28, 19 on boats)
    'boatman_pole_20495': ('idler', 1, 'fend_pole+long_pole_mid|stand_pole+long_pole|push_flank:12', '', ''),
    'boatman_standing_20615': ('idler', 1, 'reach|crane:9; look:5', '', ''),
    'boatman_on_roof_20683': ('idler', 1, 'point:7; hail:5', '', ''),
    'man_cabin_door_20877': ('idler', 1, 'squat_sleeves:20', 'soldier,townsman', ''),
    'bank_crouching_21155': ('idler', 0, 'crouch:20', 'carter,townsman', ''),
    'man_cabin_window_21333': ('idler', 1, 'sit_floor|sit_one_knee:24', 'soldier', ''),
    'crouching_man_by_timber_21880': ('idler', 0, 'crouch:20', 'carter,townsman', ''),
    'tracker_bent_21939': ('idler', 0, 'push|hold_rope:10', '', ''),
    'sweepman_leaning_back_22110': ('idler', 1, 'work_sweep|push:10', 'carter', ''),
    'sweepman_leaning_on_loom_22285': ('idler', 1, 'work_sweep|push:10', 'carter', ''),
    'boatman_pouring_bucket_22665': ('idler', 1, 'pour_bucket+bucket_pour|bucket_lift+bucket_pour|bucket_lift:12', '', ''),
    'passenger_reclining_on_cargo_22848': ('idler', 0, 'lie_wave|sleep_side|sit_floor:30', '', ''),
    'boatman_fending_off_23688': ('idler', 1, 'fend_pole+long_pole_mid|stand_pole+long_pole|push_flank:12', '', ''),
    'man_bow_arm_out_23795': ('idler', 1, 'point:7; hail:5', '', ''),
    'boatman_roof_leaning_24030': ('idler', 1, 'crouch:14; squat_sleeves:6', 'carter', ''),
    'crewman_crouching_white_24067': ('idler', 1, 'crouch:16', 'carter', ''),
    'boatman_hauling_mast_24140': ('idler', 1, 'haul_line|squat_sleeves:16', 'soldier,townsman', ''),
    'man_seated_deckhouse_24393': ('idler', 1, 'sit_floor|sit_one_knee:24', 'soldier', ''),
    'boatman_roof_seated_24478': ('idler', 1, 'sit_floor:30', 'soldier', ''),
    'man_cabin_door_24728': ('idler', 0, 'look:8; idle:5', '', ''),
    'figure_under_canopy_25518': ('idler', 1, 'sit_floor:30', 'soldier', ''),
    'barrow_puller_25607': ('idler', 0, 'idle:8; look:4', '', ''),
    'stall_keeper_26174': ('idler', 0, 'sit:24', 'carter', ''),
    'boatman_roof_26290': ('idler', 1, 'crouch:16', 'carter,townsman', 'straw_cape'),
    'man_behind_tub_27538': ('idler', 0, 'idle:8; look:5', '', ''),
    'tub_vendor_27765': ('idler', 0, 'sit_offer+hand_dish_bowl|sit_offer|knees_up|sit_one_knee|sit_floor:24', '', ''),
    'youth_topknot_28222': ('idler', 0, 'tie_kerchief:7; idle:5', '', ''),
    'sack_porter_bent_28432': ('idler', 0, 'idle:6', '', ''),
    # porter (24, 13 on boats)
    'boatman_leaning_20558': ('porter', 1, 'reach_over_rail|lean_over|push_flank:12; idle:3', 'idler,inspector', ''),
    'boatman_far_deck_21505': ('porter', 1, 'look:8; idle:5', '', ''),
    'tracker_lead_21867': ('porter', 0, 'push|hold_rope:10', '', ''),
    'tracker_hatched_coat_21994': ('porter', 0, 'push|hold_rope:10', '', 'straw_cape'),
    'sweepman_head_back_22132': ('porter', 1, 'work_sweep|push:10', 'carter,idler', ''),
    'sweepman_capped_22242': ('porter', 1, 'work_sweep|push|lean_over:10', 'inspector,carter,idler', ''),
    'boatman_on_ladder_23275': ('porter', 1, 'climb_ladder|reach|show_garment:10; idle:3', 'townsman', ''),
    'boatman_at_windlass_23465': ('porter', 1, 'look:8; idle:5', '', ''),
    'crewman_crouching_24125': ('porter', 1, 'crouch:16', 'carter,townsman', ''),
    'sack_porter_24312': ('porter', 0, 'idle:6', '', ''),
    'sack_porter_24452': ('porter', 0, 'idle:6', '', ''),
    'sack_porter_bank_edge_24467': ('porter', 0, 'bend_goods:10; idle:4', '', ''),
    'figure_roof_coils_24508': ('porter', 1, 'sit_floor|sit_one_knee|doze_knees:30', 'soldier,idler', ''),
    'sack_porter_24537': ('porter', 0, 'idle:6', '', ''),
    'windlass_man_aft_24660': ('porter', 1, 'push_flank|push:12', 'idler,carter', ''),
    'boatman_poling_24730': ('porter', 1, 'pole_boat+long_pole_low|stand_pole+long_pole|push:12', 'carter,idler', ''),
    'man_leaning_casks_25650': ('porter', 1, 'lean_over|lean_chin:12; idle:3', 'inspector,sightseer,idler', ''),
    'crewman_head_cabin_east_25810': ('porter', 1, 'look:8; idle:5', '', ''),
    'basket_porter_27666': ('porter', 0, 'stand_pole:6', '', ''),
    'pole_bundle_carrier_27767': ('porter', 0, 'stand_pole:6', '', ''),
    'sack_porter_back_28271': ('porter', 0, 'push_flank|push:10; idle:3', 'carter,idler', ''),
    'sack_porter_28343': ('porter', 0, 'idle:6', '', ''),
    'bank_porter_28355': ('porter', 0, 'idle:6', '', ''),
    'boatman_coils_28543': ('porter', 1, 'idle:8; look:5', '', ''),
    # carter (13, 8 on boats)
    'boatman_cap_20938': ('carter', 1, 'idle:8; look:5', '', ''),
    'steersman_stern_21678': ('carter', 1, 'tiller|look:8; idle:6', '', ''),
    'sweepman_upright_22168': ('carter', 1, 'work_sweep|push:10', '', ''),
    'tracker_rear_22172': ('carter', 0, 'push|hold_rope:10', '', ''),
    'crouching_figure_open_boat_22175': ('carter', 1, 'crouch:16', '', ''),
    'shop_man_head_cloth_23990': ('carter', 0, 'listen|sit:24', '', ''),
    'figure_deckhouse_east_24590': ('carter', 1, 'idle:8; look:5', '', ''),
    'figure_in_windlass_24713': ('carter', 1, 'push:10; idle:3', '', ''),
    'bank_man_with_stick_25370': ('carter', 0, 'idle+stick_under_arm|look:12', '', ''),
    'behind_ridge_26369': ('carter', 0, 'look:8; idle:5', '', ''),
    'man_stern_hood_26750': ('carter', 1, 'sit_floor|sit_one_knee|crouch:30', '', ''),
    'steersman_27890': ('carter', 1, 'tiller|look:8; idle:6', '', ''),
    'overseer_28092': ('carter', 0, 'arms_folded:12; look:5', '', ''),
    # robed_man (12, 2 on boats)
    'figure_by_top_willow_20590': ('robed_man', 0, 'look:8; idle:5', '', ''),
    'man_in_river_20970': ('robed_man', 0, 'chin:10; idle:5', '', ''),
    'bank_man_seated_21140': ('robed_man', 0, 'sit_floor+hand_dish_cup|knees_up+hand_dish_cup|sit_floor|knees_up:30', 'scholar,idler', ''),
    'eatery_man_23642': ('robed_man', 0, 'drink+hand_dish_bowl|drink|listen:24', '', ''),
    'bowman_under_hood_23660': ('robed_man', 1, 'look|crane:9; idle:5', '', ''),
    'eatery_man_standing_23918': ('robed_man', 0, 'idle:10', '', ''),
    'robed_man_foredeck_23930': ('robed_man', 0, 'point+fan_point|point:8', '', ''),
    'doorway_man_topknot_24088': ('robed_man', 0, 'sit|listen:24', '', ''),
    'man_in_shop_door_24415': ('robed_man', 0, 'idle:10', '', ''),
    'walker_26697': ('robed_man', 0, 'idle:10', '', ''),
    'pennant_pole_holder_27810': ('robed_man', 0, 'fend_pole+long_pole_mid|stand_pole:10; idle:4', '', ''),
    'man_leaning_over_donkey_29000': ('robed_man', 0, 'lean_over_seated|listen:24', '', ''),
    # scholar (12, 1 on a boat)
    'bank_tall_man_21205': ('scholar', 0, 'bow:6; idle:6', '', ''),
    'man_north_bank_21530': ('scholar', 0, 'talk:8; idle:4', '', ''),
    'terrace_diner_w_23083': ('scholar', 0, 'drink|sit_talk|sit:24', '', ''),
    'terrace_diner_back_23116': ('scholar', 0, 'drink:24', '', ''),
    'boatman_side_deck_23195': ('scholar', 0, 'look:8; idle:5', '', ''),
    'terrace_diner_leaning_23216': ('scholar', 0, 'lean_over|lean_chin:12; idle:3', 'sightseer,inspector', ''),
    'carter_24218': ('scholar', 0, 'bridle:10; look:4', '', ''),
    'cart_loader_24345': ('scholar', 0, 'lean_over:10; idle:4', '', ''),
    'man_at_horse_head_24506': ('scholar', 0, 'bridle:10; look:4', '', ''),
    'bank_man_light_robe_25338': ('scholar', 0, 'talk:8; idle:4', '', ''),
    'shed_diner_seated_28772': ('scholar', 0, 'listen|drink|sit:24', '', ''),
    'donkey_owner_seated_28850': ('scholar', 0, 'sit:24', '', ''),
    # townsman (10, 3 on boats)
    'man_seated_canopy_21120': ('townsman', 0, 'sit_floor|squat_sleeves:24', 'soldier', ''),
    'passenger_in_cabin_bay_23340': ('townsman', 0, 'look:8; idle:5', '', ''),
    'man_with_sticks_bank_24390': ('townsman', 0, 'look:8; idle:5', '', ''),
    'man_leaning_deckhouse_24447': ('townsman', 1, 'kneel_sleep:30', 'soldier', ''),
    'man_behind_cart_rear_24463': ('townsman', 0, 'look:8; idle:5', '', ''),
    'stall_keeper_24650': ('townsman', 0, 'browse:10; idle:4', '', ''),
    'far_street_man_25688': ('townsman', 0, 'browse:10; look:4', '', ''),
    'stall_second_26194': ('townsman', 0, 'talk:8; idle:4', '', ''),
    'bowing_man_28270': ('townsman', 0, 'hand_over:9; idle:3', '', ''),
    'shed_customer_back_28690': ('townsman', 0, 'sit:24', 'inspector,fortune_teller', ''),
    # camel_driver (9, 1 on a boat): the faint figures whose dress can't be read
    'figure_under_eave_20625': ('camel_driver', 0, 'look:8; idle:5', '', ''),
    'shop_seated_21683': ('camel_driver', 0, 'sit:24', 'inspector,idler', ''),
    'shop_standing_21726': ('camel_driver', 0, 'idle:10', '', ''),
    'terrace_figure_unclear_23148': ('camel_driver', 0, 'sit:24', 'inspector,carter', ''),
    'figure_stern_roof_24622': ('camel_driver', 1, 'idle:8; look:5', '', ''),
    'stall_figure_behind_table_24705': ('camel_driver', 0, 'sit:24', 'idler,inspector', ''),
    'head_over_roof_e_24867': ('camel_driver', 0, 'look:8; idle:5', '', ''),
    'shed_server_27693': ('camel_driver', 0, 'idle:8; look:5', '', ''),
    'shed_customer_28535': ('camel_driver', 0, 'sit:24', 'idler,inspector', ''),
    # hat_traveller (7)
    'big_hat_man_south_bank_22045': ('hat_traveller', 0, 'crouch:20', 'idler,carter', ''),
    'tracker_broad_hat_22057': ('hat_traveller', 0, 'push|hold_rope:10', '', ''),
    'hat_walker_24004': ('hat_traveller', 0, 'idle:6', '', ''),
    'basket_porter_24804': ('hat_traveller', 0, 'idle:6', '', ''),
    'barrow_pusher_25532': ('hat_traveller', 0, 'push:10; idle:3', 'carter,idler', ''),
    'man_standing_26362': ('hat_traveller', 0, 'idle:8; crane:4', '', ''),
    'pole_porter_27193': ('hat_traveller', 0, 'idle:6', '', ''),
    # inspector (6, 2 on boats)
    'boatman_seated_open_boat_22060': ('inspector', 1, 'sit:30', '', ''),
    'sweepman_capped_22208': ('inspector', 1, 'work_sweep|push|lean_over:10', '', ''),
    'man_by_pole_stack_24732': ('inspector', 0, 'look:8; idle:5', '', ''),
    'far_street_figure_25750': ('inspector', 0, 'hand_over:8; idle:4', '', ''),
    'staff_man_28266': ('inspector', 0, 'talk+staff|talk:12', '', ''),
    'shed_keeper_28467': ('inspector', 0, 'point+stick_point|point:12', '', ''),
    # child (5, 2 on boats)
    'child_or_vase_21076': ('child', 0, 'look:8; idle:5', '', ''),
    'man_north_bank_small_21553': ('child', 0, 'look:8; idle:5', '', ''),
    'second_passenger_window_24050': ('child', 0, 'look:8; idle:5', '', ''),
    'hall_small_figure_25628': ('child', 0, 'sit|listen:24', '', ''),
    'far_street_child_25728': ('child', 0, 'look:8; idle:5', '', ''),
    # sightseer (4, 1 on a boat)
    'pavilion_diner_23388': ('sightseer', 0, 'listen|sit:24', 'robed_man,scholar', ''),
    'passenger_window_24025': ('sightseer', 0, 'lean_chin:20', '', ''),
    'behind_ridge_26258': ('sightseer', 0, 'look:8; idle:5', '', ''),
    'man_at_railing_27650': ('sightseer', 0, 'lean_chin:20', '', ''),
    # woman (3, 1 on a boat)
    'bank_figure_raised_hands_21085': ('woman', 0, 'tie_kerchief:7; idle:5', '', ''),
    'passenger_leaning_in_bay_23385': ('woman', 0, 'lean_chin:20', 'sightseer,idler', ''),
    'rider_26832': ('woman', 0, 'ride_side:30', 'elder', 'veiled_hat'),
    # storyteller, fortune_teller, child_robed, official, butcher
    'shopkeeper_25360': ('storyteller', 0, 'idle:10', '', ''),
    'grain_owner_28045': ('storyteller', 0, 'sit_point|sit:30', 'fortune_teller,elder', ''),
    'hall_seated_man_25600': ('fortune_teller', 0, 'sit:30', '', ''),
    'man_dark_robe_26424': ('fortune_teller', 0, 'talk:8; idle:4', '', ''),
    'bank_small_figure_21255': ('child_robed', 0, 'look:8; idle:5', '', ''),
    'shop_man_dark_cap_23963': ('official', 0, 'sit_talk|write:24', '', ''),
    'handshake_youth_28163': ('butcher', 0, 'hand_over:9; idle:3', '', ''),
}
# why a figure plays other clips than the needs list's line (its line names a clip that would break the pose)
CLIP_WHY = {
    'man_north_bank_small_21553': 'the needs list\'s `listen` is the seated sit_listen take (t2m:sit_listen), and he is '
                                  'painted standing with his hands together: look',
    'bank_man_with_stick_25370': 'the needs list\'s `listen` is the seated sit_listen take, and he is painted standing, '
                                 'turned to the man in the light robe: look',
    'steersman_stern_21678': '`steer` is a walk (t2m:steer_shafts, walking between a cart\'s shafts) and would tread in '
                             'place on the stern: he stands looking along the boat until a tiller take exists',
    'steersman_27890': '`steer` is a walk (t2m:steer_shafts) and would tread in place at the tiller: he stands',
    'barrow_puller_25607': '`lead` is a walk (lead_camel_walk); the barrow is built standing, so he stands between its '
                           'shafts (the needs list: the pusher and puller walk only if the barrow is made to move)',
    'man_cabin_window_21333': 'the needs list\'s `sit` is a chair sit and no boat in the kit carries a stool: he sits on '
                              'the cabin floor (a floor sit), head and shoulders at the window as painted',
    'man_seated_deckhouse_24393': 'the needs list\'s `sit_talk` is a chair sit and the deckhouse has no seat in the kit: '
                                  'he sits on its floor, facing his companion',
    'man_stern_hood_26750': 'the needs list\'s `sit` is a chair sit on a deck with no seat: a floor sit, else the '
                            'carter\'s crouch ("seated or leaning on its floor")',
    'man_seated_canopy_21120': 'seated on the deck (no thwart under him in the kit\'s covered boat): a floor sit, else the '
                               'townsman\'s squat',
    'second_passenger_window_24050': 'painted seated at the window beside the first passenger, who leans on its sill '
                                     'standing (lean_chin): the child looks out standing, its head at the sill',
    'passenger_reclining_on_cargo_22848': 'lying back propped on one arm, looking at the bank: he lies on his side '
                                          '(sleep_side; sit_floor before the idler had it) until the lie_wave take exists',
    'eatery_man_23642': 'robed_man has no drink yet; his listen (sit_listen) is a seated take with the arms forward',
    'doorway_man_topknot_24088': 'robed_man has no chair sit yet; his listen (sit_listen) is a seated take',
}
CLIP_WHY_WHEN = {   # a note holds only while the figure plays one of these
    'eatery_man_23642': {'listen'}, 'doorway_man_topknot_24088': {'listen'},
    'passenger_reclining_on_cargo_22848': {'sit_floor', 'sleep_side'}, 'man_stern_hood_26750': {'crouch', 'sit_floor', 'sit_one_knee'},
    'man_seated_canopy_21120': {'squat_sleeves', 'sit_floor'}, 'man_cabin_window_21333': {'sit_floor', 'sit_one_knee'},
    'man_seated_deckhouse_24393': {'sit_floor', 'sit_one_knee'},
}
# the new characters the workshop makes for S2 (gen/expand/round2/catalogue.md §1b, the lead's catalogue): each of
# these figures is cast as its future character with its present cast as `stand_in` (web/src/world.js plays the
# stand-in while the character isn't in characters.json); this script plays the character's own clips the day it lands
FUTURE = {}
for _c, _ids in {
    'boatman': 'boatman_pole_20495 boatman_standing_20615 boatman_on_roof_20683 man_cabin_door_20877 '
               'man_cabin_window_21333 sweepman_leaning_back_22110 sweepman_leaning_on_loom_22285 '
               'boatman_pouring_bucket_22665 boatman_fending_off_23688 man_bow_arm_out_23795 boatman_roof_leaning_24030 '
               'crewman_crouching_white_24067 boatman_hauling_mast_24140 man_seated_deckhouse_24393 '
               'boatman_roof_seated_24478 figure_under_canopy_25518 boatman_roof_26290 boatman_leaning_20558 '
               'boatman_far_deck_21505 sweepman_head_back_22132 sweepman_capped_22242 boatman_on_ladder_23275 '
               'boatman_at_windlass_23465 crewman_crouching_24125 figure_roof_coils_24508 windlass_man_aft_24660 '
               'boatman_poling_24730 man_leaning_casks_25650 crewman_head_cabin_east_25810 boatman_coils_28543 '
               'boatman_cap_20938 steersman_stern_21678 sweepman_upright_22168 figure_deckhouse_east_24590 '
               'figure_in_windlass_24713 man_stern_hood_26750 steersman_27890 man_leaning_deckhouse_24447',
    'grain_porter': 'sack_porter_24312 sack_porter_24452 sack_porter_24537 sack_porter_bank_edge_24467 '
                    'sack_porter_28343 bank_porter_28355 sack_porter_bent_28432 sack_porter_back_28271',
    'straw_hat': 'hat_walker_24004 tracker_broad_hat_22057 basket_porter_24804 pole_porter_27193 barrow_pusher_25532 '
                 'man_standing_26362',
    'tracker': 'tracker_lead_21867 tracker_bent_21939 tracker_hatched_coat_21994 tracker_rear_22172',
    'dark_hat': 'big_hat_man_south_bank_22045',
    'youth': 'bank_small_figure_21255 second_passenger_window_24050',
}.items():
    for _s in _ids.split():
        FUTURE[_s] = _c
FUTURE_WHY = {
    'boatman': 'catalogue item 1 (30 credits, the first account): the river\'s crews, model S2.fig.sweepman_upright_22168 '
               '[22100, 805, 22205, 985]; the needs list\'s other five [boatman] crew keep their cast (their painted '
               'dress differs: bowman_under_hood_23660, boatman_seated_open_boat_22060, sweepman_capped_22208, '
               'crouching_figure_open_boat_22175, figure_stern_roof_24622)',
    'grain_porter': 'catalogue item 9 (30, the first account): a short pale jacket with an apron or hip wrap, bare shins; '
                    '私粮进京\'s porters',
    'straw_hat': 'catalogue item 10 (30, the next account): a broad straw hat or 斗笠 over a short belted jacket',
    'tracker': 'catalogue item 15 (30, the next account): a short belted jacket and a round cloth cap; the 纤夫',
    'dark_hat': 'catalogue item 14 (30, the next account): a broad dark hat over a short jacket',
    'youth': 'catalogue item 21 (30, the next account): about 1.45 m, a round face and a small topknot',
}
# walkers: their walk clips in order of preference (`clip+prop`: only with that load in the hands), and alternates
WALK = {
    'sack_porter_24312': ('sack_carry+back_sack+stick|sack_carry+back_sack|back_load+back_sack|walk+stick|walk', ''),
    'sack_porter_24452': ('sack_carry+back_sack+stick|sack_carry+back_sack|back_load+back_sack|walk+stick|walk', ''),
    'sack_porter_24537': ('sack_carry+back_sack+stick|sack_carry+back_sack|back_load+back_sack|walk+stick|walk', ''),
    'sack_porter_28343': ('sack_carry+back_sack|back_load+back_sack|walk', ''),
    'sack_porter_bent_28432': ('sack_carry+back_sack|back_load+back_sack|walk', ''),
    'bank_porter_28355': ('sack_carry+back_sack|back_load+back_sack|walk', ''),
    'sack_porter_bank_edge_24467': ('sack_carry+back_sack|back_load+back_sack|walk', ''),
    'basket_porter_27666': ('carry_pole+pole_baskets', ''),
    'pole_bundle_carrier_27767': ('carry_pole+pole_bundle', ''),
    'basket_porter_24804': ('carry_pole+pole_shallow_baskets', 'porter'),
    'pole_porter_27193': ('carry_pole+pole_bundles_small|carry_pole+pole_bundles', 'porter'),
    'hat_walker_24004': ('walk+staff_walk|walk', ''),
}
WALK_SPEED = {'carry_pole': 0.85, 'sack_carry': 0.7, 'back_load': 0.75, 'walk': 1.0}
WALK_LEN, MIN_WALK = 7.0, 2.0       # skill characters: about 6-8 m and back; a painted walker with less room stands
# the five trackers (纤夫) haul 逆水行舟 with the boats agent's `haul`: while the boat moves they walk, while it waits
# they lean on the rope
HAUL = {'tracker_lead_21867', 'tracker_bent_21939', 'tracker_hatched_coat_21994', 'tracker_broad_hat_22057',
        'tracker_rear_22172'}
HAUL_WALK = 'tow_walk|walk'
SWEEP = {'sweepman_leaning_back_22110', 'sweepman_head_back_22132', 'sweepman_upright_22168', 'sweepman_capped_22208',
         'sweepman_capped_22242', 'sweepman_leaning_on_loom_22285'}
# children: (painted fraction of an adult beside it, the reference adult's height (a character or metres), why) ->
# people.js scale = fraction x reference / the playing model's height (skill characters)
CHILD = {
    'child_or_vase_21076': (0.6, 1.70, 'the seated man beside him under the canopy (57 px against his 73 seated, about '
                                       '0.6 of a standing adult)'),
    'man_north_bank_small_21553': (0.65, 'scholar', 'the man in the long robe beside him (46 px against 73)'),
    'second_passenger_window_24050': (0.85, 'sightseer', 'the passenger beside it at the window (53 px against 63)'),
    'hall_small_figure_25628': (0.55, 'fortune_teller', 'the seated man in the window beside it (26 px against his 48)'),
    'far_street_child_25728': (0.6, 1.70, 'the dark-robed figure beside it (42 px against 73)'),
    'bank_small_figure_21255': (0.75, 'scholar', 'the tall man he faces (145 px against 196)'),
}
# facings the map can't give or the real-size scene can't keep
FACING = {
    'walker_26697': (270, 'the map reads no facing (a slim A-shaped outline on the far street): he faces the viewer, '
                          'south, as the far street\'s standing figures mostly do'),
    'pole_porter_27193': (180, 'the map\'s facing S is uncertain ("the body reads frontal") and its what says he is '
                               'crossing the open ground between 王家纸马铺\'s front and the sheds (the needs list: '
                               'crossing the yard west); south of him the low shed\'s ridge hides his shins, so he walks '
                               'west along the yard and back'),
}
# the rider: on her painted donkey (people.json ride), side-saddle as painted ("the legs hanging at the animal's side")
RIDE = {'rider_26832': 'donkey_26872'}

# ---------------------------------------------------------------- what each wanted clip is (for clips_why / wanted)
NEW = {   # Text to Motion takes (10 credits each), by the catalogue's paid list (gen/expand/round2/catalogue.md 1a, 1c)
    'work_sweep': 'item 2: working the great stern sweep, pushing the bar across and hauling it back face up (the '
                  'six at the sweep)',
    'reach_over_rail': 'item 3: bent double over a waist-high rail, both arms hanging over it reaching down and out',
    'tow_walk': 'item 4: a tracker\'s walk, bent far forward, both hands low at the waist on the rope (the five 纤夫)',
    'sack_carry': 'item 5: walking slowly bent far forward under a big sack across the shoulders, one hand at its tied '
                  'neck (私粮进京\'s seven porters)',
    'pole_boat': 'item 6: at a gunwale, leaning the weight down a long pole slanting into the water',
    'fend_pole': 'item 7: feet apart, both arms holding a long pole up or level, pushing it hard away (the two '
                 'fenders; the pennant pole\'s holder raising it)',
    'haul_line': 'item 11: hauling a rope hand over hand (the kneeling man at 逆水行舟\'s mast, played low)',
    'sit_offer': 'item 19: seated low, reaching down and holding something out at arm\'s length (the tub vendor\'s bowl)',
    'lie_wave': 'item 20: half lying propped on one elbow, raising the free arm (the passenger on the bales)',
    'sit_point': 'item 28 (optional): seated, leaning forward, the right arm out level pointing, calling orders',
    'pour_bucket': 'item 31 (optional): bent over a gunwale tipping a bucket out',
    'climb_ladder': 'item 32 (optional): climbing a steep ladder, the hands reaching over the top onto a roof',
    'lean_over_seated': 'item 35 (optional): seated on a low bench, bending far forward over an animal\'s back',
    'tiller': '(in no list) standing at a stern tiller bar, one hand on it; the steersmen look along their boats',
}
FREE = {   # local retargets (no credits), the needs list's "Clips to add, all free"
    'push': 'from:idler/push', 'look': 'from:townsman/look', 'lean_over': 't2m:lean_over', 'crouch': 'from:idler/crouch',
    'back_load': 'from:townsman/back_load', 'bend_goods': 't2m:bend_goods', 'push_flank': 't2m:push_flank',
    'reach': 'from:child/reach', 'sit_floor': 'from:idler/sit_floor', 'sit': 'from:scholar/sit',
    'drink': 'from:scholar/drink', 'point': 'from:idler/point', 'chin': 'from:inspector/chin',
    'listen': 't2m:sit_listen', 'stand_pole': 'from:porter/stand_pole', 'sit_talk': 'from:official/sit_talk',
    'sleep_side': 'from:soldier/sleep_side', 'knees_up': 't2m:sit_knees_up', 'bow': 'from:townsman/bow',
    'bridle': 't2m:hold_bridle', 'carry_pole': 'from:porter/carry_pole', 'lean_chin': 'from:idler/lean_chin',
    'tie_kerchief': 'from:idler/tie_kerchief', 'ride_side': 'from:elder/ride_side', 'kneel_sleep': 'from:soldier/kneel_sleep',
    'arms_folded': 'from:inspector/arms_folded', 'talk': 'from:townsman/talk', 'hand_over': 'from:carter/hand_over',
    'crane': 't2m:crane_listen', 'squat_sleeves': 't2m:squat_sleeves', 'sit_one_knee': 't2m:sit_one_knee',
    'doze_knees': 't2m:doze_knees', 'hail': 't2m:hail', 'browse': 't2m:browse_goods', 'show_garment': 't2m:show_garment',
    'hold_rope': 't2m:hold_rope', 'bucket_lift': 't2m:bucket_lift', 'walk': 'rig:walking',
}
PROP_NEW = {   # carried props (catalogue §2d) no GLB has yet; S2's stick_bundle is a kit part, not a prop
    'long_pole': 'a 4-6 m bamboo boat pole (fend_pole, pole_boat): boatman_pole_20495, boatman_fending_off_23688, '
                 'boatman_poling_24730',
    'back_sack': 'a big sack slung on the back, its tied neck at the top (sack_carry / back_load): the seven sack '
                 'porters, pale grain sacks, roped on bank_porter_28355',
    'straw_cape': 'a cape of layered straw (蓑衣) to the hips (worn): tracker_hatched_coat_21994, boatman_roof_26290',
    'hand_dish': 'a small bowl held out (tub_vendor_27765 on sit_offer; eatery_man_23642, optional), a cup raised '
                 'overhead (bank_man_seated_21140, low)',
    'veiled_hat': 'a tall hood or wide hat with a veil to the shoulders, 帷帽 (worn; low): rider_26832',
}
PROP_BIND = {   # existing props, new bindings the needs list asks for (figure: (prop, character, clip))
    'basket_porter_24804': ('pole_shallow_baskets', 'hat_traveller', 'carry_pole'),
    'pole_porter_27193': ('pole_bundles', 'hat_traveller', 'carry_pole'),
    'hat_walker_24004': ('staff', 'hat_traveller', 'walk'),
    'boatman_pouring_bucket_22665': ('bucket', 'idler', 'bucket_lift'),
    'robed_man_foredeck_23930': ('fan_round', 'robed_man', 'point'),
    'shed_keeper_28467': ('stick', 'inspector', 'point'),
    'bank_man_with_stick_25370': ('stick', 'carter', 'listen/look (tucked under the right arm)'),
    'sack_porter_24312': ('stick', 'porter', 'sack_carry'), 'sack_porter_24452': ('stick', 'porter', 'sack_carry'),
    'sack_porter_24537': ('stick', 'porter', 'sack_carry'),
}

GENERIC = {'idle', 'look'}
SEATED_CLIPS = {'sit', 'sit_talk', 'write', 'drink', 'listen', 'tell_fortune', 'sit_point', 'lean_over_seated'}
FLOOR_CLIPS = {'sit_floor', 'knees_up', 'sit_one_knee', 'doze_knees', 'kneel_sleep', 'sleep_side', 'lie_prop',
               'serve_bowl', 'squat_sleeves'}
WALK_CLIPS = {'walk', 'carry_pole', 'fan_walk', 'back_load', 'stride_stick', 'quick', 'stroll', 'walk_whip', 'lead',
              'steer', 'drive_team', 'shoulder_box', 'sack_carry', 'tow_walk', 'run'}


def parse_steps(s):
    out = []
    for part in s.split(';'):
        cands, secs = part.strip().rsplit(':', 1)
        out.append(([c.strip() for c in cands.split('|')], float(secs)))
    return out


def cand_ok(model, cand):
    """A candidate `clip` or `clip+prop+...` is playable by the model: it has the clip, and each named prop is a part
    of its GLB bound to that clip (characters/props.json, the registry's props)."""
    clip, *props = cand.split('+')
    if clip not in clips_of(model):
        return False
    for p in props:
        if f'prop_{p}' not in glb_parts(model) or PROPS.get(model, {}).get(p, {}).get('clip') != clip:
            return False
    return True


def key_cands(steps):
    """The first step's candidates that carry the painted action (not the generic stand)."""
    return [c for c in steps[0][0] if c.split('+')[0] not in GENERIC]


assert set(CAST) == set(FIG), f'cast vs layout: {sorted(set(CAST) ^ set(FIG))}'
STEPS0 = {s: parse_steps(v[2]) for s, v in CAST.items()}
WALKERS = [s for s in FIG if s in WALK]
CREW = {s for s in FIG if BOAT_RE.match(FIG[s]['support'])}                # on a boat (any boat support)
HOSTED_BY_SUPPORT = {s for s in CREW if CREW_RE.match(FIG[s]['support'])}   # boats.js host() reads these by support


# the workshop's recolour variants (catalogue 2e) stand in for a future character better than the needs list's cast:
# the same rig, clips and props as their base, recoloured (characters/<name>.json body_from)
INTERIM = {'dark_hat': 'hat_traveller_dark', 'official_rider': 'hat_traveller_dark'}


def playing(slug):
    """(model that plays the figure, how): the future character (catalogue) when it is made, else the needs list's
    dress character; a pose-keeping alternate instead while that one lacks every key candidate. how: 'own' (its
    character plays it), 'stand_in' (a future character not made yet: people.json stand_in), 'recast' (another
    character plays it: people.json character is the player, cast_why says why)."""
    dress, _, _, alt, _ = CAST[slug]
    fut = FUTURE.get(slug)
    base = fut if fut and made(fut) else INTERIM.get(fut) if fut and made(INTERIM.get(fut)) else dress
    keys = key_cands(STEPS0[slug])
    if slug in WALK:
        keys = [c for c in WALK[slug][0].split('|') if c.split('+')[0] != 'walk'] or keys
        alt = WALK[slug][1]
    pick = base
    if alt and keys and not any(cand_ok(base, c) for c in keys):
        pick = next((a for a in alt.split(',') if a and any(cand_ok(a, c) for c in keys)), base)
    if fut and not made(fut):
        return pick, 'stand_in'
    return pick, ('own' if pick == base else 'recast')


MODEL = {s: playing(s) for s in FIG}
N_BOATMAN = sum(1 for x in FUTURE.values() if x == 'boatman')


def char_field(slug):
    """people.json `character`: the future character while it waits (with `stand_in`), else who plays."""
    fut = FUTURE.get(slug)
    model, how = MODEL[slug]
    if fut and not made(fut):
        return fut, model
    return model, None
wanted = {}       # clip -> {character: [figures]}


def want(clip, c, slug):
    wanted.setdefault(clip, {}).setdefault(c, [])
    if slug not in wanted[clip][c]:
        wanted[clip][c].append(slug)


def steps_for(slug):
    """[clip, seconds] cycles the playing model has; each step's first candidate goes to `wanted` when not played."""
    dress = CAST[slug][0]
    model = MODEL[slug][0]
    who = FUTURE.get(slug) or dress
    out, props = [], []
    for cands, secs in STEPS0[slug]:
        have = [c for c in cands if cand_ok(model, c)]
        pick = have[0] if have else 'idle'
        clip, *pp = pick.split('+')
        if clip in WALK_CLIPS:
            raise SystemExit(f'{slug}: a walk clip ({clip}) as a standing step')
        props += [p for p in pp if p not in props]
        first = cands[0].split('+')[0]
        if first not in GENERIC and clip != first:
            want(first, who, slug)
        if out and out[-1][0] == clip:
            out[-1][1] += secs
        else:
            out.append([clip, secs])
    return out, props


STEPS, STEP_PROPS = {}, {}
for s in FIG:
    STEPS[s], STEP_PROPS[s] = steps_for(s)

# ---------------------------------------------------------------- seated clips: hips and feet (left, fwd) from the root
# tools/char_props.mjs --probe on the raw GLBs (the S4b casting's table, 2026-10-12): library chair sits (33, 32) on the
# original rigs keep the root at the feet with the hips 0.23-0.31 m behind; local retargets keep the root under the
# hips with the feet 0.3-0.4 m ahead. (character, clip): (hips_left, hips_fwd, feet_left, feet_fwd, seat_h)
HIPS = {
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


HIPS_CACHE = os.path.join(HERE, 'cast/hips.json')
_hips_cache = json.load(open(HIPS_CACHE, encoding='utf-8')) if os.path.exists(HIPS_CACHE) else {}
_hips_dirty = []


def probe(model, clip):
    """Measure a clip the way the S4b table was measured: tools/char_props.mjs --probe on the character's GLB that holds
    the clip (gen/characters/<c>/local/<clip>.glb for a local retarget, else <c>_raw.glb), at 1 s and 4 s, averaged:
    the hips and the feet (left, forward) from the root and the hips' height over the feet (Armature cm / 100). Cached
    in gen/sections/canal/cast/hips.json by the GLB's size and time, so a new delivery is probed again."""
    import subprocess
    for glb in (f'gen/characters/{model}/local/{clip}.glb', f'gen/characters/{model}/{model}_raw.glb'):
        full = os.path.join(QM, glb)
        if not os.path.exists(full):
            continue
        key = f'{model}/{clip}'
        stamp = f'{glb}:{os.path.getsize(full)}:{int(os.path.getmtime(full))}'
        if _hips_cache.get(key, {}).get('stamp') == stamp:
            return tuple(_hips_cache[key]['hips'])
        rows = []
        for t in (1.0, 4.0):
            r = subprocess.run(['node', 'tools/char_props.mjs', glb, '--probe', clip, str(t)], cwd=QM, capture_output=True,
                               text=True)
            j = {}
            for ln in r.stdout.splitlines():
                parts = ln.split()
                if parts and parts[0] in ('Hips', 'LeftFoot', 'RightFoot'):
                    j[parts[0]] = [float(v) for v in parts[1:4]]
            if len(j) == 3:
                rows.append(j)
        if not rows:
            continue
        av = lambda n, i: sum(r_[n][i] for r_ in rows) / len(rows) / 100
        hips = (round(av('Hips', 0), 2), round(av('Hips', 2), 2),
                round((av('LeftFoot', 0) + av('RightFoot', 0)) / 2, 2), round((av('LeftFoot', 2) + av('RightFoot', 2)) / 2, 2),
                round(av('Hips', 1) - (av('LeftFoot', 1) + av('RightFoot', 1)) / 2, 2))
        _hips_cache[key] = {'stamp': stamp, 'hips': list(hips)}
        _hips_dirty.append(key)
        return hips
    return None


def hips_of(model, clip):
    """HIPS for a seated clip: the S4b table, else probed (and cached); a floor sit sits on the support itself (seat 0).
    A clip that can't be probed (not delivered) is taken as a local retarget: the hips over the root, the feet 0.38 m
    ahead (0.3 m for a floor sit), the seat 0.48 m."""
    if (model, clip) in HIPS:
        return HIPS[(model, clip)]
    h = probe(model, clip)
    if h:
        h = h[:4] + ((0.0,) if clip in FLOOR_CLIPS else (h[4],))
        HIPS[(model, clip)] = h
        return h
    print(f'  note: {model} {clip} can\'t be probed: taken as a local retarget (hips over the root)')
    return (0.0, 0.0, 0.0, 0.3, 0.0) if clip in FLOOR_CLIPS else (0.0, 0.02, 0.0, 0.38, 0.48)


# where each seated figure sits: 'mapped' (its hips on a mapped bench or stool), 'sacks' (on the mapped sack pile, its
# top the clip's seat height: seats.json gives the builder the height), 'table' (at a mapped table it faces: a stool
# behind its edge), 'feet' (the painted point is the feet; a seat the map lacks under the hips), 'floor' (on the
# ground or floor itself), 'crew' (on a boat: the page places him; nothing moves here)
SEAT = {
    'eatery_man_23642': ('mapped', 'S2.prop.eatery_bench_23612', 'on the east end of the eatery\'s west bench'),
    'shop_man_dark_cap_23963': ('mapped', 'S2.prop.shop_bench_23955', 'on his bench inside the open shop front'),
    'doorway_man_topknot_24088': ('mapped', 'S2.prop.shop_bench_24066', 'on the bench in the shop\'s doorway'),
    'shed_diner_seated_28772': ('mapped', 'S2.prop.shed_bench_28740', 'on the low bench at 望楼饭铺\'s east table'),
    'donkey_owner_seated_28850': ('mapped', 'S2.prop.shed_stool_28871', 'on the stool at the shed\'s east end'),
    'man_leaning_over_donkey_29000': ('mapped', 'S2.prop.bench_29030', 'on the low bench behind the dark donkey'),
    'grain_owner_28045': ('sacks', 'S2.prop.sack_pile_27996', 'on his sacks'),
    'shop_seated_21683': ('table', 'S2.prop.shop_table_21682', 'behind the open shop\'s counter'),
    'terrace_diner_w_23083': ('table', 'S2.prop.terrace_table_23125', 'at the terrace\'s west table, its west side'),
    'terrace_diner_back_23116': ('table', 'S2.prop.terrace_table_23125', 'at the west table\'s near side, back to us'),
    'pavilion_diner_23388': ('table', 'S2.prop.pavilion_table_23392', 'in the pavilion, his hands on its small table'),
    'shop_man_head_cloth_23990': ('table', 'S2.prop.shop_small_table_23983', 'across the small table from the '
                                  'black-capped man'),
    'stall_figure_behind_table_24705': ('table', 'S2.prop.stall_table_24708', 'behind the stall table under the eave'),
    'stall_keeper_26174': ('table', 'S2.prop.stall_table_26173', 'behind the far-street stall table'),
    'shed_customer_28535': ('table', 'S2.prop.table_28522', 'behind the table in 望楼饭铺\'s middle bay'),
    'shed_customer_back_28690': ('table', 'S2.prop.table_back_28680', 'at the table against the back of the east bay'),
    'terrace_figure_unclear_23148': ('feet', 'stool', 'beside the terrace\'s west table, hunched, back to us'),
    'hall_seated_man_25600': ('feet', 'folding_seat', 'in 沿河雅座\'s open west window (the hall\'s folding seats)'),
    'hall_small_figure_25628': ('feet', 'folding_seat', 'beside the seated man in the window'),
    'bank_man_seated_21140': ('floor', 'ground', 'on the ground at the water\'s edge'),
    'tub_vendor_27765': ('floor', 'ground', 'under the upper shed\'s eave beside the big tub'),
}
for _s, _f in FIG.items():   # every crew figure painted seated, kneeling or lying sits on its deck or roof
    if _s in CREW and _f['pose'] in ('seated', 'kneeling', 'lying') and _s not in SEAT:
        SEAT[_s] = ('crew', _f['support'].split(':')[0], 'on the boat')
# a chair sit on a boat sits on the kit's own seat (the open boat's thwart): nothing for the builder
CREW_CHAIR = {'boatman_seated_open_boat_22060': 'the open boat\'s middle thwart (kit_boats._thwarts: across the hull at '
                                                'the gunwale, at 0.25, 0.5 and 0.75 of its length)'}

# ---------------------------------------------------------------- real sizes (the builder's when it says, else choices)
# furniture as blender/canal_scene.py builds it: table(eid, L, W, yaw, ht=), bench(eid, L, yaw, ht=), stool(eid, ht=),
# chair(eid, yaw, ...), folding_seat(eid, ...) (the S4b builder's helpers, which the S2 builder copies), or its
# gen/sections/canal/build/furniture.json {eid: {kind, L, W, yaw, ht}}; else these defaults (choice: real Song sizes)
def furn_default(eid):
    s = SLUG(eid)
    if 'stool' in s:
        return dict(kind='stool', L=0.32, W=0.32, yaw=0.0, ht=0.42)
    if 'bench' in s:
        return dict(kind='bench', L=1.4, W=0.26, yaw=0.0, ht=0.45)
    if 'small_table' in s:
        return dict(kind='table', L=0.6, W=0.6, yaw=0.0, ht=0.72)
    if 'pavilion_table' in s:
        return dict(kind='table', L=0.7, W=0.5, yaw=0.0, ht=0.72)
    if 'stall_table' in s or 'shop_table_21682' in s or 'counter' in s:
        return dict(kind='table', L=1.3, W=0.55, yaw=0.0, ht=0.8)
    if 'table' in s:
        return dict(kind='table', L=1.1, W=0.6, yaw=0.0, ht=0.78)
    return None


BUILDER_NAMES = {}


def builder_furniture():
    out = {}
    for eid, v in (FURN_JSON.get('furniture', FURN_JSON) or {}).items():
        if isinstance(v, dict) and eid in E and {'kind', 'L', 'W', 'yaw', 'ht'} <= set(v):
            out[eid] = {k: v[k] for k in ('kind', 'L', 'W', 'yaw', 'ht')}
    if out or not os.path.exists(BUILDER):
        return out
    src = open(BUILDER, encoding='utf-8').read()
    names = {}
    for n, eid in re.findall(r'^[ \t]*([A-Za-z_]\w*) = (?:fyaw|front_frame)\("([^"]+)"\)(?:\[1\])?\s*$', src, re.M):
        if eid in E and E[eid].get('footprint'):          # a building's front yaw (sw -> se), as front_frame() gives it
            sw, se = E[eid]['footprint'][0], E[eid]['footprint'][1]
            names[n] = math.degrees(math.atan2(se[1] - sw[1], se[0] - sw[0]))
    for n, v in re.findall(r'^[ \t]*([A-Za-z_]\w*) = (-?[\d.]+)\b', src, re.M):
        names.setdefault(n, float(v))
    ev = lambda x: float(eval(x, {'__builtins__': {}, 'math': math}, names))
    BUILDER_NAMES.update(names)
    for kind, eid, args in re.findall(r'^[ \t]*(table|bench|stool|chair|folding_seat)\("(S2\.prop\.[^"]+)"(.*)\)[ \t]*$',
                                      src, re.M):
        a = [x.strip() for x in args.split(',') if x.strip()]
        pos = [x for x in a if '=' not in x]
        kw = dict(x.split('=', 1) for x in a if '=' in x)
        try:
            if kind == 'table':
                out[eid] = dict(kind='table', L=ev(pos[0]), W=ev(pos[1]), yaw=ev(pos[2]) if len(pos) > 2 else 0.0,
                                ht=ev(kw.get('ht', '0.78')))
            elif kind == 'bench':
                out[eid] = dict(kind='bench', L=ev(pos[0]), W=0.26, yaw=ev(pos[1]) if len(pos) > 1 else 0.0,
                                ht=ev(kw.get('ht', '0.45')))
            elif kind == 'stool':
                out[eid] = dict(kind='stool', L=0.32, W=0.32, yaw=0.0, ht=ev(kw.get('ht', '0.42')))
            else:
                out[eid] = dict(kind='stool', L=0.44, W=0.44, yaw=ev(pos[0]) if pos else 0.0, ht=ev(kw.get('h', '0.45')))
        except Exception:
            continue
    return out


FURN_BUILT = builder_furniture()
FURN = {}
for k in E:
    if E[k]['kind'] == 'prop':
        d = FURN_BUILT.get(k) or furn_default(k)
        if d:
            FURN[k] = d
# other props near people at real size (choice, until the builder's inside.json says otherwise): rectangles
# (L along yaw, W, yaw) for flat things, discs for round ones; things on a table top or high up are left out
PROP_RECT = {'S2.prop.goods_racks_25290': (1.2, 0.5, 0), 'S2.prop.baskets_26778': (0.9, 0.45, 0),
             'S2.prop.paper_goods_stack_27070': (1.0, 0.6, 0), 'S2.prop.trestle_board_27310': (1.2, 0.5, 0),
             'S2.prop.low_stand_27500': (1.0, 0.4, 0), 'S2.prop.terrace_chair_23250': (0.45, 0.45, 0),
             'S2.prop.timber_frame_21922': (1.6, 0.3, 0), 'S2.prop.eatery_back_table_23670': (1.6, 0.5, 0)}
PROP_DISC = {'S2.prop.tub_27532': 0.45, 'S2.prop.tub_27815': 0.55, 'S2.prop.pole_stack_24680': 0.45,
             'S2.prop.stake_27708': 0.06, 'S2.prop.mooring_stake_27902': 0.06, 'S2.prop.coiled_rope_27873': 0.32,
             'S2.prop.mooring_post_25207': 0.12, 'S2.prop.mooring_post_rope_28272': 0.12,
             'S2.prop.signboard_pole_25235': 0.1, 'S2.prop.wheel_20965': 0.35, 'S2.prop.doorway_jar_23885': 0.3,
             'S2.prop.tall_jar_28396': 0.3, 'S2.prop.bundle_28520': 0.3, 'S2.prop.tall_paper_item_27112': 0.3,
             'S2.prop.parasol_27430': 0.05, 'S2.prop.eatery_dark_object_23574': 0.3, 'S2.prop.eatery_rack_23688': 0.3,
             'S2.prop.ribbed_object_28878': 0.3, 'S2.prop.pennant_frame_27930': 0.08, 'S2.prop.terrace_bundle_23187': 0.25,
             'S2.prop.hall_ladder_25535': 0.3, 'S2.prop.signboard_wang_paper_horse_26896': 0.12,
             'S2.prop.tub_or_trough_28923': 0.4, 'S2.prop.wheel_26343': 0.15}
PROP_POLY = ['S2.prop.sack_pile_27996', 'S2.prop.sack_heap_28144', 'S2.prop.long_board_rack_28365',
             'S2.prop.shed_tables_25845', 'S2.prop.pole_frame_27490']
# the vehicles at real size (choice until the builder's numbers are read: kit_vehicles parts the needs list names)
CART_KIT = dict(bed_len=2.3, bed_w=1.24, wheel_at=0.5, R=0.79, track_extra=0.2, z_bed=0.91)


def builder_cart():
    """The mule cart as blender/canal_scene.py builds it (_mule_cart_fallback: `R = ..`, `bed_len, hw = .., ..`, the bed
    centred on the painted wheel, the track hw + track_extra), read on every run; CART_KIT's defaults otherwise."""
    if not os.path.exists(BUILDER):
        return 'defaults'
    src = open(BUILDER, encoding='utf-8').read()
    kv_src = open(os.path.join(QM, 'blender/kit_vehicles.py'), encoding='utf-8').read()
    sig = re.search(r'def open_cart\((.*?)\):', kv_src, re.S)
    call = re.search(r'kv\.open_cart\((.*?)\)\n', src, re.S)
    if sig and call:            # the vehicle factory's open cart: its defaults, then the builder's keywords
        kw = dict(re.findall(r'(\w+)=(-?[\d.]+)', sig.group(1)))
        kw.update(dict(re.findall(r'(\w+)=(-?[\d.]+)', call.group(1))))
        CART_KIT.update(R=float(kw.get('R', 0.68)), bed_len=float(kw.get('bed_len', 2.4)),
                        bed_w=float(kw.get('bed_w', 1.25)), wheel_at=float(kw.get('wheel_at', 0.6)), track_extra=0.22,
                        loader_in=0.28)
        return 'kit_vehicles.open_cart (the builder\'s call)'
    m = re.search(r'def _mule_cart_fallback.*?\n(?=def )', src, re.S)
    if not m:
        return 'defaults'
    body = m.group(0)
    r_ = re.search(r'^\s+R = ([\d.]+)', body, re.M)
    bl = re.search(r'^\s+bed_len, hw = ([\d.]+), ([\d.]+)', body, re.M)
    te = re.search(r'track_extra=([\d.]+)', body)
    if r_:
        CART_KIT['R'] = float(r_.group(1))
    if bl:
        CART_KIT['bed_len'], CART_KIT['bed_w'] = float(bl.group(1)), 2 * float(bl.group(2))
    if te:
        CART_KIT['track_extra'] = float(te.group(1))
    if re.search(r'bx0, bx1 = s_w - bed_len / 2, s_w \+ bed_len / 2', body):
        CART_KIT['wheel_at'] = 0.5
    return 'blender/canal_scene.py _mule_cart_fallback'


CART_FROM = builder_cart()
BARROW_KIT = dict(length=1.7, width=0.7)        # kit_vehicles.sack_cart's barrow with its handles
ROUND_CART_KIT = dict(length=2.4, width=1.4)    # barrel_cover over a short bed on legs

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


def base_pos(eid, pos):
    """A layout position without this casting's own recorded move (cast.json moves are computed from the map's)."""
    m = MOVED.get(eid)
    return (pos[0] - m.get('dX', 0), pos[1] - m.get('dD', 0)) if m and m.get('by') == 'cast' else tuple(pos[:2])


# ---------------------------------------------------------------- the river and banks (as built when the plan exists)
NORTH_BANKS = ['S2.grd.north_bank_20500', 'S2.grd.north_bank_22550', 'S2.grd.bank_n_23300', 'S2.grd.north_bank_26000']
SOUTH_BANKS = ['S2.grd.south_bank_20500', 'S2.grd.mound_south_bank_21420', 'S2.grd.south_bank_flat_21850',
               'S2.grd.south_bank_spit_22400']


def bank_line(gid, which):
    b = (RIVER.get('banks') or {}).get(gid, {})
    pts = b.get(which) or E[gid]['lines'][which]
    return [tuple(p[:2]) for p in pts]


def chain(ids, which):
    pts = []
    for g in ids:
        for p in bank_line(g, which):
            if not pts or math.dist(p, pts[-1]) > 1e-6:
                pts.append(p)
    return sorted(pts, key=lambda p: p[0]) if which == 'bank_top' and False else pts


NORTH_TOP = chain(NORTH_BANKS, 'bank_top')
NORTH_SHORE = chain(NORTH_BANKS, 'shore')


def under_line(line, far=-40.0, ext=40.0):
    """The region south of a west->east line (closed far to the south and run on east and west)."""
    a, b = line[0], line[-1]
    return [(a[0] - ext, a[1])] + list(line) + [(b[0] + ext, b[1]), (b[0] + ext, far), (a[0] - ext, far)]


RIVER_N = under_line(NORTH_TOP)          # past the built north bank top: the bank slope and the water
WATER_N = under_line(NORTH_SHORE)        # past the built north shore: the water
SOUTH_LAND = [under_line(bank_line(g, 'shore'), ext=0.0) for g in SOUTH_BANKS]   # the south bank and its slope


SLOPE_FLOOR = 0.64   # choice: a walker painted on the bank slope goes down it no deeper than H -0.45 (0.64 of the way
#                      from the bank top, H 0, to the water, H -0.7): his painted H is -0.35, and the water's edge is the boat's


def water_dist(p, slope_ok=False):
    """Room from p to the river for a walker on the north bank: to the bank top (the slope beyond is the river's), or,
    for one painted on the bank slope, to the depth SLOPE_FLOOR down the slope. Positive on land."""
    if any(inside(p, poly) for poly in SOUTH_LAND):
        return 99.0
    dt = poly_dist(p, RIVER_N)
    if not slope_ok or dt > 0:
        return dt if not slope_ok else dt + 1.0
    ds = max(0.0, poly_dist(p, WATER_N))
    return (SLOPE_FLOOR - (-dt) / max(1e-6, -dt + ds)) * (-dt + ds)


# ---------------------------------------------------------------- vehicles at real size
def cart_body():
    pts = E['S2.veh.mule_cart_24305']['pts']
    rear, front, wheel = pts['rear'][:2], pts['front'][:2], pts['wheel0'][:2]
    f, length = axis(rear, front)
    lft = (-f[1], f[0])
    s_w = (wheel[0] - rear[0]) * f[0] + (wheel[1] - rear[1]) * f[1]
    bx0 = s_w - CART_KIT['wheel_at'] * CART_KIT['bed_len']
    bx1 = bx0 + CART_KIT['bed_len']
    hw = CART_KIT['bed_w'] / 2
    track = hw + CART_KIT['track_extra']
    P = lambda s, t: (rear[0] + f[0] * s + lft[0] * t, rear[1] + f[1] * s + lft[1] * t)
    return dict(rear=rear, f=f, left=lft, bx0=bx0, bx1=bx1, hw=hw, P=P, track=track,
                collider=[P(bx0 - 0.05, -track - 0.12), P(bx1 + 0.05, -track - 0.12), P(bx1 + 0.05, track + 0.12),
                          P(bx0 - 0.05, track + 0.12)],
                bed=[P(bx0 + 0.1, -hw + 0.1), P(bx1 - 0.1, -hw + 0.1), P(bx1 - 0.1, hw - 0.1), P(bx0 + 0.1, hw - 0.1)])


CART = cart_body()


def long_body(eid, length, width):
    p = E[eid]['pts']
    rear, front = p['rear'][:2], p['front'][:2]
    c = ((rear[0] + front[0]) / 2, (rear[1] + front[1]) / 2)
    f, _ = axis(rear, front)
    return rect(c, math.degrees(math.atan2(f[1], f[0])), length / 2, width / 2), c, f


def barrow_body():
    """The crate barrow as blender/canal_scene.py builds it: kit_vehicles.barrow_load from the painted rear (under the
    handles' tips, where the pusher stands) `Ld * <len>` m along its heading to the shafts' ends (where the puller
    stands); the kit's walker collider from 0.3 m to L - 0.3 m along it, frame_w / 2 + 0.1 to each side."""
    pts = E['S2.veh.barrow_crates_25598']['pts']
    rear, front = pts['rear'][:2], pts['front'][:2]
    f, _ = axis(rear, front)
    Lb, hw = BARROW_KIT['length'], BARROW_KIT['width'] / 2
    if os.path.exists(BUILDER):
        m = re.search(r'S2\.veh\.barrow_crates_25598.*?Ld \* ([\d.]+)', open(BUILDER, encoding='utf-8').read(), re.S)
        if m:
            Lb, hw = float(m.group(1)), 0.43
    P = lambda s_, t_: (rear[0] + f[0] * s_ - f[1] * t_, rear[1] + f[1] * s_ + f[0] * t_)
    return dict(P=P, L=Lb, f=f, collider=[P(0.3, -hw - 0.1), P(Lb - 0.3, -hw - 0.1), P(Lb - 0.3, hw + 0.1), P(0.3, hw + 0.1)])


BARROW_B = barrow_body()
BARROW = BARROW_B['collider']
ROUND_CART, _, _ = long_body('S2.veh.cart_round_top_26035', ROUND_CART_KIT['length'], ROUND_CART_KIT['width'])
VEH = [('S2.veh.mule_cart_24305', CART['collider']), ('S2.veh.barrow_crates_25598', BARROW),
       ('S2.veh.cart_round_top_26035', ROUND_CART)]
# the boats as built (blender/build_boats.py's manifest: loa, beam, heading), centred where kit_boats._frame centres
# them (the midpoint of the layout's front and rear, or the kit's `centre` option): walkers stop short of their hulls
BOAT_MAN = (J('gen/sections/canal/web_build/canal_boats.json', {}) or J('web/public/assets/canal/boats.json', {})).get('boats', {})
HULLS = []
for bid, info in BOAT_MAN.items():
    if bid not in E or not info.get('loa'):
        continue
    bp = E[bid]['pts']
    cen = ((CHOICES.get('boats') or {}).get(bid, {}).get('kit') or {}).get('centre')
    c = tuple(cen[:2]) if cen else ((bp['front'][0] + bp['rear'][0]) / 2, (bp['front'][1] + bp['rear'][1]) / 2)
    hd = math.degrees(math.atan2(bp['front'][1] - bp['rear'][1], bp['front'][0] - bp['rear'][0]))
    HULLS.append((bid, rect(c, hd, info['loa'] / 2, info['beam'] / 2 + 0.1)))

# ---------------------------------------------------------------- animals
ANIMAL_SPEC = {   # model (preferences: the first the registry has), load (preferences), clips, as painted
    'cart_mule_lead_24192': dict(model=['mule'], load=['collar'], do=[['graze', 9], ['idle', 5]]),
    'cart_mule_near_24215': dict(model=['mule'], load=['collar'], do=[['graze', 14]]),
    'horse_24565': dict(model=['horse'], load=['girth_cloth', 'saddle'],
                        do=[['head_low', 10], ['idle', 4]]),
    'horse_feeding_26072': dict(model=['horse_dark', 'horse'], load=[], do=[['graze', 12], ['idle', 3]]),
    'donkey_26098': dict(model=['donkey'], load=[], do=[['idle', 10]]),
    'donkey_26872': dict(model=['donkey'], load=['saddle_cloth'], do=[['idle', 10]]),
    'donkey_dark_28921': dict(model=['donkey_dark', 'donkey'], load=['halter'], do=[['idle', 10]]),
    'bird_in_willow_21135': dict(model=['bird'], load=[], do=[['idle', 10]]),
    'bird_in_willow_21730': dict(model=['bird'], load=[], do=[['idle', 10]]),
}
assert set(ANIMAL_SPEC) == set(ANIMALS), f'animals vs layout: {set(ANIMAL_SPEC) ^ set(ANIMALS)}'
TEAM = ('cart_mule_lead_24192', 'cart_mule_near_24215')
LOAD_W = {'pack_saddle': 0.8, 'pannier_charcoal': 0.8}


def tack_of(model):
    t = ANI.get(model, {}).get('tack') or {}
    return set(t) if isinstance(t, (dict, list)) else set()


ANIMAL_WHY_FALLBACK = {}
for s, sp in ANIMAL_SPEC.items():
    prefs = sp['model']
    sp['model'] = next((m for m in prefs if m in ANI and isinstance(ANI[m], dict) and ANI[m].get('file')), prefs[-1])
    if sp['model'] != prefs[0]:
        ANIMAL_WHY_FALLBACK[s] = f'{prefs[0]} (not made) -> {sp["model"]}'
    loads = sp.pop('load')
    have = [x for x in loads if x in tack_of(sp['model'])]
    if have:
        sp['load'] = have[0]
    if loads and (not have or have[0] != loads[0]):
        ANIMAL_WHY_FALLBACK[s] = (ANIMAL_WHY_FALLBACK.get(s, '') + '; ' if s in ANIMAL_WHY_FALLBACK else '') + \
            f'tack {loads[0]} (not made) -> {have[0] if have else "none"}'


def hoof_facing(slug, pts=None):
    a = pts or ANIMALS[slug]['pts']
    return math.degrees(math.atan2(a['fore'][1] - a['hind'][1], a['fore'][0] - a['hind'][0]))


def animal_body(slug, spec, nudge=None, pos=None):
    e = ANIMALS[slug]
    info = ANI.get(spec['model'], {'length_m': 0.3, 'width_m': 0.12})
    k = spec.get('scale', 1)
    w = LOAD_W.get(spec.get('load'), info['width_m'])
    ang = spec.get('facing_deg', hoof_facing(slug))
    nx, nd = nudge if nudge is not None else spec.get('nudge', [0, 0])
    p0 = pos or e['pos']
    c = (p0[0] + nx, p0[1] + nd)
    return dict(c=c, ang=ang, hl=info['length_m'] * k / 2, hw=w * k / 2, H=e.get('H', 0),
                poly=rect(c, ang, info['length_m'] * k / 2, w * k / 2))


for s in TEAM:
    ANIMAL_SPEC[s]['facing_deg'] = round(hoof_facing(s), 1)

# ---------------------------------------------------------------- obstacles
BLOCK = [(k, [tuple(p[:2]) for p in e['footprint']]) for k, e in E.items()
         if e['kind'] in ('building', 'structure') and e.get('footprint')]
# buildings people are painted inside or under (open fronts, sheds, the terrace, the upper hall): their footprints
# are not walls for the figures painted in them (the builder's inside.json says where its real walls are)
OPEN = {'S2.bld.wanglou_shed_28660', 'S2.bld.tiled_shed_27985', 'S2.bld.lower_shed_27780',
        'S2.bld.eating_shed_west_27300', 'S2.bld.far_long_shed_26260', 'S2.bld.yanhe_yazuo_hall_25690',
        'S2.bld.open_shop_25340', 'S2.bld.open_shop_24300', 'S2.bld.open_shop_24020', 'S2.bld.eatery_shelter_23750',
        'S2.bld.river_terrace_23250', 'S2.bld.open_shop_21640', 'S2.bld.far_shed_25785', 'S2.bld.open_shed_26755',
        'S2.str.jetty_27260', 'S2.str.landing_steps_22950'}
SOLID, SEATS_P = [], []
for k, fu in FURN.items():
    poly = rect(tuple(E[k]['pos'][:2]), fu['yaw'], fu['L'] / 2, fu['W'] / 2)
    (SOLID if fu['kind'] == 'table' else SEATS_P).append((k, poly))
for k, (Lr, Wr, yaw) in PROP_RECT.items():
    if k in E:
        SOLID.append((k, rect(tuple(E[k]['pos'][:2]), yaw, Lr / 2, Wr / 2)))
for k in PROP_POLY:
    if k in E and E[k].get('footprint'):
        SOLID.append((k, [tuple(p[:2]) for p in E[k]['footprint']]))
DISCS = [(k, tuple(E[k]['pos'][:2]), r) for k, r in PROP_DISC.items() if k in E]
for t in L['trees']:          # trunks: the builder gives every tree over 3 m a 0.3 m trunk collider (x its scale)
    if (t.get('height_m') or 0) >= 3.0 and t.get('X') is not None:
        DISCS.append((t['map_id'], (t['X'], t['D']), 0.3 * t.get('scale', 1)))
TABLE_H = {k for k, fu in FURN.items() if fu['kind'] == 'table'}

# ---------------------------------------------------------------- nudges
NUDGE = {}
EXTRA = {}       # seated figures: their computed seat (seats.json and the checks)


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
    return FACING.get(slug, (FIG[slug].get('facing_deg', 270),))[0]


def scale_ref(ref):
    return ref if isinstance(ref, float) else height(ref)


scale_of = {s: round(r * scale_ref(ref) / height(MODEL[s][0]), 2) for s, (r, ref, why) in CHILD.items()}


def furn_rect(k):
    fu = FURN[k]
    return rect(tuple(E[k]['pos'][:2]), fu['yaw'], fu['L'] / 2, fu['W'] / 2)


def extent(poly, c, d):
    return max((q[0] - c[0]) * d[0] + (q[1] - c[1]) * d[1] for q in poly)


def over_table(p, H):
    return [k for k in TABLE_H if abs(E[k].get('H', 0) - H) < 0.3
            and any(inside((p[0] + dx, p[1]), furn_rect(k)) for dx in (-0.12, 0, 0.12))]


SEAT_GAP = 0.32     # choice: a seated figure's hips this far behind the table's edge (the knees under its top)
for slug, (kind, what, where) in SEAT.items():
    f = FIG[slug]
    model = MODEL[slug][0]
    clip = STEPS[slug][0][0]
    k_ = scale_of.get(slug, 1.0)
    seated = clip in SEATED_CLIPS or clip in FLOOR_CLIPS
    hl, hf, fl, ff, seat_h = [v * k_ for v in hips_of(model, clip)] if seated else (0, 0, 0, 0, 0)
    fac = facing_of(slug)
    p = (f['X'], f['D'])
    fw, lf = fwd_left(fac)
    why = None
    if kind == 'crew' or slug in CREW:
        seat = root = feet = p
    elif kind == 'mapped':
        c = tuple(E[what]['pos'][:2])
        fu = FURN.get(what, {'kind': 'stool', 'L': 0.32, 'yaw': 0.0, 'ht': 0.42})
        # on the seat where his painted feet put his hips, the first clip of his action whose root (people.js grounds
        # it from above) stays off any colliding table top; along a bench, the nearest place that does
        tries = list(dict.fromkeys(x.split('+')[0] for x in STEPS0[slug][0][0] if cand_ok(model, x))) or [clip]
        pick = None
        for cl in tries:
            h_ = [v * k_ for v in hips_of(model, cl)]
            hips_est = at(p, fac, h_[0] - h_[2], h_[1] - h_[3])
            if fu['kind'] == 'bench':
                bf, _ = fwd_left(fu['yaw'])
                lim = max(0.0, fu['L'] / 2 - 0.2)
                t0 = max(-lim, min(lim, (hips_est[0] - c[0]) * bf[0] + (hips_est[1] - c[1]) * bf[1]))
                ts = sorted({round(max(-lim, min(lim, t0 + sg * i * 0.05)), 3) for i in range(0, 60) for sg in (-1, 1)},
                            key=lambda t: abs(t - t0))
                places = [(c[0] + bf[0] * t, c[1] + bf[1] * t) for t in ts]
            else:
                places = [c]
            for q in places:
                if not over_table(at(q, fac, -h_[0], -h_[1]), f['H']):
                    pick = (cl, h_, q)
                    break
            if pick:
                break
        if not pick:
            cl = tries[0]
            h_ = [v * k_ for v in hips_of(model, cl)]
            hips_est = at(p, fac, h_[0] - h_[2], h_[1] - h_[3])
            pick = (cl, h_, places[0] if fu['kind'] == 'bench' else c)
        if pick[0] != clip:
            CLIP_WHY[slug] = (CLIP_WHY.get(slug, '') + '; ' if slug in CLIP_WHY else '') + (
                f'{clip} would stand his root (the feet) under the table beside his seat at real size, and people.js '
                f'lifts a figure onto a colliding top: he plays {pick[0]} (its root under the hips) until the seat and '
                f'the table stand apart (builder_notes)')
            STEPS[slug][0][0] = pick[0]
            clip = pick[0]
        hl, hf, fl, ff, seat_h = pick[1]
        seat = pick[2]
        root = at(seat, fac, -hl, -hf)
        feet = at(root, fac, fl, ff)
        why = (f'seated {where} ({SLUG(what)}, a mapped {fu["kind"]}, {fu["ht"]:.2f} m high '
               f'{"as the builder makes it" if what in FURN_BUILT else "(choice until the builder says)"}), as painted: '
               f'{model}\'s {clip} keeps the hips {math.hypot(hl, hf):.2f} m from the root, so the root stands where '
               f'the hips land on it; the feet then fall {math.dist(feet, p):.2f} m from the painted foot point')
    elif kind == 'sacks':
        poly = [tuple(q[:2]) for q in E[what]['footprint']]
        hips_est = at(p, fac, hl - fl, hf - ff)
        seat = hips_est
        if poly_dist(seat, poly) > -0.2:              # on the pile, 0.2 m inside its painted outline
            cx = sum(q[0] for q in poly) / len(poly)
            cy = sum(q[1] for q in poly) / len(poly)
            for t_ in [i * 0.02 for i in range(51)]:
                q = (seat[0] + (cx - seat[0]) * t_, seat[1] + (cy - seat[1]) * t_)
                if poly_dist(q, poly) <= -0.2:
                    seat = q
                    break
        root = at(seat, fac, -hl, -hf)
        feet = at(root, fac, fl, ff)
        why = (f'seated {where} ({SLUG(what)}, mapped), as painted: his hips on the pile {math.dist(seat, hips_est):.2f} m '
               f'from where his painted feet put them; the pile\'s top under his hips is the builder\'s (seats.json: '
               f'{seat_h:.2f} m, kc.sack_pile(seat=True)); the feet fall {math.dist(feet, p):.2f} m from the painted point')
    elif kind == 'table':
        poly = furn_rect(what)
        hips_est = at(p, fac, hl - fl, hf - ff)       # where the painted feet put his hips
        seat, moved = hips_est, 0.0
        if poly_dist(hips_est, poly) < SEAT_GAP:      # out of the table's top, its edge SEAT_GAP from the hips
            best = None
            for i_ in range(len(poly)):
                a_, b_ = poly[i_], poly[(i_ + 1) % len(poly)]
                ex, ey = b_[0] - a_[0], b_[1] - a_[1]
                n = math.hypot(ex, ey) or 1
                for nx, ny in ((ey / n, -ex / n), (-ey / n, ex / n)):
                    for k_ in range(1, 160):
                        q = (hips_est[0] + nx * k_ * 0.01, hips_est[1] + ny * k_ * 0.01)
                        if poly_dist(q, poly) >= SEAT_GAP:
                            if best is None or k_ < best[0]:
                                best = (k_, q)
                            break
            moved, seat = best[0] * 0.01, best[1]
        root = at(seat, fac, -hl, -hf)
        feet = at(root, fac, fl, ff)
        why = (f'seated {where} ({SLUG(what)}, {FURN[what]["L"]:.2f} x {FURN[what]["W"]:.2f} m '
               f'{"as the builder makes it" if what in FURN_BUILT else "(choice until the builder says)"}), as painted: '
               f'{model}\'s {clip} keeps the hips {math.hypot(hl - fl, hf - ff):.2f} m behind the feet, '
               + (f'and his hips, at the painted feet, fell {"inside" if poly_dist(hips_est, poly) < 0 else "within " + str(SEAT_GAP) + " m of"} '
                  f'its top at real size: they step {moved:.2f} m out of it, {SEAT_GAP} m from its edge (the knees under it); '
                  if moved else '') + f'the root stands {math.dist(root, p):.2f} m from his painted point, and his seat '
               f'(seats.json) goes under the hips')
    elif kind == 'floor':
        feet = p
        root = at(feet, fac, -fl, -ff)
        seat = at(root, fac, hl, hf)
        if math.dist(root, p) > 0.01:
            why = (f'painted seated {where}, the painted point his feet; {model}\'s {clip} sits on the ground with the '
                   f'feet {math.hypot(fl, ff):.2f} m ahead of the root, so the root stands there')
    else:   # 'feet': the painted point is the feet; a seat the map lacks under the hips
        feet = p
        root = at(feet, fac, -fl, -ff)
        seat = at(root, fac, hl, hf)
        why = (f'painted seated {where}, the painted point his feet (the map\'s foot est); {model}\'s {clip} keeps its root '
               f'{math.hypot(fl, ff):.2f} m from the feet and the hips {math.hypot(hl, hf):.2f} m from the root, so the root '
               f'stands there and his seat goes under the hips (seats.json)')
    EXTRA[slug] = dict(kind=kind, what=what, where=where, model=model, clip=clip, seat=seat, root=root, feet=feet,
                       seat_h=seat_h, facing=fac, seated=seated)
    if slug not in CREW and why and math.dist(root, p) > 0.01:
        nudge(slug, (root[0] - p[0], root[1] - p[1]), why)

# a seated figure's root must not lie over a colliding table top (people.js stands him on the highest colliding surface
# under rays at X and X +- 0.12 from H + 1.2 m): a library chair sit keeps its root at the feet, which a table would
# otherwise lift onto its top. He moves the least that clears it, his seat with him.
for slug, x in EXTRA.items():
    if slug in CREW or x['kind'] in ('mapped', 'sacks'):
        continue
    p = spot(slug)
    hit = over_table(p, FIG[slug]['H'])
    if not hit:
        continue
    best = None
    floor_of = FIG[slug]['support'].split(': ')[-1] if FIG[slug]['support'].startswith(('upper floor', 'terrace floor')) else None
    fac_ = x['facing']
    angs = [fac_, fac_ + 180, fac_ + 90, fac_ - 90] + [fac_ + d for d in range(15, 360, 15) if d % 90]
    for k_ in range(1, 150):
        for ang in angs:
            q = (p[0] + math.cos(math.radians(ang)) * k_ * 0.01, p[1] + math.sin(math.radians(ang)) * k_ * 0.01)
            if floor_of and floor_of in E and poly_dist(q, [tuple(v[:2]) for v in E[floor_of]['footprint']]) > -0.3:
                continue                      # he stays on his raised floor
            if not over_table((q[0], q[1]), FIG[slug]['H']) and all(poly_dist((q[0] + dx, q[1]), furn_rect(hit[0])) > 0.05
                                                                for dx in (-0.12, 0.12)):
                best = q
                break
        if best:
            break
    if best:
        v = (best[0] - p[0], best[1] - p[1])
        _h = hips_of(x['model'], x['clip'])
        add_nudge(slug, v, f'his root (the {x["model"]}\'s {x["clip"]} stands it '
                           f'{"at the feet, " + format(math.hypot(*_h[:2]), ".2f") + " m from the hips" if math.hypot(*_h[:2]) > 0.1 else "under the hips"}) '
                           f'lay over {SLUG(hit[0])}\'s top, which collides and would lift him onto it: he and his seat move '
                           f'{math.hypot(*v):.2f} m clear of it')

# figures at the silk's edges: the walkable area's edge walls stand there (edge:south, edge:north); a body (0.26 m)
# keeps inside them
for s in FIG:
    if s in CREW or s in RIDE:
        continue
    p = spot(s)
    if poly_dist(p, AREA) <= -0.28:
        continue
    best = None
    for i_ in range(len(AREA)):
        a_, b_ = AREA[i_], AREA[(i_ + 1) % len(AREA)]
        d_ = seg_dist(p, a_, b_)
        if best is None or d_ < best[0]:
            ex, ey = b_[0] - a_[0], b_[1] - a_[1]
            n = math.hypot(ex, ey)
            nrm = (-ey / n, ex / n)
            cx, cy = sum(q[0] for q in AREA) / 4, sum(q[1] for q in AREA) / 4
            if (cx - a_[0]) * nrm[0] + (cy - a_[1]) * nrm[1] < 0:
                nrm = (-nrm[0], -nrm[1])
            best = (d_, nrm)
    mv = next(k_ * 0.01 for k_ in range(1, 200) if poly_dist((p[0] + best[1][0] * k_ * 0.01, p[1] + best[1][1] * k_ * 0.01), AREA) <= -0.28)
    add_nudge(s, (best[1][0] * mv, best[1][1] * mv), f'painted at the silk\'s edge, where the walkable area\'s edge wall '
                                                      f'stands: he steps {mv:.2f} m in, a body\'s width inside it')

# the builder's list: figures inside walls, counters or vehicles (gen/sections/canal/build/inside.json:
# [map id, owner, X, D, suggested fix]); each steps straight out of the owner's footprint (or by the builder's vector)
INSIDE_DONE, INSIDE_OPEN = [], []
DIRS = {'north': (0, 1), 'south': (0, -1), 'east': (1, 0), 'west': (-1, 0)}


def fix_vector(fix):
    """The builder's suggested fix as a vector: [dX, dD], or its text's "dX +0.15", "dD -0.3", else "nudge 0.3 m
    north-east"."""
    if isinstance(fix, (list, tuple)) and len(fix) == 2 and all(isinstance(v, (int, float)) for v in fix):
        return tuple(fix)
    t = str(fix or '')
    dx_, dd_ = re.search(r'dX ([+-]?[\d.]+)', t), re.search(r'dD ([+-]?[\d.]+)', t)
    if dx_ or dd_:
        return (float(dx_.group(1)) if dx_ else 0.0, float(dd_.group(1)) if dd_ else 0.0)
    m = re.search(r'nudge ([\d.]+) m ((?:north|south|east|west)(?:-(?:north|south|east|west))?)', t)
    if m:
        parts = [DIRS[w] for w in m.group(2).split('-')]
        v = (sum(q[0] for q in parts), sum(q[1] for q in parts))
        n = math.hypot(*v) or 1
        return (v[0] / n * float(m.group(1)), v[1] / n * float(m.group(1)))
    return None


for row in INSIDE if isinstance(INSIDE, list) else (INSIDE.get('rows') or INSIDE.get('figures') or []):
    try:
        mid, owner = row[0], row[1]
        fix = row[4] if len(row) > 4 else None
    except Exception:
        continue
    s = SLUG(mid)
    if s not in FIG or s in CREW:
        INSIDE_OPEN.append(f'{mid}: {owner} ({fix})' + (' (crew: the boats agent\'s)' if s in CREW else ''))
        continue
    v = fix_vector(fix)
    if not v:
        INSIDE_OPEN.append(f'{mid}: {owner} ({fix}): no fix to read')
        continue
    n = math.hypot(*v)
    have = NUDGE.get(s, ([0, 0],))[0]
    along = (have[0] * v[0] + have[1] * v[1]) / n if n else 0.0     # what this casting's nudges already give that way
    if along >= n - 0.02:
        INSIDE_OPEN.append(f'{mid}: {owner}: its fix ({fix}) is already given by this casting\'s nudge {have}')
        continue
    rest = ((n - max(0.0, along)) / n * v[0], (n - max(0.0, along)) / n * v[1])
    add_nudge(s, rest, f'the builder found him against {SLUG(owner) if owner.startswith("S2.") else owner} as built '
                       f'(gen/sections/canal/build/inside.json: {fix}): he steps {math.hypot(*rest):.2f} m by its fix')
    INSIDE_DONE.append(mid)

# figures whose painted foot lies in a closed building at real size (until the builder's inside.json lists its real
# walls): each steps out on the side it is painted (behind the house, over whose roof it shows)
CLOSED_OUT = {
    'head_over_roof_e_24867': ('S2.bld.scaffold_house_24975', 90, 'a head in a cap over the scaffold house\'s roof, its '
                               'body hidden: he stands behind the plain-walled house (north), as he shows over its roof'),
    'pole_porter_27193': ('S2.bld.low_shed_27245', 90, 'his legs hidden by the small shed\'s ridge in front of him: he '
                          'walks in the yard behind (north of) the low shed'),
}
for s, (bid, ang, why) in CLOSED_OUT.items():
    poly = dict(BLOCK)[bid]
    p = spot(s)
    if poly_dist(p, poly) < 0.3:
        d = (math.cos(math.radians(ang)), math.sin(math.radians(ang)))
        mv = next(k_ * 0.02 for k_ in range(1, 400) if poly_dist((p[0] + d[0] * k_ * 0.02, p[1] + d[1] * k_ * 0.02), poly) >= 0.35)
        add_nudge(s, (d[0] * mv, d[1] * mv), f'his foot point lies inside {SLUG(bid)}\'s mapped footprint: {why}; he '
                                             f'steps {mv:.2f} m out of it')

# ---------------------------------------------------------------- animals at real size
ANIMAL_WHY = {}
CAST_MOVES = {}       # recorded moves (gen/sections/canal/choices/cast.json): the team, whose harness the builder reads


def unmoved(slug):
    """An animal's map position without this casting's own recorded move."""
    e = ANIMALS[slug]
    m = MOVED.get(f'S2.ani.{slug}')
    return (e['pos'][0] - m.get('dX', 0), e['pos'][1] - m.get('dD', 0)) if m and m.get('by') == 'cast' else tuple(e['pos'][:2])


def free_of(poly, obst, margin=0.0):
    return not any(polys_overlap(poly, q) for _, q in obst)


# the mule cart's team, in harness (the builder's traces run from their collars to the cart's front): the lead mule
# stands ahead of the cart at real size, the traces' length clear of its front; the near mule beside it on the near
# (south) side, both at their painted headings. Painted far up the bank (0.5-0.85 of life), the cart (2.07 m between
# its painted ends), its two mules and the horse behind it don't fit at real size where they are painted.
TRACE_GAP = 0.85      # the lead mule's rump this far ahead of the cart's collider: the painted traces run 65-80 px
#                       from its hindquarters to the cart's front eyes (u 24265 -> 24330-24345), about 0.85-1.0 m
_lead_base, _near_base = unmoved('cart_mule_lead_24192'), unmoved('cart_mule_near_24215')
_lead0 = animal_body('cart_mule_lead_24192', ANIMAL_SPEC['cart_mule_lead_24192'], [0, 0], _lead_base)
_fa, _ = fwd_left(_lead0['ang'])
_hard = [(n, q) for n, q in BLOCK if n not in OPEN] + SOLID
_lead_mv = (0.0, 0.0)
for k_ in range(0, 81):
    v = (_fa[0] * 0.05 * k_, _fa[1] * 0.05 * k_)
    b = animal_body('cart_mule_lead_24192', ANIMAL_SPEC['cart_mule_lead_24192'], list(v), _lead_base)
    if not polys_overlap(rect(b['c'], b['ang'], b['hl'] + TRACE_GAP, b['hw']), CART['collider']) and free_of(b['poly'], _hard):
        _lead_mv = (round(v[0], 2), round(v[1], 2))
        break
_lead = animal_body('cart_mule_lead_24192', ANIMAL_SPEC['cart_mule_lead_24192'], list(_lead_mv), _lead_base)
_rump = (_lead['c'][0] - _fa[0] * _lead['hl'], _lead['c'][1] - _fa[1] * _lead['hl'])
_traces = rect((_rump[0] - _fa[0] * TRACE_GAP / 2, _rump[1] - _fa[1] * TRACE_GAP / 2), _lead['ang'], TRACE_GAP / 2, 0.45)


def near_cost(v):
    b = animal_body('cart_mule_near_24215', ANIMAL_SPEC['cart_mule_near_24215'], list(v), _near_base)
    A = rect(b['c'], b['ang'], b['hl'] + 0.08, b['hw'] + 0.08)
    pen = 0.0
    if polys_overlap(A, _lead['poly']):
        pen += 100
    for name, poly in VEH + _hard:
        if polys_overlap(A, poly):
            pen += 100
    for s_ in FIG:
        if s_ in CREW or s_ in WALK or s_ in HAUL or FIG[s_]['H'] > 0.5 or s_ == 'carter_24218':
            continue
        if poly_dist(spot(s_), A) < 0.3:
            pen += 50
    if b['c'][1] > _lead['c'][1] - 0.2:       # the near one stays on the near (south) side, as painted
        pen += 30
    if polys_overlap(A, _traces):             # beside the lead mule, not across its traces to the cart
        pen += 100
    if water_dist(b['c']) < b['hl'] + 0.3:    # and on the bank, clear of its top
        pen += 100
    return pen + v[0] ** 2 + v[1] ** 2


_best = min(((near_cost((dx * 0.1, dd * 0.1)), (round(dx * 0.1, 2), round(dd * 0.1, 2)))
             for dx in range(-30, 21) for dd in range(-30, 11)), key=lambda x: x[0])
_near_mv = _best[1]
TEAM_MOVE = {'cart_mule_lead_24192': _lead_mv, 'cart_mule_near_24215': _near_mv}
if math.hypot(*_lead_mv) > 0.01:
    CAST_MOVES['S2.ani.cart_mule_lead_24192'] = {
        'dX': _lead_mv[0], 'dD': _lead_mv[1], 'by': 'cast',
        'why': (f'the mule cart\'s team at real size (map/BUILDING.md rule 5): the cart (kit sizes, make_people.py CART_KIT: '
                f'a {CART_KIT["bed_len"]} m bed round its painted wheel, painted 2.07 m between its ends) reaches '
                f'{math.dist(CART["P"](CART["bx1"], 0), E["S2.veh.mule_cart_24305"]["pts"]["front"][:2]):.2f} m past its '
                f'painted front, and the lead mule (2.09 m long, painted 0.96) stood in it; it steps '
                f'{math.hypot(*_lead_mv):.2f} m forward along its own heading (west, as painted, pulling), so its rump '
                f'stands {TRACE_GAP} m ahead of the cart, the painted traces\' run; the carter at its far side goes with it '
                f'(people.json nudge); the builder\'s harness reads the moved hooves')}
if math.hypot(*_near_mv) > 0.01:
    CAST_MOVES['S2.ani.cart_mule_near_24215'] = {
        'dX': _near_mv[0], 'dD': _near_mv[1], 'by': 'cast',
        'why': ('the mule cart\'s team at real size (map/BUILDING.md rule 5): the near mule is painted 0.18 m from the lead '
                'mule, turned toward the viewer and foreshortened (its long axis runs north-south), its hindquarters behind '
                'the lead mule\'s flank; at the registry mule\'s size (2.09 m long, 0.55 m across the collar) the two stood '
                'inside each other. With the lead mule ahead of the cart, the near mule steps the least that frees it '
                f'({math.hypot(*_near_mv):.2f} m, searched on a 0.1 m grid) on its painted near (south) side at its painted '
                'heading, clear of the lead mule, the cart, the buildings, the bank top and the people round it; the '
                'builder\'s harness reads the moved hooves')}
BODY = {s: animal_body(s, sp) for s, sp in ANIMAL_SPEC.items()}
for s in TEAM:
    BODY[s] = animal_body(s, ANIMAL_SPEC[s], list(TEAM_MOVE[s]), unmoved(s))
# free animals whose real-size bodies overlap another animal, a vehicle, a closed building or a solid prop: the least
# move that frees them, along their own heading first (their painted heading and group kept), else a small one aside
FREE_ANIMALS = ('horse_24565', 'horse_feeding_26072', 'donkey_26098', 'donkey_26872', 'donkey_dark_28921')
for a in FREE_ANIMALS:
    sp = ANIMAL_SPEC[a]
    obst = _hard + VEH + [(f'animal {b}', BODY[b]['poly']) for b in BODY if b != a and BODY[b]['H'] < 1]
    b0 = animal_body(a, sp)
    hits = [SLUG(n) if n.startswith('S2.') else n for n, poly in obst if polys_overlap(b0['poly'], poly)]
    if not hits:
        continue
    fa, la = fwd_left(b0['ang'])
    done = None
    for k_ in range(1, 41):
        for sg in (-1, 1):
            v = (sg * fa[0] * 0.05 * k_, sg * fa[1] * 0.05 * k_)
            if free_of(animal_body(a, sp, v)['poly'], obst):
                done = (v, f'{0.05 * k_:.2f} m {"back" if sg < 0 else "forward"} along its own heading')
                break
        if done:
            break
    if not done or math.hypot(*done[0]) > 0.5:     # a small step aside can be less than a long one along
        best = None
        for i in range(-20, 21):
            for j in range(-20, 21):
                v = (fa[0] * 0.05 * i + la[0] * 0.05 * j, fa[1] * 0.05 * i + la[1] * 0.05 * j)
                cost = (0.05 * i) ** 2 + 4 * (0.05 * j) ** 2
                if (best is None or cost < best[0]) and free_of(animal_body(a, sp, v)['poly'], obst):
                    best = (cost, v, i, j)
        if best and (not done or best[0] < math.hypot(*done[0]) ** 2):
            done = (best[1], f'{abs(best[2]) * 0.05:.2f} m {"back" if best[2] < 0 else "forward"} along its heading and '
                             f'{abs(best[3]) * 0.05:.2f} m to its {"left" if best[3] > 0 else "right"}')
    if done:
        sp['nudge'] = [round(done[0][0], 2), round(done[0][1], 2)]
        BODY[a] = animal_body(a, sp)
        ANIMAL_WHY[a] = (f'at real size ({2 * b0["hl"]:.2f} m long against its painted {ANIMALS[a].get("length_m", 0):.2f} '
                         f'm) its body ran into {", ".join(hits)}: it steps {done[1]}, the least that frees it, keeping its '
                         f'painted heading and its place in its group')
    else:
        ANIMAL_WHY[a] = f'at real size its body runs into {", ".join(hits)}; no move within 1 m frees it'
# figures held to an animal go with it: the carter at the lead mule's far side, the man holding the horse's bridle
FOLLOW = {'carter_24218': 'cart_mule_lead_24192', 'man_at_horse_head_24506': 'horse_24565'}
for s, a in FOLLOW.items():
    v = TEAM_MOVE.get(a) or ANIMAL_SPEC[a].get('nudge')
    if v and math.hypot(*v) > 0.01:
        add_nudge(s, v, f'painted holding {"the lead mule" if a in TEAM else "the saddled horse"} '
                        f'({"leaning over its far side" if a in TEAM else "its lowered head at his chest"}): he goes with '
                        f'it, {math.hypot(*v):.2f} m ({"its recorded move" if a in TEAM else "its nudge"})')

ANIMAL_NAMES = {'horse_24565': 'the saddled horse', 'cart_mule_lead_24192': 'the lead mule',
                'cart_mule_near_24215': 'the near mule', 'horse_feeding_26072': 'the feeding horse',
                'donkey_26098': 'the donkey under the stall shed', 'donkey_26872': 'the ridden donkey',
                'donkey_dark_28921': 'the dark donkey'}


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


ON_MAPPED_SEAT = {s for s, x in EXTRA.items() if x['kind'] in ('mapped', 'sacks')}
for s in FIG:
    if s in CREW or s in WALK or s in RIDE or s in HAUL or s in ON_MAPPED_SEAT:
        continue
    for a, b in BODY.items():
        if b['H'] >= 1:
            continue
        r = push_off(s, b)
        if r:
            (vx, vy), part, m = r
            add_nudge(s, (vx, vy), f'painted against {ANIMAL_NAMES.get(a, a)} ({ANIMAL_SPEC[a]["model"]}, '
                      f'{2 * b["hl"]:.2f} m long and {2 * b["hw"]:.2f} m wide at real size), his spot fell inside its '
                      f'body: he steps {m:.2f} m straight out from its {part}, on the side he is painted')

# ---------------------------------------------------------------- figures out of vehicles, furniture and props
EXPECTED = {   # painted so: the figure belongs inside or against it
    ('cart_loader_24345', 'S2.veh.mule_cart_24305'): 'standing on the cart\'s bed (cart bed H 0.91)',
    ('barrow_pusher_25532', 'S2.veh.barrow_crates_25598'): 'at the barrow\'s handles',
    ('barrow_puller_25607', 'S2.veh.barrow_crates_25598'): 'between the barrow\'s shafts',
    ('man_behind_tub_27538', 'S2.prop.tub_27532'): 'behind the tub, only his head shows over it',
}
SEATED_FIXED = set(SEAT)
UNDER_EAVE = {   # painted under a roof's edge: inside the mapped footprint's eave, outside its walls (the builder's
    #              check_inside() lists figures inside its real walls: none)
    ('figure_under_eave_20625', 'S2.bld.south_bank_hall_21050'): 'painted between the dark tree and the hall\'s west '
                                                                  'eave, under it; the hall is built as its roof',
    ('crouching_man_by_timber_21880', 'S2.bld.thatched_shed_south_21600'): 'painted crouching under the slanting '
                                                                            'timber at the thatched roof\'s edge',
}


def step_out(s, name, poly, need=0.3):
    p = spot(s)
    best = None
    for i_ in range(len(poly)):
        a_, b_ = poly[i_], poly[(i_ + 1) % len(poly)]
        ex, ey = b_[0] - a_[0], b_[1] - a_[1]
        n = math.hypot(ex, ey) or 1
        for nx, ny in ((ey / n, -ex / n), (-ey / n, ex / n)):
            for mv in [k_ * 0.02 for k_ in range(1, 120)]:
                q = (p[0] + nx * mv, p[1] + ny * mv)
                if poly_dist(q, poly) >= need:
                    if best is None or mv < best[0]:
                        best = (mv, (nx * mv, ny * mv))
                    break
    return best


for s in FIG:
    if s in WALK or s in SEATED_FIXED or s in CREW or s in RIDE or FIG[s]['H'] > 0.5:
        continue
    for name, poly in VEH + SOLID:
        if (s, name) in EXPECTED:
            continue
        dd = poly_dist(spot(s), poly)
        if dd >= 0.3:
            continue
        best = step_out(s, name, poly)
        if best:
            what_ = ('at the kit\'s real size (make_people.py CART_KIT and the barrow\'s, choices until the builder\'s '
                     'are read)' if name.startswith('S2.veh') else 'at the builder\'s size' if name in FURN_BUILT
                     else 'at its real size (choice until the builder says)')
            add_nudge(s, best[1], f'his spot lies {"inside" if dd < 0 else "within 0.3 m of"} {SLUG(name)} {what_}: '
                                  f'he steps {best[0]:.2f} m straight out of it')
    for name, c, r in DISCS:
        if (s, name) in EXPECTED:
            continue
        p = spot(s)
        d = math.dist(p, c) - r
        if d < 0.2:
            v = (p[0] - c[0], p[1] - c[1])
            n = math.hypot(*v) or 1
            mv = 0.2 - d
            add_nudge(s, (v[0] / n * mv, v[1] / n * mv), f'his spot is {max(0.0, r + d):.2f} m from the centre of '
                      f'{SLUG(name)} ({r:.2f} m in radius at real size): he steps {mv:.2f} m out from it')

# the barrow's pusher at its handles (the painted rear: the handles' tips), its puller between the shafts' ends
for s_, at_s, why_ in (('barrow_pusher_25532', -0.3, 'bent over the barrow\'s west end, his hands on its handles: he '
                        'stands 0.3 m behind the handles\' tips (the painted rear point)'),
                       ('barrow_puller_25607', BARROW_B['L'], 'standing between the barrow\'s shafts at its east end, '
                        'pulling: at the real-size barrow\'s shaft ends')):
    q = BARROW_B['P'](at_s, 0.0)
    if math.dist(q, spot(s_)) > 0.05:
        add_nudge(s_, (q[0] - spot(s_)[0], q[1] - spot(s_)[1]),
                  f'painted {why_} (the barrow as the builder makes it, {BARROW_B["L"]:.1f} m from its painted rear along '
                  f'its heading: the painted 0.72 m is the far row\'s foreshortening)')

# the man on the cart bed: inside the bed at real size (people.js stands him on its collider top, cart bed H 0.91)
_cl = 'cart_loader_24345'
if CART_KIT.get('loader_in'):      # open_cart's `.bed`: the top of the bed's free front, loader_in from its front edge
    q = CART['P'](CART['bx1'] - CART_KIT['loader_in'], 0.0)
    if math.dist(q, spot(_cl)) > 0.03:
        add_nudge(_cl, (q[0] - spot(_cl)[0], q[1] - spot(_cl)[1]),
                  f'painted standing on the cart\'s bed front handling its load; the cart as {CART_FROM} builds it (bed '
                  f'{CART_KIT["bed_len"]} x {CART_KIT["bed_w"]} m round its painted wheel, the load over all but its '
                  f'front {0.6} m) has its free bed {CART_KIT["loader_in"]} m in from the front edge, where the kit '
                  f'stands the painted loader (its `.bed`, the collider\'s top at 0.91 m): he stands there')
elif not inside(spot(_cl), CART['bed']):
    q = min((CART['P'](s_, t_) for s_ in [CART['bx0'] + 0.15 + i * 0.05 for i in range(int((CART['bed_len'] if 'bed_len' in CART else CART_KIT['bed_len']) / 0.05))]
             for t_ in [(-CART['hw'] + 0.15) + j * 0.05 for j in range(int((2 * CART['hw'] - 0.3) / 0.05) + 1)]
             if inside(CART['P'](s_, t_), CART['bed'])), key=lambda q: math.dist(q, spot(_cl)))
    add_nudge(_cl, (q[0] - spot(_cl)[0], q[1] - spot(_cl)[1]),
              f'painted standing on the cart\'s bed front handling its load; at the cart\'s real size (bed '
              f'{CART_KIT["bed_len"]} x {CART_KIT["bed_w"]} m round its painted wheel, choice until the builder\'s) his '
              f'foot point lies off the bed: he steps onto its nearest point')

# ---------------------------------------------------------------- walks
BODY_R = 0.26        # people.js: everyone is a 0.26 m cylinder
WALKING = set(WALKERS)


def standing_people(exclude=()):
    return {s: spot(s) for s in FIG if s not in WALKING and s not in CREW and s not in exclude
            and s not in HAUL and FIG[s]['H'] < 0.5}


def clearance(p, me=None, slope_ok=False):
    d, who = -poly_dist(p, AREA), 'the painted area\'s edge'
    dw = water_dist(p, slope_ok)
    if dw < d:
        d, who = dw, ('the river (its built shore)' if slope_ok else 'the bank top (the river\'s slope beyond)')
    for name, poly in BLOCK + VEH + SOLID + SEATS_P + HULLS + [(f'animal {s}', b['poly']) for s, b in BODY.items() if b['H'] < 1]:
        dd = poly_dist(p, poly)
        if dd < d:
            d, who = dd, SLUG(name) if name.startswith('S2.') else name
    for name, c, r in DISCS:
        dd = math.hypot(p[0] - c[0], p[1] - c[1]) - r
        if dd < d:
            d, who = dd, SLUG(name)
    for s, q in standing_people(exclude=(me,)).items():
        dd = math.hypot(p[0] - q[0], p[1] - q[1]) - BODY_R
        if dd < d:
            d, who = dd, f'figure {s}'
    return d, who


def run_from(o, d, limit, me, slope_ok=False):
    best, stop = 0.0, ''
    for i in range(1, 200):
        s_ = i * 0.05
        if s_ > limit:
            break
        c, who = clearance((o[0] + d[0] * s_, o[1] + d[1] * s_), me=me, slope_ok=slope_ok)
        if c < BODY_R + 0.04:
            stop = who
            break
        best = s_
    return best, stop


SLOPE_WALK = {'bank_porter_28355', 'sack_porter_bank_edge_24467'}   # painted on the bank slope: may walk to the shore


def walk_path(slug):
    o = spot(slug)
    fac = facing_of(slug)
    a = math.radians(fac)
    d = (math.cos(a), math.sin(a))
    sl = slug in SLOPE_WALK
    c0, who0 = clearance(o, me=slug, slope_ok=sl)
    if c0 < BODY_R + 0.04:
        return [[round(o[0], 2), round(o[1], 2)], [round(o[0], 2), round(o[1], 2)]], 0.0, f'no room at his spot ({who0})'
    fwd, stop = run_from(o, d, WALK_LEN, slug, sl)
    back, bstop = run_from(o, (-d[0], -d[1]), WALK_LEN - fwd, slug, sl)
    path = [[round(o[0] - d[0] * back, 2), round(o[1] - d[1] * back, 2)],
            [round(o[0] + d[0] * fwd, 2), round(o[1] + d[1] * fwd, 2)]]
    why = (f'{fwd:.1f} m along his painted facing ({fac} deg)' + (f' to {stop}' if stop else '')
           + (f', and {back:.1f} m back behind his spot' + (f' to {bstop}' if bstop else '') if back > 0.05 else ''))
    return path, fwd + back, why


WALK_STAND = {}
WALK_PATHS = {}
for s in WALKERS:
    o = spot(s)
    if clearance(o, me=s, slope_ok=s in SLOPE_WALK)[0] < BODY_R + 0.04:   # no room where he is painted: he starts
        a_ = math.radians(facing_of(s))                                    # the least way along his painted direction
        for k_ in range(1, 61):
            for sg in (1, -1):
                q = (o[0] + sg * math.cos(a_) * k_ * 0.05, o[1] + sg * math.sin(a_) * k_ * 0.05)
                c_, who_ = clearance(q, me=s, slope_ok=s in SLOPE_WALK)
                if c_ >= BODY_R + 0.06:
                    add_nudge(s, (q[0] - o[0], q[1] - o[1]), f'painted where a walker has no room at real size '
                              f'({clearance(o, me=s, slope_ok=s in SLOPE_WALK)[1]}'
                              + (f'; on the bank slope he walks no lower than {SLOPE_FLOOR:.2f} of the way down to the '
                                 f'water, H -0.45, his painted H being -0.35' if s in SLOPE_WALK else '')
                              + f'): his walk starts {k_ * 0.05:.2f} m {"on" if sg > 0 else "back"} along his painted '
                              f'direction')
                    break
            else:
                continue
            break
    path, length, why = walk_path(s)
    if length < MIN_WALK:
        WALK_STAND[s] = (length, why)
        WALKING.discard(s)
    else:
        WALK_PATHS[s] = (path, length, why)

# ---------------------------------------------------------------- bodies closer than people.js allows
ANCHORED = {s for s, x in EXTRA.items() if x['kind'] in ('mapped', 'sacks')} | set(RIDE) | {'cart_loader_24345'}


def body_r(s):
    return BODY_R * min(1.0, scale_of.get(s, 1.0))


for it in range(80):
    moved = False
    pts = {s: spot(s) for s in FIG if s not in WALKING and s not in CREW and s not in RIDE and s not in HAUL}
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
            pts = {s: spot(s) for s in FIG if s not in WALKING and s not in CREW and s not in RIDE and s not in HAUL}
    if not moved:
        break

# ---------------------------------------------------------------- the boats block (the boats agent's) and the haulers
BOATS = json.loads(json.dumps(BOATS_PEOPLE.get('boats') or {}))
HAUL_CLIPS = {}
hauled = {h for b in BOATS.values() for h in (b.get('haul') or {})}
for s in HAUL:
    model = MODEL[s][0]
    walk = next((c for c in HAUL_WALK.split('|') if cand_ok(model, c)), 'walk')
    if walk != HAUL_WALK.split('|')[0]:
        want(HAUL_WALK.split('|')[0], CAST[s][0], s)
    stand = STEPS[s][0][0]
    HAUL_CLIPS[s] = (walk, stand)
for b in BOATS.values():
    for h, job in (b.get('haul') or {}).items():
        if h in HAUL_CLIPS:
            job['walk'], job['stand'] = HAUL_CLIPS[h]
crew_listed = {c for b in BOATS.values() for c in (b.get('crew') or {})}
WORKING = {c for b in BOATS.values() for c, j in (b.get('crew') or {}).items() if (j or {}).get('work')}
UNHOSTED = sorted(s for s in CREW if s not in HOSTED_BY_SUPPORT and s not in crew_listed)
for s, v in (BOATS_PEOPLE.get('crew_nudges') or BOATS_PEOPLE.get('nudges') or {}).items():   # the boats agent's
    if s in FIG and isinstance(v, dict) and v.get('nudge'):
        NUDGE[s] = ([round(v['nudge'][0], 2), round(v['nudge'][1], 2)], 'the boats agent\'s crew check: ' + v.get('why', ''))

# ---------------------------------------------------------------- people.json
props_note = {}


PROPS_MISSING = {}    # figure -> props its painted action wants that its playing character can't show yet


def props_for(slug, model, clips, step_props):
    on = []
    for p in step_props:
        if f'prop_{p}' in glb_parts(model) and PROPS.get(model, {}).get(p, {}).get('clip') in clips:
            on.append(p)
            props_note[slug] = f'{p}: on ({model}, held in {PROPS[model][p]["clip"]})'
    for p in [x for x in CAST[slug][4].split(',') if x]:        # worn: on whenever the GLB has it
        if f'prop_{p}' in glb_parts(model):
            on.append(p)
            props_note[slug] = (props_note.get(slug, '') + '; ' if slug in props_note else '') + f'{p}: on ({model}, worn)'
        else:
            props_note[slug] = (props_note.get(slug, '') + '; ' if slug in props_note else '') + f'{p}: off ({model} has no prop_{p} yet)'
    first = (WALK[slug][0] if slug in WALK else STEPS0[slug][0][0][0]).split('|')[0].split('+')
    want_ = [p for p in first[1:] + [x for x in CAST[slug][4].split(',') if x] if p not in on]
    if want_:
        PROPS_MISSING[slug] = (first[0], want_)
    return on or None


people = {
    'about': 'Who the canal wharves\' (S2) people and animals are and what they do: every painted figure and animal of '
             'S2 (map/text/S2.md, u 20500-29050) at its mapped spot (layout.json, with its recorded moves), and nobody '
             'else (map/BUILDING.md). Written by gen/sections/canal/make_people.py (the casting of '
             'gen/expand/canal_needs.md, from the 22 existing characters, at real sizes); rerun it after a layout move, a '
             'build (its inside.json), the boats agent\'s boats_people.json or a workshop delivery. figures: character '
             '(the character the figure is made for: the catalogue\'s new characters (boatman, grain_porter, '
             'straw_hat, tracker, dark_hat, youth: gen/expand/round2/catalogue.md 1b) are played by their stand_in, the '
             'needs list\'s cast, until each is made; a figure whose painted pose its character can\'t keep yet is '
             'played by the nearest look that can: cast_why), do = [clip, seconds] cycles with clips the playing character has (clips_why, wanted: what is '
             'still to make), nudge = [dX, dD] (nudge_why), facing_deg where the map gives none (facing_why), scale for '
             'children (scale_why), props = carried prop_<name> parts (props_why), ride (the rider on her donkey). Crew '
             'stand on their boats by their layout support (boat deck:/boat roof:) or the boats block\'s crew, at '
             'their layout spots (which carry their boats\' moves), never nudged here. boats: the boats agent\'s '
             '(gen/sections/canal/boats_people.json: motion, crew work, haul, tow), copied unchanged except the '
             'trackers\' haul clips (walk/stand), which are the casting\'s. walkers: figures painted mid-stride or '
             'carrying a load, walking along their painted direction and back (walkers_why). animals: each painted '
             'animal at its map position facing hind to fore, model and load from web/public/assets/animals/animals.json '
             '(animals_why). Seats the map lacks: gen/sections/canal/seats.json, for the builder. No traffic.',
    'figures': {}, 'nudge_why': {}, 'walkers': [], 'walkers_why': {}, 'animals': {}, 'animals_why': {},
    'clips_why': {}, 'scale_why': {}, 'facing_why': {}, 'cast_why': {}, 'props_why': {}, 'wanted': {},
    'builder_notes': {},
}
if BOATS:
    people['boats'] = BOATS
    people['boats_why'] = {**(BOATS_PEOPLE.get('why') or {}),
                           'casting': 'copied from gen/sections/canal/boats_people.json (the boats agent\'s) by '
                                      'make_people.py; the haul entries\' walk and stand clips are the casting\'s (each '
                                      'tracker\'s walk the take tow_walk when his character has it, else walk; his stand, '
                                      'leaning into the rope while the boat waits, push, else hold_rope, else idle)'}

for s, (r, ref, why) in CHILD.items():
    h_ref = scale_ref(ref)
    m = MODEL[s][0]
    people['scale_why'][s] = (f'painted about {r} of {why}: {r} x {h_ref:.2f} m / the {m} model\'s {height(m):.2f} m = '
                              f'{scale_of[s]} ({scale_of[s] * height(m):.2f} m tall)')
people['scale_why']['about'] = ('people.js scale multiplies the playing character\'s own height, so each child\'s '
                                'painted ratio to the adult beside it (the needs list\'s "scale about", a fraction of that '
                                'adult) becomes a scale of the child model (skill characters)')

for slug in sorted(FIG, key=lambda s: (FIG[s]['X'], s)):
    dress = CAST[slug][0]
    model, how = MODEL[slug]
    char, stand_in = char_field(slug)
    if slug in WALKING:
        path, length, why = WALK_PATHS[slug]
        w = {'id': slug, 'figure': slug, 'character': char}
        if stand_in:
            w['stand_in'] = stand_in
        cands = WALK[slug][0].split('|')
        pick = next((c for c in cands if cand_ok(model, c)), 'walk')
        clip, *pp = pick.split('+')
        first = cands[0].split('+')[0]
        if clip != first:
            want(first, FUTURE.get(slug) or dress, slug)
        pr = props_for(slug, model, [clip], pp)
        if pr:
            w['props'] = pr
        w.update({'clip': clip, 'speed': WALK_SPEED.get(clip, 1.0), 'pause': ['idle', 3], 'path': path})
        if slug in scale_of:
            w['scale'] = scale_of[slug]
        if slug in NUDGE and math.hypot(*NUDGE[slug][0]) > 0.005:
            w['nudge'] = NUDGE[slug][0]
            people['nudge_why'][slug] = NUDGE[slug][1]
        people['walkers'].append(w)
        people['walkers_why'][slug] = why + (f'; playing {pick} ({model})' if pick != 'walk' else f'; plain walk ({model}: '
                                              f'{first} with its load not made yet)')
        continue
    if slug in WALK_STAND:
        ln, why = WALK_STAND[slug]
        people['walkers_why'][slug] = (f'painted walking or carrying, but there is room for only {ln:.1f} m along his '
                                       f'painted way ({why}): he stands at his spot (skill characters: a painted walker '
                                       f'with no room stands)')
    spec = {'character': char}
    if stand_in:
        spec['stand_in'] = stand_in
    spec['do'] = STEPS[slug]
    pr = props_for(slug, model, [x[0] for x in spec['do']], STEP_PROPS[slug])
    if pr:
        spec['props'] = pr
    if slug in scale_of:
        spec['scale'] = scale_of[slug]
    if slug in RIDE:
        spec['ride'] = RIDE[slug]
    if slug in FACING:
        spec['facing_deg'] = FACING[slug][0]
        people['facing_why'][slug] = FACING[slug][1]
    if slug in NUDGE and math.hypot(*NUDGE[slug][0]) > 0.005:
        spec['nudge'] = NUDGE[slug][0]
        people['nudge_why'][slug] = NUDGE[slug][1]
    people['figures'][slug] = spec
people['walkers_why']['held'] = {
    'barrow': 'barrow_pusher_25532 and barrow_puller_25607 are painted walking with the crate barrow, which is built '
              'standing: they stay at its handles and shafts (the needs list: they walk only if the barrow is made to move)',
    'trackers': 'the five trackers walk with 逆水行舟 (the boats agent\'s haul: they go out and back along its travel, '
                'their walk clip while it moves, their stand while it waits); without the boats block they stand at their '
                'painted spots playing their stand',
    'rider': 'rider_26832 rides the donkey, which stands facing 王家纸马铺\'s signboard as painted',
}

cw = {}
def keys_txt(s):
    ks = key_cands(STEPS0[s]) if s not in WALK else [c for c in WALK[s][0].split('|') if c.split('+')[0] != 'walk']
    return '/'.join(dict.fromkeys(c.split('+')[0] for c in ks))


for s in FIG:
    dress = CAST[s][0]
    fut = FUTURE.get(s)
    model, how = MODEL[s]
    if fut and not made(fut):
        cw[s] = (f'{fut} (not made yet; {FUTURE_WHY[fut].split(":")[0]}) is his character; '
                 + (f'the needs list\'s {dress} stands in' if model == dress else
                    f'the workshop\'s recolour {model} (the needs list\'s {dress}, recoloured for {fut}: catalogue 2e) '
                    f'stands in' if model == INTERIM.get(fut) else
                    f'the needs list casts {dress}, who has no {keys_txt(s)} yet: {model} stands in, the nearest look '
                    f'that keeps the painted {FIG[s]["pose"]} pose'))
    elif how == 'recast':
        base = fut if fut else dress
        cw[s] = (f'{base} is his look ({"the catalogue" if fut else "the needs list"}), played by {model} until {base} '
                 f'has {keys_txt(s)}: the painted pose ({FIG[s]["pose"]}) needs it')
for s, why in CLIP_WHY.items():
    played = {c for c, _ in (people['figures'].get(s) or {}).get('do', [])}
    need = CLIP_WHY_WHEN.get(s)
    if need and not (need & played):
        continue
    cw[s] = (cw[s] + '; ' if s in cw else '') + why
people['cast_why'] = {**cw, 'about': (
    'by dress (needs list "Casting"): short jackets and trousers are the idler, the porter or the carter (the carter '
    'for some crew, so the idler doesn\'t play 40), long light robes with a dark cap the scholar, a light robe without a '
    'cap the robed man, dark long robes the townsman, the inspector or the fortune-teller, wide hats the hat traveller, '
    'the apron the butcher, the bearded grain owner and shopkeeper the storyteller; faint figures the camel driver and '
    'the carter. The catalogue\'s new characters (gen/expand/round2/catalogue.md 1b) are cast as `character` with the '
    'needs list\'s cast (or a pose-keeping look) as `stand_in` until each is made: ' +
    '; '.join(f'{c} {sum(1 for s in FUTURE.values() if s == c)}' for c in FUTURE_WHY) + '. Here: who plays a figure '
    'other than its character, and why')}
people['props_why'] = dict(props_note)
def prop_text(p):
    return PROP_NEW.get(p) or PROP_NEW.get(p.rsplit('_', 1)[0]) or ''


people['props_why']['wanted'] = {s: f'{", ".join(ps)} with {clip} ({MODEL[s][0]} or its character has none bound '
                                    f'to it yet){": " + prop_text(ps[0]) if prop_text(ps[0]) else ""}'
                                 for s, (clip, ps) in sorted(PROPS_MISSING.items())}
people['props_why']['about'] = ('carried props as painted (needs list "Props carried by figures"), switched on only '
                                'when the playing character\'s GLB has prop_<name> bound to a clip the figure plays '
                                '(characters/props.json); worn ones (the straw cape, the veiled hat) whenever the GLB has '
                                'them: never a carry clip without its load, never a prop in the wrong hands')

for s, sp in ANIMAL_SPEC.items():
    people['animals'][s] = {k: v for k, v in sp.items()}
people['animals_why'] = {
    'models': 'species as painted (map/text/S2.md, needs list "Animals"): the mule cart\'s two mules (no horns, slim '
              'bodies, long heads: t5 and the merge), the saddled horse behind the cart, the dark horse or mule feeding '
              'on the far street, the donkey under the stall shed, the hooded rider\'s donkey, the dark donkey at '
              '望楼饭铺, two small dark birds in the great willow',
    'team': 'the cart\'s two mules stand in their collars (the registry mule\'s collar carries the trace points, '
            'harness.trace_l/r, source tack_collar) at their hoof headings (facing_deg written out: the builder\'s '
            'harness reads the same hooves); the lead mule grazes head low, the near one has its head lowered between '
            'its forelegs (graze); none walks. The near mule\'s real-size move is a recorded move '
            '(gen/sections/canal/choices/cast.json), so the harness follows it',
    'loads': 'the mules the collar; the horse behind the cart the saddle (painted: a dark saddle-cloth or pad hanging at '
             'its withers, no rider); the ridden donkey the saddle cloth; the rest nothing',
    'fallbacks': {
        'horse_24565': 'painted with a plain dark cloth or pad at the withers and no seat; the registry horse has only '
                       'its saddle, so it wears the saddle until a pad variant exists (S4b asked for the same)',
        'horse_feeding_26072': 'painted DARK (a horse or mule): the pale registry horse until a dark coat (body_from '
                               'horse + tone, free) exists',
        'donkey_dark_28921': 'painted DARK: the grey-dun donkey until a dark tone variant exists (free)',
        'cart_mule_near_24215': 'painted darker than the lead mule: the registry mule (dark brown) as is',
        **ANIMAL_WHY_FALLBACK,
    },
    'doing': 'the mules graze head low in their collars; the saddled horse holds its head low at the chest of the man at '
             'its head (head_low); the feeding horse grazes (head to the ground or a trough); the donkeys stand (the '
             'dark donkey\'s head held high toward the man holding its lead); the birds perch',
    'perched': 'the two birds sit in S2.tree.willow_great_21345\'s whips over the water, 10.47 m up (the frame\'s '
               '`perched` support: the layout H), each facing hind to fore as painted',
    'nudges': dict(ANIMAL_WHY),
}

# clips_why
cwh = {}
for clip, by in sorted(wanted.items()):
    for c, slugs in sorted(by.items()):
        now = sorted({people['figures'][s]['do'][0][0] for s in slugs if s in people['figures']} |
                     {w['clip'] for w in people['walkers'] if w['id'] in slugs})
        plan = set(J(f'characters/{c}.json', {}).get('clips', {})) if made(c) else set()
        state = ('with the character' if not made(c) else 'being made' if clip in plan else 'NEW' if clip in NEW
                 else 'to make')
        cwh.setdefault(clip, []).append(f'{c} [{state}]: {", ".join(slugs)}' + (f' (plays {"/".join(now)} now)' if now else ''))
people['clips_why'] = {
    'about': 'Actions the painting needs that the playing character lacks. "to make": a free local retarget '
             '(t2m:/from:, tools/retarget_local.mjs) onto that character; "NEW": a new Text to Motion take (10 credits, '
             'the needs list\'s ranking); "being made": already in characters/<name>.json; "with the character": the '
             'boatman\'s own clips when he is made. Rerun make_people.py when they land; until then each figure plays '
             'the nearest clip its playing character has.',
    **{clip: f'{NEW.get(clip) or FREE.get(clip, "")} -- ' + '; '.join(v) for clip, v in cwh.items()},
}

# ---------------------------------------------------------------- seats.json
seats = {'about': (
    'Seats of the figures painted seated (map/BUILDING.md rule 3: the seat of a figure painted seated is part of it), '
    'for the area builder, written by gen/sections/canal/make_people.py from the layout, the builder\'s real sizes (when '
    'it says them) and the playing clip (rerun after a layout move or a build). Keys are figure map IDs. X, D: the '
    'seat\'s centre, under the hips (build it there, not a step behind); H: the height it stands on (its support: the '
    'ground 0, the terrace floor 0, 沿河雅座\'s upper floor 1.3, a deck or roof); seat_h: its top above H (0: the figure '
    'sits on the support itself); facing_deg: the way the figure faces (0 = east, 90 = north); root: [X, D, H] where '
    'people.js stands the figure (its nudged spot) and the height of the surface it must find there (people.js drops '
    'rays from the layout H + 1.2 m at X and X +- 0.12 and stands on the highest colliding hit, so no colliding table '
    'top may lie under them); kind: what the builder adds ("stool": kit_inner_city.stool; "folding_seat": '
    'kit_canal.folding_seat, the hall\'s folding seats; "sacks": the mapped sack pile\'s top at seat_h under the hips, '
    'kc.sack_pile(seat=True), no collider; "none": nothing, the seat is a mapped bench or stool, the floor, the ground '
    'or the boat); what: prefixed by what holds it ("stool:", "folding seat:", "sacks:", "bench:", "ground:", "floor:", '
    '"boat deck:", "boat roof:"); build: what the builder adds; clip: who plays it, with what. "footings": hidden '
    'blocks a standing figure needs (not seats).')}
seat_rows = []
for slug, x in EXTRA.items():
    f = FIG[slug]
    sup = f['support']
    root = spot(slug) if slug not in CREW else (f['X'], f['D'])
    # a seat the map lacks goes with its sitter's later nudges (a table top, the silk's edge, a neighbour)
    seat_now = x['seat'] if x['kind'] in ('mapped', 'sacks') or slug in CREW else \
        (x['seat'][0] + root[0] - x['root'][0], x['seat'][1] + root[1] - x['root'][1])
    k_ = scale_of.get(slug, 1.0)
    if slug in CREW:
        pre = 'boat roof' if 'roof' in sup else 'boat deck'
        H, seat_h, kind = f['H'], 0.0, 'none'
        if x['clip'] in SEATED_CLIPS:
            what = f'{pre}: {CREW_CHAIR.get(slug, "the boat kit has no seat here: the chair sit sits on air (a boat factory item)")}; {x["model"]} {x["clip"]}'
        else:
            what = f'{pre}: {x["where"]} ({sup}); {"a floor sit" if x["clip"] in FLOOR_CLIPS else "no sit"} ({x["model"]} {x["clip"]})'
        build = 'nothing: the boat kit\'s deck/roof collider grounds him (boats.js), and he rides with the boat'
    elif x['kind'] == 'mapped':
        fu = FURN.get(x['what'], {})
        H, seat_h, kind = f['H'], round(fu.get('ht', 0.45), 2), 'none'
        what = f'{fu.get("kind", "bench")}: {SLUG(x["what"])} (mapped), {x["where"]}'
        build = f'nothing: {x["what"]} is the seat (the builder\'s, {fu.get("ht", 0.45):.2f} m high)'
    elif x['kind'] == 'sacks':
        H, seat_h, kind = f['H'], round(x['seat_h'], 2), 'sacks'
        what = f'sacks: {x["what"]} (mapped), {x["where"]}; its top under his hips at {seat_h} m'
        build = (f'kc.sack_pile(..., seat=True) for {x["what"]} with a level top at {seat_h} m above the ground under X, D '
                 f'(the {x["model"]}\'s {x["clip"]} puts the hips {x["seat_h"]:.2f} m above the soles), no collider there '
                 f'(people.js then stands him on the ground and the clip lifts his hips onto the top)')
    elif x['clip'] in FLOOR_CLIPS or not x['seated']:
        H, seat_h, kind = f['H'], 0.0, 'none'
        pre = 'floor' if 'floor' in sup else 'ground'
        what = f'{pre}: {x["where"]}; a floor sit ({x["model"]} {x["clip"]})'
        build = 'nothing: he sits on the ' + ('floor' if pre == 'floor' else 'ground') + ' itself'
    else:
        H = f['H']
        lo, hi = (0.42, 0.55) if k_ >= 0.99 else (0.2, 0.55)
        seat_h = round(min(hi, max(lo, x['seat_h'])), 2)
        kind = 'folding_seat' if x['what'] == 'folding_seat' else 'stool'
        seat_txt = "a 交杌 (the hall's own folding seats)" if kind == 'folding_seat' else 'a stool 0.32 m square'
        what = (f'{"folding seat" if kind == "folding_seat" else "stool"}: {x["where"]}; choice: {seat_txt}, its '
                f'top {seat_h} m (the {x["model"]}\'s {x["clip"]} puts the hips {x["seat_h"]:.2f} m above the soles'
                f'{", scaled with the child" if k_ < 0.99 else ""})')
        build = (f'kc.folding_seat(X, D, {H}, facing_deg, rng, h={seat_h}) inside {f["map_id"]}' if kind == 'folding_seat'
                 else f'a stool (kit_inner_city.stool, h {seat_h}, s 0.32) centred on X, D, inside {f["map_id"]}')
    seats[f['map_id']] = {
        'X': round(seat_now[0], 2), 'D': round(seat_now[1], 2), 'H': round(H, 2), 'facing_deg': round(x['facing'] % 360, 1),
        'seat_h': seat_h, 'kind': kind, 'what': what, 'build': build, 'support': sup,
        'root': [round(root[0], 2), round(root[1], 2), round(f['H'], 2)], 'clip': f'{x["model"]} {x["clip"]}',
    }
    seat_rows.append((slug, kind, what))
# footings: the man in the river stands waist-deep (painted from the waist up in the open water, nothing under him)
_mr = FIG['man_in_river_20970']
_waist = 0.55 * height(MODEL['man_in_river_20970'][0])
seats['footings'] = {
    _mr['map_id']: {
        'X': _mr['X'], 'D': _mr['D'], 'top_H': round(_mr['H'] - _waist, 2), 'size': [0.5, 0.5],
        'what': (f'water: a hidden block under the man standing waist-deep in the river, its top {_waist:.2f} m under the '
                 f'water (H {_mr["H"]}): his waist ({MODEL["man_in_river_20970"][0]}, {height(MODEL["man_in_river_20970"][0])} m '
                 f'tall) at the surface, as painted; never a boat'),
        'build': ('a hidden collider block 0.5 m square, its top at top_H, inside the figure\'s entity (the river bed may '
                  'be deeper there): people.js drops him from H + 1.2 onto the highest colliding surface, and the water '
                  'strip doesn\'t collide'),
    }}
# the details pass's seat fits (sections/canal/contact_fixes.json "seats"; gen/details/contacts/fix_standard.md rule 3:
# a stool's or bench's top at the sitter's seat point less 0.005-0.01, centred under it, measured on the page's own
# placement by gen/details/contacts/fix_river/tools/seat_fit.mjs): per figure map ID, the seat's centre X, D and its
# top's height top_H (map H), and for a mapped bench or sack pile the owner whose top the builder fits ("fit_owner")
import sys as _sys
_sys.path.insert(0, os.path.join(QM, 'tools'))
from contact_fixes import load as _load_contact_fixes
for _mid, _sf in (_load_contact_fixes('canal').get('seats') or {}).items():
    if _mid not in seats:
        print(f'seat fit: {_mid} has no seat in seats.json (skipped)')
        continue
    _e = seats[_mid]
    for _k in ('X', 'D', 'top_H', 'base_H', 'fit_owner'):
        if _k in _sf:
            _e[_k] = _sf[_k]
    if 'top_H' in _sf:
        _e['seat_h_cast'] = _e.get('seat_h')
        _e['fit_why'] = _sf.get('why', '')
json.dump(seats, open(os.path.join(HERE, 'seats.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- cast.json (the casting's recorded moves)
frag_path = os.path.join(HERE, 'choices/cast.json')
frag = json.load(open(frag_path, encoding='utf-8')) if os.path.exists(frag_path) else {}
new_moves = {k: {kk: vv for kk, vv in v.items()} for k, v in CAST_MOVES.items()}
frag_new = {'owner': 'cast', 'moves': new_moves, 'how': {}, 'unbuilt': {}, 'edges': {}, 'boats': {}}
MOVES_CHANGED = (frag.get('moves') or {}) != new_moves
if MOVES_CHANGED:
    json.dump(frag_new, open(frag_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- the wish list (for the area agent and the lead)
people['wanted'] = {
    'about': 'What S2 would take from the catalogue, each with the figures (map ID slugs) it is for; nothing here is '
             'needed to show the section (every figure is cast and acts). This script switches to each by itself when '
             'characters.json / animals.json has it.',
    'characters': {
        **{c: f'{FUTURE_WHY[c]} -- ' + ', '.join(sorted(s for s, x in FUTURE.items() if x == c)) + ' ('
              + ('made' if made(c) else 'not made: their stand_in plays') + ')' for c in FUTURE_WHY},
    },
    'actions_new': {k: NEW[k] + ' -- ' + ', '.join(sorted({s for c in wanted.get(k, {}).values() for s in c}))
                    for k in NEW if k in wanted},
    'actions_free': {k: v for k, v in people['clips_why'].items() if k != 'about' and k not in NEW},
    'props': people['props_why']['wanted'],
    'animals': {
        'girth_cloth': 'tack on the horse: a plain dark pad at the withers (horse_24565; catalogue 2c)',
        'horse_dark': 'body_from horse + a dark bay tone (horse_feeding_26072; catalogue 2c)',
        'donkey_dark': 'body_from donkey + a near-black tone (donkey_dark_28921; catalogue 2c)',
        'halter': 'tack on the donkey: a halter, its lead rope the builder\'s line to the head (donkey_dark_28921)',
    },
}

# ---------------------------------------------------------------- builder notes (what the casting assumes of the build)
tbl_hits = []
for s in people['figures']:
    if s in CREW:
        continue
    p = spot(s)
    for k in TABLE_H:
        poly = furn_rect(k)
        if abs(E[k].get('H', 0) - FIG[s]['H']) > 0.3:
            continue
        if any(inside((p[0] + dx, p[1]), poly) for dx in (-0.12, 0, 0.12)):
            tbl_hits.append(f'{s} (root {p[0]:.2f}, {p[1]:.2f}) over {SLUG(k)}')
people['builder_notes'] = {
    'about': 'What this casting assumes of blender/canal_scene.py and the boats, and what it found. Furniture sizes are '
             'the builder\'s when make_people.py can read them (table/bench/stool/chair/folding_seat("S2.prop.…", …) '
             'calls in canal_scene.py, or gen/sections/canal/build/furniture.json {eid: {kind, L, W, yaw, ht}}), else '
             'its defaults (furn_default).',
    'furniture_read': f'{len(FURN_BUILT)} pieces read from the builder' if FURN_BUILT else
                      'none read yet (canal_scene.py has no recognisable furniture calls, no furniture.json): defaults',
    'seats_json': 'seats.json X, D is the seat\'s centre under the hips: build each stool or folding seat there; the '
                  'grain owner\'s sack pile needs its level top at seats.json seat_h under his hips (kind "sacks"); '
                  '"footings" lists the hidden block under the man standing waist-deep in the river',
    'table_tops': 'people.js stands a figure on the highest colliding surface under rays at X and X +- 0.12 from H + '
                  '1.2 m; roots over a table top at these sizes: ' + ('; '.join(tbl_hits) if tbl_hits else 'none'),
    'cart': f'the mule cart as {CART_FROM} builds it (bed {CART_KIT["bed_len"]} x {CART_KIT["bed_w"]:.2f} m centred on '
            f'its painted wheel, its collider the track + 0.12 m to each side); the loader stands on its bed (cart bed '
            f'H 0.91: the bed\'s collider top); the lead mule\'s rump {TRACE_GAP} m ahead of the bed (between the '
            f'shafts), both mules moved as recorded (cast.json), so the harness the builder hangs on their hooves follows',
    'stick_bundle': 'man_with_sticks_bank_24390\'s bundle of upright sticks stands on the ground beside him: part of the '
                    'figure\'s what (needs list), so the builder builds it inside his map ID (no carried prop)',
    'crew_supports': ('boats.js host() and loyalty_check read only "boat deck: <id>" and "boat roof: <id>": these crew '
                      'stand on other boat supports and are hosted only when the boats block lists them under its '
                      '`crew`: ' + (', '.join(f'{s} ({FIG[s]["support"]})' for s in UNHOSTED) if UNHOSTED else 'all listed')),
}
# the details pass's contact fixes (sections/canal/contact_fixes.json: solved nudges and turns, recasts, IK clip
# variants, root_h; gen/details/contacts/fix_standard.md) are applied last
import sys
sys.path.insert(0, os.path.join(QM, 'tools'))
from contact_fixes import apply as apply_contact_fixes
apply_contact_fixes(people, 'canal')
# an animal a figure holds plays one clip (contact_fixes.json "animals": its do, with the reason): the details pass's
# hand-on-animal targets sit where its body stays put through that clip (fix-river, gen/details/contacts/fix_river/)
for _a, _af in (_load_contact_fixes('canal').get('animals') or {}).items():
    if _a in people['animals']:
        for _k in ('do', 'facing_deg'):
            if _k in _af:
                people['animals'][_a][_k] = _af[_k]
        people['animals_why'][_a] = (_af.get('why', '') + (' || casting: ' + people['animals_why'][_a]
                                                           if people['animals_why'].get(_a) else ''))
out = os.path.join(QM, 'sections/canal/people.json')
json.dump(people, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- notes for the area agent (generated)
def md_table(rows, head):
    return '\n'.join(['| ' + ' | '.join(head) + ' |', '|' + '---|' * len(head)] + ['| ' + ' | '.join(str(c) for c in r) + ' |' for r in rows])


cast_count = Counter()
crew_count = Counter()
for s in FIG:
    model = MODEL[s][0]
    cast_count[model] += 1
    if s in CREW:
        crew_count[model] += 1
dress_count = Counter(CAST[s][0] for s in FIG)
notes = [
    '# S2 casting (the casting agent, Run 2): people, animals, seats',
    '',
    'Generated by `gen/sections/canal/make_people.py` (rerun it; never edit this file by hand). It writes '
    '`sections/canal/people.json`, `gen/sections/canal/seats.json` and, for animals the builder\'s harness reads, '
    '`gen/sections/canal/choices/cast.json` (recorded moves).',
    '',
    f'**Numbers:** {len(people["figures"])} figures at their spots and {len(people["walkers"])} walkers ({len(people["figures"]) + len(people["walkers"])} '
    f'of {len(FIG)} painted figures), {len(people["animals"])} animals (of {len(ANIMALS)}), {len(CREW)} figures on boats '
    f'({N_BOATMAN} of them crew cast as the boatman, played by stand-ins), '
    f'{len(HAUL)} trackers hauling with 逆水行舟, {len(SEAT)} seated figures; {len(set(MODEL[s][0] for s in FIG))} '
    f'characters play. Boats block: {"copied from boats_people.json (" + str(len(BOATS)) + " boats)" if BOATS else "not yet (boats_people.json missing)"}.',
    '',
    '## The cast (who plays; needs list dress in brackets where it differs)',
    '',
    md_table([(c, n, crew_count.get(c, 0), dress_count.get(c, 0)) for c, n in cast_count.most_common()],
             ['character playing', 'figures', 'on boats', 'needs list (dress)']),
    '',
    '## Stand-ins and recasts',
    '',
] + [f'- `{s}`: {v}' for s, v in sorted(cw.items())] + [
    '',
    '## Clips that stand in for missing takes',
    '',
] + [f'- **{k}**: {v}' for k, v in people['clips_why'].items() if k != 'about'] + [
    '',
    '## Children',
    '',
] + [f'- `{s}`: scale {scale_of[s]} ({people["scale_why"][s]})' for s in CHILD] + [
    '',
    '## Walkers',
    '',
] + [f'- `{w["id"]}` ({w["character"]}{"/" + w["stand_in"] if w.get("stand_in") else ""}): {w["clip"]}'
     f'{" + " + ", ".join(w["props"]) if w.get("props") else ""}, {math.dist(*w["path"]):.1f} m; '
     f'{people["walkers_why"][w["id"]]}' for w in people['walkers']] + \
    [f'- `{s}` stands: {people["walkers_why"][s]}' for s in WALK_STAND] + [
    f'- trackers: ' + ', '.join(f'`{s}` walk {HAUL_CLIPS[s][0]}, stand {HAUL_CLIPS[s][1]}' for s in sorted(HAUL)) +
    (' (in the boats block\'s haul)' if hauled else ' (no boats block yet: they stand)'),
    '',
    '## Animals',
    '',
] + [f'- `{s}`: {sp["model"]}{" + " + sp["load"] if sp.get("load") else ""}, {sp["do"]}'
     f'{", facing " + str(sp["facing_deg"]) if sp.get("facing_deg") is not None else ""}'
     f'{", nudge " + str(sp["nudge"]) if sp.get("nudge") else ""}' for s, sp in ANIMAL_SPEC.items()] + \
    [f'- recorded move `{k}`: dX {v["dX"]}, dD {v["dD"]}: {v["why"]}' for k, v in CAST_MOVES.items()] + \
    [f'- {k}: {v}' for k, v in people['animals_why']['fallbacks'].items()] + [
    '',
    '## Seats (seats.json)',
    '',
] + [f'- `{s}`: {k}; {w}' for s, k, w in seat_rows] + [
    '',
    '## Nudges',
    '',
] + [f'- `{s}` {v[0]}: {v[1]}' for s, v in sorted(NUDGE.items()) if math.hypot(*v[0]) > 0.005] + [
    '',
    '## Waiting on others',
    '',
    '- the workshop\'s new characters (catalogue 1b): ' + ', '.join(f'{c} {sum(1 for x in FUTURE.values() if x == c)}'
                                                         f'{" (made)" if made(c) else ""}' for c in FUTURE_WHY) + ';',
    '- the takes, ranked: ' + '; '.join(f'{k} ({len({s for c in wanted.get(k, {}).values() for s in c})})' for k in NEW if k in wanted) + ';',
    '- the free clips: ' + ', '.join(k for k in people['clips_view'] ) if False else
    '- the free clips (local retargets): ' + ', '.join(sorted(k for k in wanted if k not in NEW)) + ';',
    '- props still to bind or make: ' + ('; '.join(f'{s} ({", ".join(ps)} with {c})' for s, (c, ps) in sorted(PROPS_MISSING.items()))
                                         or 'none') + ';',
    '- animals: a horse pad, a dark horse coat, a dark donkey coat;',
    f'- the builder: furniture sizes ({len(FURN_BUILT)} read), inside.json ({len(INSIDE_DONE)} applied, '
    f'{len(INSIDE_OPEN)} open), the sack pile\'s top, the folding seats, the man in the river\'s footing;',
    f'- the boats agent: boats_people.json ({"in" if BOATS else "missing"}); crew on other boat supports not hosted: '
    + (', '.join(UNHOSTED) if UNHOSTED else 'none') + '.',
]
os.makedirs(os.path.join(HERE, 'cast'), exist_ok=True)
open(os.path.join(HERE, 'cast/notes_cast.md'), 'w', encoding='utf-8').write('\n'.join(notes) + '\n')

# ---------------------------------------------------------------- checks
nf, nw = len(people['figures']), len(people['walkers'])
print(f'{nf} figures at their spots, {nw} walkers ({nf + nw} of {len(FIG)}), {len(people["animals"])} animals '
      f'(of {len(ANIMALS)}); crew {len(CREW)} ({N_BOATMAN} boatman), stand-ins '
      f'{sum(1 for f in people["figures"].values() if f.get("stand_in"))}, recast {sum(1 for s in FIG if MODEL[s][1] == "recast")}; '
      f'furniture read from the builder: {len(FURN_BUILT)}; boats block: {len(BOATS)} boats')
print('playing:', dict(cast_count.most_common()))
for w in people['walkers']:
    print(f'  walk {w["id"]}: {w["clip"]} {math.dist(*w["path"]):.1f} m {w["path"]}  {people["walkers_why"][w["id"]]}')
for s, (ln, why) in WALK_STAND.items():
    print(f'  stands {s}: {ln:.1f} m of room ({why})')
pos = {s: spot(s) for s in FIG if s not in WALKING}
issues, expected = [], []
ids = sorted(pos)
for i, a in enumerate(ids):
    for b in ids[i + 1:]:
        if (a in CREW) != (b in CREW) or (a in RIDE or b in RIDE):
            continue
        if a in CREW and FIG[a]['support'] != FIG[b]['support']:
            continue
        if WORKING & {a, b}:                  # the page stands sweep and oar crew at the bar or grip, spread along it
            continue
        d = math.dist(pos[a], pos[b])
        if d < body_r(a) + body_r(b) - 0.03 and abs(FIG[a]['H'] - FIG[b]['H']) < 0.3:
            issues.append(f'figures {a} and {b} {d:.2f} m apart' + (' (crew: placed by the boats page; the boats agent\'s crew check)' if a in CREW else ''))
for s in ids:
    if s in CREW or s in RIDE or FIG[s]['H'] > 0.5:
        continue
    p = pos[s]
    for a, b in BODY.items():
        if b['H'] < 1 and poly_dist(p, b['poly']) < 0.15 and s not in HAUL:
            issues.append(f'figure {s} {poly_dist(p, b["poly"]):+.2f} m from animal {a}')
    for name, poly in BLOCK:
        dd = poly_dist(p, poly)
        if dd < 0.1:
            ok_ = name in OPEN or (s, name) in UNDER_EAVE
            (expected if ok_ else issues).append(f'figure {s} {dd:+.2f} m from {SLUG(name)}' + (
                ' (open: painted in it)' if name in OPEN else f' ({UNDER_EAVE[(s, name)]})' if ok_ else ''))
    for name, poly in VEH + SOLID:
        dd = poly_dist(p, poly)
        if dd < 0.1:
            (expected if (s, name) in EXPECTED or s in SEATED_FIXED else issues).append(f'figure {s} {dd:+.2f} m from {SLUG(name)}')
    for name, c, r in DISCS:
        dd = math.dist(p, c) - r
        if dd < 0.05:
            (expected if (s, name) in EXPECTED else issues).append(f'figure {s} {dd:+.2f} m from {SLUG(name)}')
    if poly_dist(p, AREA) > -0.26:
        issues.append(f'figure {s} {poly_dist(p, AREA):+.2f} m from the painted area\'s edge (outside if +)')
    for name, poly in HULLS:
        if poly_dist(p, poly) < 0.0:
            issues.append(f'figure {s} ({FIG[s]["support"]}) inside {SLUG(name)}\'s hull as built (the boats agent\'s)')
    if FIG[s]['support'] == 'ground' and water_dist(p) < 0.2:
        issues.append(f'figure {s} {water_dist(p):+.2f} m from the bank top (the river beyond)')
for w in people['walkers']:
    for q in w['path']:
        if water_dist(q, w['id'] in SLOPE_WALK) < 0.25:
            issues.append(f'walker {w["id"]} path end {q} {water_dist(q, w["id"] in SLOPE_WALK):+.2f} m from the river')
an = sorted(BODY)
for i, a in enumerate(an):
    for b in an[i + 1:]:
        if BODY[a]['H'] < 1 and BODY[b]['H'] < 1 and polys_overlap(BODY[a]['poly'], BODY[b]['poly']):
            issues.append(f'animals {a} and {b} overlap (real size)')
    for name, poly in BLOCK + VEH + SOLID:
        if BODY[a]['H'] < 1 and name not in OPEN and polys_overlap(BODY[a]['poly'], poly):
            (expected if a in TEAM and 'mule_cart' in name else issues).append(f'animal {a} overlaps {SLUG(name)} (real size)')
# faces along the street: the same character playing within 2.5 m of another standing on the ground
faces = []
gr = sorted((s for s in FIG if s not in CREW and FIG[s]['H'] < 0.5), key=lambda s: pos.get(s, spot(s))[0])
for i, a in enumerate(gr):
    for b in gr[i + 1:]:
        pa, pb = (pos.get(a) or spot(a)), (pos.get(b) or spot(b))
        if pb[0] - pa[0] > 2.5:
            break
        if MODEL[a][0] == MODEL[b][0] and math.dist(pa, pb) < 2.5:
            faces.append(f'{MODEL[a][0]}: {a} / {b} {math.dist(pa, pb):.1f} m')
print('expected (painted so):', len(expected))
for x in expected:
    print('   ', x)
print('checks:', 'none' if not issues else '')
for x in issues:
    print('   ', x)
print('same face within 2.5 m:', len(faces))
for x in faces:
    print('   ', x)
print('table tops under roots:', tbl_hits or 'none')
print('nudges:', sum(1 for v in NUDGE.values() if math.hypot(*v[0]) > 0.005), ' animal nudges:',
      {m: ANIMAL_SPEC[m].get('nudge') for m in ANIMAL_SPEC if ANIMAL_SPEC[m].get('nudge')}, ' recorded moves:',
      {k: (v['dX'], v['dD']) for k, v in CAST_MOVES.items()}, '(cast.json ' + ('CHANGED: run merge_choices.py, '
      'map_layout.mjs S2, then this again)' if MOVES_CHANGED else 'unchanged)'))
print('inside.json:', len(INSIDE_DONE), 'applied;', INSIDE_OPEN or 'none open')
print('crew on boat supports boats.js does not host (need the boats block\'s crew):', UNHOSTED or 'none')
print('to make (free):', ', '.join(sorted(k for k in wanted if k not in NEW)))
print('NEW takes:', ', '.join(k for k in NEW if k in wanted))
print('props:', json.dumps(props_note, ensure_ascii=False))
print('seats.json:', len(seats) - 2, 'seats;', 'wrote', os.path.relpath(out, QM))
if _hips_dirty:
    json.dump(_hips_cache, open(HIPS_CACHE, 'w', encoding='utf-8'), indent=1, sort_keys=True)
    print('probed:', ', '.join(f'{k} {tuple(_hips_cache[k]["hips"])}' for k in _hips_dirty))
