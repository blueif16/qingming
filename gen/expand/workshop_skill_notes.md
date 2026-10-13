**Merged into characters "Data", "Accounts", "Steps", "What the actions can do", "Animals" and "Carried props",
and web-scene "The atomic scripts" (Vehicles), 2026-10-12** (round 1; checked by the round-2 records agent).

# Skill text from the workshop (Run 1 + Run 2), for the lead to merge

Exact text proposed for the `characters` skill (replace or add the sections named) and a short addition to
`web-scene`. Records with the evidence: `characters/notes.md` (Run 2), `animals/notes.md`, `gen/expand/workshop_props_notes.md`.

---

## characters skill

### Data (replace the clip-source list)

- `characters/<name>.json`: the figure (`section`, figure `id`, `crop` in scan px of the section's registered restyle;
  `"src": "scan"` crops the scan itself where a section has no restyle yet, e.g. S7), the `prompt`
  (prompts/char_<name>.txt), `height_m`, the Meshy `account` its rig lives in (the key's first characters, as
  `tools/meshy_key.sh` masks it; looked up in `~/.meshy_keys`), and `clips` {name: source}. A source is one of:
  - `"rig:walking"` / `"rig:running"`: the rig task's own walk and run;
  - a number: a Meshy animation library `action_id` (catalogue: `reference/meshy/animation_library.json`), fetched onto
    this rig (3 credits, same account);
  - `"motion:<name>"`: a Text to Motion take retargeted onto this rig by Meshy (3 credits, same account);
  - `"t2m:<name>[@<account>]"`: the same take retargeted **locally, free, from any account** (preferred);
  - `"from:<character>/<clip>"`: another character's clip retargeted locally, free (how library clips spread).
- `characters/motions.json` + `prompts/motion_<name>.txt`: custom actions. A take lives in `gen/motions/<name>/` (the
  first account) or `gen/motions/<name>/<account>/`; its FBX stays in `gen/` for good, so a `t2m:` clip never expires.
- `characters/props.json`: carried props per character (see "Carried props").

### Accounts (new)

A Meshy task belongs to the account that made it: a character's mesh, retexture, rig, library fetches and `motion:`
retargets all run with its `account`'s key (character.mjs sets it per child process). New characters go to the
account with credits; switch accounts between characters, never inside one. A spent key is retired with
`tools/meshy_key.sh retire`; characters whose rig lives in a retired account keep working and get new clips through
`t2m:` / `from:`.

### Steps (add these rows / notes)

| Step | Atomic script | What it does | Cost |
|---|---|---|---|
| `motions` | `tools/meshy_task.py text-to-motion` | each take the listed characters need, in the account each needs it (`motion:` → the character's account, `t2m:…@acct` → that account) | 10 each |
| `clips` | `char_pipeline.py --rig-task`, `meshy_task.py animations`, `tools/retarget_local.mjs` | library and `motion:` clips (paid, same account); `t2m:` / `from:` clips locally (`tools/motion_fbx2glb.py` converts a take's FBX once) | 3 / 0 |
| `build` | `build_character.mjs` → `tools/char_props.mjs` → `gltf-transform optimize` | named clips + the `prop_` parts → web GLB; `characters.json` lists `clips`, `motion` (clips to loop by cross-fade) and `props` | – |

`char_pipeline.py` reuses any step that already succeeded with the same request, and `meshy_task.py` retries 429 and
5xx, so a rerun after a failure never pays twice.

### What the actions can do (add)

- **A custom action costs 10 credits once** (the take); every character then gets it free with `t2m:<name>`. Prefer
  `t2m:` over `motion:` for everything new. Checked: Meshy's retarget and the local one of the same take give the same
  frames (`gen/characters/idler/clips_t2m_test.jpg`).
- Prompts: at most 400 characters; body only; say where the hands and feet are and how high; name a prop the mocap
  knows instead of an animal ("sits up high on a tall narrow stool, straddling it as if riding a horse"); ask for big
  motions explicitly ("lifts the cleaver high above his head", "elbow low, fan at chin height") or they come out small.
- Read every take's frame sheet; about one in six needed a second take (crane, chop, fan).
- Riding: `ride` (astride) on every character; `ride_side` (the old rider sitting sideways, knees up) is seated on the
  animal turned 90° to its heading.

### Carried props (new section)

Things a figure carries are optional parts `prop_<name>` in its GLB, skinned rigidly (weight 1) to one bone of the
body's own skin, so they batch with the body (`crowd.js` `shareMap`). people.json `"props": [...]` switches them on.
- Geometry: `blender/char_props.py -- build` from kit primitives, one palette texture, canonical frame (origin at the
  grip or contact) → `gen/props/<prop>.glb`. Soft things are lumps and rolls, never boxes.
- Binding: `characters/props.json` `{<character>: {<prop>: {geom, clip, t, bone, at, ...}}}` places each prop on the
  pose of the clip that holds it (`at`: shoulder, back, hand, hand_world); `tools/char_props.mjs` (run by `build`).
- Review: `blender/char_props.py -- review <glb> <png> <clip> <prop> <times>` at several times; chars.html shows
  every prop on every clip, so don't judge props there.
- Pair each prop with the clip that holds it (pole + `carry_pole`, bucket + `bucket_shoulder`, back_frame +
  `back_load`, fan_round + `fan`/`fan_walk`/`ride_fan`, whip + `walk_whip`/`drive_cart`, staff + `idle`/`stand_pole`,
  child_in_arms + `hold_child`); never a carry clip without its load, nor a long prop on a clip whose hand gestures.
- Poles follow Spine, not the shoulder bone (it swings with the raised arm). Current set: pole_baskets, pole_boxes,
  pole_bundle, pole_shallow_baskets, pole_bundles, back_frame, back_boxes, back_bundle, fan_round, bucket, cleaver,
  bow, goad, whip, stick, staff, child_in_arms.

### Animals (replace the section)

Meshy rigs only humanoids, so animals take Meshy's body and our rig (`tools/animal.mjs`, steps ref → sheet (2×2 B1,
shyfai) → views → test (Smart Topology mesh only from the side view, 5) → mesh (retexture with the four views, 10) → rig
(`blender/rig_quadruped.py`: one 31-bone skeleton for every body plan — equid, bovid, camelid, canid — fitted to the
mesh, heat weights on a welded copy, legs solved from hoof targets) → build → frames). Clips idle, walk (a true
four-beat walk in place; `walk.speed_mps`, measured slip ~1 mm), graze / sniff / head_low, lie (sternal; the camel's
`kush`), every lie grounded on the chest. Tack and loads are `tack_<name>` parts (saddle_cloth, pack_saddle, collar,
pannier_charcoal, camel packs, the ox's draught gear), switched on by people.json `load`. Variants of a body
(`"body_from": "horse"`, `"tone"`) cost nothing; small kit-built types (`"build": "kit"`, the crow) skip Meshy.
Registry `web/public/assets/animals/animals.json` (`about` documents every field: sizes, clips, walk, saddle seat
points per tack, harness and trace points, perch for birds). Review: `web/creatures.html` (`?tack=`, `?rider=`,
`?move=1`) and `node tools/animal.mjs <type> frames --move`. Records: `animals/notes.md`.

### Carried children (add to "Carried props")

A child painted on a carrier (on the shoulders, on the back, in arms) stays a map figure in people.json, marked
`"carried_by": "<carrier figure>"`, and the carrier shows it with a prop (`child_on_shoulders`, `child_on_back`,
`child_in_arms`) on the carry clip that holds it (townsman `carry_child`, idler `carry_child`, woman `hold_child`), so
the scene never shows two.

---

## web-scene skill (kit table: add a row)

| Vehicles | `blender/kit_vehicles.py` (moving into `song_kit.py`) | Song carts from kit primitives, positions from the caller (`front`, `rear`, `wheels`, `team=[(X, D, facing, kind)]`), real-size `choice:` kwargs, every piece through `sb.B` (wrap the call in `sb.entity(<veh id>)`): `covered_ox_cart`, `barrow_screen` (串车), `sack_cart`, `mule_wagon` (太平车; `load="sacks"/"covered"/None`), `cask_cart`, `sedan_chair` (`carried`, `cabin_at`); `sack_cart(low=True)` is the two-wheeled dray. `covered_ox_cart`, `mule_wagon` and `cask_cart` (`driver_seat=True`) return `Built`, an int (the triangles) carrying `.seat = (x, y, z, facing)` and `.feet` for a seated driver, outside the hidden collider. The harness (yoke, swingletree, traces) reaches the team's collar or yoke points from `HARNESS`, measured on the rigged animals. Review: `... --python qingming/blender/kit_vehicles.py -- review <out_dir> [types]` (the real animals stand at the team spots). |
