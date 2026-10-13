"""Writes qingming/characters/contacts.json: the contact rules as data (gen/details/brief_contacts.md step 4).
Rerun after editing the table below; every clip `node tools/clips_used.mjs` lists must have a rule."""
import json, os, subprocess, sys

QM = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..'))

def C(site, target, gap=0.03, pen=0.03, hold=0.9, feature=None, why=None, soft=False):
    r = {"site": site, "target": target, "gap_m": gap, "pen_m": pen, "hold": hold}
    if feature: r["feature"] = feature
    if soft: r["soft"] = True
    if why: r["why"] = why
    return r

def palms(target, **kw): return [C("palm_L", target, **kw), C("palm_R", target, **kw)]
def soles_floor(gap=0.03, pen=0.03, sides=("L", "R")): return [C(f"sole_{s}", "floor", gap=gap, pen=pen, hold=0.75) for s in sides]
def chair(extra=(), feet=("L", "R")): return [C("seat", "seat", gap=0.03, pen=0.02, hold=0.9)] + soles_floor(sides=feet) + list(extra)
def floor_sit(extra=()): return [C("seat", "floor", gap=0.04, pen=0.03, hold=0.9)] + list(extra)

CLIPS = {
  # ---- carrying vehicles
  "sedan_carry": ("stand", [C("shoulder_R", "vehicle", feature="pole", why="the pole rests on his right shoulder (prompt motion_sedan_carry)"),
                            C("palm_L", "vehicle", feature="pole"), C("palm_R", "vehicle", feature="pole")],
                  "the shoulder top on a pole <= 3 cm and both palms on the same pole <= 3 cm (plan)"),
  "reach_up_load": ("stand", palms("vehicle", gap=0.05, pen=0.03, hold=0.6, soft=True), "the fend_pole take: under the back of a cart bed, both arms up steadying the load (make_people.py)"),
  # fix-S4 (2026-10-13): the take bends to grip the figure's OWN carrying pole low and lift it (S4's youth_bending_11138, the
  # only one who plays it: "a long carrying pole lies over his right shoulder and slopes down east to the top of the tied
  # bundle"); that pole is a carried prop (people.json props_why "wanted"), never a vehicle's pole, so there is no built
  # object for the hands to touch (the old rule measured his palms against a sedan chair 2.7 m away)
  # IK clip variants (tools/ik_clip.mjs, characters/ik_variants.json) take their base clip's rule unless listed here
  "write~table": ("chair", chair([C("palm_L", "table", gap=0.03, pen=0.02, hold=0.7), C("palm_R", "table", gap=0.03, pen=0.02, hold=0.7)]),
                  "write with both palms on the table top (the fortune-teller: arms spread on his table over his papers)"),
  "browse~bearded_man_10142": ("stand", [C("palm_L", "table", gap=0.10, pen=0.03, hold=0.5, soft=True)],
                               "S4's bearded man bending toward the big basket, \"his left hand reaching out low to the goods\" (map): the left palm in the heap"),
  "listen~table": ("chair", chair([C("forearm_L", "table", gap=0.04, pen=0.02, hold=0.7), C("forearm_R", "table", gap=0.04, pen=0.02, hold=0.7)]),
                   "sit_listen leaning forward with both forearms on a table (the fortune-teller's client)"),
  "sedan_carry~pole_ends": ("stand", [C("palm_L", "vehicle", feature="pole"), C("palm_R", "vehicle", feature="pole")],
                            "the front bearer between the pole ends, a hand on each pole (no pole on his shoulder)"),
  # fix-river (2026-10-13): S2's pennant_pole_holder_27810 holds up the lower end of the pennant frame's west pole, which the
  # builder builds (S2.prop.pennant_frame_27930, its held end at his hands), so he carries no pole of his own (no pole_far):
  # both palms on that built pole
  "fend_pole~pennant_pole_holder_27810": ("stand", [C("palm_L", "structure", gap=0.03, pen=0.03, hold=0.7), C("palm_R", "structure", gap=0.03, pen=0.03, hold=0.7)],
                                          "both palms on the pennant frame's built west pole, holding up its lower end (map: \"holding up in both hands the lower end of the long pole\")"),
  # fix-bridge (2026-10-13): S3's cart_puller_19870 hauls the north-bank handcart by its shaft tips; the props kit's shafts are
  # 0.96 m rods, which steer's rule (poles: rods >= 1.5 m) doesn't take: both palms on the handcart's surface (its shafts)
  # fix-bridge (2026-10-13): S3's front bearer plays the pole_ends setup (between the pole ends facing the chair, a hand on
  # each end) fitted to the S3 poles' slope: its rule is pole_ends' (palms only)
  "sedan_carry~sedan_bearer_front_18838": ("stand", [C("palm_L", "vehicle", feature="pole"), C("palm_R", "vehicle", feature="pole")],
                                           "S3's front bearer between the pole ends, a hand on each pole (no pole on his shoulder)"),
  "steer~cart_puller_19870": ("stand", [C("palm_L", "vehicle", hold=0.6), C("palm_R", "vehicle", hold=0.6)],
                              "S3's handcart puller between its shaft tips, a hand on each shaft (the kit's shafts: 0.96 m rods)"),
  # fix-gate (2026-10-13): S5's groom_8167 "bends to hold the bridle, has a short stick or whip in his other hand" (map): only
  # the right hand is at the bit (bridle~groom_8167 pins that hand alone)
  "bridle~groom_8167": ("stand", [C("palm_R", "animal", gap=0.04, pen=0.02, hold=0.8, why="right hand at the bit")],
                        "S5's groom at the rider's donkey's head: the right hand at the bit, a stick in the other (map)"),
  # fix-gate (2026-10-13): the 串车's two carters (S5) hold its shafts and handles, the kit's bent rails (blender/kit_vehicles.py
  # _barrow), which the rod finder doesn't take for poles (it finds the straight draught pole between the front carter's feet):
  # steer's palms on the vehicle's surface there
  "idle~cart_shaftman_8498": ("stand", palms("vehicle"), "the 串车's front carter standing between its front shafts, a hand on each (the barrow's rails; idle's hands hang at the shafts' place)"),
  "steer~cart_pusher_8254": ("stand", palms("vehicle", hold=0.6), "the 串车's rear carter gripping its rear handles (the barrow's rails), a hand on each (hold 0.6 as steer: the take's whip lift turns the shoulder away)"),
  # fix-s4b (2026-10-13): S4b's man_bending_to_donkey_13440 "bending forward ... with both arms reaching out over the small
  # donkey's back" (map): lean_over's hands rest on the donkey's back, not on a rail (none is painted there)
  "lean_over~man_bending_to_donkey_13440": ("stand", palms("animal", gap=0.04, pen=0.02, hold=0.8),
                                            "S4b's man bending over the small donkey, both hands resting on its back (map)"),
  # fix-s4b (2026-10-13): S4b's man_big_hat_12895 stands against the small horse's far flank, both hands laid on its
  # withers (idle + IK: the bridle take is out of reach of a small horse)
  "idle~man_big_hat_12895": ("stand", palms("animal", gap=0.04, pen=0.02, hold=0.8),
                             "S4b's man in the big hat holding the small horse at its withers, both hands on it"),
  "lift_pole": ("stand", [], "bending to grip his own carrying pole (a self-prop: wanted, its far end on the tied bundle) and lift it"),
  # fix-S4 (2026-10-13): palms on the vehicle where it is pushed, its push bar or handles where it has them, else its body
  # (S4's man_cart_tail_10405 pushes the covered cart's tail, which has no bar): the vehicle's nearest visible surface, a
  # bar included (the old feature "rod" measured him against the cart's frame rails)
  "push": ("stand", palms("vehicle"), "both palms on the vehicle <= 3 cm: its push bar or handles, else its body (a cart's tail); library 261 Push and Walk Forward"),
  "steer": ("stand", palms("vehicle", feature="pole", hold=0.6), "between two wagon shafts, a shaft in each hand at waist height (steer_shafts; the right hand lets go to whip: hold 0.6)"),
  "drive_cart": ("chair", [C("seat", "seat", gap=0.04, pen=0.03, why="sits on the front edge of a cart, feet hanging")], "the seat on the cart's edge (the vehicle's surface under the seat point); feet hang"),
  # ---- animals
  "push_flank": ("stand", palms("animal", gap=0.02, pen=0.01, hold=0.8), "palms on the animal's surface, gap <= 2 cm, penetration <= 1 cm (plan)"),
  "bridle": ("stand", [C("palm_R", "animal", gap=0.04, pen=0.02, hold=0.8, why="right hand at the bit"), C("palm_L", "animal", gap=0.03, pen=0.02, hold=0.8, why="left hand on its neck")], "hold_bridle: the right hand on the bridle at the bit, the left on the neck"),
  "hold_horse_neck": ("stand", [C("chest_front", "animal", gap=0.06, pen=0.03, hold=0.8)] + palms("animal", gap=0.05, pen=0.02, hold=0.8), "hugging a lowered neck, cheek close to it"),
  "girth": ("stand", palms("animal", gap=0.05, pen=0.02, hold=0.7), "both hands low under the belly pulling a strap"),
  "drive_donkeys": ("stand", [C("palm_L", "animal", gap=0.03, pen=0.02, hold=0.8, why="the left palm flat on a load beside him")], "palm on the animal's load"),
  "ride": ("ride", [C("seat", "ridden", gap=0.04, pen=0.04, hold=0.9)], "the seat point on the saddle seat (plan); the page puts the hips 0.09 m over the saddle point"),
  "ride_side": ("ride", [C("seat", "ridden", gap=0.04, pen=0.04, hold=0.9)], "seated sideways on the animal (turned 90 deg)"),
  "ride_fan": ("ride", [C("seat", "ridden", gap=0.04, pen=0.04, hold=0.9)], "astride, fan in hand"),
  # ---- seats (chairs, stools, benches)
  "sit": ("chair", chair(), "the seat point 0-3 cm above a seat top and soles on the ground <= 3 cm (plan)"),
  "sit_talk": ("chair", chair(), "library 307 Sitting Answering Questions"),
  "drink": ("chair", chair(), "library 343 Sit and Drink: a chair sit"),
  "listen": ("chair", chair(), "sit_listen: on a low bench, forearms on the knees"),
  "write": ("chair", chair([C("palm_L", "table", gap=0.03, pen=0.02, hold=0.7, why="the left hand flat on the desk holding the paper")]), "on a stool at a desk"),
  "tell_fortune": ("chair", chair([C("forearm_L", "table", gap=0.04, pen=0.02, hold=0.6), C("forearm_R", "table", gap=0.04, pen=0.02, hold=0.6)]), "behind a table, both forearms resting on it"),
  "sit_point": ("chair", chair(), "on a low stool, feet flat"),
  "sit_hold_child": ("chair", chair(), "on a low bench, knees together, feet flat (child_on_lap is a self-prop)"),
  "lean_over_seated": ("chair", chair([C("forearm_L", "table", gap=0.04, pen=0.02, hold=0.6), C("forearm_R", "table", gap=0.04, pen=0.02, hold=0.6)]), "on a low bench, forearms on something waist-high in front"),
  "knee_on_stool": ("chair", chair(feet=("L",)), "on a stool at knee height, left foot flat, the right heel on the stool"),
  # ---- floor sits, lying, kneeling
  "sit_floor": ("floor", floor_sit(), "library 363 cross-legged on the floor: the seat on the surface under it (ground, deck or floor)"),
  "knees_up": ("floor", floor_sit(), "sits on the ground, knees drawn up"),
  "doze_knees": ("floor", floor_sit(), "sits on the ground, head on the knees"),
  "sit_one_knee": ("floor", floor_sit(), "sits on the ground, one knee up"),
  "sit_offer": ("floor", floor_sit(), "cross-legged on the ground holding a bowl up"),
  "show_goods_seated": ("floor", floor_sit(), "the sit_offer take: cross-legged on the ground"),
  "tiller_seated": ("floor", floor_sit([C("palm_R", "boat", gap=0.04, pen=0.03, hold=0.7, feature="tiller")]), "on the deck gripping the tiller bar (fix-boats: the right hand on the boat's tiller)"),
  "lie_wave": ("lie", [C("seat", "floor", gap=0.05, pen=0.04, hold=0.9)], "half lying on the ground"),
  "sleep_side": ("lie", [C("seat", "floor", gap=0.06, pen=0.04, hold=0.9)], "lying on the right side"),
  "kneel_sleep": ("kneel", [], "kneels, head on a low box: no knee site; universal checks only"),
  # ---- leaning on rails, walls, counters, posts
  "lean_chin": ("stand", [C("elbow_L", "rail", gap=0.04, pen=0.03, hold=0.8), C("elbow_R", "rail", gap=0.04, pen=0.03, hold=0.8)], "both elbows on the rail, chin on the hands (lean_chin_on_hands)"),
  "lean_over": ("stand", palms("rail", gap=0.03, pen=0.03, hold=0.8), "both hands resting on a waist-high edge, wide apart"),
  "reach_over_rail": ("stand", [C("belly", "rail", gap=0.05, pen=0.03, hold=0.8)], "bends double over a waist-high rail, the hips at the rail"),
  "beckon_lean": ("stand", [C("forearm_L", "rail", gap=0.04, pen=0.03, hold=0.8)], "the left forearm flat along a bar at waist height"),
  "pour_bucket": ("stand", [C("belly", "rail", gap=0.08, pen=0.03, hold=0.6, soft=True)], "at a waist-high edge bending over it (the bucket is a self-prop)"),
  "lean_wall": ("stand", [C("back", "wall", gap=0.04, pen=0.03, hold=0.8)], "lean_wall_idle: back and shoulders against a wall"),
  "arms_folded": ("stand", [C("back", "wall", gap=0.04, pen=0.03, hold=0.8)], "the same take as lean_wall (lean_wall_idle): leaning back on a wall, arms folded"),
  "lean_post_talk": ("stand", [C("back", "wall", gap=0.04, pen=0.03, hold=0.8)], "shoulders against a tall post behind him"),
  "climb_ladder": ("stand", palms("structure", gap=0.04, pen=0.03, hold=0.6), "hands on rungs in front of the face (a boat's ladder: the boat is in the checks since fix-boats)"),
  # ---- work at tables, blocks, goods
  "chop": ("stand", [C("palm_L", "table", gap=0.03, pen=0.02, hold=0.7, why="the left hand presses the meat on the block")], "chop_meat at a waist-high block (the cleaver is a self-prop)"),
  "browse": ("stand", palms("table", gap=0.10, pen=0.03, hold=0.5, soft=True), "reaching into goods on a low table (into the goods: loose)"),
  "reach": ("stand", palms("table", gap=0.08, pen=0.03, hold=0.5, soft=True), "child_reach: arms across a chest-high table top"),
  "wheelwright": ("stand", [C("palm_L", "structure", gap=0.04, pen=0.03, hold=0.7, why="the left hand presses the wheel's rim at knee height")], "hammer_rim over a wheel lying at his feet"),
  "bucket_lift": ("stand", [], "the bucket is a self-prop (prop_bucket_pour)"),
  "draw_water": ("stand", [], "hauls a rope out of a well: the rope is not built"),
  # ---- boats (fix-boats, 2026-10-13: the boats are in the checks, gen/sections/<name>/boat_owners.*, posed at the dump's
  # instant and at frozen clock times; target "boat": the crew member's own boat, by feature: sweep (the sweep node: loom
  # and bar), oar (its oar node), tiller (the body's rods at pt_tiller), line (the boat's ropes: line_* and rope pieces);
  # target "pole": the figure's own carried pole (tools/prop_tracks.mjs: the prop's axis, less its radius); target
  # "water": a pole end at or under the water surface, or on whatever surface is under it (deck, bank, bed), never
  # floating; target "reach": the end on the nearest surface that is not its own boat (a bank, a bridge, another boat) or
  # the water)
  "work_sweep": ("stand", palms("boat", gap=0.04, pen=0.03, hold=0.7, feature="sweep"), "both hands on the sweep's loom or crossbar (the sweep node), pushing it across chest-high"),
  "row": ("stand", palms("boat", gap=0.04, pen=0.03, hold=0.7, feature="oar"), "both hands on an oar's loom (its oar node)"),
  "pole_boat": ("stand", [C("pole_lo", "water", gap=0.05, pen=0.05, hold=0.8, why="the pole's foot in the water (or on the bed, a bank, a deck), never in the air")]
                + palms("pole", gap=0.04, pen=0.03, hold=0.8), "poling: both hands on the pole (self-prop long_pole_low), its foot in the water; palms within 0.04 m of the pole's surface (the palm site is the hand's middle: a hand round a 4 cm pole holds it 1.5-3 cm off, and the hands slide along it as they push)"),
  "fend_pole": ("stand", [C("pole_far", "reach", gap=0.10, pen=0.05, hold=0.5, soft=True, why="the far end on what it fends off (a bank, a bridge, another boat) or in the water")]
                + palms("pole", gap=0.04, pen=0.03, hold=0.7), "fending off: both hands on the pole (self-prop long_pole_mid) held up, its far end on what it fends off; palms within 0.04 m of the pole's surface (as pole_boat)"),
  "stand_pole": ("stand", [C("pole_lo", "water", gap=0.05, pen=0.05, hold=0.8, why="the pole's foot on the floor or in the water")]
                 + [C("palm_R", "pole", gap=0.03, pen=0.03, hold=0.8)], "pole upright, its foot on the floor (self-prop long_pole), the right hand on it"),
  "tow_walk": ("walk", [], "tracker walking as he hauls a tow rope (fix-boats: a walk, so its soles are not judged mid-stride; the tow line on the lead tracker is checked by contact_check's boat crews)"),
  "haul_line": ("stand", palms("boat", gap=0.05, pen=0.03, hold=0.6, feature="line"), "hauling a rope of its boat (fix-boats: a line_* rope, a stay or a rope piece of its own boat)"),
  "hold_rope": ("stand", [], "a lead rope behind him: not built"),
  "lead": ("stand", [], "lead_camel_walk: a lead rope over the shoulder: not built"),
  "drive_team": ("stand", [], "reins: not built"),
  "hold_whip": ("stand", [], "whip: self-prop"),
  "stand_whip": ("stand", [], "whip: self-prop"),
  "walk_whip": ("stand", [], "whip: self-prop"),
  # ---- carried things (self-props)
  "carry_pole": ("stand", [], "pole and loads: self-props"),
  "back_load": ("stand", [], "back load: self-prop"),
  "sack_carry": ("stand", [], "sack: self-prop"),
  "bucket_shoulder": ("stand", [], "bucket: self-prop"),
  "shoulder_box": ("stand", [], "box: self-prop"),
  "hold_tray": ("stand", [], "tray: self-prop"),
  "walk_hold_chest": ("stand", [], "bundle: self-prop"),
  "rest_on_stick": ("stand", [], "the stick props the load: self-prop"),
  "carry_child": ("stand", [], "child_on_back / child_on_shoulders: self-props (the children brief)"),
  "hold_child": ("stand", [], "child_in_arms: self-prop"),
  "examine_child": ("stand", [], "hands at a child's wrist held up before him: the child is not built"),
  "show_garment": ("stand", [], "the robe is not built"),
  "hand_over": ("stand", [], "the paper is not built"),
  "bend_goods": ("stand", [], "hands rest on his own knees, peering at goods (open_sack is a self-prop)"),
  "draw_bow": ("stand", [], "bow: self-prop"),
  # ---- no contact: stand, gesture, walk
  **{c: ("stand", [], "no contact") for c in ["idle", "look", "talk", "chat", "argue", "point", "point_way", "crane", "chin", "hail", "bow", "bind",
       "tie_kerchief", "fan", "stand_sleeves", "lunge_arms_wide", "wave_arms", "look_up", "tell", "listen_stand"]},
  "crouch": ("squat", [], "library 258 crouch: soles on the ground (universal)"),
  "squat_sleeves": ("squat", [], "squats on his heels: soles on the ground (universal)"),
  **{c: ("walk", [], "walking: universal checks at the dump instant only") for c in ["walk", "run", "quick", "stroll", "chase_run", "fan_walk", "stride_stick", "play"]},
}
CLIPS.pop("listen_stand")

POSTURES = {
  "stand": "standing: stance soles on the surface under them; standing-on-furniture and body checks apply",
  "squat": "squatting or crouching: soles on the surface (a looser stance check), body checks apply",
  "walk": "walking: checked at the dump instant (soles not judged: mid-stride)",
  "chair": "seated on a raised seat: the seat rule replaces the stance soles; the seat owner is exempt from the body checks",
  "floor": "seated on the floor: the seat on whatever surface is under it (ground included)",
  "lie": "lying: the hips on the surface",
  "kneel": "kneeling: no stance check",
  "ride": "on an animal: placed by the page every frame; seat on the ridden animal's back",
}

TARGETS = {
  "vehicle": "the vehicle (S*.veh.*) in the figure's map group, else the nearest vehicle owner within 4 m; feature 'rod': its long thin pieces found by connectivity (push bars, handles, rails: >= 0.5 m long, <= 0.08 m thick), 'pole': the same >= 1.5 m long (sedan poles, shafts); distance to the piece's axis minus its radius. Without a feature: the vehicle's nearest visible surface",
  "seat": "the highest non-ground surface (any owner, collide or not, visible) under the seat point, from 0.15 m above it; none = the ground (sits on air): gap = seat - ground",
  "floor": "the highest surface under the site from 0.15 m above it, the ground included",
  "rail": "the nearest visible non-ground surface (structures, buildings, props, vehicles) within 0.6 m of the site; signed (inside a closed piece = negative)",
  "wall": "as rail",
  "table": "as rail",
  "structure": "as rail",
  "animal": "the people.json animal in the figure's map group (S*.ani.*), else the nearest within 4 m: its posed mesh (body + its load's tack) at the page's spot, yaw and scale (frame 0 of its current clip); signed by vertical-ray parity",
  "ridden": "the animal the rider sits on (people.json ride): its posed mesh with its load",
  "self-prop": "a carried prop bound to the clip by construction: skipped",
  "boat": "fix-boats: the crew member's own boat (people_dump boats: its root and node matrices at the instant; gen/sections/<name>/boat_owners.*), by feature: sweep (the sweep node's visible pieces), oar (the oar nodes), tiller (the body's rods within 0.35 m of pt_tiller), line (its line_* ropes as segments less their radius, and its rope pieces); without a feature its nearest visible piece",
  "pole": "fix-boats: the figure's own carried pole (people.json props long_pole*; tools/prop_tracks.mjs): distance to its axis less its radius",
  "water": "fix-boats: a pole end (site pole_lo, the lower end) under or at the water surface, or on the highest visible surface under it (deck, bank, ground): gap = height over that surface (0 under the water); a solid surface above the water counts with penetration",
  "reach": "fix-boats: a pole end (site pole_far, the end away from the right hand) on the nearest visible surface that is not its own boat or body (a bank, a bridge, another boat), or at the water surface",
}

UNIVERSAL = {
  "stance_soles": {"postures": ["stand", "squat"], "gap_m": 0.03, "pen_m": 0.04, "squat_gap_m": 0.05,
                   "how": "per sample the lower sole's height over the highest surface under it (from 0.25 m above the sole); judged on the median over every clip of the cycle"},
  "furniture": {"raise_m": 0.05, "how": "root H minus the ground owner's height under the root, when the map support is ground (or none); the owner the root stands on is named"},
  "order": {"diff_m": 0.05, "how": "the root as placed (dump) vs the ground hook with every section loaded (tools/place_predict.mjs): a figure placed before a neighbour section streamed in stands elsewhere when the world loads in another order"},
  "body_cylinder": {"r_m": 0.26, "band_m": [0.15, 1.6], "fail_overlap_m": 0.10, "warn_overlap_m": 0.03,
                    "how": "collide triangles (edge walls left out) within BODY_R of the root's vertical axis in plan, inside the height band above the root; the figure's own contact targets and seat are exempt"},
  "head_inside": {"pen_m": 0.02, "how": "head_top inside any visible closed piece (collide or not: roofs are nocol): odd vertical-ray parity up and down on that owner, depth = distance to its nearest triangle; over the cycle"},
  "site_inside": {"pen_m": 0.02, "sites": ["palm_L", "palm_R", "forearm_L", "forearm_R", "elbow_L", "elbow_R", "chest_front", "back", "belly", "shoulder_L", "shoulder_R", "hips", "seat"],
                  "how": "a body site inside a visible closed piece of a collide owner (walls, tables, cabins, other vehicles), deeper than pen_m, over the cycle; the clip's own contact targets allow their pen_m"},
}

used = json.loads(subprocess.check_output(["node", os.path.join(QM, "tools/clips_used.mjs"), "--json"], cwd=QM))
all_used = sorted({c for v in used.values() for c in v["used"]})
for c in all_used:   # an IK variant "<base>~<variant>" not listed takes its base's rule
    if c not in CLIPS and "~" in c and c.split("~")[0] in CLIPS:
        p_, cs_, w_ = CLIPS[c.split("~")[0]]
        CLIPS[c] = (p_, cs_, f"IK variant of {c.split('~')[0]} (characters/ik_variants.json): {w_}")
missing = [c for c in all_used if c not in CLIPS]
if missing:
    sys.exit(f"no rule for: {missing}")
out = {
  "about": "Contact rules as data (gen/details/brief_contacts.md; tools/contact_check.mjs reads them). clips.<clip>: posture, contacts "
           "[{site, target, feature?, gap_m, pen_m, hold}], why. A contact PASSes when, over every sample of the clip at 10 Hz, the "
           "signed distance (gap > 0, penetration < 0) stays <= gap_m and >= -pen_m for at least `hold` of the cycle (the hold-quantile). "
           "Sites: tools/joint_tracks.mjs. Written by gen/details/contacts/tools/make_contacts_json.py.",
  "postures": POSTURES, "targets": TARGETS, "universal": UNIVERSAL,
  "clips": {c: {"posture": p, "contacts": cs, "why": w} for c, (p, cs, w) in sorted(CLIPS.items())},
}
with open(os.path.join(QM, "characters/contacts.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1, ensure_ascii=False)
print(f"contacts.json: {len(CLIPS)} clips ({sum(1 for v in CLIPS.values() if v[1])} with contacts), every one of {len(all_used)} used clips has a rule")
