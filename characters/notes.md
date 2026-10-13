# Characters: the record

How to run everything: the skill `characters` (`.claude/skills/characters/SKILL.md`). This file says what was made,
from which figure, what it cost and what we found.

## The cast (2026-10-10)

Every character is a figure in the gate section, cropped from the registered restyle (`gen/sections/gate/mosaic.jpg`).

| Character | Scroll figure | Look | Clips |
|---|---|---|---|
| official | the tax official seated at his desk (tax_official) | warm-grey robe, black futou | walk, idle (243), sit (33), sit_talk (307), **write** |
| inspector | the inspector outside the office (tax_inspector) | indigo knee robe, white trousers, sandals | walk, idle, talk (314), argue (308), **point** |
| carter | the carter handing over the manifest (tax_carter_manifest) | ochre-brown robe, brown head-wrap | walk, idle, gape (333), push (261), carry (551), **hand_over** |
| camel_driver | the caravan's driver inside the gate (camel_driver) | grey-blue tunic, indigo mantle, hair bun | walk, idle, stroll (30), look (338), **lead** |
| sightseer | the scholar leaning on the bridge railing (bridge_sightseer) | cornflower-blue robe, futou | walk, run, idle, look (336), chat (56), stroll (121), **lean_chin** |
| idler | a labourer in the group by the wall (wall_idler_white) | off-white hemp jacket and trousers, dark head-wrap | walk, run, idle, chat (56), sit_floor (363), quick (115), **lean_wall**, **lean_chin** |
| porter | B1 style test, 2026-10-09 (gen/v1) | hemp jacket, indigo trousers | walk, run, idle, carry (552) |
| townsman | B1 style test, 2026-10-09 (gen/v1) | slate-grey robe, futou | walk, idle, talk (313), look (336) |

Numbers are Meshy library action ids; every 'idle' is Idle 3 (243) since the clip audit below. **Bold** clips are custom
Text to Motion actions (`characters/motions.json`).

## Run 1 (2026-10-10)

- **Sheets:** 6 turnaround sheets with `prompts/char_turnaround.txt`, one shyfai batch (about 35 s each). All six kept the
  figure's clothes, colours and headwear, and split cleanly into three views. The side views face right although the
  prompt asks for left; Meshy doesn't mind.
- **Meshes:** Smart Topology 4k + 3-view retexture + rig for all six in parallel, about 6 minutes. Each is about
  4.2k triangles on one mesh, 24 bones, 250–370 KB as a web GLB.
- **Custom actions:** 6 prime motions (10 credits each) and one swift (3) for comparison, each about a minute.
  Retargeted onto their characters (3 credits each).
- **Credits:** 851 → 524 for the whole run (meshes about 180, motions 63, clips about 84), then 3 more for the idler's
  railing lean (521 left).

## What the custom actions are worth (frame sheets in `gen/characters/<name>/clips.jpg`)

- **write_at_desk** (official): a chair sit with the right hand making small strokes on a desk top and the left hand
  resting. Reads as writing once he sits behind the desk.
- **lean_on_rail** (sightseer, idler): forearms folded on a rail at about 1.1 m, the body leaning on it, the head turning.
  On the bridge railing (top rail 1.02–1.08 m) it reads exactly as the painting's fish-watchers.
- **point_and_argue** (inspector): points ahead and to the left, then shakes an open palm.
- **hand_over_paper** (carter): both hands at the chest, a small step forward with a bow, back, hands clasped.
- **lead_camel_walk** (camel_driver): a slow walk with one arm trailing back as if holding a rope. No rope prop yet.
- **lean_wall_idle** (idler): stands with arms crossed and glances around; the lean against the wall barely shows.
- **lean_on_rail swift**: unusable (arms thrown overhead, 16 s instead of 8). Dropped; use prime only.
- **Run 2 (same day):** on the bridge lean_on_rail looked like falling into the railing (a stiff plank from the feet),
  and lean_on_rail_v2 ("bends forward from the waist") was steeper still. **lean_chin_on_hands** ("elbows on the rail,
  chin on clasped hands, feet under his hips") reads right and replaced both on the sightseer and the idler. Every
  character also got the rig's free run clip, so any of them can be the player. 32 more credits (489 left).

Limits found: no props (brush, paper, rope, the porter's pole and baskets), contacts are only implied (the character
has to be placed against the rail, desk or wall), text-to-motion clips don't loop cleanly (people.js cross-fades them
into themselves), and floor sits come out hovering (people.js grounds every clip at load).

## Clip audit (2026-10-10, evening)

The user saw people walking "like zombies". Frame sheets of every walk and standing action
(`gen/characters/audit_walks/`, front and side) found:
- **Carry walks without the load are the zombies.** Carry Heavy Object Walk (551, carter) holds both arms straight
  out in front; Carry Water Bucket Walk (552, porter) bends double to the ground every few steps and barely walks.
  Thoughtful Walk (121, sightseer 'stroll') hangs the head with limp arms. None of them walks in people.json any more.
  Carrying comes back with props (shoulder pole, baskets, a box) and a carry walk that matches them.
- **The library's default Idle (0) is a fidget**: weight on one leg, a turn to look behind with one arm flung out.
  Every character now has **Idle 3 (243)**, a calm, upright stand with small weight shifts (10 s loop), checked on
  the townsman first (`townsman_idle243.jpg`), then fetched for the other seven. 24 credits: 489 -> 465.
- Look Around Dumbfounded (333, carter 'gape') turns its back and gapes: out of every cycle.
- Fine: the rig walk, Casual Walk (30), Quick Walk (115), the talks (313, 314), Talk Passionately (308), Stand and
  Chat (56), Long Breathe and Look Around (336), the floor and chair sits and the custom actions.
- Choosing library clips: download the preview GIFs (`preview_url` in `reference/meshy/animation_library.json`;
  free) into `gen/meshy_previews/` and look at frames before paying 3 credits a character. Of the idles, 243, 244,
  247, 249 and 252 are calm; 0, 12, 245, 248, 250, 253 and 254 fidget, crouch or dance.

## Riding (workshop Run 1, 2026-10-11)

- **ride** (`prompts/motion_ride.txt`, prime, 8 s), retargeted onto all 8 characters, so any of them can ride (a
  `ride` clip in every GLB and in `characters.json`). Read on the real GPU on the carter (`gen/characters/carter/
  ride_clips_take2.jpg`) and seated on the animals in `web/creatures.html` (`gen/animals/donkey/ride_carter2.jpg`,
  `gen/animals/horse/ride_sightseer.jpg`): thighs forward and a little apart over the barrel, lower legs hanging along
  the flanks, back upright, both hands forward at the belly holding the reins, a small sway. It reads as riding.
- **Take 1** ("sits astride a horse's back, hips held at one height as on a saddle, feet off the ground ...") came out
  as a half squat with the feet on the floor: unusable (`gen/motions/ride_take1/`, the carter's retarget kept in
  `gen/characters/carter/meshy/4_motion_ride_take1/`). **Take 2** describes a prop the mocap knows: "sits up high on a
  tall narrow stool, straddling it as if riding a horse: knees spread wide apart, knees bent, feet hanging free in the
  air". Text to Motion prompts are limited to 400 characters.
- **Seating it on an animal** (the page; `web/src/creatures.js` `loadRider` does it): don't ground the `ride` clip
  (people.js grounds every clip at load, which would put the feet on the ground); put the rider's Hips bone 0.09 m
  (times the rider's scale) above the animal's seat point (`animals.json`: the tack variant's `saddle_rest`, else
  `saddle.rest`), facing the animal's way, and parent the rider to the animal's `saddle.bone` so it rides the back.
- The painted old rider sitting sideways with his knees drawn up (`S5.fig.old_rider_9168`) needs its own action
  (side-saddle); not made yet.
- Credits: 13 (take 1 + one retarget) + 34 (take 2 + 8 retargets) = 47.

## Open

- Props attached to hand bones: the official's brush and paper, the carter's manifest, the camel driver's lead rope,
  the porter's shoulder pole and baskets.
- Animals: done in `animals/` (our quadruped rig; see `animals/notes.md`). A side-saddle `ride_side` for the old rider.
- More of the scroll's types: women (rare in this section), children (the beggar boys on the bridge), the barber
  and his customer, the rider's servants.
- Per-person routines with names, descriptions and backgrounds (the user will design these).

## Run 2 (2026-10-12): the areas' cast, their actions, props

What the two areas (S6 west, S4 east) needed: `gen/expand/inner_city_needs.md`, `gen/expand/outer_road_needs.md`.

### The new cast (14 characters; all in Meshy account `msy_B7y3`)

| character | scroll figure (ref) | look | clips |
|---|---|---|---|
| child | S6 boy_5050 (plays the street children, `scale` per figure) | teal short jacket, cream trousers, cap | walk, run, idle, play, back_load, ride, reach |
| child_robed | S6 boy_dark_robe_2380 | dark knee robe, cap | walk, run, idle, chin |
| woman | dress from a woman bringing a child to 赵太丞家, S7 (scan u 1575–1655; S6's matchmaker shows only her face, S4's mother is 70 px) | slate jacket-robe over a pale skirt, high bun | walk, run, idle, sit (32, in the sedan), hold_child (+ prop child_in_arms) |
| monk | S6 itinerant_monk_2078 (行脚僧; also S4's temple monk) | shaven, ochre robe tucked up, leg wraps | walk, run, idle, back_load (+ prop back_frame) |
| bearer | S6 sedan_bearer_far_4462 | red-brown short jacket, top-knot, leg wraps | walk, run, idle, sedan_carry, sedan_walk, lift_pole |
| storyteller | S6 storyteller_3822 | bearded, grey-blue robe, cap | walk, run, idle, tell |
| butcher | S6 butcher_3920 | pale jacket, brown apron | walk, run, idle, chop (+ prop cleaver) |
| scholar | S6 scholar_front_3240 (19 pale-robed men) | long white robe, futou with ribbon ends | walk, run, idle, sit (33), drink (343), talk (313), listen, fan (+ fan_round), knees_up, bow, crane |
| elder | S6 old_man_tall_hat_4666 (also S5's old rider) | white beard, tall black hat, pale robe | walk, run, idle, ride_side, fan (+ fan_round), listen, sit (33) |
| archer | S5 archer_drawing_bow_5635 (the wine depot's three archers) | bare chest, red-brown waist guard | walk, run, idle, draw_bow (224 Archery Shot, + prop bow), bind |
| soldier | S4 soldier_knee_up_11792 (the seven courier-post soldiers) | grey belted jacket, cap, leg wraps | walk, run, idle, sleep_side, doze_knees, sit_one_knee, squat_sleeves, kneel_sleep, sit |
| robed_man | S4 ox_leader_11017 (S4's white-robed men; not the scholar: no cap) | long loose white robe, blue sash, top-knot | walk, run, idle (+ prop staff), lead, talk, listen, tie_kerchief, sit |
| fortune_teller | S4 fortune_teller_12232 | dark ink-blue robe, futou | walk, run, idle, tell_fortune, sit |
| hat_traveller | S4 rider_fan_10285 | wide conical straw hat, buff robe | walk, run, idle, ride_fan (+ fan_round), ride, talk |

Every new character is about 4.1–4.4k triangles on one mesh, Meshy's 24-bone rig, one 512 px texture; GLBs
210–430 KB. The existing eight got the areas' actions too (see `characters.json`): idler 23 clips (820 KB), carter 16
(621 KB), townsman 14, sightseer 14, inspector 11, porter 10 (+ seven props), official 8, camel_driver 7.

### The big change: clips are retargeted locally, for free, across accounts

A Meshy retarget (3 credits) needs the rig and the motion in one account, and account 1 (`msy_czMs`, which holds the
original eight rigs) ran out mid-run. `tools/retarget_local.mjs` now carries any clip onto any of our rigs on this
machine:
- **`t2m:<motion>[@<account>]`**: a Text to Motion take. Its result FBX (Meshy's SMPL-H skeleton, T-pose rest; kept in
  `gen/motions/<m>/[<account>/]result_motion_url.fbx`, so it never expires) is converted once by
  `tools/motion_fbx2glb.py` (headless Blender) to `motion_smpl.glb`, then retargeted.
- **`from:<character>/<clip>`**: another character's clip (library or Meshy-retargeted), e.g. `from:townsman/talk`.
- The method: per bone, the change of its world orientation from the source's rest (with the rest bone directions
  aligned first, so a T-pose source drives an A-pose rig), applied to the target's rest; the hips' height is set
  absolutely, as the source's hip height above its ankles × the hip-height ratio, so ground sits sit on the ground.
- Checked against Meshy's own retarget of the same take (`bucket_shoulder` on the idler, Meshy vs `t2m:`): the two
  frame sheets are the same pose for pose (`gen/characters/idler/clips_t2m_test.jpg`).
- So **a custom action now costs 10 credits once** (the take), and any number of characters get it free, in any
  account. Library clips still need one paid fetch onto some rig (3), then `from:` spreads them.
- `character.mjs` makes the local clips in the `clips` and `build` steps (cached by the source, the rig and the tool).

### Actions made in Run 2 (prime, frame sheets in `gen/characters/<name>/clips_run2*.jpg`)

All read as intended unless noted: carry_pole (shoulder pole walk; the hand at the pole beside the head), crane_listen
(take 2, "leaning forward from the waist, hands clasped behind his back"; take 1 hardly leaned), bow_gongshou (拱手,
hands joined, bow from the waist), fan_walk, sit_knees_up, draw_water (weak: hands at the belt rather than hand over
hand), bucket_shoulder (squat, lift, onto the shoulder), read_window (seated, hand raised by the face), back_load_walk,
sedan_carry, sedan_walk, lift_pole, tell_story, chop_meat (take 2 "lifts the cleaver high above his head"; take 1 barely
moved), fan_self (take 2 "elbow low, fan at chin height"; take 1 raised the hand above the head), sit_listen,
ride_side (sits on a stool with both legs together and the knees up: seat it on the donkey turned 90° to its
heading, which is the old rider's painted pose), bind_wrist, chin_watch, child_play, ride (account-2 take for the
new cast), drive_cart, steer_shafts, drive_team, hold_bridle, browse_goods, bucket_lift, stand_pole (weak: the hand
stays low; reads with the staff prop), show_garment, walk_whip, hail, sit_one_knee, squat_sleeves, tie_kerchief,
hold_child, child_reach, sleep_side, doze_knees, kneel_sleep, tell_fortune, ride_fan. Library: 224 Archery Shot
(draw_bow), 258 crouch, 261 push, 32/33 chair sits, 343 sit and drink, 313 talk.

### Accounts and credits (Run 2)

- `msy_czMs` (the original eight's rigs): 245 → 1. Eight takes and their retargets, the crane retake, then seven takes
  (bucket_lift, hold_bridle, browse_goods, back_load_walk, drive_cart, steer_shafts, drive_team) of which the last
  retargets failed with 402. Their FBXs serve every character through `t2m:`. **Retired** from `~/.meshy_keys`
  (`tools/meshy_key.sh retire`); the eight characters carry `"account": "msy_czMs"`, so a paid step on them now
  fails loudly instead of running in the wrong account. They don't need it: new clips reach them through `t2m:`/`from:`.
- `msy_B7y3`: 1,100 → 251. Fourteen characters × 30 (mesh 15, retexture 10, rig 5) = 420; 30 takes = 300; library
  clips and retargets ≈ 114; the dog 15 (the animal fork).

### What worked, what failed, best practice

- **Sheets:** `prompts/char_turnaround.txt` unchanged; every one of the 14 split cleanly into three views. Write the
  character prompt from the restyle's colours and the map's `what`; say the hat, the hair and the shoes.
- **Meshy moderation:** the hat traveller's first front view was refused (403 `ForbiddenForPublicFigure`). A re-rolled
  sheet with a different face ("round, friendly weathered face, small chin beard") passed.
- **Rate limits:** sixteen takes plus meshes at once gave 429s. `meshy_task.py` now retries 429/5xx with a growing
  wait, and `char_pipeline.py` reuses any step that already succeeded with the same request (no double charge on a
  rerun).
- **Text to Motion prompts:** 400 characters at most. Name a prop the mocap knows ("a tall narrow stool" for riding);
  say where the hands and feet are and how high; ask for "a big full-arm chop", "elbow low", or the motion stays small.
- **Contacts:** joined hands and a hand at the chin survive the local retarget; long held props must be bound to a
  clip whose hand stays still (the robed man's staff is on `idle`: on `talk` it swung flat).
- **Review:** `node tools/clip_sheet.mjs <base> <name> <clips> --side`. chars.html shows every `prop_` part on every
  clip (it doesn't hide them); judge props with `blender/char_props.py -- review` instead.
- **Size:** clips are most of a GLB (idler 23 clips: 820 KB). Drop clips nobody in `people.json` plays before shipping
  widely (remove them from `characters/<name>.json`; the build is cached and cheap).

## Carried props (workshop Run 2, 2026-10-12)

### Workflow

The things painted figures carry are optional parts inside the character's own GLB. Each is a mesh node
`prop_<name>`, skinned rigidly (weight 1) to one bone of the body's own skin. people.json `"props": [...]` switches
them on, and `web/src/crowd.js` batches each one with the body's bake (`shareMap`).

1. **Geometry: `blender/char_props.py`.** Each prop is built from the kit's primitives and exported on its own:
   `blender_wsl.sh -b --factory-startup --python qingming/blender/char_props.py -- build <gen/props as UNC> [prop,prop]`
   writes `gen/props/<prop>.glb`.
   - The parts are `song_kit.beam` / `soft_box` and `street_b1.tube` / `cyl` / `lathe`, plus soft lumps and rolls for
     cloth. Soft things are never boxes.
   - All colours come from one small palette texture (40 px, nearest filtering). The material is double-sided, so
     the open baskets show an inside.
   - **Canonical frame** (glTF): +Z is the character's forward, +Y up, +X the character's left, in metres. The
     origin is the grip or contact point:
     - pole: the point resting on the shoulder;
     - back load: the upper back;
     - hand prop: the fist (a rod runs along +Y);
     - bucket: the middle of its bottom;
     - child in arms: the carrier's shoulder top.
2. **Binding: `tools/char_props.mjs`.** `node tools/char_props.mjs <raw.glb> <out.glb> <character>`; out may equal
   in.
   - **Input:** the character's entries in `characters/props.json`.
   - **Idempotent:** it first removes any `prop_*` nodes and the `prop_palette` material already in the GLB. So run
     it on the raw merged GLB every time it is rebuilt.
   - **Posing:** for each prop it samples the clip that holds it at time `t` and composes the node matrices in
     Armature space. The Meshy GLBs are in cm under a 0.01-scaled `Armature`.
   - **Placement:** it places the prop from that pose, then maps each vertex to bind space:
     `v_bind = IBM_j^-1 · W_j(t)^-1 · v_posed`.
   - **The new node:** a sibling of the body mesh under the Armature, with an identity transform and the body's
     skin object. The bind matrix then equals the body's, and the part shares the body's bake.
   - **Missing clip:** a prop whose clip isn't in the GLB yet is skipped with a message, not an error.
   - **Probe:** `node tools/char_props.mjs <raw.glb> --probe <clip|rest> <t>` prints the joint positions and axes at
     that time, for picking placements.
3. **Review:** `... char_props.py -- review <glb UNC> <out.png UNC> <clip> <prop> <t0,t1,...>`.
   - It imports the GLB with props, hides every other `prop_*`, and plays the clip.
   - It renders the given times from the side and three-quarter, written to `gen/characters/<name>/props_<prop>.png`.
   - Read it at every time, not only the reference frame.
4. **The build step:** in `tools/character.mjs` `build`, run `char_props.mjs raw raw <name>` between
   `build_character.mjs` and `gltf-transform optimize`. `optimize` (meshopt, webp 512) keeps every `prop_*` node
   separate: join leaves skinned meshes alone. Checked on the porter: 6 props, +63 KB; gltf-validator reports no
   errors.

### `characters/props.json`

```json
{
  "_defaults": { "<geom>": { placement fields } },
  "<character>": {
    "<prop name>": { "geom": "<gen/props stem, default = prop name>", "clip": "<clip>", "t": <s>, ...overrides }
  }
}
```

The character's entry overrides `_defaults[geom]`. The same geometry can therefore appear on several characters, or
twice on one character under two names with different clips or placements.

**Placement fields:**
- `bone`: the joint the part follows rigidly.
- `at`: one of
  - `shoulder`: on top of the `side` shoulder, `along` (0 = neck, 1 = shoulder joint) and `lift` metres up, along the
    body's facing, level;
  - `back`: at `bone_ref` (Spine), its up `follow` × the spine's axis + (1 − `follow`) × vertical;
  - `hand`: in the hand bone's frame. The fist is at `grip` metres (y along the fingers, z the thumb); `rot` gives
    degrees about the hand's x, y, z. `rot [90,0,0]` runs a rod along the thumb direction, so it is clip-independent;
  - `hand_world`: at the fist (`grip_y` along the fingers), oriented by the body: up, forward, with `pitch` and `yaw`.
    For things that must stand upright at the reference frame.
- `side`: left or right.
- `offset`: metres in the placement frame (x left, y up, z forward).
- `scale`: e.g. 0.7 for a child's load.

### The props (triangles; review renders)

| prop | tris | character · clip | reads |
|---|---|---|---|
| `pole_baskets` | 540 | porter · `carry_pole` | Pole on the right shoulder, level, two deep baskets (one heaped). Good at every frame. Bound to Spine, not RightShoulder: the shoulder bone swings with the raised arm and tipped the pole. `porter/props_pole_baskets.png` |
| `pole_boxes` | 728 | porter · `carry_pole` | Two slatted cages with dark lids and goods inside. `porter/props_pole_boxes.png` |
| `pole_bundle` | 424 | porter · `carry_pole` | One big knotted cloth bundle at the back end. `porter/props_pole_bundle.png` |
| `pole_shallow_baskets` | 632 | porter · `carry_pole` | Two shallow trays on four cords, goods and greens. `porter/props_pole_shallow_baskets.png` |
| `pole_bundles` | 756 | porter · `carry_pole` | Two tall bundles of rolled straw mats, bound three times. `porter/props_pole_bundles.png` |
| `back_frame` | 690 | monk · `back_load` | The 笈: a frame upright behind him, red box, bundles and a roll, a mat canopy over the head with a lantern box, gourds and a red tassel. The clip bends him forward, so the frame follows the spine only 15%. `monk/props_back_frame.png` |
| `back_boxes` | 468 | child · `back_load` (scale 0.7), townsman · `back_load` | Three lacquered tiers, side rails, carrying bar, straps. `child/props_back_boxes.png` |
| `back_bundle` | 176 | child · `back_load` (scale 0.8) | An indigo cloth bundle knotted at the shoulder. `child/props_back_bundle.png` |
| `fan_round` | 150 | sightseer · `fan_walk`, scholar · `fan`, elder · `fan` | `hand_world`: the blade stands upright at the face. The sightseer screens his face; the scholar and elder hold it beside the cheek. `sightseer/…`, `scholar/…`, `elder/props_fan_round.png` |
| `bucket` | 310 | idler · `bucket_shoulder` (t 5.6) | On RightHand: in the hand as he squats (beside the shin, near the ground), then on the right shoulder held overhead in the end pose. The clip starts with the hand at the chest, so the bucket is held there for a moment. `idler/props_bucket.png` |
| `cleaver` | 48 | butcher · `chop` | In the right hand, blade forward of the fist. `butcher/props_cleaver.png` (rendered on the chop take in the 00:29 raw) |
| `bow` | 146 | archer · `draw_bow` | In the left hand, upright at full draw, the string toward him; held low across the body at rest. `archer/props_bow.png` |
| `goad` | 62 | carter · `drive_cart` | A 2 m goad raised in the right hand while seated. `carter/props_goad.png` |
| `whip` | 86 | carter · `drive_cart` | A whip raised, its stock bending over, with a lash and red tassel. `carter/props_whip.png` |
| `stick` | 50 | porter · `walk` | A 1.5 m stick held a third from its end, swinging with the arm. `porter/props_stick.png` |
| `staff` | 90 | inspector · `talk` (left hand) | A 1.9 m staff with a knob, upright, its foot near the ground at every frame. In the right hand it swung with the talking gestures, so it moved to the left hand. `inspector/props_staff.png` |
| `child_in_arms` | 678 | woman · `idle` | A small child in a red jacket clinging at her left shoulder: head on the shoulder, arms round her neck, legs folded at her side. On Spine. Her left arm still hangs (idle); a `hold_child` clip would make it hold him. `woman/props_child_in_arms.png` |

### What worked, pitfalls

- **Bind to the most stable bone, not the nearest one.** Poles go on Spine (the shoulder bone tips with the raised
  hand), back loads on Spine, and hand things on the hand.
- **Rods in a fist run along the hand's thumb axis** (`rot [90,0,0]` in the `hand` placement). Then the prop is
  right in every clip, not only at the reference frame.
- **Things that must stand upright** (a staff, a fan screen) are placed with `hand_world` at a calm frame. Put them
  in the hand that gestures least: the inspector's talk moves his right hand, so the staff went to the left.
- **Back loads on a clip that bends the body** (the monk's `back_load`) need `follow` < 1, or the frame tips over
  the head.
- **Name lookups must be exact:** Meshy action names come in as clip names in the raw GLB.
- **Review camera:** after the glTF import the character faces −Y in Blender. Review angles are 90° (side) and
  35° (three-quarter).
- **Write UNC paths for Blender output:** relative Windows paths in bpy resolve against Blender's cwd, not WSL's.
- **Missing clips:** if a clip isn't in the raw GLB yet (carter `steer`, the east `robed_man`), add the entry
  anyway. The tool skips it until the clip lands.

### Props polish (2026-10-12, after the gate's recast)

The lead saw the `pole_bundles` pole close up as a thick square bar in flat yellow. The fix is in `blender/char_props.py`:
- **Poles:** every carrying pole is now a round bamboo pole, about 4.5 cm thick with 8 sides.
  - It tapers about 18% from the butt end to the tip.
  - It bows down about 4.5 cm at both ends under the load.
  - It has a raised node ring every third of a metre or so.
  - Length is 1.5–1.7 m.
- **Rods:** the staff (1.98 m, with a knob), stick, goad, whip stock and bow are round, tapered rods too. Their ring frames are parallel-transported: the old per-point frames flipped where a rod's bend changed sign, which pinched it to a point.
- **Painted strips:** the prop texture is now 256 px. The flat palette cells stay, and beside them are painted strips that the meshes map along or round:
  - bamboo, with streaks and dark node bands;
  - wood grain, dark and light, used for the bucket's staves;
  - an over-under wicker weave, used for the baskets;
  - straw, used for the rolled mats.
- **Shading and filtering:**
  - Shading is smooth, with sharp edges only above 40°, so round things shade round and boxes keep their edges.
  - The texture now filters linearly with mipmaps (`tools/char_props.mjs`).
- **Close-ups:** the renders are in `gen/props/review/close_*.png`, and the porter with `pole_bundles` is in `gen/characters/porter/props_pole_bundles_v2.png`.
- **Triangles:**
  - each pole with its loads is 710–1,200 (`pole_bundles` 1,204);
  - rods are 140–180;
  - the bucket is 320.

### Last batch (2026-10-12): the areas' builds

**New takes** (`msy_B7y3`, 100 credits; sheets in `gen/characters/<name>/clips_run3.jpg`):

| take | given to | how it reads |
|---|---|---|
| stand_whip | carter, and the inspector as `hold_whip` | the whip arm rises overhead now and then: moderate |
| hold_rope | robed_man | standing, the rope hand low behind: subtle |
| push_flank | idler | good |
| stride_stick | porter | a plain stride; the arms are barely flung |
| bend_goods | inspector | good |
| lean_over | inspector | good |
| carry_child_shoulders | townsman `carry_child` | hands raised at the shoulders |
| carry_child_back | idler `carry_child` | bent forward, hands behind the hips: good |
| hold_tray | porter | good |
| shoulder_box_walk | porter `shoulder_box` | good |

**Free retargets:**
- `sit` (from the scholar's library sit) for the idler and the inspector;
- `look` (from the townsman's 336) for idler, inspector, scholar, child, child_robed, elder and carter;
- `listen` for the carter and the child;
- `talk` for the elder, monk and porter;
- `bow` for the camel driver;
- `crane` for the robed man and the hat traveller;
- `squat_sleeves` for the townsman.

**Sizes and pitfalls:**
- Local retargets are now sampled at 20 fps (it was 30). The page bakes at 30 and interpolates.
- GLBs with 25+ clips approach 1 MB (the idler is 0.86 MB).

## Clips trimmed to what the sections play (lead, 2026-10-12)

`node tools/clips_used.mjs` lists, per character, the clips every section's people.json plays (figures' `do`, walkers'
clip, pause and stops, riders, load-test traffic), plus walk, run and idle (any character can be your avatar) and each
carried prop's clip. The 22 clips nobody played were removed from `characters/<name>.json` and the characters rebuilt
(cached, free): 8.6 -> 7.9 MB. The removed clips stay in `gen/` (their takes and retargets), so adding one back to a
config and rerunning `build` costs nothing. The configs before the trim: `gen/archive/characters_before_trim/`.
Removed: bearer sedan_walk, lift_pole; camel_driver lead, ride; carter gape, carry, arms_folded; child ride; elder listen;
hat_traveller talk; idler ride; official ride, read; porter carry, ride, sedan_carry, sedan_walk; robed_man lead, sit;
scholar listen, bow, crane; sightseer stroll, fan. Run `clips_used.mjs` after casting changes.

## Round 2 workshop (2026-10-12): the five new areas (S7, S4b, S3, S2, S1)

Order: `gen/expand/round2/catalogue.md` §8 (a). Deliveries are logged line by line in
`gen/expand/round2/workshop_progress.md`.

### Record fix: the woman's model figure (catalogue 2b)

`characters/woman.json` names the wrong figure. Its crop [1575, 725, 1655, 905] (scan, S7) is
`S7.fig.doctor_dark_robe_1615`, the doctor of 赵太丞家, a man. The woman's dress was meant to come from
**`S7.fig.standing_woman_1567` [1545, 712, 1595, 895]** (a high dark bun, a long robe under a short over-jacket). The
JSON's `figure` and `crop` stay as they are: they are cache inputs (ref → sheet → views → mesh), and changing them
would make a later `character.mjs all` pay about 30 credits to re-mesh her. Her mesh came out a woman in a slate
褙子 over a pale skirt anyway (the sheet prompt describes her), which is S7's women's cut in another tone.

### Free work (0 credits)

- **92 local retargets** (catalogue 2a) onto 17 existing characters, every one `t2m:` from a take already in `gen/`
  or `from:` a library clip: `gen/archive/characters_before_round2/` holds the configs before. The idler is now 38
  clips (1.2 MB): trim with `clips_used.mjs` once the areas have recast onto the boatman and grain porter.
- **Carried props** (2d): 37 new geometries in `blender/char_props.py` (two palette cells added: `ceramic`, `sack`;
  every prop GLB was rebuilt so they all carry the same palette, since `char_props.mjs` takes the first prop's image
  for a character). 68 bindings onto the interim casts, all reviewed in `gen/characters/<name>/props_<binding>.png`
  (`char_props.py -- review_many <jobs.json>` renders many in one Blender run; a job may give `views`, e.g.
  `[[-90, 6], [-35, 14]]` to see a right-hand prop, which the default left-side views hide).
- **Recolour variants** (2e): `hat_traveller_dark`, `woman_pale`, `child_red`: `"body_from"` + `"recolour"` rules,
  applied by `tools/build_character.mjs --recolour` (a mask from the body's own faces in the rest pose: height band,
  distance from the head's axis; and texel colour: hue, saturation, value; then a ramp or an HSV change). Same rig,
  clips and props as the base, nothing paid. Checks `gen/characters/<variant>/recolour_check.jpg`.

### Paid (account `msy_B7y3`, 151 → 1)

| # | item | credits | result |
|---|---|---|---|
| 1 | **boatman** (S2 `sweepman_upright_22168`; indigo head-cloth, light hemp jacket with rolled sleeves, brown-grey apron-kilt, rolled trousers, bare shins) | 30 (mesh 15, retexture 10, rig 5) | views matched the crop and the dress refs first time |
| 2–7 | takes `work_sweep`, `reach_over_rail`, `tow_walk`, `sack_carry`, `pole_boat`, `fend_pole` | 60 | five passed; `pole_boat` take 1 failed (below) |
| 8 | retake allowance → `pole_boat` take 2 | 10 | passed |
| 9 | **grain_porter** (S4b `porter_pole_bundle_13537`; pointed dark kerchief cap, white short jacket, dark brown hip wrap to the knee, rolled white trousers, bare shins) | 30 | views matched first time |
| 11–12 | takes `haul_line`, `chase_run` | 20 | see the frame sheets |
| | **total** | **150** (1 left) | |

Takes, read on the GPU (`gen/characters/porter/clips_round2a.jpg`, `clips_round2b.jpg`,
`clips_pole_boat_take2.jpg`, `gen/characters/inspector/clips_round2.jpg`):
- `work_sweep`: feet braced wide, a forward lunge with the arms reaching low, then a lean back with the face up: the
  whole-body stroke reads; the hands sit lower than a sweep's bar (moderate).
- `reach_over_rail`: bends about 45° and reaches down and out with both arms, then straightens: reads at a rail.
- `tow_walk`: lunging, straining steps bent forward with the hands low; alternates with more upright steps.
- `sack_carry`: bent forward, one hand up at the shoulder, the other low: right with `back_sack`.
- `pole_boat` take 1 (`gen/motions/pole_boat_take1_msy_B7y3/`): the hands stayed on the hips; the body bent once.
  Take 2 says where the hands are ("both hands grip a long pole together at shoulder height, one hand above the
  other ... until his hands reach his knees"): the hands are together at the shoulder and push down: passes.
- `fend_pole`: both arms overhead, then a push at chest height: good.

Restart review (2026-10-12 evening, all eight takes on their rebuilt casts, with the carried props; sheets
`gen/characters/<name>/clips_takes_run3.jpg` and `close_takes_run3_*.jpg`; verdicts in
`gen/expand/round2/workshop_progress.md`):
- Six pass: `work_sweep`, `reach_over_rail`, `tow_walk`, `sack_carry` (with its sack), `fend_pole` (with
  `long_pole_mid`), `haul_line` (lunge, lean back, hand over hand).
- `chase_run` fails: both arms stay out sideways at shoulder height through the whole run. The take itself has the
  shoulders within about 20° of the T-pose rest. Stand-in `run`; retake wanted.
- `pole_boat` fails with its pole: the body poles, but the right wrist turns over, so the rigidly bound `long_pole_low`
  points up for about two thirds of the cycle. A one-hand rigid binding can't hold a two-hand pole whose grip turns.
  Stand-in `stand_pole` + `long_pole`; retake wanted (fists locked, a constant slant, wrists not turning).
- Lesson: judge a take that holds a prop with the prop on (`chars.html?props=<prop>`); `clip_sheet.mjs` hides props.

### Paid run 4 (account `msy_VYNl`, 1,100 → 570; restart run, 2026-10-12 evening)

Log: `gen/expand/round2/workshop_logs/credits.log`; deliveries and verdicts: `gen/expand/round2/workshop_progress.md`.

| item | credits | result |
|---|---|---|
| 7 characters: straw_hat (S3 `porter_straw_hat_17762`), dark_hat (S7 `porter_baskets_1255`), tracker (S2 `tracker_rear_22172`), farmer (S1 `man_with_stick_29205`), groom (S7 `groom_1698`), youth (S3 `youth_round_face_18643`, 1.45 m), official_rider (S7 `official_rider_1610`) | 210 | all seven sheets matched their scan crops first time; meshes, rigs and the broad hat brims came through; 270–520 KB each |
| 23 takes, catalogue 13–43 (all but `floor_write`) | 230 | 16 passed first time |
| retakes the take review asked for: `chase_run`, `pole_boat` | 20 | both pass (`pole_boat` with the prop fix below) |
| retakes of 7 new takes that came out plainly wrong | 70 | 6 usable, `sit_offer` not (the idler keeps take 1) |
| **total** | **530** | |

What the takes taught (frame sheets `gen/characters/<cast>/clips_paid4*.jpg`):
- **A rigid pole on a turning wrist fails, whatever the take.** `long_pole_low` bound to the hand pointed at the sky
  for most of `pole_boat` in both takes. Bound to the **Hips** with `at: hand_world` (the fist's place at the clip's
  top, `pitch` 25), it keeps one slant into the water and the hands slide along it: use this for any long tool whose
  grip slides (poles, oars).
- Text to Motion still drops the hand contact of one-arm-on-something actions: `drive_donkeys` (hand on the load) and
  `beckon_lean` (forearm on a bar) came out with the arm elsewhere twice; `sit_offer` (holding out a bowl) came out as
  a shrug on retake. Big symmetric actions (`wave_arms`, `lunge_arms_wide`, `climb_ladder`) work first time.
- The same take can read differently on two rigs' sheets (the storyteller's `sit_offer` passed, the idler's didn't);
  read the take on the cast that plays it.
- "Never kneels" fixed `knee_on_stool` (take 1 knelt on the ground); "hips stay on the ground" did not make
  `lie_wave` prop itself on an elbow.
- A casting script can depend on a clip by its pose list: S4b's `make_people.py` stopped with a KeyError when the
  boatman landed without a seated clip from its list; giving the boatman `knees_up` (free) fixed it.
