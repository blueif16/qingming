#!/usr/bin/env python3
"""Writes sections/rainbow_bridge/people.json and gen/sections/rainbow_bridge/seats.json: every painted figure (232) and
every painted animal (9) of S3, the Rainbow Bridge (u 15500-20500, map/text/S3.md), at its mapped spot
(sections/rainbow_bridge/layout.json, read on every run: it carries the recorded moves of the bridge fit, the river, the
props and the builder), doing what it is painted doing, and nobody else (map/BUILDING.md). The cast is data,
gen/sections/rainbow_bridge/cast.json (the needs list's casting, gen/expand/rainbow_bridge_needs.md, updated to the
catalogue, gen/expand/round2/catalogue.md); this script only applies it, at the kits' real sizes:

- each figure plays the clip its painted action (cast.json `act`, after the new take it waits for, `take`) maps to
  through the ALIAS chain below: the first clip the playing character has today (web/public/assets/chars/
  characters.json); what is still wanted goes to clips_why and wanted (free retargets, NEW takes, new characters);
- a new character the catalogue orders (1b: the boatman, straw_hat, dark_hat, tracker, youth, groom, grain_porter) is
  played by its stand_in until characters.json lists it, then by itself with no edit here; a figure painted seated,
  crouching or riding whose character can't take that posture yet is played by cast.json `recast` until it can;
- carried props: each painted prop as the first of its GLB parts (PROP_VARIANTS, the workshop's names; then the loads
  that stand in for it, PROP_STANDIN) that the playing character has, placed in a clip the figure plays (characters.json
  props); never a carry clip without its load;
- walkers (cast.json `walk`): a short path along the painted direction and back, cut at buildings, vehicles (front to
  rear + 0.6 m, +-1.0 m), animals' bodies, ground props (+0.3 m), trees, the water, the bridge's ramps and the painted
  area's edge; on the bridge along the built deck's centre line, inside its railings. The bridge is the kit's own fit
  (blender/kit_rainbow_bridge.py plan_only with gen/sections/rainbow_bridge/bridge_params.json), the deck the builder
  builds. people.js starts a walker at y 0 (its first ground ray from 1.5 m): a deck walker above WALK_GROUND_MAX_H stands
  until the page takes a start height (WALKER_START_H, detected in web/src);
- animals (cast.json `animals`): the catalogue's tone, tack and clip variants (2c) once animals.json has them; painted
  walking with nobody riding or leading it, a short path; slid along its heading off buildings, vehicles, props and the
  men working at a vehicle;
- nudges, each with its reason: seated figures onto their seats (the clips' probed hip offsets, HIPS), railing leaners
  to the near railing (RAIL_GAP, facing out over it), the handcart's puller to its shaft tips, the sedan's bearers to its
  poles, everyone inside the railings, the painted area and out of buildings (unless painted inside: cast.json
  `inside`), vehicles, props, tables and animals' bodies, apart from each other; crew onto their real-size hulls
  (build_choices.json boats) and apart (web/src/boats.js host applies the nudge; sweep and oar crew stand at their bar);
- crews' work (sweep, the trackers' haul, the tow line, each boat's run) is the river agent's
  gen/sections/rainbow_bridge/people_boats.json, merged into people.json `boats` (the trackers' walk/stand clips set
  here); seats the map lacks go to seats.json for the builder.

Every check is printed. Rerun after any layout move (merge_choices.py + map_layout.mjs S3), when people_boats.json,
the props table, the bridge params or river_plan.json change, or when the workshop delivers (characters, clips, props,
animal variants; gen/expand/round2/workshop_progress.md):
    python3 gen/sections/rainbow_bridge/make_people.py
"""
import json
import math
import os
import re
import struct
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
QM = os.path.abspath(os.path.join(HERE, '../../..'))
FOLDER, S = 'rainbow_bridge', 'S3'


def J(p, default=None):
    full = os.path.join(QM, p)
    if default is not None and not os.path.exists(full):
        return default
    return json.load(open(full, encoding='utf-8'))


def opt(p):
    full = os.path.join(QM, p)
    return json.load(open(full, encoding='utf-8')) if os.path.exists(full) else None


L = J(f'sections/{FOLDER}/layout.json')
FRAME = J(f'map/frames/{S}.json')
CAST = J(f'gen/sections/{FOLDER}/cast.json')
CF, CA = CAST['figures'], CAST['animals']
REG = J('web/public/assets/chars/characters.json')
ANI = J('web/public/assets/animals/animals.json')
PROPS = J('characters/props.json')
for _m, _c in REG.items():   # the registry's own props {name: clip} win over props.json
    if isinstance(_c, dict):
        for _n, _clip in (_c.get('props') or {}).items():
            PROPS.setdefault(_m, {})[_n] = {**PROPS.get(_m, {}).get(_n, {}), 'clip': _clip}
CHOICES = J(f'sections/{FOLDER}/build_choices.json', {})
PROPS_TABLE = opt(f'gen/sections/{FOLDER}/props_table.json')
BRIDGE_PARAMS = opt(f'gen/sections/{FOLDER}/bridge_params.json') or {}
BRIDGE_PLAN = opt(f'gen/sections/{FOLDER}/bridge_plan.json')
PEOPLE_BOATS = opt(f'gen/sections/{FOLDER}/people_boats.json')
BOATS_MAN = opt(f'gen/sections/{FOLDER}/web_build/{FOLDER}_boats.json') or opt(f'web/public/assets/{FOLDER}/boats.json')
PAGE_SRC = open(os.path.join(QM, 'web/src/people.js'), encoding='utf-8').read() + \
    open(os.path.join(QM, 'web/src/world.js'), encoding='utf-8').read()
# people.js grounds a walker's first step with a ray from its root's y + 1.5 m, and a new walker's root is at y 0: a
# walker that starts on the deck above about 1.3 m lands under the bridge. Walkers above that height walk only once the
# page passes a start height (proposed: world.js startAt [X, D, H], addWalker sets root.y = startAt[2]).
WALKER_START_H = bool(re.search(r'startAt\??\.?\[2\]|startH\b|start_h\b', PAGE_SRC))
WALK_GROUND_MAX_H = 1.3

FIG = {f['id']: f for f in L['figures']}
E = L['entities']
ANIMALS = {k.split('.')[-1]: e for k, e in E.items() if e['kind'] == 'animal'}
BOATS = {k.split('.')[-1]: e for k, e in E.items() if e['kind'] == 'vehicle' and k.split('.')[-1].startswith('boat_')}
assert set(CF) == set(FIG), f'cast.json vs layout: missing {sorted(set(FIG) - set(CF))}, extra {sorted(set(CF) - set(FIG))}'
assert set(CA) == set(ANIMALS), f'cast.json animals vs layout: {sorted(set(CA) ^ set(ANIMALS))}'


def glb_parts(c, _cache={}):
    """Names of the optional prop_<name> parts in a character's web GLB."""
    if c not in REG:
        return set()
    if c not in _cache:
        b = open(os.path.join(QM, 'web/public', REG[c]['file']), 'rb').read()
        n = struct.unpack('<I', b[12:16])[0]
        j = json.loads(b[20:20 + n])
        _cache[c] = {x.get('name', '') for x in j.get('nodes', []) + j.get('meshes', []) if x.get('name', '').startswith('prop_')}
    return _cache[c]


def _not_to_use():
    """Takes the workshop's review marked NOT TO USE (gen/expand/round2/workshop_progress.md), unless a later line of it
    passes the take again (a retake): the casting falls back down the chain to the stand-in clip it names."""
    import re
    try:
        txt = open(os.path.join(QM, 'gen/expand/round2/workshop_progress.md'), encoding='utf-8').read()
    except OSError:
        return set()
    last = {}
    for m in re.finditer(r'\*\*(NOT TO USE|PASS) `([a-z_0-9]+)`', txt):
        last[m.group(2)] = m.group(1)
    return {k for k, v in last.items() if v == 'NOT TO USE'}


NOT_TO_USE = _not_to_use()


def clips(c):
    return set(REG.get(c, {}).get('clips', [])) - NOT_TO_USE


def height(c):
    return REG[c]['height_m']


# ---------------------------------------------------------------- what each painted action plays (the ALIAS chain)
# The painted action first (the needs list's clip, or the new take it waits for), then the nearest clips, all of the
# same posture (a seated figure never stands up, a figure at the railing never walks away); 'idle' ends standing chains.
ALIAS = {
    'idle': ['idle'], 'look': ['look', 'crane', 'idle'], 'crane': ['crane', 'look', 'idle'],
    'talk': ['talk', 'chat', 'argue', 'point', 'idle'], 'chat': ['chat', 'talk', 'idle'],
    'point': ['point', 'argue', 'hail', 'talk', 'idle'], 'argue': ['argue', 'point', 'talk', 'idle'],
    'lunge_arms_wide': ['lunge_arms_wide', 'argue', 'point', 'idle'],
    'hail': ['hail', 'point', 'talk', 'idle'], 'wave_arms': ['wave_arms', 'hail', 'point', 'idle'],
    'bow': ['bow', 'bend_goods', 'lean_over', 'idle'],
    'lean_chin': ['lean_chin', 'lean_over', 'crane', 'look', 'idle'],
    'lean_over': ['lean_over', 'lean_chin', 'bend_goods', 'crane', 'idle'],
    'reach_over_rail': ['reach_over_rail', 'lean_over', 'lean_chin', 'crane', 'idle'],
    'throw_rope': ['throw_rope', 'reach', 'lean_over', 'point', 'idle'],
    'bend_goods': ['bend_goods', 'lean_over', 'browse', 'push_flank', 'idle'],
    'browse': ['browse', 'bend_goods', 'lean_over', 'idle'],
    'reach': ['reach', 'browse', 'point', 'idle'], 'hand_over': ['hand_over', 'talk', 'idle'],
    'arms_folded': ['arms_folded', 'lean_wall', 'idle'], 'tie_kerchief': ['tie_kerchief', 'look', 'idle'],
    'hold_tray': ['hold_tray', 'idle'], 'stand_pole': ['stand_pole', 'idle'],
    'push': ['push', 'push_flank', 'lean_over', 'idle'], 'push_flank': ['push_flank', 'push', 'lean_over', 'idle'],
    'steer': ['steer', 'push', 'push_flank', 'idle'],
    'pole_boat': ['pole_boat', 'stand_pole', 'push', 'lean_over', 'idle'],
    'work_sweep': ['work_sweep', 'push', 'push_flank', 'idle'],
    'tow_walk': ['tow_walk', 'push', 'walk'],
    'fend_pole': ['fend_pole', 'stand_pole', 'push', 'idle'],
    'haul_line': ['haul_line', 'hold_rope', 'bridle', 'push_flank', 'idle'],
    'hold_rope': ['hold_rope', 'bridle', 'idle'], 'bridle': ['bridle', 'hold_rope', 'push_flank', 'idle'],
    'hold_horse_neck': ['hold_horse_neck', 'bridle', 'push_flank', 'idle'],
    'sedan_carry': ['sedan_carry', 'stand_pole', 'idle'],
    # crouching and floor sits
    'crouch': ['crouch', 'squat_sleeves', 'sit_one_knee', 'sit_floor'],
    'squat_sleeves': ['squat_sleeves', 'crouch', 'sit_one_knee', 'sit_floor'],
    'sit_floor': ['sit_floor', 'sit_one_knee', 'knees_up', 'squat_sleeves', 'crouch'],
    'sit_one_knee': ['sit_one_knee', 'sit_floor', 'knees_up', 'squat_sleeves', 'crouch'],
    'lie_wave': ['lie_wave', 'sleep_side', 'sit_one_knee', 'sit_floor', 'knees_up'],
    'sleep_side': ['sleep_side', 'kneel_sleep', 'sit_one_knee', 'sit_floor', 'knees_up'],
    # chair sits
    'sit': ['sit', 'listen', 'drink', 'sit_talk', 'tell_fortune', 'write'],
    'drink': ['drink', 'sit', 'listen', 'sit_talk', 'tell_fortune'],
    'sit_talk': ['sit_talk', 'tell_fortune', 'drink', 'sit', 'listen'],
    'sit_listen': ['listen', 'sit', 'drink'], 'listen': ['listen', 'sit', 'drink'],
    'tell_fortune': ['tell_fortune', 'sit_talk', 'sit', 'listen'],
    'ride': ['ride'],
}
POSTURE = {}
for _c in ('sit', 'drink', 'sit_talk', 'sit_listen', 'listen', 'write', 'tell_fortune'):
    POSTURE[_c] = 'chair'
for _c in ('sit_floor', 'sit_one_knee', 'knees_up', 'sleep_side', 'kneel_sleep', 'doze_knees', 'lie_wave'):
    POSTURE[_c] = 'floor'
for _c in ('crouch', 'squat_sleeves'):
    POSTURE[_c] = 'crouch'
POSTURE['ride'] = 'ride'
SAME = {'chair': {'chair'}, 'floor': {'floor', 'crouch'}, 'crouch': {'crouch', 'floor'}, 'ride': {'ride'}}
# what each wanted clip is: "free" = a local retarget (tools/retarget_local.mjs, from:/t2m:); NEW = a Text to Motion take
WANT = {
    'look': 'Long Breathe and Look Around (free: from:townsman/look)', 'crane': 'leaning forward to see (free: from:idler/crane)',
    'talk': 'talking (free: from:townsman/talk)', 'point': 'pointing and arguing (free: from:idler/point)',
    'hail': 'one arm raised high, calling (free: from:idler/hail)', 'bow': 'bowing (free: from:camel_driver/bow)',
    'lean_chin': 'elbows on a railing, chin on the hands (free: from:idler/lean_chin)',
    'lean_over': 'leaning over a waist-high edge, hands on it (free: from:inspector/lean_over)',
    'bend_goods': 'bent double over goods (free: from:inspector/bend_goods)',
    'browse': 'reaching into goods on a table (free: from:idler/browse)', 'reach': 'reaching both arms out (free: from:child/reach)',
    'arms_folded': 'arms folded (free: from:inspector/arms_folded)', 'tie_kerchief': 'hand raised to the head (free: from:idler/tie_kerchief)',
    'hold_tray': 'holding a tray out at the waist (free: from:porter/hold_tray)', 'stand_pole': 'holding a pole upright (free: from:porter/stand_pole)',
    'push': 'Push and Walk Forward (free: from:idler/push)', 'steer': 'between shafts, gripping them (free: from:carter/steer; a walk)',
    'hold_rope': 'a rope held low behind (free: from:robed_man/hold_rope)', 'bridle': 'holding an animal at its head (free: from:idler/bridle)',
    'crouch': 'crouching (free: from:idler/crouch)', 'sit_floor': 'sitting cross-legged on the ground (free: from:idler/sit_floor)',
    'sleep_side': 'lying on the side (free: from:soldier/sleep_side)', 'sit': 'the chair sit (free: from:scholar/sit)',
    'drink': 'Sit and Drink (free: from:scholar/drink)', 'sit_talk': 'seated, talking across a table (free: from:official/sit_talk)',
    'sit_listen': 'seated, forearms on the knees, listening (free: t2m:sit_listen)', 'ride': 'riding astride (free: from:carter/ride)',
    'back_load': 'walking with a load on the back (free: from:townsman/back_load)', 'carry_pole': 'walking with a shoulder pole (free: from:porter/carry_pole)',
    'pole_boat': 'NEW (10 credits, rank 1): standing at a gunwale, both hands on a long pole planted at a slant into the water, a short shove, then the hands walk back up it',
    'work_sweep': 'NEW (rank 2): in a row at a long sweep\'s loom, both hands at chest height, pushing it across and pulling it back with the whole body',
    'haul_line': 'NEW (rank 3): hauling a rope hand over hand, leaning back, one foot forward',
    'reach_over_rail': 'NEW (rank 4): bent far over a waist-high railing, head down, both arms hanging over it reaching down',
    'tow_walk': 'NEW (rank 5): walking slowly bent far forward, leaning into a tow line over the shoulder, arms swinging low',
    'wave_arms': 'NEW (rank 6): both arms raised high and waving, shouting',
    'fend_pole': 'NEW (optional, rank 7): holding a long pole overhead or level and pushing it away against something',
    'throw_rope': 'NEW (optional, rank 8): leaning over a railing, the right arm swung out and down after a throw',
    'lie_wave': 'NEW (optional, rank 9): half lying on the back on a roof, one arm raised high waving',
    'hold_horse_neck': 'NEW (optional, rank 10): leaning into a horse\'s chest, both arms round its lowered neck',
    'lunge_arms_wide': 'NEW (optional, rank 11): a crouched lunge with both arms flung wide, face up, shouting',
    'sedan_carry': 'the bearers\' pole on the shoulder (the bearer\'s own)',
    'sack_carry': 'NEW (catalogue 1c #5): walking slowly bent under a big sack across the shoulders, one hand at its tied neck',
    'drive_donkeys': 'NEW (catalogue 1c #13): walking a little behind a pack animal, the near hand on its load, a switch low behind',
    'listen': 'seated, forearms on the knees, listening (free: t2m:sit_listen, called listen)',
    'sit_one_knee': 'seated on the ground, one knee up (free: t2m:sit_one_knee)', 'push_flank': 'pushing hard against something big (free: t2m:push_flank)',
    'stride_stick': 'striding with a long stick (the porter\'s own)',
}
WALK_CLIPS = {'walk', 'carry_pole', 'fan_walk', 'back_load', 'stride_stick', 'quick', 'stroll', 'walk_whip', 'push',
              'lead', 'steer', 'tow_walk'}
# the clip a carried load is held in (the registry's props), and the loads that stand in for a painted load no GLB has
# yet: the painted silhouette (a pole with two hanging loads, a load on the back, a pole in the hands) is kept
# painted prop -> the GLB parts that are it (the workshop's variants, catalogue 2d), in preference order; then the parts
# that stand in for it (PROP_STANDIN). cast.json `prop_pref` overrides the order per figure.
PROP_VARIANTS = {'long_pole': ['long_pole'], 'stick': ['stick_shoulder', 'stick_ride', 'stick', 'stick_drive', 'stick_stride'],
                 'back_sack': ['back_sack', 'back_sack_dark', 'sack_shoulder'], 'hand_dish': ['hand_dish_buns', 'hand_dish'],
                 'hip_bag': ['hip_bag', 'bag_hand'], 'pole_bundles': ['pole_bundles', 'pole_bundles_small']}
PROP_STANDIN = {'pole_buckets': ['pole_shallow_baskets'], 'pole_jar_bundle': ['pole_bundles'], 'pole_fringe_frame': ['pole_bundle'],
                'back_sack': ['back_bundle', 'back_boxes'], 'flat_basket': ['tray'], 'long_pole': ['staff'],
                'stick_stride': [], 'back_tall_bundle': ['back_bundle']}


def prop_cands(slug, p):
    """(GLB part, exact?) candidates for a painted prop, in order."""
    pref = (CF[slug].get('prop_pref') or {}).get(p)
    exact = pref or PROP_VARIANTS.get(p, [p])
    return [(q, q in PROP_VARIANTS.get(p, [p]) or q == p) for q in exact] + \
        [(q, False) for q in PROP_STANDIN.get(p, []) if q not in exact]

wanted = {}        # clip -> {character: [figures]}


def want(clip, c, slug):
    if clip and clip != 'idle':
        lst = wanted.setdefault(clip, {}).setdefault(c, [])
        if slug not in lst:
            lst.append(slug)


def resolve(act, model, take=None, prefer=()):
    """The clip `model` plays for the painted action: the take first, then the action itself, then cast.json `prefer`
    (a clip the casting chose as closer for this figure than the chain's next), then the action's chain."""
    full = ALIAS.get(act, [act, 'idle'])
    chain = ([take] if take else []) + full[:1] + list(prefer) + full[1:]
    for c in chain:
        if c in clips(model):
            return c
    return None


def char_of(slug):
    return CF[slug]['character']


def playing(slug):
    """(model, how): who draws the figure now. how: None, 'stand_in' (the boatman not made yet) or 'recast'."""
    c = CF[slug]
    char = char_of(slug)
    model, how = (char, None) if char in REG else (c['stand_in'], 'stand_in')
    act = c['act']
    pose = POSTURE.get(act)
    got = resolve(act, model, c.get('take'), c.get('prefer', ()))
    if pose and (got is None or (POSTURE.get(got) not in SAME[pose] and got not in c.get('prefer', ()))):
        rc = c.get('recast')
        if not rc:
            print(f'  WARNING {slug}: {model} has no {pose} clip for {act} and cast.json gives no recast')
            return model, how
        return rc[0], 'recast'
    return model, how


MODEL = {s: playing(s) for s in FIG}


def steps_for(slug):
    """The do-cycle: [clip, seconds] steps the playing character has."""
    c = CF[slug]
    model, how = MODEL[slug]
    char = char_of(slug)
    act, take = c['act'], c.get('take')
    if take:
        want(take, char, slug)
    for w in c.get('wants', []):
        if w not in clips(char):
            want(w, char, slug)
    main = resolve(act, model, take, c.get('prefer', ())) or 'idle'
    if act not in clips(char) and act != 'idle':
        want(act, char, slug)
    if how and act not in clips(model) and act != 'idle':
        want(act, model, slug)
    pose = POSTURE.get(main)
    secs = 16 if pose in ('chair', 'floor', 'ride') else 12 if c.get('rail') else 10
    out = [[main, secs]]
    sec = c.get('second')
    if sec and not pose:
        s2 = resolve(sec, model)
        if s2 and s2 != main:
            out.append([s2, 4])
    return out


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


def line_dist(p, pts):
    return min(seg_dist(p, pts[i], pts[i + 1]) for i in range(len(pts) - 1))


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


def heading(a, b):
    return math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))


# ---------------------------------------------------------------- the bridge as the kit builds it
sys.path.insert(0, os.path.join(QM, 'blender'))
import kit_rainbow_bridge as kbr   # noqa: E402  (the fit runs in plain python3)

_bp = json.loads(json.dumps(BRIDGE_PARAMS.get('params') or {}))
for _q in _bp.get('posts', []):          # a post given by id alone stands at its layout position (bridge_params.json about)
    if 'X' not in _q and _q.get('id') in E:
        _q.update(X=E[_q['id']]['pos'][0], D=E[_q['id']]['pos'][1], H=E[_q['id']].get('H', 0.0))
BR = kbr.plan_only(E['S3.str.rainbow_bridge'], FRAME, _bp or None)
PL = BR.plan
RAIL_GAP = 0.36      # a railing leaner's feet from the railing's line: lean_chin's elbows rest ~0.35 m ahead of the feet
DECK_IN = 0.3        # everyone else at least this far inside the railings (the railing walls stand at the deck edges)


def deck_s_off(p):
    return BR.station(p[0], p[1])


def deck_z(p):
    """The built deck top at p, or None off the deck."""
    s, off = deck_s_off(p)
    if s < 0 or s > PL.L or not (-PL.wr(s) <= off <= PL.wl(s)):
        return None
    return PL.Z(s)


def deck_outline(step=0.25):
    n = int(PL.L / step) + 1
    ss = [min(PL.L, i * step) for i in range(n + 1)]
    near = [PL.pt(s, -PL.wr(s)) for s in ss]
    far = [PL.pt(s, PL.wl(s)) for s in ss]
    return near + far[::-1], near, far


DECK_POLY, RAIL_NEAR, RAIL_FAR = deck_outline()
# under the ramps the deck is a solid (skirt walls, abutments): where it is higher than a step, ground people can't be
DECK_HIGH = [(PL.pt(s, -PL.wr(s) - 0.05), PL.pt(s, PL.wl(s) + 0.05)) for s in [i * 0.25 for i in range(int(PL.L / 0.25) + 1)]
             if PL.Z(s) > 0.35]


def under_deck(p):
    """A ground point inside the deck's outline where the deck is higher than a step."""
    z = deck_z(p)
    return z is not None and z > 0.35


def on_bridge(slug):
    f = FIG[slug]
    return f['support'].startswith('bridge deck') or (f['support'].startswith('animal ') and
                                                      ANIMALS[f['support'].split('.')[-1]]['support'].startswith('bridge'))


# ---------------------------------------------------------------- vehicles at the kits' real sizes
def axis(rear, front):
    dx, dy = front[0] - rear[0], front[1] - rear[1]
    n = math.hypot(dx, dy)
    return (dx / n, dy / n), n


def vehicle_body(eid):
    """The vehicle's real body in plan, as the kits build it: {collider polygon, band (front to rear + 0.6 m, +-1.0 m),
    ends}. kit_vehicles._barrow: rails rear -> front, collider 0.3..L-0.3 along, +-(frame_w/2 + 0.1) across; the load
    (barrow_screen's dome 2.4 x 1.55 over the wheel; the hooped load about as wide) overhangs it at head height.
    sedan_chair(carried): cabin d 0.92 x w 0.78 at the poles' middle, collider +0.05 / +0.12 proud; the poles to the
    bearers at front and rear. The handcart (the area builder's): a box 1.2 m wide from rear to front, shafts beyond."""
    e = E[eid]
    rear, front = tuple(e['pts']['rear'][:2]), tuple(e['pts']['front'][:2])
    f, Lv = axis(rear, front)
    lft = (-f[1], f[0])
    P = lambda s, t: (rear[0] + f[0] * s + lft[0] * t, rear[1] + f[1] * s + lft[1] * t)
    slug = eid.split('.')[-1]
    if slug.startswith('sedan'):
        mid, hx, hy = Lv * 0.5, 0.46 + 0.05, 0.39 + 0.12
        col = [P(mid - hx, -hy), P(mid + hx, -hy), P(mid + hx, hy), P(mid - hx, hy)]
        load = None
    elif slug.startswith('handcart'):    # kit_rainbow_bridge_props.handcart: axle at the wheel, body 1.6 x 0.85 from 0.45
        w0 = e['pts'].get('wheel0')       # behind it, collider 0.1 m past each end and +-(0.425 + 0.25); shafts 0.95 m on
        s_w = ((w0[0] - rear[0]) * f[0] + (w0[1] - rear[1]) * f[1]) if w0 else Lv * 0.25
        x_r, x_f = s_w - 0.45, s_w - 0.45 + 1.6
        col = [P(x_r - 0.1, -0.675), P(x_f + 0.1, -0.675), P(x_f + 0.1, 0.675), P(x_r - 0.1, 0.675)]
        load = None
        front = P(x_f + 0.95, 0)                 # the shafts' tips, where the puller stands
        load = [P(x_f + 0.1, -0.42), P(x_f + 0.9, -0.42), P(x_f + 0.9, 0.42), P(x_f + 0.1, 0.42)]   # the shafts
        Lv = x_f + 0.95
    else:   # the barrows (串车 and the hooped barrow)
        hw = 0.43 + 0.1
        col = [P(0.3, -hw), P(Lv - 0.3, -hw), P(Lv - 0.3, hw), P(0.3, hw)]
        w0 = e['pts'].get('wheel0')
        s_w = ((w0[0] - rear[0]) * f[0] + (w0[1] - rear[1]) * f[1]) if w0 else Lv / 2
        a, b = (1.2, 0.78) if 'chuanche' in slug else (min(1.1, Lv / 2), 0.7)
        load = [P(s_w + a * math.cos(t * math.pi / 8), b * math.sin(t * math.pi / 8)) for t in range(16)]
    band = [P(-0.6, -1.0), P(Lv, -1.0), P(Lv, 1.0), P(-0.6, 1.0)]
    return dict(id=eid, col=col, band=band, load=load, rear=rear, front=front, f=f, left=lft, L=Lv, P=P,
                H=e.get('H', 0), ang=heading(rear, front), deck=(e.get('support') or '').startswith('bridge'))


VEHICLES = {k: vehicle_body(k) for k, e in E.items() if e['kind'] == 'vehicle' and not k.split('.')[-1].startswith('boat_')}

# ---------------------------------------------------------------- animals at the registry's real sizes
LOAD_W = {'pack_saddle': 0.8, 'pannier_charcoal': 0.8, 'pack_bale': 1.2}


def hoof_facing(slug):
    a = ANIMALS[slug]['pts']
    return heading(a['hind'], a['fore'])


def animal_body(slug, nudge=None):
    e, sp = ANIMALS[slug], CA[slug]
    info = ANI.get(sp['model'], {'length_m': 1.5, 'width_m': 0.4})
    k = sp.get('scale', 1)
    w = LOAD_W.get(sp.get('load'), info['width_m'])
    ang = sp.get('facing_deg', hoof_facing(slug))
    nx, nd = nudge if nudge is not None else sp.get('nudge', [0, 0])
    c = (e['pos'][0] + nx, e['pos'][1] + nd)
    return dict(c=c, ang=ang, hl=info['length_m'] * k / 2, hw=w * k / 2, H=e.get('H', 0),
                poly=rect(c, ang, info['length_m'] * k / 2, w * k / 2))


# ---------------------------------------------------------------- props and buildings
def _deck_yaw():
    try:
        ln = E['S3.str.rainbow_bridge']['lines']['deck_e']
        return math.degrees(math.atan2(ln[-1][1] - ln[0][1], ln[-1][0] - ln[0][0]))
    except Exception:  # noqa: BLE001
        return 48.7


DECK_YAW = _deck_yaw()


def _yaw(v):
    if isinstance(v, str) and v.startswith('deck'):
        return DECK_YAW + (float(v[4:]) if len(v) > 4 else 0.0)
    return float(v or 0.0)


def _anchored(c, L, W, yaw, anchor):
    """kit_rainbow_bridge_props.Ctx.anchored: the centre of an L x W thing whose painted base is its front (south) edge's
    middle ('front'), its centre or its back."""
    if anchor == 'center':
        return c
    a = math.radians(yaw)
    dn = abs(L / 2 * math.sin(a)) + abs(W / 2 * math.cos(a))
    return (c[0], c[1] + (dn if anchor == 'front' else -dn))


def prop_shape(eid):
    """A ground or deck prop's plan shape for the checks: ('rect', centre, L, W, yaw), ('disc', centre, r), ('poly', pts)
    or ('posts', pts, r), as the props agent's placer builds it (gen/sections/rainbow_bridge/props_table.json `part` and
    `args`, kit_rainbow_bridge_props: tables anchored at their front edge unless `anchor` says otherwise); canopies,
    awnings and parasols block only at their posts. Without a table entry: the map's footprint, else a typical size by
    what the prop is (choice)."""
    e = E[eid]
    slug = eid.split('.')[-1]
    c = tuple(e['pos'][:2])
    sup = e.get('support') or ''
    if sup.startswith(('table top', 'boat', 'water')):
        return None
    row = PROPS_ROWS.get(eid)
    fp = e.get('footprint')
    if row:
        part, g = row.get('part', ''), row.get('args') or {}
        part = part.split('.')[-1]
        if part in ('small_thing', 'jars', 'bottles', 'dishes', 'round_tray', 'fruit_heap', 'hanging_sign', 'rail_bundle',
                    'leaning_pole', 'lying_pole', 'hooked_post', 'pot_rack'):
            return None if part != 'pot_rack' else ('rect', c, g.get('w', 0.75), g.get('depth', 0.28), _yaw(g.get('yaw', 0)))
        if part == 'table':
            yaw = _yaw(g.get('yaw', 0))
            return ('rect', _anchored(c, g['L'], g['W'], yaw, g.get('anchor', 'front')), g['L'], g['W'], yaw)
        if part == 'table_row':
            pw = (c[0] + g['w_off'][0], c[1] + g['w_off'][1])
            pe = (c[0] + g['e_off'][0], c[1] + g['e_off'][1])
            sz = g.get('size', [0.72, 0.72])
            return ('rect', ((pw[0] + pe[0]) / 2, (pw[1] + pe[1]) / 2), math.dist(pw, pe) + sz[0], sz[1] + 0.8, heading(pw, pe))
        if part == 'bench':
            yaw = _yaw(g.get('yaw', 0))
            w = g.get('w', 0.26)
            return ('rect', _anchored(c, g['L'], w, yaw, g.get('anchor', 'center')), g['L'], w, yaw)
        if part == 'stool':
            return ('disc', c, g.get('s', 0.32) / 2)
        if part == 'chair':
            return ('disc', c, 0.24)
        if part in ('tray_stand', 'basket', 'tub', 'rope_reel', 'coiled_heap'):
            r = g.get('R', g.get('r', 0.3))
            if part == 'coiled_heap':
                sp_ = g.get('spread', [0.8, 0.55])
                return ('rect', c, sp_[0] + 0.3, sp_[1] + 0.3, _yaw(g.get('yaw', 'deck')))
            return ('disc', c, r + (g.get('splay', 0) if part == 'tray_stand' else 0))
        if part in ('parasol', 'goods_pole', 'lamp_post', 'post_box'):
            return ('disc', c, 0.06 if part != 'post_box' else 0.15)
        if part in ('mat_awning', 'frame_awning'):
            if g.get('eave') == 'corners' and fp:
                return ('posts', [tuple(q[:2]) for q in fp[:4]], 0.06)
            size = g.get('size', [2.2, 1.5])
            yaw = _yaw(g.get('yaw', 'deck'))
            return ('posts', rect(c, yaw, size[0] / 2, size[1] / 2), 0.06)
        if part in ('slat_rack', 'crossed_box'):
            return ('rect', c, g.get('l', 0.6), g.get('w', 0.4), _yaw(g.get('yaw', 0)))
        if part == 'bottle_stand':
            return ('rect', c, g.get('w', 0.55), g.get('d', 0.4), _yaw(g.get('yaw', 0)))
        if part == 'display_board':
            size = g.get('size', [1.7, 0.9])
            if fp:
                return ('poly', [tuple(q[:2]) for q in fp[:4]])
            return ('rect', c, size[0], size[1], _yaw(g.get('yaw', 0)))
        if part == 'propped_board':
            yaw = _yaw(g.get('yaw', 0))
            return ('rect', _anchored(c, g.get('L', 1.4), g.get('D', 0.9), yaw, g.get('anchor', 'front')), g.get('L', 1.4),
                    g.get('D', 0.9), yaw)
        if part in ('leaning_sign', 'slat_panel'):
            return ('rect', c, g.get('w', 0.4) + 0.1, 0.35, _yaw(g.get('yaw', 0)))
    if any(w in slug for w in ('parasol', 'umbrella', 'awning', 'canopy', 'flagpole', 'goods_pole', 'end_post', 'lamp_post')):
        r = 0.14 if 'end_post' in slug else 0.09 if 'flagpole' in slug else 0.05
        if fp and ('awning' in slug or 'canopy' in slug):        # posts at the corners
            return ('posts', [tuple(q[:2]) for q in fp[:4]], 0.06)
        return ('disc', c, r)
    if 'over_rail' in slug:
        return None
    if fp and len(fp) >= 4:
        return ('poly', [tuple(q[:2]) for q in fp[:4]])
    for key, shape in (('bench', ('rect', 1.2, 0.3)), ('stool', ('disc', 0.18)), ('chair', ('disc', 0.24)),
                       ('table', ('rect', 1.0, 0.6)), ('jar', ('disc', 0.25)), ('basket', ('disc', 0.3)),
                       ('box', ('disc', 0.22)), ('board', ('rect', 1.0, 0.15)), ('stand', ('disc', 0.35)),
                       ('lamp_box', ('disc', 0.25)), ('mooring', ('disc', 0.12)), ('stick', None), ('object', ('disc', 0.3))):
        if key in slug:
            if shape is None:
                return None
            return ('disc', c, shape[1]) if shape[0] == 'disc' else ('rect', c, shape[1], shape[2], 0.0)
    return ('disc', c, 0.25)


PROPS_ROWS = {row['id']: row for row in (PROPS_TABLE or {}).get('props', []) if isinstance(row, dict) and row.get('id')}
SEAT_WORDS = ('bench', 'stool', 'chair')


def shape_dist(p, sh):
    if sh[0] == 'disc':
        return math.dist(p, sh[1]) - sh[2]
    if sh[0] == 'posts':
        return min(math.dist(p, q) - sh[2] for q in sh[1])
    if sh[0] == 'poly':
        return poly_dist(p, sh[1])
    _, c, Lr, Wr, yaw = sh
    return poly_dist(p, rect(c, yaw, Lr / 2, Wr / 2))


def shape_poly(sh):
    if sh[0] == 'rect':
        return rect(sh[1], sh[4], sh[2] / 2, sh[3] / 2)
    if sh[0] == 'poly':
        return sh[1]
    if sh[0] == 'disc':
        return rect(sh[1], 0, sh[2], sh[2])
    return None


def shape_hits(sh, poly):
    """Does a prop/building shape overlap a polygon (an animal's body)?"""
    if sh[0] == 'disc':
        return poly_dist(sh[1], poly) < sh[2]
    if sh[0] == 'posts':
        return any(poly_dist(q, poly) < sh[2] for q in sh[1])
    return polys_overlap(shape_poly(sh), poly)


PROPSH = {}
for k, e in E.items():
    if e['kind'] == 'prop':
        sh = prop_shape(k)
        if sh:
            PROPSH[k] = (sh, e.get('H', 0), (e.get('support') or 'ground'))
BUILD = {k: [tuple(q[:2]) for q in e['footprint']] for k, e in E.items()
         if e['kind'] in ('building', 'structure') and e.get('footprint') and k != 'S3.str.rainbow_bridge'}
TRUNKS = [(t['map_id'], (t['X'], t['D']), 0.3 * t.get('scale', 1)) for t in L['trees'] if (t.get('height_m') or 0) >= 3.0]

# the water: each reach between its mapped shores (the river agent's river_plan.json moves them through the layout)
RIVER_PLAN = opt(f'gen/sections/{FOLDER}/river_plan.json')
WATER = []
for k, e in E.items():
    if e['kind'] == 'water':
        ls = dict(e.get('lines', {}))
        built = ((RIVER_PLAN or {}).get('water') or {}).get(k) or {}
        if built.get('shore_s') and built.get('shore_n'):      # the shores as the builder builds them (river_plan.json)
            ls = built
        if ls.get('shore_s') and ls.get('shore_n'):
            WATER.append((k, [tuple(q[:2]) for q in ls['shore_s']] + [tuple(q[:2]) for q in ls['shore_n']][::-1]))


def in_water(p):
    return min((poly_dist(p, poly) for _, poly in WATER), default=9)


def level_of(slug, p=None):
    """The height a figure stands at: the built deck under it for deck people, else its layout H."""
    f = FIG[slug]
    if on_bridge(slug) and not f['support'].startswith('animal'):
        z = deck_z(p or (f['X'], f['D']))
        return z if z is not None else f['H']
    return f['H']


def obstacles_for(slug_or_level, deck=None):
    """[(name, kind, shape)] that a figure at this level collides with: buildings (ground only), vehicles, props, trunks."""
    out = []
    for k, (sh, H, sup) in PROPSH.items():
        is_deck = sup.startswith('bridge')
        if deck is not None and is_deck != deck:
            continue
        out.append((k, 'seat' if any(w in k for w in SEAT_WORDS) else 'prop', sh))
    if not deck:
        for k, poly in BUILD.items():
            out.append((k, 'building', ('poly', poly)))
        for n, c, r in TRUNKS:
            out.append((n, 'trunk', ('disc', c, r)))
    for k, v in VEHICLES.items():
        if v['deck'] == bool(deck):
            out.append((k, 'vehicle', ('poly', v['col'])))
            if v['load']:
                out.append((k + ' load', 'vehicle', ('poly', v['load'])))
    return out


# ---------------------------------------------------------------- seated clips: where the hips and the feet are
# (left, forward) metres from the character's root, and the hips' height above the soles: tools/char_props.mjs --probe
# <clip> 4 on gen/characters/<c>/<c>_raw.glb (S4b's casting, 2026-10-12). Library chair sits (33) on the original rigs
# keep the root at the feet; local retargets keep it under the hips.
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
    # the workshop's free retargets of 2026-10-12, probed by S3's casting the same way (scratchpad probe_hips.py, t 1-6)
    ('robed_man', 'sit'): (0.01, 0.05, 0.0, 0.35, 0.49), ('robed_man', 'sit_talk'): (0.01, 0.05, -0.02, 0.35, 0.63),
    ('robed_man', 'drink'): (0.01, 0.03, 0.02, 0.26, 0.44), ('camel_driver', 'sit_floor'): (-0.01, 0.02, -0.01, 0.31, 0.0),
    ('camel_driver', 'sit'): (-0.01, 0.04, -0.01, 0.44, 0.49), ('townsman', 'sit'): (0.0, 0.0, -0.01, 0.35, 0.52),
    ('storyteller', 'sit'): (-0.01, 0.03, -0.03, 0.37, 0.41), ('hat_traveller', 'sit'): (-0.01, -0.04, -0.02, 0.34, 0.50),
    ('scholar', 'sit_talk'): (0.0, 0.05, -0.03, 0.42, 0.65), ('scholar', 'listen'): (0.01, 0.03, -0.02, 0.43, 0.52),
}
_NOTED = set()


def hips_of(model, clip):
    """HIPS for a character's seated clip; one not measured yet (a clip the workshop adds later) is taken as a local
    retarget (tools/retarget_local.mjs keeps the root under the hips). Re-probe it (tools/char_props.mjs --probe)."""
    if (model, clip) in HIPS:
        return HIPS[(model, clip)]
    if (model, clip) not in _NOTED:
        _NOTED.add((model, clip))
        print(f'  note: {model} {clip} not probed yet: taken as a local retarget (hips over the root); probe it')
    return (0.0, 0.0, 0.0, 0.3, 0.0) if POSTURE.get(clip) in ('floor', 'crouch') else (0.0, 0.02, 0.0, 0.38, 0.48)


STEPS = {s: steps_for(s) for s in FIG}
CREW = {s for s in FIG if FIG[s]['support'].startswith('boat')}           # placed by the page on their boats
RIDERS = {s for s in FIG if CF[s].get('ride')}
HAUL = {s for s in FIG if CF[s].get('haul')}

# ---------------------------------------------------------------- nudges (each with its reason)
NUDGE, FACING, EXTRA = {}, {}, {}      # NUDGE: slug -> [dX, dD]; WHY: slug -> {tag: reason} (one reason per kind of move)
WHY = {}


def spot(slug):
    f = FIG[slug]
    n = NUDGE.get(slug, (0.0, 0.0))
    return (f['X'] + n[0], f['D'] + n[1])


def add_nudge(slug, v, why, tag=None):
    n0 = NUDGE.get(slug, (0.0, 0.0))
    NUDGE[slug] = (n0[0] + v[0], n0[1] + v[1])
    WHY.setdefault(slug, {})[tag or why[:40]] = why


def set_spot(slug, q, why, tag=None):
    p = spot(slug)
    if math.dist(p, q) > 0.005:
        add_nudge(slug, (q[0] - p[0], q[1] - p[1]), why, tag)


def facing_of(slug):
    if slug in FACING:
        return FACING[slug][0]
    fc = CF[slug].get('facing')
    if fc:
        return fc[0]
    return FIG[slug].get('facing_deg', 0)


for s in FIG:
    if CF[s].get('facing'):
        FACING[s] = tuple(CF[s]['facing'])

# seated figures: the root from the seat (or the painted feet) through the clip's own hip and foot positions
for slug in FIG:
    seat = CF[slug].get('seat')
    clip = STEPS[slug][0][0]
    if not seat or POSTURE.get(clip) not in ('chair', 'floor', 'crouch') or slug in CREW or slug in RIDERS:
        if seat and slug in CREW:
            EXTRA[slug] = dict(kind='boat', clip=clip, model=MODEL[slug][0])
        continue
    f = FIG[slug]
    model = MODEL[slug][0]
    hl, hf, fl, ff, seat_h = hips_of(model, clip)
    fac = facing_of(slug)
    p = (f['X'], f['D'])
    if seat in E:                               # a mapped seat: the hips on it
        sh = PROPSH.get(seat, (('disc', tuple(E[seat]['pos'][:2]), 0.2),))[0]
        c = tuple(E[seat]['pos'][:2])
        if sh[0] == 'rect' and sh[2] > 0.6:     # a bench: where it passes his painted spot
            bf, _ = fwd_left(sh[4])
            t_ = max(-sh[2] / 2 + 0.22, min(sh[2] / 2 - 0.22, (p[0] - c[0]) * bf[0] + (p[1] - c[1]) * bf[1]))
            st = (c[0] + bf[0] * t_, c[1] + bf[1] * t_)
        else:
            st = c
        root = at(st, fac, -hl, -hf)
        why = (f'seated on {seat} (a mapped seat), as painted: {model}\'s {clip} keeps the hips '
               f'{math.hypot(hl, hf):.2f} m from the root, so the root stands where the hips land on the seat')
        kind = 'mapped'
    elif POSTURE.get(clip) == 'chair':           # a seat the map lacks: the painted point is the feet
        feet = p
        root = at(feet, fac, -fl, -ff)
        st = at(root, fac, hl, hf)
        why = (f'painted seated with his feet at the painted point; {model}\'s {clip} keeps its root '
               f'{math.hypot(fl, ff):.2f} m behind the feet and the hips {math.hypot(hl, hf):.2f} m from the root, so the '
               f'root stands there and his seat (a stool the map lacks, seats.json) goes under the hips')
        kind = 'stool'
    else:                                        # a floor sit, a squat: on the support itself
        root = st = p
        why = None
        kind = 'floor'
    EXTRA[slug] = dict(kind=kind, seat=st, root=root, model=model, clip=clip, seat_h=seat_h, facing=fac, mapped=seat if kind == 'mapped' else None)
    if why and math.dist(root, p) > 0.01:
        set_spot(slug, root, why, 'seat')

# railing leaners: feet RAIL_GAP inside the near railing's line, facing out over it
RAIL_INFO = {}
for slug in FIG:
    if CF[slug].get('rail') != 'near':
        continue
    p = spot(slug)
    s_, off = deck_s_off(p)
    if s_ < 0 or s_ > PL.L:
        RAIL_INFO[slug] = f'off the built deck (station {s_:.2f} of 0-{PL.L:.2f}): waits for the bridge fit\'s move'
        continue
    wr = PL.wr(s_)
    d_rail = wr + off                       # distance inside the near railing (off is + to the far side)
    n = PL.N(s_)
    out_ang = math.degrees(math.atan2(-n[1], -n[0])) % 360
    if not 0.30 <= d_rail <= 0.45:
        q = PL.pt(s_, -(wr - RAIL_GAP))
        set_spot(slug, q, f'leans over the near railing ({CF[slug]["act"]}): at real size the railing\'s line (the built '
                          f'deck\'s near edge) is {d_rail:+.2f} m from his spot; he stands {RAIL_GAP} m inside it, square to it, '
                          f'so his forearms rest on its top rail (1.05 m)', 'rail')
    fac0 = facing_of(slug)
    dd = abs((fac0 - out_ang + 180) % 360 - 180)
    if dd > 20:
        FACING[slug] = (round(out_ang, 1), f'painted leaning over the near railing facing {fac0:.0f} (the painter turns '
                                           f'the railing toward us); the built railing runs along the deck at '
                                           f'{math.degrees(math.atan2(PL.T(s_)[1], PL.T(s_)[0])):.0f} deg, so he faces '
                                           f'straight out over it ({out_ang:.0f}), as a lean clip needs')
    RAIL_INFO[slug] = f'{RAIL_GAP} m inside the near railing at station {s_:.2f}, facing {facing_of(slug):.0f}'

# the sedan's bearers at its poles' ends (kit_vehicles.sedan_chair: the poles run from `rear` to `front`, where the
# bearers stand under them)
for slug in FIG:
    end = CF[slug].get('sedan')
    if not end:
        continue
    v = VEHICLES['S3.veh.sedan_18842']
    q = v['front'] if end == 'front' else v['rear']
    if math.dist(spot(slug), q) > 0.25:
        set_spot(slug, q, f'the sedan\'s {end} bearer: the poles\' {end} ends rest on his shoulder, so he stands under '
                          f'them at the sedan\'s {end} point as built (kit_vehicles.sedan_chair carried, poles {v["L"]:.2f} m)', 'sedan')
    FACING.setdefault(slug, (round(v['ang'], 1), 'carrying the sedan up the ramp: facing its heading, rear to front'))



# a man between a handcart's shafts stands at their tips, as the props kit builds them (kit_rainbow_bridge_props.handcart:
# the shafts end 0.95 m past the body's front); his hands are on the tips behind him, so his feet are 0.3 m ahead of them
for slug in FIG:
    vid, end = CF[slug].get('vehicle'), CF[slug].get('at_end')
    if vid in VEHICLES and end == 'front' and vid.split('.')[-1].startswith('handcart'):
        v = VEHICLES[vid]
        tip = v['front']
        q = (tip[0] + v['f'][0] * 0.3, tip[1] + v['f'][1] * 0.3)
        set_spot(slug, q, f'painted between the handcart\'s shaft tips, leaning forward with his arms back on them: at real '
                          f'size the shafts end at ({tip[0]:.2f}, {tip[1]:.2f}) (the props kit\'s handcart, 0.95 m past its '
                          f'1.6 m body); he stands 0.3 m ahead of the tips, between them', 'shafts')
        FACING.setdefault(slug, (round(v['ang'], 1), 'hauling the handcart: facing the way its shafts point'))


def deck_clamp(slugs):
    """Deck people inside the railings: DECK_IN m (a railing leaner RAIL_GAP m), square to the railing."""
    for slug in slugs:
        if not on_bridge(slug) or slug in RIDERS or (slug in EXTRA and EXTRA[slug]['kind'] == 'mapped'):
            continue
        p = spot(slug)
        s_, off = deck_s_off(p)
        if s_ < 0 or s_ > PL.L:
            continue
        gap = RAIL_GAP if CF[slug].get('rail') == 'near' else DECK_IN
        lo, hi = -PL.wr(s_) + gap, PL.wl(s_) - DECK_IN
        if CF[slug].get('rail') == 'near':
            hi = lo + 0.09
        if off < lo - 0.005 or off > hi + 0.005:
            q = PL.pt(s_, min(hi, max(lo, off)))
            side = 'near' if off < 0 else 'far'
            set_spot(slug, q, f'on the deck within {gap} m of the {side} railing (or beyond it) at real size (the built deck is '
                              f'{PL.wl(s_) + PL.wr(s_):.2f} m between its railings): he steps in, square to the railing, to '
                              f'{gap} m inside it', 'deck')


deck_clamp(FIG)


def area_clamp(slugs, gap=0.32):
    """Everyone at least `gap` inside the painted area's edge (the walkable area's invisible walls stand on it): a body is
    0.26 m wide."""
    for slug in slugs:
        if slug in CREW or slug in RIDERS:
            continue
        p = spot(slug)
        d = -poly_dist(p, AREA)
        f = FIG[slug]
        if d >= gap - 0.005 or -poly_dist((f['X'], f['D']), AREA) < 0:
            continue      # far enough in; or placed beyond the silk's edge by a recorded move (the far bank: river_plan.json)
        best = None
        for i in range(len(AREA)):
            a_, b_ = AREA[i], AREA[(i + 1) % len(AREA)]
            if seg_dist(p, a_, b_) - abs(d) < 1e-3:
                ex, ey = b_[0] - a_[0], b_[1] - a_[1]
                n = math.hypot(ex, ey)
                inward = (-ey / n, ex / n)          # the corners run sw, se, ne, nw: inside is to the left
                best = inward
        if best:
            mv = gap - d
            set_spot(slug, (p[0] + best[0] * mv, p[1] + best[1] * mv),
                     f'painted at the silk\'s edge ({d:.2f} m inside the painted area, where the walkable area\'s invisible '
                     f'wall stands): a body is 0.26 m wide, so he steps {mv:.2f} m in from it', 'edge')


area_clamp(FIG)

# ---------------------------------------------------------------- animals: real size against painted place
ANIMAL_WHY = {}
BODY = {a: animal_body(a) for a in CA}


def same_level(h1, h2):
    return abs(h1 - h2) < 1.0


def animal_level(a, b=None):
    e = ANIMALS[a]
    if e.get('support', '').startswith('bridge'):
        z = deck_z((b or BODY[a])['c'])
        return z if z is not None else e.get('H', 0)
    return e.get('H', 0)


for a in CA:   # a free animal whose real-size body runs into a building, a vehicle or a solid prop slides back along its heading
    b0 = BODY[a]
    deck = ANIMALS[a].get('support', '').startswith('bridge')
    obst = [(n, sh) for n, kind, sh in obstacles_for(None, deck=deck) if kind in ('building', 'vehicle', 'prop')]
    obst += [(f'figure {s} (at {CF[s]["vehicle"].split(".")[-1]})', ('disc', spot(s), 0.5)) for s in FIG
             if CF[s].get('vehicle') and CF[s].get('at_end') and not deck]
    hits = [n for n, sh in obst if shape_hits(sh, b0['poly'])]
    hits = [h for h in hits if not (a == 'donkey_18048' and 'barrow' in h)]
    if not hits:
        continue
    fa, _ = fwd_left(b0['ang'])
    found = None
    for k_ in range(1, 41):
        for sg in (-1, 1):
            v = (sg * fa[0] * 0.05 * k_, sg * fa[1] * 0.05 * k_)
            b1 = animal_body(a, v)
            if not any(shape_hits(sh, b1['poly']) for n, sh in obst):
                found = (v, sg, k_)
                break
        if found:
            break
    if found:
        v, sg, k_ = found
        CA[a]['nudge'] = [round(v[0], 2), round(v[1], 2)]
        ANIMAL_WHY[a] = (f'at real size ({2 * b0["hl"]:.2f} m long, {2 * b0["hw"]:.2f} m wide with its load) its body ran '
                         f'into {", ".join(hits)}: it steps {0.05 * k_:.2f} m {"back" if sg < 0 else "forward"} along its own '
                         f'heading, keeping its painted place in its group')
        BODY[a] = animal_body(a)
    else:
        ANIMAL_WHY[a] = f'its real-size body overlaps {", ".join(hits)} and no slide along its heading within 2 m frees it'


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


WALKING = {s for s in FIG if CF[s].get('walk')}


# ---------------------------------------------------------------- walks
WALK_LEN, MIN_WALK, BODY_R = 7.0, 2.0, 0.26
WALK_CLIP = {'carry_pole': 'carry_pole', 'back_load': 'back_load', 'stride_stick': 'stride_stick'}
VEH_BANDS = {k: v['band'] for k, v in VEHICLES.items()}


def walk_clear(p, deck, me=None, need_extra=0.0):
    """Room (metres) from p to the nearest thing a walker can't pass: buildings, vehicles' bands, animals' bodies, props
    (+0.3 m), trunks, the water, the painted area's edge; on the deck its railings and ends."""
    d, who = -poly_dist(p, AREA), 'the painted area\'s edge'
    if deck:
        s_, off = deck_s_off(p)
        for dd, w in ((s_ - 0.3, 'the deck\'s south foot'), (PL.L - 0.3 - s_, 'the deck\'s north foot'),
                      (off + PL.wr(min(PL.L, max(0, s_))) - DECK_IN, 'the near railing'),
                      (PL.wl(min(PL.L, max(0, s_))) - DECK_IN - off, 'the far railing')):
            if dd + BODY_R < d:
                d, who = dd + BODY_R, w
    else:
        wd = in_water(p)
        if wd + 0.0 < d:
            d, who = wd, 'the water'
        if under_deck(p):
            d, who = -1, 'the bridge\'s ramp (its skirt walls)'
    for name, kind, sh in obstacles_for(None, deck=deck):
        if kind == 'vehicle':
            continue
        dd = shape_dist(p, sh) - (0.3 if kind in ('prop', 'seat') else 0)
        if dd < d:
            d, who = dd, name
    for k, band in VEH_BANDS.items():
        if VEHICLES[k]['deck'] == deck:
            dd = poly_dist(p, band)
            if dd < d:
                d, who = dd, f'{k} (front to rear + 0.6 m, +-1.0 m)'
    for a, b in BODY.items():
        if a == me or (ANIMALS[a].get('support', '').startswith('bridge')) != deck:
            continue
        dd = poly_dist(p, b['poly'])
        if dd < d:
            d, who = dd, f'animal {a}'
    return d - need_extra, who


def run_from(o, dvec, limit, deck, me=None, need=BODY_R + 0.04):
    """How far from o along dvec a body walks before something stops it; painted in a tight spot (a cart's band at his
    elbow), he may still walk out of it while the room grows."""
    best, stop = 0.0, ''
    prev = walk_clear(o, deck, me)[0]
    for i in range(1, 400):
        s_ = i * 0.05
        if s_ > limit:
            break
        c, who = walk_clear((o[0] + dvec[0] * s_, o[1] + dvec[1] * s_), deck, me)
        if c < need and (c <= prev + 1e-6 or who.startswith(('the water', 'the painted', 'the bridge'))):
            stop = who
            break
        prev = c
        best = s_
    return best, stop


def ground_path(o, ang, me=None, need=BODY_R + 0.04, length=WALK_LEN):
    d = (math.cos(math.radians(ang)), math.sin(math.radians(ang)))
    fwd, stop = run_from(o, d, length, False, me, need)
    back, bstop = run_from(o, (-d[0], -d[1]), length - fwd, False, me, need)
    path = [[round(o[0] - d[0] * back, 2), round(o[1] - d[1] * back, 2)], [round(o[0] + d[0] * fwd, 2), round(o[1] + d[1] * fwd, 2)]]
    why = (f'{fwd:.1f} m along the painted direction ({ang % 360:.0f} deg)' + (f' to {stop}' if stop else '')
           + (f', and {back:.1f} m back behind the painted spot' + (f' to {bstop}' if bstop else '') if back > 0.05 else ''))
    return path, fwd + back, why


def deck_path(o, ang, me=None):
    """Along the built deck's centre line (both ways from the painted spot, the painted direction first), at the walker's
    own offset from it, cut where walk_clear stops it; points every metre (the ramps bend the deck's line)."""
    s0, off = deck_s_off(o)
    t = PL.T(min(PL.L, max(0, s0)))
    sg = 1 if math.cos(math.radians(ang)) * t[0] + math.sin(math.radians(ang)) * t[1] >= 0 else -1
    lim = {}
    stops = {}
    for dirn in (sg, -sg):
        got, stop = 0.0, ''
        budget = WALK_LEN - (lim.get(sg, 0) if dirn == -sg else 0)
        for i in range(1, 400):
            ds = i * 0.05
            if ds > budget:
                break
            q = PL.pt(s0 + dirn * ds, off)
            c, who = walk_clear(q, True, me)
            if c < BODY_R + 0.04:
                stop = who
                break
            got = ds
        lim[dirn], stops[dirn] = got, stop
    a, b = s0 - sg * lim[-sg], s0 + sg * lim[sg]
    n = max(1, int(abs(b - a)))
    path = [[round(PL.pt(a + (b - a) * i / n, off)[0], 2), round(PL.pt(a + (b - a) * i / n, off)[1], 2)] for i in range(n + 1)]
    why = (f'along the built deck ({"up" if sg > 0 else "down"} toward the {"north" if sg > 0 else "south"} foot, as painted), '
           f'{off:+.2f} m off its centre line: {lim[sg]:.1f} m ahead' + (f' to {stops[sg]}' if stops[sg] else '') +
           (f', {lim[-sg]:.1f} m back' + (f' to {stops[-sg]}' if stops[-sg] else '') if lim[-sg] > 0.05 else '') +
           f'; the deck rises from {PL.Z(min(a, b)):.2f} to {PL.Z(max(a, b)):.2f} m along it')
    return path, lim[sg] + lim[-sg], why


WALK_STAND, PATHS = {}, {}
for s in sorted(WALKING):
    f = FIG[s]
    o = spot(s)
    ang = facing_of(s)
    if on_bridge(s):
        path, ln, why = deck_path(o, ang)
        z0 = deck_z(o) if deck_z(o) is not None else f['H']
        if ln >= MIN_WALK and z0 > WALK_GROUND_MAX_H and not WALKER_START_H:
            WALK_STAND[s] = (ln, why + f'; but people.js starts a walker from its root at y 0 and grounds it by a ray from '
                                     f'1.5 m: on the deck at {z0:.2f} m he would land under the bridge, so he stands at his '
                                     f'spot until the page passes a start height (startAt [X, D, H])')
            continue
    else:
        path, ln, why = ground_path(o, ang)
    if ln < MIN_WALK:
        WALK_STAND[s] = (ln, f'only {ln:.1f} m of room ({why})')
        continue
    PATHS[s] = (path, ln, why)
for s in WALK_STAND:
    WALKING.discard(s)


# ---------------------------------------------------------------- facings on the deck (moves don't rotate anything)
# the painter turns the bridge toward the viewer, so a painted facing on the deck relates to the built deck only through
# what the figure does: walkers up or down the ramp face along the deck; a figure at a railing whose painted facing points
# into it faces square out over it; everyone else keeps the painted facing
DECK_UP = round(math.degrees(math.atan2(PL.T(PL.L / 2)[1], PL.T(PL.L / 2)[0])) % 360, 1)


def deck_facings():
    for slug in FIG:
        if not on_bridge(slug) or slug in RIDERS or CF[slug].get('sedan') or CF[slug].get('rail') == 'near':
            continue
        p = spot(slug)
        s_, off = deck_s_off(p)
        if s_ < 0 or s_ > PL.L:
            continue
        fac = facing_of(slug)
        if CF[slug].get('walk'):
            t = PL.T(s_)
            up = math.cos(math.radians(fac)) * t[0] + math.sin(math.radians(fac)) * t[1] >= 0
            new = DECK_UP if up else (DECK_UP + 180) % 360
            if abs((new - fac + 180) % 360 - 180) > 5:
                FACING[slug] = (new, f'painted walking {"up" if up else "down"} the ramp (painted facing {fac:.0f}); the built '
                                     f'deck runs at {DECK_UP:.1f} deg, so he faces {"up" if up else "down"} it ({new:.1f})')
            continue
        n = PL.N(s_)
        for side, dist, normal in (('near', PL.wr(s_) + off, (-n[0], -n[1])), ('far', PL.wl(s_) - off, n)):
            out = math.degrees(math.atan2(normal[1], normal[0])) % 360
            if dist < 1.2 and abs((fac - out + 180) % 360 - 180) < 60 and abs((fac - out + 180) % 360 - 180) > 5:
                FACING[slug] = (round(out, 1), f'at the {side} railing ({dist:.2f} m from it), his painted facing {fac:.0f} '
                                               f'points into it (the painter turns the railing toward us): he faces square '
                                               f'out over it ({out:.1f})')


deck_facings()

# ---------------------------------------------------------------- relaxation: animals, obstacles, neighbours
SEATED_FIXED = {s for s, x in EXTRA.items() if x['kind'] in ('mapped', 'stool')}
ANCHORED = SEATED_FIXED | {s for s in FIG if CF[s].get('sedan')}
INSIDE_OK = {(s, k): why for s in FIG for k, why in (CF[s].get('inside') or {}).items()}
FREE = [s for s in FIG if s not in WALKING and s not in CREW and s not in RIDERS]
CHILD_SCALE = {}
for s in FIG:
    sc = CF[s].get('scale')
    if sc:
        CHILD_SCALE[s] = round(sc * 1.70 / height(MODEL[s][0]), 2)


def body_r(s):
    return 0.26 * min(1.0, CHILD_SCALE.get(s, 1.0))


def along_rail(s, v):
    """A railing leaner moves only along the railing (his distance to it is the clip's)."""
    if CF[s].get('rail') != 'near':
        return v
    s_, _ = deck_s_off(spot(s))
    t = PL.T(min(PL.L, max(0, s_)))
    k = v[0] * t[0] + v[1] * t[1]
    return (t[0] * k, t[1] * k)


def relax_animals():
    for s in FREE:
        if s in HAUL:
            continue
        for a, b in BODY.items():
            if not same_level(level_of(s, spot(s)), animal_level(a)):
                continue
            r = push_off(s, b)
            if r:
                (vx, vy), part, m = r
                add_nudge(s, along_rail(s, (vx, vy)), f'painted against {a} ({CA[a]["model"]}, {2 * b["hl"]:.2f} m long and '
                                                   f'{2 * b["hw"]:.2f} m wide at real size): his spot fell inside its body, so '
                                                   f'he steps straight out from its {part}, on the side he is painted', 'animal ' + a)


inside_report = set()


def relax_obstacles():
    for s in FREE:
        if s in SEATED_FIXED:
            continue
        deck = on_bridge(s)
        for name, kind, sh in obstacles_for(None, deck=deck):
            if (s, name.replace(' load', '')) in INSIDE_OK:
                continue
            p = spot(s)
            need = 0.2 if sh[0] in ('disc', 'posts') else 0.3
            dd = shape_dist(p, sh)
            if dd >= need:
                continue
            if kind == 'building' and dd < -0.6:
                inside_report.add(f'{s} {dd:+.2f} m inside {name}')
                continue
            best = None
            for k_ in range(0, 72):
                a = math.radians(k_ * 5)
                for mv in [j * 0.02 for j in range(1, 60)]:
                    q = (p[0] + math.cos(a) * mv, p[1] + math.sin(a) * mv)
                    if shape_dist(q, sh) >= need:
                        if best is None or mv < best[0]:
                            best = (mv, q)
                        break
            if best:
                what_ = {'building': 'its mapped footprint', 'vehicle': 'the kit\'s real-size body', 'seat': 'the seat',
                         'prop': 'the prop at its built size', 'trunk': 'its trunk'}[kind]
                set_spot(s, best[1], f'his painted spot lies inside or within {need} m of {name} ({what_}): he steps straight '
                                     f'out of it', 'out of ' + name)


def table_slide():
    """A seated figure whose root (people.js grounds it by rays at X, X +- 0.12 from H + 1.2) lies over a table, counter or
    stand: slid the least way that clears every one of them (straight back from the table he sits at, unless another
    stands behind him), so he isn't stood on a top."""
    tops = [(k, sh) for k, (sh, H, sup) in PROPSH.items() if re.search(r'table|counter|stand|display', k) and sh[0] != 'posts']
    for s in SEATED_FIXED:
        if EXTRA[s]['kind'] != 'stool':
            continue
        mine = [(k, sh) for k, sh in tops if same_level(level_of(s, spot(s)),
                                                         PROPSH[k][1] if not PROPSH[k][2].startswith('bridge') else level_of(s, spot(s)))]
        hit = lambda q: min([min(shape_dist((q[0] + dx, q[1]), sh) for dx in (-0.12, 0, 0.12)) for k, sh in mine] or [9])
        p = spot(s)
        if hit(p) >= 0.03:
            continue
        under = [k for k, sh in mine if min(shape_dist((p[0] + dx, p[1]), sh) for dx in (-0.12, 0, 0.12)) < 0.03]
        fac = EXTRA[s]['facing']
        best = None
        for k_ in range(16):
            a = fac + 180 + k_ * 22.5
            for j in range(1, 60):
                q = at(p, a, 0, 0.02 * j)
                if hit(q) >= 0.05:
                    cost = 0.02 * j * (1 if k_ == 0 else 1.25)
                    if best is None or cost < best[0]:
                        best = (cost, q, (a - fac - 180) % 360, 0.02 * j)
                    break
        if best:
            _, q, da, mv = best
            way = 'straight back' if da < 1 or da > 359 else f'{"back and to one side" if da < 90 or da > 270 else "forward"}'
            set_spot(s, q, f'seated at {", ".join(under)} with his legs under it: at its built size his hips (the root) were '
                           f'over its top, so he slides {mv:.2f} m {way} to clear it (people.js would stand him on the top)', 'table')


def relax_people():
    moved_any = False
    for it in range(60):
        moved = False
        pts = {s: spot(s) for s in FREE}
        lv = {s: level_of(s, pts[s]) for s in FREE}
        ids = sorted(FREE)
        for i, a in enumerate(ids):
            for b in ids[i + 1:]:
                if abs(lv[a] - lv[b]) > 0.5:
                    continue
                need = (0.55 if on_bridge(a) and on_bridge(b) else body_r(a) + body_r(b)) - 0.02
                d = math.dist(pts[a], pts[b])
                if d >= need:
                    continue
                v = ((pts[b][0] - pts[a][0]) / d, (pts[b][1] - pts[a][1]) / d) if d > 1e-6 else (1, 0)
                gap = need - d + 0.005
                anc = {a: a in ANCHORED, b: b in ANCHORED}
                if anc[a] and anc[b]:
                    anc = {a: False, b: False}     # two seated side by side: each slides half
                wa = 0 if anc[a] else (1 if anc[b] else 0.5)
                wb = 0 if anc[b] else (1 if anc[a] else 0.5)
                for s, w, sg in ((a, wa, -1), (b, wb, 1)):
                    if w == 0:
                        continue
                    mv = along_rail(s, (sg * v[0] * gap * w, sg * v[1] * gap * w))
                    add_nudge(s, mv, 'painted closer to a neighbour than two bodies (0.26 m each, people.js; 0.55 m apart on '
                                     'the deck): pushed apart along the line between them' +
                              (', along the railing' if CF[s].get('rail') else ''), 'apart')
                moved = moved_any = True
                pts = {s: spot(s) for s in FREE}
                lv = {s: level_of(s, pts[s]) for s in FREE}
        if not moved:
            break
    return moved_any


for rnd in range(5):
    before = {s: spot(s) for s in FIG}
    relax_animals()
    relax_obstacles()
    table_slide()
    relax_people()
    deck_clamp(FREE)
    area_clamp(FREE)
    if max(math.dist(before[s], spot(s)) for s in FIG) < 0.01:
        break

# crew on their boats as the boat kit builds them (build_choices.json boats: lw, beam; the hull centred between the
# layout's front and rear, kit_boats._frame): a spot off the built deck is brought onto it (boats.js host would pull it
# toward the centre line, where crewmates bunch); the sweep and oar crew stand at their bar or grip (people_boats.json)
_PB = (PEOPLE_BOATS or {}).get('boats', PEOPLE_BOATS or {}) if PEOPLE_BOATS else {}
WORKERS = {f for b in _PB.values() if isinstance(b, dict) for f, j in (b.get('crew') or {}).items() if (j or {}).get('work')}
HULL = {}
for bid, bc in (CHOICES.get('boats') or {}).items():
    e = E.get(bid)
    kit = (bc or {}).get('kit') or {}
    if not e or not kit.get('lw'):
        continue
    fr, rr = e['pts']['front'][:2], e['pts']['rear'][:2]
    c = tuple(kit['centre'][:2]) if kit.get('centre') else ((fr[0] + rr[0]) / 2, (fr[1] + rr[1]) / 2)
    HULL[bid] = dict(c=c, ang=heading(rr, fr), lw=kit['lw'], beam=kit.get('beam', 2.4), kind=kit.get('kind', ''))


def hull_local(bid, p):
    h = HULL[bid]
    f, l = fwd_left(h['ang'])
    d = (p[0] - h['c'][0], p[1] - h['c'][1])
    return d[0] * f[0] + d[1] * f[1], d[0] * l[0] + d[1] * l[1]


def hull_clamp(slug, why_tag='hull'):
    m = re.match(r'^boat (?:bow )?deck: (.+)$', FIG[slug]['support'])
    if not m or m.group(1) not in HULL or slug in WORKERS:
        return
    bid = m.group(1)
    h = HULL[bid]
    al, ac = hull_local(bid, spot(slug))
    lim_al, lim_ac = h['lw'] / 2 - 1.0, h['beam'] / 2 - 0.4
    al2, ac2 = max(-lim_al, min(lim_al, al)), max(-lim_ac, min(lim_ac, ac))
    if abs(al2 - al) > 0.005 or abs(ac2 - ac) > 0.005:
        f, l = fwd_left(h['ang'])
        q = (h['c'][0] + f[0] * al2 + l[0] * ac2, h['c'][1] + f[1] * al2 + l[1] * ac2)
        set_spot(slug, q, f'on {bid.split(".")[-1]}, built at real size ({h["kind"]}, {h["lw"]} m long, {h["beam"]} m in the beam, '
                          f'build_choices.json boats): his painted spot lay off its deck ({al:+.2f} m along, {ac:+.2f} m across '
                          f'from its middle), so he stands on the deck inside its gunwale, where the boats page finds it', why_tag)


for s in sorted(CREW):
    hull_clamp(s)
for i_ in range(40):
    moved = False
    crew = sorted(s for s in CREW)
    for i, a in enumerate(crew):
        for b in crew[i + 1:]:
            if FIG[a]['support'].split(': ')[-1] != FIG[b]['support'].split(': ')[-1] or abs(FIG[a]['H'] - FIG[b]['H']) > 0.5:
                continue
            pa, pb = spot(a), spot(b)
            d = math.dist(pa, pb)
            if d >= 0.5:
                continue
            v = ((pb[0] - pa[0]) / d, (pb[1] - pa[1]) / d) if d > 1e-6 else (1, 0)
            gap = (0.5 - d + 0.005) / 2
            for s, sg in ((a, -1), (b, 1)):
                if s in WORKERS:
                    continue
                add_nudge(s, (sg * v[0] * gap, sg * v[1] * gap),
                          f'painted closer to a crewmate than two bodies on {FIG[s]["support"].split(".")[-1]}: pushed apart '
                          f'along the line between them (the boats page places him at his nudged spot on its deck)', 'crew')
                hull_clamp(s)
            moved = True
    if not moved:
        break


# ---------------------------------------------------------------- carried props
LOAD_CLIPS = {'carry_pole', 'back_load', 'sack_carry'}   # never a carry clip without its load


def prop_options(slug, model, played):
    """The props a figure shows: each painted prop (cast.json props) as the first of its GLB parts (prop_cands) that the
    playing character has, bound to a clip the figure plays (characters.json props: the pose it is placed for); with a
    note per prop."""
    out, notes = [], []
    for p in CF[slug].get('props', []):
        got = None
        for q, exact in prop_cands(slug, p):
            spec = PROPS.get(model, {}).get(q) or {}
            if f'prop_{q}' in glb_parts(model) and spec.get('clip') in played:
                got = (q, spec['clip'], exact)
                break
        if got and got[2]:
            out.append(got[0])
            notes.append(f'{p}: on as {got[0]} ({model}, held in {got[1]})')
        elif got:
            out.append(got[0])
            notes.append(f'{p}: not on {model} yet; {got[0]} stands in, held in {got[1]} (the painted silhouette kept)')
        else:
            binds = {q: (PROPS.get(model, {}).get(q) or {}).get('clip') for q, _ in prop_cands(slug, p)}
            notes.append(f'{p}: off ({model}: ' + ', '.join(f'{q} ' + (f'held in {c}' if c else 'missing')
                                                         for q, c in binds.items()) + f'; it plays {"/".join(played)})')
    return out, notes


def walk_clip(slug, model):
    """The clip a walker walks in: the one its painted load is placed for (the first of its parts the character has,
    bound to a walk the character has), else the take it waits for or its painted carry, else a plain walk; a carry
    clip only with its load on."""
    c = CF[slug]
    char = char_of(slug)
    cands = [x for x in (c.get('walk_take'), WALK_CLIP.get(c['act'])) if x]
    for x in cands:
        if x not in clips(char):
            want(x, char, slug)
    for p in c.get('props', []):
        for q, exact in prop_cands(slug, p):
            b = (PROPS.get(model, {}).get(q) or {}).get('clip')
            if f'prop_{q}' in glb_parts(model) and b in WALK_CLIPS and b in clips(model):
                pr, notes = prop_options(slug, model, [b])
                return b, pr, notes
    for x in cands:
        if x not in clips(model):
            continue
        pr, notes = prop_options(slug, model, [x])
        if x in LOAD_CLIPS and not pr:
            continue
        return x, pr, notes
    pr, notes = prop_options(slug, model, ['walk'])
    return 'walk', pr, notes


# ---------------------------------------------------------------- animals that walk (painted walking, nobody riding or leading)
def animal_spec(a):
    """The animal's model, load and clips: the catalogue's wanted variant (2c: tones, tack, clips) once animals.json
    has it, else the registry's nearest (animals_why)."""
    sp = dict(CA[a])
    model = sp['model']
    if sp.get('model_wanted') in ANI:
        model = sp['model_wanted']
    load = sp.get('load')
    tack = (ANI.get(model) or {}).get('tack') or {}
    if isinstance(tack, str):
        tack = json.loads(tack)
    if sp.get('load_wanted') in tack:
        load = sp['load_wanted']
    if load and load not in tack:
        load = None
    do = [[(sp.get('clip_wanted') or {}).get(c, c), t] for c, t in sp['do']]
    do = [[c if c in (ANI.get(model) or {}).get('clips', {}) else orig, t] for (c, t), (orig, _) in zip(do, sp['do'])]
    out = {'model': model}
    if load:
        out['load'] = load
    out['do'] = do
    for k in ('scale', 'nudge', 'facing_deg'):
        if k in sp:
            out[k] = sp[k]
    return out


ANIMAL_PATH, ANIMAL_WALK = {}, {}
for a, sp in CA.items():
    if not sp.get('walk'):
        continue
    b = BODY[a]
    deck = ANIMALS[a].get('support', '').startswith('bridge')
    d = fwd_left(b['ang'])[0]
    nose = (b['c'][0] + d[0] * b['hl'], b['c'][1] + d[1] * b['hl'])
    rump = (b['c'][0] - d[0] * b['hl'], b['c'][1] - d[1] * b['hl'])
    fwd, stop = run_from(nose, d, WALK_LEN, deck, me=a, need=b['hw'] + 0.1)
    back, bstop = run_from(rump, (-d[0], -d[1]), WALK_LEN - fwd, deck, me=a, need=b['hw'] + 0.1)
    ln = fwd + back
    why = (f'painted walking with nobody riding or leading it: {fwd:.1f} m ahead along its heading ({b["ang"] % 360:.0f} deg)'
           + (f' to {stop}' if stop else '') + (f', {back:.1f} m back' + (f' to {bstop}' if bstop else '') if back > 0.05 else ''))
    if ln < MIN_WALK:
        CA[a]['do'] = [['idle', 10]]
        ANIMAL_WALK[a] = (f'painted walking, but there is only {ln:.1f} m of room along its heading ({why}): it stands '
                          f'(idle), as a painted walker with no room does')
        continue
    c = b['c']
    ANIMAL_PATH[a] = [[round(c[0] - d[0] * back, 2), round(c[1] - d[1] * back, 2)], [round(c[0] + d[0] * fwd, 2), round(c[1] + d[1] * fwd, 2)]]
    ANIMAL_WALK[a] = why

# ---------------------------------------------------------------- people.json
people = {
    'about': ('Who the Rainbow Bridge\'s (S3) people and animals are and what they do: every painted figure (232) and animal '
              '(9) of S3 (map/text/S3.md, u 15500-20500) at its mapped spot (layout.json, with its recorded moves), and nobody '
              'else (map/BUILDING.md). Written by gen/sections/rainbow_bridge/make_people.py from the cast '
              'gen/sections/rainbow_bridge/cast.json (the needs list\'s casting with the catalogue\'s new characters), at '
              'the kits\' real sizes (the bridge as kit_rainbow_bridge fits it, the vehicles, the animals, the props); rerun '
              'it after a layout move, a build or a workshop delivery. figures: character (a character not made yet plays '
              'its stand_in; a figure painted seated, crouching or riding whose character lacks that posture is played by '
              'the nearest look that has it: cast_why), do = [clip, seconds] cycles with clips the playing character has '
              '(clips_why: what is still to make), nudge = [dX, dD] (nudge_why), facing_deg where the real-size scene '
              'needs another (facing_why), scale for children (scale_why), ride = the animal a rider sits on, props = '
              'carried prop_<name> parts (props_why). Crew on boats (layout support boat deck:/roof:/bow deck:) stand at '
              'their layout spots, placed by the page\'s boats (web/src/boats.js); boats: each boat\'s motion and crew '
              'work (the river agent\'s people_boats.json, merged). walkers: figures painted walking or carrying, along '
              'their painted direction and back (walkers_why). animals: each painted animal at its map position facing '
              'hind to fore, model, load and clips from web/public/assets/animals/animals.json (animals_why). Seats the '
              'map lacks: gen/sections/rainbow_bridge/seats.json, for the builder. No traffic.'),
    'figures': {}, 'nudge_why': {}, 'walkers': [], 'walkers_why': {}, 'animals': {}, 'animals_why': {}, 'boats': {},
    'clips_why': {}, 'scale_why': {}, 'facing_why': {}, 'cast_why': {}, 'props_why': {}, 'wanted': {}, 'builder_notes': {},
}

for s in WALK_STAND:      # a painted walker who stands plays a calm stand, his walk's load off
    CF[s] = {**CF[s], 'act': 'look', 'second': 'idle'}
    STEPS[s] = steps_for(s)

for slug in sorted(FIG, key=lambda s: -FIG[s]['X']):
    c = CF[slug]
    char = char_of(slug)
    model, how = MODEL[slug]
    if slug in WALKING:
        path, ln, why = PATHS[slug]
        clip, pr, notes = walk_clip(slug, model)
        w = {'id': slug, 'figure': slug, 'character': char}
        if how == 'stand_in':
            w['stand_in'] = model
        if how == 'recast':
            w['character'] = model
        if pr:
            w['props'] = pr
        w.update({'clip': clip, 'speed': 0.85 if clip in LOAD_CLIPS else 1.0, 'pause': ['idle', 3], 'path': path})
        if slug in CHILD_SCALE:
            w['scale'] = CHILD_SCALE[slug]
        if notes:
            people['props_why'][slug] = '; '.join(notes)
        people['walkers'].append(w)
        people['walkers_why'][slug] = why
        continue
    if slug in WALK_STAND:
        ln, why = WALK_STAND[slug]
        people['walkers_why'][slug] = f'painted walking, but he stands at his spot: {why}'
    spec = {'character': char if how != 'recast' else model}
    if how == 'stand_in':
        spec['stand_in'] = model
    if c.get('ride'):
        spec['ride'] = c['ride']
    spec['do'] = STEPS[slug]
    pr, notes = prop_options(slug, model, [x[0] for x in spec['do']])
    if pr:
        spec['props'] = pr
    if notes:
        people['props_why'][slug] = '; '.join(notes)
    if slug in CHILD_SCALE:
        spec['scale'] = CHILD_SCALE[slug]
    if slug in FACING or FIG[slug].get('facing_deg') is None:
        fac = FACING.get(slug, (FIG[slug].get('facing_deg', 0), 'the map gives no facing'))
        spec['facing_deg'] = fac[0]
        people['facing_why'][slug] = fac[1]
    if slug in NUDGE and math.hypot(*NUDGE[slug]) > 0.005:
        spec['nudge'] = [round(NUDGE[slug][0], 2), round(NUDGE[slug][1], 2)]
        people['nudge_why'][slug] = '; then '.join(WHY[slug].values())
    people['figures'][slug] = spec

# who plays whom, and why
cw = {}
for s in FIG:
    c, (model, how) = CF[s], MODEL[s]
    if how == 'stand_in':
        cw[s] = f'{c["character"]} (not made yet; {c.get("wanted_why", "")}) is played by {model}' + \
                (f': {c["stand_in_why"]}' if c.get('stand_in_why') else ' (the needs list\'s cast)')
    elif how == 'recast':
        cw[s] = f'{c["character"]} is his look; played by {model} until {c["character"]} can: {c["recast"][1]}'
    elif c.get('cast_why'):
        cw[s] = c['cast_why']
people['cast_why'] = {**cw, 'about': ('by dress (needs list "Casting", catalogue 1b and 7): short jackets and trousers are '
                                      'the idler or the porter, long light robes with a dark cap the scholar, a light robe '
                                      'without a cap the robed man, dark long robes the townsman, the inspector or the '
                                      'fortune-teller, wide hats the hat traveller (dark broad hats dark_hat, straw hats '
                                      'straw_hat, when made), the crews the boatman (when made)')}
people['props_why']['about'] = ('carried props as painted (needs list "Props carried by figures", catalogue 2d), switched on '
                                'only when the playing character\'s GLB has prop_<name> bound to a clip the figure plays: '
                                'never a carry clip without its load; a painted load no GLB has yet may be played by the '
                                'nearest existing load (the pole and its two loads, a load on the back, a pole in the hands)')
for s, sc in CHILD_SCALE.items():
    m = MODEL[s][0]
    people['scale_why'][s] = (f'painted about {CF[s]["scale"]} of the adults beside him ({CF[s].get("scale_why", "needs list")}): '
                              f'{CF[s]["scale"]} x 1.70 m / the {m} model\'s {height(m):.2f} m = {sc} ({sc * height(m):.2f} m tall)')
people['scale_why']['about'] = ('people.js scale multiplies the playing character\'s own height, so each child\'s painted '
                                'ratio to the adults beside it becomes a scale of the model that plays it (recomputed when '
                                'the youth replaces the child)')
people['walkers_why']['held'] = {s: CF[s]['held'] for s in FIG if CF[s].get('held')}
people['walkers_why']['trackers'] = ('the five 纤夫 walk with their towed boat (boats.js hauler: people.json boats.<boat>.haul, '
                                     'from the river agent\'s people_boats.json): figures, not walkers')
if not WALKER_START_H:
    people['walkers_why']['deck'] = ('people.js starts every walker from its root at y 0 and grounds it by a ray from 1.5 m: a '
                                     'walker whose path starts on the deck above about 1.3 m would land under the bridge, so '
                                     'those stand until the page passes a start height (proposed: world.js populate passes '
                                     'startAt [f.X, f.D, f.H] and people.js addWalker sets p.root.position.y = startAt[2] '
                                     'before its first step); their paths are computed and kept in walkers_why')
for a in CA:
    people['animals'][a] = animal_spec(a)
    if a in ANIMAL_PATH:
        people['animals'][a]['path'] = ANIMAL_PATH[a]
ANI_NOTE = {}
for a, sp in CA.items():
    got = people['animals'][a]
    miss = []
    if sp.get('model_wanted') and got['model'] != sp['model_wanted']:
        miss.append(f'{sp["model_wanted"]} (catalogue 2c) not in animals.json yet: the {got["model"]} stands in')
    if sp.get('load_wanted') and got.get('load') != sp['load_wanted']:
        miss.append(f'tack {sp["load_wanted"]} not made yet: ' + (f'{got["load"]} stands in' if got.get('load') else 'none shown'))
    for c0, c1 in (sp.get('clip_wanted') or {}).items():
        if not any(x[0] == c1 for x in got['do']):
            miss.append(f'clip {c1} not made yet: {c0} plays')
    ANI_NOTE[a] = f'{sp["painted"]}. ' + ('; '.join(miss) if miss else 'as painted') + (
        f'. Wanted: {sp["wanted"]}' if sp.get('wanted') else '') + (f'. {sp["held"]}' if sp.get('held') else '') + (
        '. The lead\'s call (needs list)' if sp.get('lead_call') else '')
people['animals_why'] = {**ANI_NOTE, 'nudges': dict(ANIMAL_WHY), 'walks': dict(ANIMAL_WALK),
                         'riders': {s: CF[s]['ride'] for s in FIG if CF[s].get('ride')}}

# ---------------------------------------------------------------- boats: the river agent's crew work, merged
BOAT_SPEC = json.loads(json.dumps((PEOPLE_BOATS or {}).get('boats', PEOPLE_BOATS or {}))) if PEOPLE_BOATS else {}
BOAT_SPEC = {k: v for k, v in BOAT_SPEC.items() if isinstance(v, dict) and k != 'about'}
boats_note = []
for s in FIG:   # crew on a "boat bow deck:" (boats.js host reads only "boat deck|roof:"): listed as crew so it claims them
    m = re.match(r'^boat bow deck: (.+)$', FIG[s]['support'])
    if m:
        key = m.group(1).split('.')[-1]
        crew = BOAT_SPEC.setdefault(key, {}).setdefault('crew', {})
        if s not in crew:
            crew[s] = {}
            boats_note.append(f'{s}: on the raised bow deck of {key} ("boat bow deck:", which web/src/boats.js host does not '
                              f'parse): listed in boats.{key}.crew so the boat carries him, on its highest deck under his spot')
HAUL_WHY = {}
for key, b in BOAT_SPEC.items():
    for s, h in (b.get('haul') or {}).items():   # trackers: the walk and stand their playing character has
        if s in FIG:
            m = MODEL[s][0]
            for k_, chain in (('walk', ['tow_walk', 'push', 'walk']), ('stand', ['idle'])):
                h[k_] = next(x for x in chain if x in clips(m) or x in ('walk', 'idle'))
            HAUL_WHY[s] = (f'walks with {key} ({m} {h["walk"]} while it moves: the tow_walk take\'s stand-in, a forward-'
                           f'leaning walk; {h["stand"]} while it waits)')
people['boats'] = BOAT_SPEC
if not PEOPLE_BOATS:
    boats_note.append('the river agent\'s gen/sections/rainbow_bridge/people_boats.json has not landed: no boat motion, sweep '
                      'crew or haul yet beyond the bow-deck crew; the trackers stand at their spots meanwhile')
people['builder_notes']['boats'] = boats_note
people['walkers_why']['haul'] = HAUL_WHY

# ---------------------------------------------------------------- seats.json (the seats the map lacks, for the builder)
seats = {'about': ('Seats the map lacks, for the area builder (map/BUILDING.md rule 3: the seat of a figure painted seated is '
                   'part of it), written by gen/sections/rainbow_bridge/make_people.py from the layout, the bridge as built '
                   'and the playing clip (rerun after a layout move). Keys are figure map IDs. X, D: the seat\'s centre, '
                   'under the hips; H: the height it stands on (the ground 0, the built deck under it, the riverside hall\'s '
                   'upper floor 3.83, a boat\'s deck or roof); seat_h: its top above H (0: the figure sits on the support '
                   'itself); what: stool (build a small non-colliding stool inside the figure\'s entity), ground (a floor '
                   'sit on the ground, a floor or the deck: nothing to build), boat (on a boat: the boat kit\'s deck '
                   'grounds him, nothing to build); facing_deg, root [X, D, H] (where people.js stands the figure), clip; '
                   'why. Figures on mapped benches, stools and chairs are not listed: their nudges put their hips on those '
                   'props.')}
for slug, x in EXTRA.items():
    if x['kind'] == 'mapped':
        continue
    f = FIG[slug]
    if x['kind'] == 'boat':
        seats[f['map_id']] = dict(X=f['X'], D=f['D'], H=f['H'], seat_h=0.0, what='boat', clip=f'{x["model"]} {x["clip"]}',
                                  why=f'seated on {f["support"]} (a floor sit): the boat kit\'s deck grounds him and he '
                                      f'rides with the boat; nothing to build')
        continue
    root = spot(slug)
    if x['kind'] == 'stool':     # the seat under the hips of the root as finally placed
        hl, hf, fl, ff, _ = hips_of(x['model'], x['clip'])
        x['seat'] = at(root, x['facing'], hl, hf)
    else:                        # a floor sit: on the support under the root
        x['seat'] = root
    H = level_of(slug, x['seat'])
    if x['kind'] == 'stool':
        seat_h = round(min(0.58, max(0.40, x['seat_h'] - 0.06)), 2)
        what, why = 'stool', (f'painted seated with no seat in the map: choice: a stool 0.32 m square, top {seat_h} m '
                              f'({x["model"]}\'s {x["clip"]} puts the hip joint {x["seat_h"]} m above the soles, about '
                              f'0.06 m above the seat), centred under his hips')
    else:
        seat_h = 0.0
        what, why = 'ground', f'a floor sit ({x["model"]} {x["clip"]}) on {f["support"]} itself: nothing to build'
    seats[f['map_id']] = dict(X=round(x['seat'][0], 2), D=round(x['seat'][1], 2), H=round(H, 2), seat_h=seat_h, what=what,
                              facing_deg=round(x['facing'] % 360, 1), root=[round(root[0], 2), round(root[1], 2), round(H, 2)],
                              clip=f'{x["model"]} {x["clip"]}', support=f['support'], why=why)

# ---------------------------------------------------------------- the wish list (for the workshop and the lead)
WANT_STATE = {}
cwh = {}
for clip, by in sorted(wanted.items()):
    for c, slugs in sorted(by.items()):
        plan = set((J(f'characters/{c}.json', {}) or {}).get('clips', {})) if c in REG else set()
        state = ('being made' if clip in plan else 'NEW take' if WANT.get(clip, '').startswith('NEW') else
                 'with the new character' if c not in REG else 'to retarget (free)')
        now = sorted({people['figures'][s]['do'][0][0] for s in slugs if s in people['figures']} |
                     {w['clip'] for w in people['walkers'] if w['id'] in slugs})
        cwh.setdefault(clip, []).append(f'{c} [{state}]: {", ".join(slugs)}' + (f' (plays {"/".join(now)} now)' if now else ''))
people['clips_why'] = {
    'about': ('Actions the painting needs that the character its dress calls for lacks today. "to retarget (free)": a local '
              'retarget (from:/t2m:, catalogue 2a) onto that character; "NEW take": a Text to Motion take (catalogue 1c); '
              '"with the new character": the catalogue\'s new character gets it (1b); "being made": already in '
              'characters/<name>.json. Rerun make_people.py when they land; until then each figure plays the nearest clip '
              'its playing character has.'),
    **{clip: f'{WANT.get(clip, "")} -- ' + '; '.join(v) for clip, v in cwh.items()},
}
people['wanted'] = {
    'about': 'What S3 still waits for, by kind (the catalogue\'s items), with the figures each serves.',
    'characters': {ch: sorted(s for s in FIG if CF[s]['character'] == ch) for ch in sorted({CF[s]['character'] for s in FIG}) if ch not in REG},
    'takes': {k: sorted({s for c in wanted.get(k, {}).values() for s in c}) for k in WANT if WANT[k].startswith('NEW') and k in wanted},
    'props': {s: CF[s]['props'] for s in FIG if CF[s].get('props') and any(n.split(':')[0] in CF[s]['props'] and ': on' not in n for n in people['props_why'].get(s, '').split('; '))},
    'animals': {a: {k: CA[a][k] for k in ('model_wanted', 'load_wanted', 'clip_wanted') if k in CA[a]} for a in CA if any(k in CA[a] for k in ('model_wanted', 'load_wanted', 'clip_wanted'))},
}

# ---------------------------------------------------------------- checks
issues, expected = [], []
pos = {s: spot(s) for s in FIG if s not in WALKING}
lvl = {s: level_of(s, pos[s]) for s in pos}
ids = sorted(pos)
for i, a in enumerate(ids):
    for b in ids[i + 1:]:
        if (a in CREW) != (b in CREW) or a in RIDERS or b in RIDERS:
            continue
        if a in CREW and FIG[a]['support'].split(': ')[-1] != FIG[b]['support'].split(': ')[-1]:
            continue
        d = math.dist(pos[a], pos[b])
        if d < body_r(a) + body_r(b) - 0.03 and abs(lvl[a] - lvl[b]) < 0.5:
            (expected if a in CREW else issues).append(f'figures {a} and {b} {d:.2f} m apart' + (' (crew: placed by the boats page)' if a in CREW else ''))
deck_rows = []
for s in ids:
    if s in CREW or s in RIDERS:
        continue
    p = pos[s]
    f = FIG[s]
    if on_bridge(s):
        z = deck_z(p)
        s_, off = deck_s_off(p)
        if z is None:
            issues.append(f'figure {s} is off the built deck (station {s_:.2f}, {off:+.2f} m off the centre line; layout H {f["H"]}): it would stand below')
        else:
            inn = min(PL.wr(s_) + off, PL.wl(s_) - off)
            deck_rows.append((s, round(s_, 2), round(off, 2), round(z, 2), f['H'], round(inn, 2)))
            if z > f['H'] + 1.0:
                issues.append(f'figure {s}: the built deck ({z:.2f}) is {z - f["H"]:.2f} m above his layout H {f["H"]}: people.js\'s ray from H + 1.2 starts under it')
            elif abs(z - f['H']) > 0.5:
                expected.append(f'figure {s}: deck {z:.2f} vs layout H {f["H"]:.2f} ({z - f["H"]:+.2f}; within the drop limit)')
            if inn < 0.27 and CF[s].get('rail') != 'near':
                issues.append(f'figure {s} {inn:.2f} m inside a railing')
            if inn < 0.26:
                issues.append(f'figure {s} {inn:.2f} m inside a railing (on the railing\'s line)')
    else:
        if f['H'] < 0.5 and under_deck(p):
            z = deck_z(p)
            (issues if z > f['H'] + 1.0 else expected).append(
                f'figure {s} (ground) stands inside the built ramp\'s outline where its deck is {z:.2f} m high: ' +
                ('under the ramp (the ray from H + 1.2 starts below it)' if z > f['H'] + 1.0 else 'he stands on the ramp\'s foot'))
        if f['H'] < 0.5 and in_water(p) < 0.15 and not f['support'].startswith('boat'):
            issues.append(f'figure {s} {in_water(p):+.2f} m from the water (inside if -)')
    if poly_dist(p, AREA) > -0.2:
        moved_out = poly_dist((f['X'], f['D']), AREA) > 0 and f['map_id'] in CHOICES.get('moves', {})
        (expected if moved_out else issues).append(
            f'figure {s} {poly_dist(p, AREA):+.2f} m from the painted area\'s edge (outside if +)' +
            (' (moved there by a recorded move: ' + CHOICES['moves'][f['map_id']].get('why', '')[:90] + '...)' if moved_out else ''))
    for a, b in BODY.items():
        if same_level(lvl[s], animal_level(a)) and poly_dist(p, b['poly']) < 0.15:
            issues.append(f'figure {s} {poly_dist(p, b["poly"]):+.2f} m from animal {a}')
    if s in SEATED_FIXED:
        continue
    for name, kind, sh in obstacles_for(None, deck=on_bridge(s)):
        if (s, name.replace(' load', '')) in INSIDE_OK:
            if shape_dist(p, sh) < 0.1:
                expected.append(f'figure {s} {shape_dist(p, sh):+.2f} m from {name} ({INSIDE_OK[(s, name.replace(" load", ""))]})')
            continue
        dd = shape_dist(p, sh)
        if dd < (0.05 if sh[0] in ('disc', 'posts') else 0.1):
            issues.append(f'figure {s} {dd:+.2f} m from {name}')
# table tops under roots (people.js stands a figure on the highest hit of three rays at X, X +- 0.12 from H + 1.2)
tbl = []
for s in ids:
    if s in CREW or s in RIDERS:
        continue
    p = pos[s]
    for k, (sh, H, sup) in PROPSH.items():
        if not re.search(r'table|counter|stand|display|tray', k) or sh[0] == 'posts':
            continue
        if not same_level(lvl[s], H if not sup.startswith('bridge') else (deck_z(sh[1] if sh[0] in ('disc', 'rect') else p) or H)):
            continue
        if any(shape_dist((p[0] + dx, p[1]), sh) < 0 for dx in (-0.12, 0, 0.12)):
            tbl.append(f'{s} ({p[0]:.2f}, {p[1]:.2f}) over {k}')
for w in people['walkers']:
    for q in w['path']:
        if in_water(q) < 0.25 and not on_bridge(w['id']):
            issues.append(f'walker {w["id"]} path point {q} {in_water(q):+.2f} m from the water')
        if poly_dist(q, AREA) > -0.26:
            issues.append(f'walker {w["id"]} path point {q} outside the painted area')
an = sorted(BODY)
for i, a in enumerate(an):
    for b in an[i + 1:]:
        if same_level(animal_level(a), animal_level(b)) and polys_overlap(BODY[a]['poly'], BODY[b]['poly']):
            issues.append(f'animals {a} and {b} overlap (real size)')
    deck = ANIMALS[a].get('support', '').startswith('bridge')
    if deck:
        for q in BODY[a]['poly']:
            s_, off = deck_s_off(q)
            if s_ < 0 or s_ > PL.L or not (-PL.wr(min(PL.L, max(0, s_))) + 0.05 <= off <= PL.wl(min(PL.L, max(0, s_))) - 0.05):
                issues.append(f'animal {a}: a corner of its real-size body ({q[0]:.2f}, {q[1]:.2f}) is off the built deck (station {s_:.2f}, off {off:+.2f})')
                break
        z = deck_z(BODY[a]['c'])
        if z is not None and z > ANIMALS[a].get('H', 0) + 1.0:
            issues.append(f'animal {a}: the built deck ({z:.2f}) is above its layout H {ANIMALS[a].get("H")} + 1.0')
    for name, kind, sh in obstacles_for(None, deck=deck):
        if kind in ('building', 'vehicle', 'prop') and shape_hits(sh, BODY[a]['poly']):
            (expected if a == 'donkey_18048' and 'barrow' in name else issues).append(f'animal {a} overlaps {name} (real size)')
# crew: two on one boat closer than two bodies (the page places both at their layout spots on the deck)
crew_close = []
for i, a in enumerate(sorted(CREW)):
    for b in sorted(CREW)[i + 1:]:
        if FIG[a]['support'].split(': ')[-1] == FIG[b]['support'].split(': ')[-1] and abs(FIG[a]['H'] - FIG[b]['H']) < 0.5 \
                and a not in WORKERS and b not in WORKERS:
            d = math.dist(spot(a), spot(b))
            if d < 0.48:
                crew_close.append(f'{a} / {b} {d:.2f} m ({FIG[a]["support"].split(".")[-1]})')

people['builder_notes'].update({
    'about': 'What this casting assumes of the build, and what it found (rerun after each build).',
    'bridge': (f'the deck as kit_rainbow_bridge.plan_only fits it with bridge_params.json: {PL.L:.2f} m foot to foot, '
               f'{PL.wl(PL.L / 2) + PL.wr(PL.L / 2):.2f} m between the railings, crown {PL.prof["Hc"]:.2f} m'
               + (f'; bridge_plan.json agrees ({BRIDGE_PLAN["summary"]["length_m"]} m)' if BRIDGE_PLAN else '')
               + f'; railing leaners {RAIL_GAP} m inside the near railing, everyone else {DECK_IN} m inside'),
    'seats_json': 'seats.json X, D is the seat\'s centre under the hips; build each stool there (non-colliding)',
    'table_tops': 'roots over a table, counter or stand at its assumed size (people.js would stand the figure on it): ' + ('; '.join(tbl) if tbl else 'none'),
    'vehicles': 'the barrows as kit_vehicles._barrow (collider 0.3 m in from each end, +-0.53 m; the load over the wheel), the sedan as sedan_chair(carried) (cabin 0.92 x 0.78 at the poles\' middle), the handcart a 1.2 m wide box rear to front (the area builder\'s)',
    'props': ('sizes from gen/sections/rainbow_bridge/props_table.json args' if PROPS_TABLE else
              'props_table.json not landed: typical real sizes by kind (choice, make_people.prop_shape); rerun when it lands'),
    'crew_close': crew_close,
    'walker_start_height': ('people.js takes a walker\'s start height' if WALKER_START_H else
                            'people.js starts walkers at y 0 (ray from 1.5 m): deck walkers above 1.3 m stand; proposed fix in walkers_why.deck'),
})
OUT = os.path.join(QM, f'sections/{FOLDER}/people.json')
json.dump(people, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(seats, open(os.path.join(HERE, 'seats.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- report
nf, nw = len(people['figures']), len(people['walkers'])
print(f'{nf} figures at their spots, {nw} walkers ({nf + nw} of {len(FIG)}), {len(people["animals"])} animals '
      f'(of {len(ANIMALS)}); stand-ins {sum(1 for x in list(people["figures"].values()) + people["walkers"] if x.get("stand_in"))}, '
      f'recast {sum(1 for s in FIG if MODEL[s][1] == "recast")}; riders {len(RIDERS)}; children {len(CHILD_SCALE)}; crew {len(CREW)}')
print('cast (wanted):', dict(Counter(CF[s]['character'] for s in FIG).most_common()))
print('playing now:', dict(Counter(MODEL[s][0] for s in FIG).most_common()))
for w in people['walkers']:
    print(f'  walk {w["id"]}: {w["clip"]} {sum(math.dist(w["path"][i], w["path"][i + 1]) for i in range(len(w["path"]) - 1)):.1f} m  {people["walkers_why"][w["id"]]}')
for s, (ln, why) in WALK_STAND.items():
    print(f'  stands {s}: {why}')
for a, pth in ANIMAL_PATH.items():
    print(f'  animal walk {a}: {math.dist(*pth):.1f} m  {ANIMAL_WALK[a]}')
print('rail:', len(RAIL_INFO), '; '.join(f'{k}: {v}' for k, v in RAIL_INFO.items() if 'off the built deck' in v))
print('inside buildings (for cast.json inside):', sorted(inside_report) or 'none')
print('expected:')
for x in expected:
    print('   ', x)
print(f'checks: {len(issues)}')
for x in issues:
    print('   ', x)
print('table tops under roots:', tbl or 'none')
print('crew closer than 0.5 m:', crew_close or 'none')
print('nudges:', len(people['nudge_why']), ' largest:', ', '.join(f'{s} {math.hypot(*people["figures"][s]["nudge"]):.2f}' for s in sorted(people['nudge_why'], key=lambda s: -math.hypot(*people['figures'][s]['nudge']))[:8]))
print('animal nudges:', {a: CA[a].get('nudge') for a in CA if CA[a].get('nudge')})
print('wanted clips:', ', '.join(k for k in people['clips_why'] if k != 'about'))
print('seats.json:', len(seats) - 1, 'entries;', Counter(v['what'] for k, v in seats.items() if k != 'about'))
print('boats:', {k: sorted(v) for k, v in people['boats'].items()}, '| people_boats.json', 'merged' if PEOPLE_BOATS else 'not landed')
print('inputs: props_table', bool(PROPS_TABLE), '| river_plan', bool(RIVER_PLAN), '| bridge_plan', bool(BRIDGE_PLAN), '| boats manifest', bool(BOATS_MAN),
      '| walker start height', WALKER_START_H)
print('wrote', os.path.relpath(OUT, QM), 'and', os.path.relpath(os.path.join(HERE, 'seats.json'), QM))
