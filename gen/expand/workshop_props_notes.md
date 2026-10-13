**Merged into characters "Carried props", 2026-10-12:** the workflow and pitfalls in round 1; Batch 3 (the
`hands` and `head` modes, the carried-child props, the box on the shoulder) by the round-2 records agent. The field
reference stays here (the skill points to it).

# Carried props (workshop Run 2, 2026-10-12)

## Workflow

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

## `characters/props.json`

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

## The props (triangles; review renders)

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

## What worked, pitfalls

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

## Batch 3 (2026-10-12): carried children, trays, a shoulder box, standing whips, a lead rope

### New placement modes (`tools/char_props.mjs`)

- **`hands`:** midway between both fists (each hand bone plus `grip_y` along the fingers), oriented by the body (left, up, forward); `pitch` tips it. For a tray held out in both hands. Bind it to one hand (RightHand) so it follows the arms.
- **`head`:** on the crown, at the Head joint plus `lift` metres up the head's own axis (default 0.19). The load's up sits between the head's axis and the vertical (`follow`, default 0.5), facing the body's way. For a tray balanced on the head; bind it to Head.
- **`back` with `bone_ref: "neck"`:** the existing back mode measured at the neck joint. It carries a child astride the shoulders; bind it to Spine so the child doesn't swing with the head.

### The carried-child pattern (`carried_by`)

Superseded 2026-10-13 for the geometry: the four children below are now the rigged child posed onto each carrier by
IK (`tools/carry_pose.mjs`, `gen/props/carry.json`, checked by `tools/carry_check.mjs`; skill `characters`, Carried
props; records `gen/details/children/notes.md`). The `carried_by` casting is unchanged.

- A child carried by an adult is its own map figure. It stays in people.json (loyalty) with `"carried_by": "<carrier figure>"`.
- The page draws no body for it. The carrier plays its carry clip with the matching prop, which stands for the child, as the woman's `child_in_arms` does.
- Pairs:

| prop | carrier · clip |
|---|---|
| `child_on_shoulders` | townsman · `carry_child` |
| `child_on_back` | idler · `carry_child` |
| `child_in_arms` | woman · `hold_child` |

### The new props (triangles; reviews in `gen/characters/<name>/props_*.png`)

| prop | tris | character · clip | reads |
|---|---|---|---|
| `child_on_shoulders` | 902 | townsman · `carry_child` | A child about 1 m tall sits astride his neck behind his tall hat, thighs over his shoulders, shins down his chest where his hands hold the ankles, hands at his temples. |
| `child_on_back` | 902 | idler · `carry_child` | Piggy-back on the bent man: torso on his back, head beside his, arms round his neck, legs hanging at his sides by his hands. |
| `staff` | 180 | scholar · `idle` (offset +0.1 m) | Upright at his right side, foot near the ground. |
| `tray` | 718 | porter · `hold_tray` | A long tray across the waist in both hands, goods and a little lattice box at one end. It turns with the clip's show-it motion. |
| `tray_head` | 484 | porter · `walk` | A round tray of goods on a ring pad, balanced on the head through the stride. |
| `box_shoulder` | 152 | porter · `shoulder_box` | A long lacquered box (1.0 × 0.3 × 0.15 m) carried on edge on the right shoulder, outboard of the head (`along` 1.1), the raised hand beside it. |
| `whip_stand` / `whip_hold` (geom `whip`) | 176 | carter · `stand_whip`, inspector · `hold_whip` | In the right hand, cracked overhead in mid-clip, lowered at the ends. |
| `stick_stride` (geom `stick`) | 140 | porter · `stride_stick` | The stick held out as he strides. |
| `lead_rope` | 108 | robed_man · `hold_rope` | A slack rope from his right fist trailing back and down about 1.4 m, toward the ox behind him. |

### Pitfall

- **A box carried flat on the shoulder covers the head:** its inner half reaches past the neck. Carry it on edge and place it just outboard of the shoulder joint (`along` 1.1).
