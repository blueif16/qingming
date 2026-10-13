---
name: characters
description: Make, animate and place qingming characters - one scroll figure -> turnaround sheet -> Meshy rigged mesh -> library and custom (text-to-motion) actions -> web GLB -> routines in a scene page. Use when adding or changing a character, giving one a new action, making an animal or a carried prop, or deciding what people and animals do in a section (people.json).
---

# Character workflow (qingming/)

Every character is one specific figure in the scroll. The porter and the townsman (2026-10-09) proved the 3D chain; the
gate cast (2026-10-10) added the sheet step, custom actions and routines; the expansion's workshop (2026-10-12) added
accounts, free local retargets, animals, carried props and casting by script; round 2's workshop (2026-10-12) added
recolour variants, take verdicts that casting scripts read, and boat crews (records: `characters/notes.md` Round 2,
`animals/notes.md` Round 3, `gen/expand/round2/workshop_progress.md`). Each step below is one atomic script.
`tools/character.mjs` only composes them and caches each step by a key over its inputs, so editing a prompt, a crop
or a clip list redoes exactly what depends on it.

## Data

- `characters/<name>.json`: the `figure` (`section`, `id`, `map_id`, `crop` in scan px of the section's registered
  restyle; `"src": "scan"` crops the scan itself where a section has no restyle yet, e.g. S7), the `prompt`
  (prompts/char_<name>.txt), `height_m`, the Meshy `account` its rig lives in (the key's first characters, as
  `tools/meshy_key.sh` masks it), and `clips` {name: source}. A source is one of:
  - `"rig:walking"` / `"rig:running"`: the rig task's own walk and run;
  - a number: a Meshy animation library `action_id` (catalogue: `reference/meshy/animation_library.json`, 678 actions),
    fetched onto this rig (3 credits, same account);
  - `"motion:<name>"`: a Text to Motion take retargeted onto this rig by Meshy (3 credits, same account);
  - `"t2m:<name>[@<account>]"`: the same take retargeted **locally, free, from any account** (preferred for
    everything new);
  - `"from:<character>/<clip>"`: another character's clip retargeted locally, free (how library clips spread, e.g.
    `"sit": "from:scholar/sit"`).
- `characters/motions.json` + `prompts/motion_<name>.txt`: the custom actions, written as text. A take lives in
  `gen/motions/<name>/` (the first account's) or `gen/motions/<name>/<account>/`; its FBX stays in `gen/` for good, so
  a `t2m:` clip never expires.
- `"body_from": "<character>"`: a **variant** of another character, nothing paid. It takes the base's rig, clips (the
  same retarget files), carried props and take verdicts, and recolours part of the body texture with `"recolour":
  [{mask, to}]` (`tools/build_character.mjs --recolour`): `mask` picks texels by colour (`hue` [h0, h1] degrees, `sat`,
  `val`), optionally only on faces of a body part in the rest pose (`y` [f0, f1] as fractions of the height, every
  vertex inside; `radial_min` from the head's axis, a hat's brim; `crown` keeps the faces above); `to` is a `ramp`
  [[value, "#rrggbb"], ...] (the texel's value mapped to a colour, keeping the painted shading) or `hue`, `hue_shift`,
  `sat_mul`, `val_mul`, `val_add`. Measure the texture's hues first (Meshy's "teal" jacket was hue 100–120, not
  160–200) and check on the GPU (`gen/characters/<variant>/recolour_check.jpg`). Made: `hat_traveller_dark`,
  `woman_pale`, `child_red`.
- `"eyes": {"from": "<donor>"}`: dot eyes replaced in the body texture by a passing character's eye (bearer for men,
  youth for children), scaled, mirrored, written through the texel map before the 512 webp (`tools/eye_fix.mjs`, run
  by `build_character.mjs --eyes`; a variant takes its base's, before its recolour). `node tools/eye_check.mjs all
  --out <dir>` measures every shipped face (lid reach past the iris >= 6.8 mm and outline width >= 17.2 mm pass;
  records and calibration: `gen/details/eyes/notes.md`). Check a new character with it before shipping. A face on UV
  slivers the 512 map can't hold (eye_check's `sliver` share) gets texture space of its own first: `"reuv": {...}`
  (scholar); `dy`/`scale` move and size the eye (hat_traveller, under its fringe). The recolour mask's `spare`
  {radial_max, below} keeps a face out of a hat's `radial_min` (hat_traveller_dark's nose).
- `characters/props.json`: the carried props per character ("Carried props" below).
- `characters/notes.md`: the record in prose (who each character is, runs, credits, review findings). Update it after every run.
- `prompts/char_turnaround.txt`: the shared sheet prompt; `{character}` pulls in the character's prompt and `{style_ref}` the
  B1 style phrase. Change the look here, not per character.

## Steps (`node tools/character.mjs <name|all> <step>`, from `qingming/`)

| Step | Atomic script | What it does | Cost |
|---|---|---|---|
| `ref` | sharp | Crops the figure out of `gen/sections/<s>/mosaic.jpg` (registered restyle, 2× scan) → `ref.png` | – |
| `sheet` | `tools/shyfai_image.py` | [style_B1.png, ref.png] + the turnaround prompt → front / side / back on one 1536×1024 sheet (gpt-image-2.5) | shyfai |
| `views` | sharp | Splits the sheet at its background gaps into `front/side/back.png` at one scale; writes `views.jpg` | – |
| `mesh` | `tools/char_pipeline.py` → `tools/meshy_task.py` | Smart Topology 4k from the front view → retexture with the 3 views → rig (24 bones, Mixamo names, walk + run) | ~30 credits |
| `motions` | `tools/meshy_task.py text-to-motion` | Each take the listed characters need (prime mode, 2–10 s), in the account each needs it in (`motion:` → the character's account, `t2m:…@acct` → that account) → `gen/motions/<name>/` | 10 credits each |
| `clips` | `char_pipeline.py --rig-task`, `meshy_task.py animations`, `tools/retarget_local.mjs` | Library actions by `action_id` and `motion:` clips (paid, same account); `t2m:` and `from:` clips retargeted locally (`tools/motion_fbx2glb.py` converts a take's FBX once) | 3 / 0 credits each |
| `build` | `tools/build_character.mjs` → `tools/char_props.mjs` → `gltf-transform optimize` | Rig + named clips + the `prop_` parts in one GLB (meshopt, webp 512) → `web/public/assets/chars/<name>.glb`; rewrites `characters.json` (`clips`, `motion` = clips that loop by cross-fade, `props`) ; then `tools/char_lod.mjs` adds the far body and `tools/clip_split.mjs` cuts the world page's body and per-clip files from the new GLB (inside the same lock; a failed split fails the build) | – |
| `review` | sharp | `gen/characters/review.jpg`: ref | front | side | back per character | – |

`status` shows every step's state (ok / stale / missing) and the clips still to fetch; add `--dry-run` to any paid step
to see what it would buy (`all clips --dry-run` hashes every clip source and takes minutes on a busy machine: dry-run
only the characters you changed). Always read `views.jpg` before paying for `mesh`. `build` builds with the clips that
are made and lists the ones still to come; `characters.json` lists only clips the GLB holds, so a casting never asks for
one that isn't there. Headless Blender (take FBX conversions, animal rigs, prop reviews) runs through
`tools/blender_slot.sh`, whose three slots every agent shares: batch reviews into one run (`char_props.py --
review_many`). Meshy tasks are remote and cheap on the machine, so characters on one account can run in parallel;
the local steps (sheets, retargets, builds) run one at a time.

After every `build` (and an animal's), run `node tools/ktx2.mjs encode` and `check` (skill `web-scene`, KTX2): the page
loads a GPU-compressed copy of each body texture from `web/public/assets/ktx2/emb/`, found by the image's bytes, and
falls back to the GLB's own webp (4–8× the GPU memory) where none exists. The GLB is never changed; palettes stay webp.

Anything else that rewrites a shipped character GLB has to cut its split again:
`flock /tmp/qingming_charbuild.lock node tools/clip_split.mjs <name>`. `char_lod.mjs` does this itself.
`node tools/cast_clips_check.mjs` FAILs on a stale split. A stale split still works on the page, which loads that
character's full GLB, but it costs the bytes. Likewise `tools/char_lod.mjs <glb>` (the far body) under the lock after anything else rewrites a character or animal GLB.

Meshy keeps a text-to-motion task for **3 days**, so a `motion:` retarget only works inside that window; a `t2m:` clip
needs only the take's FBX, downloaded into `gen/` at once, so it never expires. Retargeted clips stay in `gen/` for
good. `char_pipeline.py` reuses any step that already succeeded with the same request, and `meshy_task.py` retries 429
and 5xx, so a rerun after a failure never pays twice.

## Accounts

A Meshy task belongs to the account that made it: a character's mesh, retexture, rig, library fetches and `motion:`
retargets all run with its `account`'s key (`character.mjs` sets it per child process from `~/.meshy_keys`). New
characters go to the account with credits; switch accounts between characters, never inside one. A spent key is
retired with `tools/meshy_key.sh retire`; characters whose rig lives in a retired account keep working and get new
clips through `t2m:` and `from:`. `tools/meshy_key.sh status` lists the keys (masked) with their balances; every
paid item is logged in `workshop_logs/credits.log`. Round 2's prices: a character about 30 credits, a take 10, a
retake 10 (seven characters and 23 takes with 9 retakes came to 530).

## Reviewing actions

- `web/chars.html` (`?only=a,b`): every character side by side; pick any clip per character. The same loader as the scenes.
- `node tools/clip_sheet.mjs http://127.0.0.1:5180 <name> [clips] --side` (real GPU, `tools/win_chrome.sh start`; an
  agent runs it as `tools/chrome_slot.sh node tools/clip_sheet.mjs http://127.0.0.1:5190 …`):
  frame sheets per clip → `gen/characters/<name>/clips.jpg`. Read it before using a new action, with the carried prop
  on (`?props=`): a take is judged by whether it shows what the figure really does (hands on the pole, the load on the
  back).
- **Verdicts are data.** Each reviewed take gets a line in the workshop's progress file
  (`gen/expand/round2/workshop_progress.md`): "\*\*PASS `take`\*\*" with the casts it suits,
  "\*\*NOT TO USE `take`\*\* → <stand-in>", or "retake wanted" with a prompt hint. Casting scripts read them in
  order: "NOT TO USE" bars a clip and a later "PASS" lifts the bar, so a barred take falls back to its stand-in and a
  passed retake plays on the next rerun, with no hand edit (S1's and S3's `make_people.py`). A carry take passes only with its load: `sack_carry` is cast only on
  characters with a sack bound, `fend_pole` only with `long_pole_mid`.

What the actions can do (tested 2026-10-10):
- **Library** (3 credits): good generic idles, talks, looks, sits, walk variants. Look at the free preview GIF first
  (`preview_url` in the catalogue; download to `gen/meshy_previews/` and read frames). The 2026-10-10 audit
  (`characters/notes.md`) rules out: carry walks without their load (551 arms straight out, 552 bends double: they read
  as zombies), Thoughtful Walk (121, head hanging), the default Idle 0 (turns round, flings an arm) and Look Around
  Dumbfounded (333). Every character's `idle` is Idle 3 (243), a calm stand.
- **Text to Motion, prime** (10 + 3 credits): specific period actions work, but read the frame sheet: "leans on the
  railing" came out as a stiff plank lean twice; "elbows on the rail, chin on his clasped hands, feet under the hips"
  came out right. Say where the feet are. Tested: writing at a desk, leaning on a railing
  with folded arms, pointing at goods and arguing, handing over a paper with a bow, leading an animal, standing arms
  crossed. Describe the body only. Props aren't there and contacts are implied: put the character where the rail, desk
  or wall is (people.json `nudge`).
- **A custom action costs 10 credits once** (the take); every character then gets it free with `t2m:<name>`. Prefer
  `t2m:` over `motion:` for everything new: Meshy's retarget and the local one of the same take give the same frames
  (`gen/characters/idler/clips_t2m_test.jpg`).
- **Motion prompts:** at most 400 characters; body only; say where the hands and feet are and how high; name a prop
  the mocap knows instead of an animal ("sits up high on a tall narrow stool, straddling it as if riding a horse");
  ask for big motions explicitly ("lifts the cleaver high above his head", "elbow low, fan at chin height") or they
  come out small. Read every take's frame sheet: about one in six needed a second take on the gate (crane, chop, fan),
  and 10 of 31 in round 2. Say where both arms are and how high, and what they never do: `chase_run`'s first take held
  both arms out in a T for the whole run ("right arm reaching forward at chest height, the hand open; left arm bent,
  pumping low at his side; arms never out to the sides" fixed it); a walking or poling take without "both hands grip
  the pole together at shoulder height, one above the other" keeps the hands on the hips.
- **Riding:** `ride` (astride) is on every character; `ride_side` (the old rider sitting sideways, knees up) is seated
  turned 90° to the animal's heading.
- **Text to Motion, swift** (3 credits): not usable (arms thrown overhead, wrong length).
- Library walks are in place; people.js measures their stride from the planted foot and plays them at the walker's speed.

## Animals (`tools/animal.mjs`, the same steps as the characters)

Meshy rigs only humanoids, so animals take Meshy's body and our rig. `node tools/animal.mjs <type|all> <step>` from
`animals/<type>.json`: `ref` → `sheet` (2×2 B1 sheet, shyfai) → `views` → `test` (a Smart Topology mesh from the side
view only, 5 credits: it builds cleanest) → `mesh` (retexture with the four views, 10) → `rig` (`blender/rig_quadruped.py`:
one 31-bone skeleton for every body plan, equid, bovid, camelid, canid, fitted to the mesh; heat weights on a welded
copy; legs solved from hoof targets) → `build` → `frames`.
- **Clips:** `idle`, `walk` (a true four-beat walk, in place; `walk.speed_mps`, slip about 1 mm), `graze` / `sniff` /
  `head_low`, `lie` (sternal; the camel's `kush`), every lie grounded on the chest.
- **Tack and loads** are `tack_<name>` parts (saddle_cloth, pack_saddle, collar, pannier_charcoal, camel packs, the
  ox's `draught` gear), switched on by people.json `load`.
- **Cheap variants:** `"body_from": "horse"` with a `"tone"` (horse_white) costs nothing; small kit-built types
  (`"build": "kit"`, the bird) skip Meshy. A variant carries its own `tack` (none is inherited from `body_from`).
  - **Tone by ramp:** `"tone": {"ramp": [[luminance, "#rrggbb"], ...]}` maps each texel's luminance to a colour, so a
    white or grey body becomes bay, near-black or slate (an HSV change can't add hue to grey): `horse_dark`,
    `donkey_dark`, `buffalo`. Place the stops on the body texture's measured luminance percentiles.
  - **Horns** (`"horns": {"shape": "swept" | "lyre", span, back, rise, r0, flat, sweep, uv_from}`) are built at the ear
    bones, weighted wholly to `head` and joined into the body mesh with the body's own material (`uv_from: "hoof"` for
    dark horn, `"ear"` for pale), so they batch with the body: `crowd.js` draws only the body and `tack_*` parts, and a
    separate horn mesh vanishes in a crowd. The buffalo (ox body + slate ramp + swept horns) cost nothing.
  - `"lie_turn"` (degrees, + = the animal's left) holds the head turned while lying; `"joints": {"lie_neck_raise": 16}`
    lifts it.
- **Tack kinds** (`blender/rig_quadruped.py`): saddle_cloth, pack_saddle, collar, panniers, packs, the ox's draught
  gear, and since round 2 `halter` (rope), `bridle` (leather, bit rings, reins to the pommel), `breeching`, `crupper`
  (`tassels`), `skirt` (a long saddle skirt hanging from the barrel's widest point, `fringe`; rigid on the spine so the
  legs move behind it) and `bale` (one huge roped sack across the back). Straps round the head or tail are cast from
  the body's cross-section clamped to 1.3× its median radius, or a ring runs up round an ear or out round the rump.
- **Registry** `web/public/assets/animals/animals.json`: its `about` documents every field (sizes, clips, walk, saddle
  seat points per tack, harness and trace points, `perch` for birds).
- **On the painting:** the scroll HUD boxes each animal on its painted figure, its rump and back sized by species from
  the people.json `model` (ox, camel, horse, donkey, mule, pig, dog, bird), so give every animal its real model.
- **Review:** `web/creatures.html` (`?tack=donkey:pack_saddle`, `?rider=donkey:carter`, `?move=1`) and
  `node tools/animal.mjs <type> frames --move` (real GPU; an agent runs it as `tools/chrome_slot.sh node
  tools/animal.mjs <type> frames --base http://127.0.0.1:5190 …`). Records: `animals/notes.md`.

## Carried props

Things a figure carries are optional parts `prop_<name>` in its GLB, skinned rigidly (weight 1) to one bone of the
body's own skin, so they batch with the body (`crowd.js`). people.json `"props": [...]` switches them on per figure.
- **Anything baked into a character or animal GLB beyond the body is named `prop_*` or `tack_*`,** or it skews the
  load-time size: `people.js` sizes each model from its body alone, leaving those meshes out. Before that fix it
  measured the whole GLB, hidden 4–6 m boat poles included, and drew 643 adults (porters, carters, boatmen) at about
  0.6 of their height; `people_check`'s "sizes" line now FAILs on any adult drawn under 0.9 of its character's height
  without a people.json `scale`.
Method and per-prop reviews: `gen/expand/workshop_props_notes.md`.
- **Geometry:** `blender/char_props.py -- build <out_dir> [props]`, from kit primitives with one small palette texture,
  in a canonical frame (origin at the grip or contact: the shoulder point of a pole, the fist of a hand prop) →
  `gen/props/<prop>.glb`. Soft things are lumps and rolls, never boxes.
- **Binding:** `characters/props.json` `{<character>: {<prop>: {geom, clip, t, bone, at, ...}}}` places each prop on
  the pose of the clip that holds it (`at`: `shoulder`, `back`, `hand`, `hand_world`, `hands` midway between both
  fists, `head` on the crown; field reference in `gen/expand/workshop_props_notes.md`); `tools/char_props.mjs` does it
  (run by `build`; idempotent; a prop whose clip hasn't landed yet is skipped, so add the entry anyway;
  `node tools/char_props.mjs <raw.glb> --probe <clip|rest> <t>` prints the joints for picking a placement).
- **One palette for every prop:** `char_props.mjs` takes the first prop's texture for all of a character's props, so
  after adding a palette cell (round 2: `ceramic`, `sack`) rebuild every prop (`char_props.py -- build <gen/props>`
  with no list).
- **Review:** `blender/char_props.py -- review <glb> <png> <clip> <prop> <times>` at several times (`review_many` for a
  batch). Renders look from the character's left (side 90°, three-quarter 35°), which hides a right-hand prop: give
  those `"views": [[-90, 6], [-35, 14]]`. `web/chars.html` hides props unless `?props=`; judge them on the review
  renders.
- **Pair each prop with the clip that holds it:** pole + `carry_pole`, bucket + `bucket_shoulder`, back_frame +
  `back_load`, fan_round + `fan` / `fan_walk` / `ride_fan`, whip + `walk_whip` / `drive_cart`, staff + `idle` /
  `stand_pole`, child_in_arms + `hold_child`. Never a carry clip without its load, nor a long prop on a clip whose hand
  gestures.
- **Bind to the most stable bone:** poles and back loads follow Spine, not the shoulder bone (it swings with the
  raised arm); rods in a fist run along the thumb axis (`hand`, `rot [90,0,0]`), so they hold in every clip; things
  that must stand upright (a staff, a fan screen) use `hand_world` in the hand that gestures least (a long rod `at:
  hand` swings with the arm on `walk`); a back load on a clip that bends the body needs `follow` < 1. A prop that must
  keep its slant while the clip turns the wrist rides a steadier bone at the fist's place: `pole_boat`'s
  `long_pole_low` on the hand pointed at the sky for two thirds of the cycle, and on the hips at a fixed 25° from
  vertical it slants into the water throughout.
- **Placements that worked in round 2:** a bag at the hip is `at: back` with `bone_ref: Hips`, `follow: 1` and a
  sideways `offset`; a staff or stick on the shoulder is `at: shoulder` with `pitch` 65–75; a child on a seated lap is
  `at: back`, `bone_ref: Hips`, `follow: 0`; a hood is `at: head`, `lift: 0`, with its cape a separate prop on Spine
  (`bone_ref: neck`), since one prop follows one bone; two-handed loads (`flat_basket`, `rope_coil`, `open_sack`,
  `bundle_small`) are `at: hands` on a clip whose hands are together (`hold_tray`, `bend_goods`); a box on the
  shoulder is carried on edge, just outboard of the joint (`along` 1.1), or it covers the head. Boat poles are three
  geoms, one per grip: `long_pole` (`stand_pole`), `long_pole_low` (`pole_boat`), `long_pole_mid` (`fend_pole`).
- **Carried children** are drawn by their carrier's prop on the clip that holds it: `child_in_arms` (woman
  `hold_child`), `child_on_shoulders` (townsman `carry_child`), `child_on_back` (idler `carry_child`), `child_on_lap`
  (woman `sit_hold_child`). Since 2026-10-13 each is the real rigged child posed onto its carrier, not kit primitives
  (records: `gen/details/children/notes.md`):
  - `node tools/carry_pose.mjs <prop|all> [--search]`, spec `gen/props/carry.json`: the child decimated to ~2000 tris,
    placed by a recipe per support (back, shoulders, arms, lap) and its limbs solved by IK onto contact sites snapped on
    the carrier's posed body; contact flattening; a seeded search over the recipe's numbers on the whole cycle. It
    writes `gen/props/<prop>.glb` (posed in the carrier's frame: `at: "root"`) and the props.json binding (`t`,
    `texture_from`: the child's body texture in a material of its own, so the KTX2 copy is the child's own).
  - Each child part follows the carrier bones under its contacts (`_CARRY_JOINTS`/`_CARRY_WEIGHTS`), blending only
    bones that move alike at the bind time: the page skins a blend with the bind-space inverse, and unlike bones (both
    forearms) swing it far.
  - `node tools/carry_check.mjs` must PASS on the shipped GLBs: gaps 2 cm at the bind time and 4 cm over the cycle,
    floating 3 cm, penetration 1 cm; it also prints the departure from rigid and the largest edge stretch.
  - A carrier embeds the child's texture: rebuild the carriers after the child's texture changes (eyes, recolours).
  - Where the carry take moves the supports against the spine (her forearm, his hands and head), the carrier plays
    a shared IK variant that freezes them on the spine (`hold_child~child`: ik_variants `child_arms`;
    `carry_child~child`: `child_shoulders`; `freeze` + `damp` + `trim`). The child then rides the spine rigidly, and
    the figure's `do` is switched through the section's contact_fixes.json.
- **A prop bound to one clip can ride another only where its bone holds still:** check it with `char_props.py review`
  at several times. To hold a figure in a clip's calm opening, use a step of `[clip, 1]` (people.js restarts the clip at
  a random point of its first 3 s at every step).
- The set: 60 geoms in `gen/props/` (pole loads, back loads, hand dishes, sticks, staffs, poles, hoods and capes,
  trays, bags, the children); bindings per character in `characters/props.json`.

## Routines (`sections/<name>/people.json`, run by `web/src/people.js`)

**Loyalty** (`qingming/map/BUILDING.md`; the user, 2026-10-11): every painted figure of the section is in
`people.json` at its painted spot, and nobody else. Movement comes from the figures painted mid-stride or carrying a
load: each walks a short way (about 6-8 m) along its painted direction and back, from its spot, clipped to the
walkable area and clear of buildings and water. Children painted small get `scale`. A rider whose animal isn't built
yet is listed under `unbuilt` in `build_choices.json`. `tools/loyalty_check.mjs` fails on a person who isn't a mapped
figure and on any `traffic`. The gate's casting (77 figures: 63 at their spots, 14 walkers) is in
`sections/gate/people.json`. Its notes say why each figure got its character and why any figure was nudged.

- `figures`: a scroll figure (its position from the scroll map, `sections/<name>/layout.json`; skill `scroll-section`,
  "Mapping a section"; the key is the map ID's last part, e.g. `tax_official` for `S5.fig.tax_official`, and the scroll
  HUD boxes the person on the painting by it) as a character with a cycle of actions, `do: [[clip, seconds], ...]`, plus an optional `nudge` [dX, dD] to sit on the bench or lean on the
  rail of our model (say why in `nudge_why`).
- `walkers`: a path [[X, D], ...] walked back and forth at a pace with a walk clip, pausing at the ends; `figure` starts
  them at their scroll spot.
- `load_test_traffic`: a seeded crowd along a path, used only by the load-test panel's "extra walkers" (never shown
  by default): `kinds` (character, walk clip, speed, weight, `stops` clips, `talk` clips), `lanes`, `pairs`,
  `stop_every`, `stop_for`.
- `scale` (figures and walkers): for figures painted as children. It multiplies the character's own size: on the
  child model, the painted fraction × 1.70 m / the child's `height_m`.
- `animals`: `{"<slug>": {"model": "donkey", "load": "saddle_cloth", "do": [["idle", 9]], "scale"?, "nudge"?,
  "facing_deg"?, "path"?}}`, each at its map position facing from hind to fore hooves (or `facing_deg`: every animal
  of a team set out at real size gets one, and the builder's harness reads the same value), with a body of circles
  along its length. An animal with a `path` walks it (the pig herd); a perched one (`perch` in `animals.json`, the
  bird) sits at its mapped H. A rider is a figure with `"ride": "<animal slug>"` and the `ride` clip; it sits on the
  load's seat; with `ride_side` it sits turned 90° (`ride_turn_deg` overrides).
- `stand_in`: the existing character a figure plays until its own new character exists (else the townsman). Name the
  requested actions in `do` already: a character without the clip plays idle until it arrives.
- `carried_by`: a child carried in arms, on the shoulders, on the back or on a lap is its own map figure (support
  `carried in arms`, `shoulders`, `carried on back`), cast as the child with `carried_by` its carrier; the page doesn't
  draw it, the carrier's child prop does ("Carried props"), and the HUD boxes it with its carrier. A figure painted on
  a vehicle bed stands beside the vehicle, said in `nudge_why`, unless the kit gives a seat (`Built.seat` for drivers,
  `open_cart`'s `.bed` for a loader; skill `web-scene`, Vehicles).
- **Crews on boats** are figures whose map support names a boat level, `boat [<part> ]deck|roof|ladder: <boat id>`
  (`boat stern deck:`, `boat after roof:`, ...): `boats.js` `host()` stands each on that level in the boat's frame and
  moves it with the boat (a deck figure under a cabin, awning or cargo mound steps to the nearest open deck; a ladder
  figure stands on the rungs at its painted height). people.json `boats.<slug>` only for a boat under way: `run_m`,
  `speed_mps`, `pause_s`, `mast_cycle_s`, `crew` (`work: sweep` at the sweep's bar, `oar` at an oar's grip, `at`),
  `haul` (trackers on the bank with `walk` and `stand` clips, walking with its travel), `tow` (the figure the line ends
  at). A boat built 2–5 times its painted length keeps its crew at their painted metres: carry each crew figure's
  place along and across the waterline onto the built hull (`build_choices.json` boats `lw` and `beam`, centred between
  front and rear, inset 0.4 m across and 1.0 m along), then separate crewmates; sweep and oar crews stand at their bar.
- **Where the built thing moves the painted figure:** railing leaners stand 0.36 m inside the built railing, turned
  square to it (the painter turns railings toward the viewer); a cart's puller stands at the kit's real shaft tips, not
  at the painted front; a painted walking animal that is ridden or led stands, with its groom and driver; a walker
  whose path starts on a deck or floor higher than about 1.3 m lands under it (people.js spawns the root at y 0 and
  grounds its first step from 1.5 m), so it stands. Never clamp back into the painted area a figure that a recorded
  move put beyond it (a far bank moved out under the mist); clamp only figures inside it within 0.32 m of the edge.
- Drawing: everyone run by a routine is batched one draw per character (`web/src/crowd.js`; `?batch=0` turns it off).
  Only the clips people play are baked, appended as they are first asked for and time-sliced (a clip someone on screen
  starts is ready by the next frame), so a character may carry many; carried props and animal tack share their body's
  bake. With the streaming window, a character or animal loads with the first loaded section that casts it and goes
  with the last.
- Clips cross-fade; text-to-motion clips loop by fading into a second copy of themselves; every clip is grounded at load.
- **Bodies and routing.** Everyone is a 0.26 m cylinder. The player can't walk through anyone (player.js `pushOut`).
  Walkers plan 2.6 m ahead and steer round the player, figures and anyone standing, inside their path's corridor
  (measured once against the colliders); they follow someone walking their way at their pace, and stand (calm idle,
  never a slow-motion walk) when there is no room. If the way is shut they stop, face whoever blocks it, and turn
  round after 1-2 s. A figure that blocks a doorway or a stair needs a `nudge`. Check with `tools/people_check.mjs`
  on `world.html?...&window=all` (routing: you stand on the road at each `--road` spot; pick spots on painted walkers'
  lines, e.g. the gate's `--road "7,2.7;-3,6.3"`; a section streamed in just before a spot has walkers only just
  leaving their painted places, which skews the count) and look at motion with `tools/film_page.mjs`.
- **You.** The player is one of the characters (the "You" panel; default the official), seen from behind by the
  follow camera, or from its eyes in first person.
- Paths can follow the mapped road: `{"route": [from, to]}` in stations (metres from the section's datum, + east),
  resolved by the page from `layout.json`.
- `tools/export_web_scene.mjs` ships `people.json` with the scene. Every scroll figure is already in the map
  (`map/text/<S>.md` lists all of them with what they do); give one a character and a routine here.

When the user designs routines per person (name, description, background → where they go, how fast, what they look
at), they belong in this file, as data, and new behaviours as small additions to people.js.

## Casting a big section (S6's 180 figures, S4's 65, S3's 232; 2026-10-12)

Cast from a table and generate `people.json` with a script; never by hand.
- **Cast by dress.** Dump every figure's `what` (dress, age, sex, action) from the map into one text file and cast each
  against the existing characters (`characters/notes.md`). Request a new character for each type none fits (S6:
  children, a woman, monks, sedan bearers, the storyteller, the butcher, white-robed scholars, elders in tall hats, a
  bare-backed archer), naming the scroll figure that models it (map ID and crop), in the needs list for the workshop
  (skill `scroll-section`, the playbook).
- **The cast is data** (`gen/sections/inner_city/cast.json`), and a rerunnable script writes people.json
  (`gen/sections/inner_city/make_people.py`, `gen/sections/outer_road/make_people.py`). It holds the action cycles,
  named after what the painting asks for and mapped to the nearest clip each character has (an `ALIAS` chain; what is
  still wanted goes to `clips_why`), the `stand_in`s, the children's scales, the walkers and the animals with their
  tack. It models the kit's real sizes (cart bodies, sedan cabins, animal bodies), computes each nudge with its reason
  and prints every overlap. Rerun it after a build, a map move or a workshop delivery; when `build_choices.json`
  records animal formations, run it, then `map_layout.mjs`, then it again (the walk paths read the moved animals).
- **Walkers** are figures painted walking or carrying and not held to a cart, sedan, animal or child. Each plays a
  walk its character has (a missing walk slides): `carry_pole` with the pole props, `back_load` with a back frame or
  bundle, `fan_walk` with the fan, else `walk`. Paths run along the painted direction and are cut short at building
  footprints, vehicles (front to rear plus 0.6 m, ±1.0 m), every animal's real body (`animals.json` length and width),
  every ground prop (its radius + 0.3 m) and the painted area's edge. A painted walker with no room stands.
- **Final spots** are tested against furniture: a spot inside a counter or tub stands the figure on top of it (the
  ray from H + 1.2 m), so nudge it out (skill `web-scene`, "Before shipping").
- **When the workshop delivers:** drop the stand-ins, map each requested action to the character's real clips, add
  the props, rescale the children on the child model, and recast a seated figure whose character can't sit yet
  (`cast_why`). Then `map_layout.mjs`, `export_web_scene.mjs <folder> --no-boats`, `loyalty_check`, `ktx2.mjs encode`
  and `check`, `people_check` at `?window=all` and `budget_check.mjs <folder>` (new characters add to the cast's
  download); `node tools/clips_used.mjs` shows the clips nobody plays.

What round 2's casting added (S7, S4b, S3, S2, S1; `gen/sections/<folder>/make_people.py`):
- **A catalogue character not made yet is cast as `character` with `stand_in`:** the page and the script switch to it
  by themselves once `characters.json` lists it. A figure whose wanted character can't hold the pose is a pose
  fallback, written as `character` (world.js plays `character` whenever it exists), with the wanted one kept in the
  script (`POSE`) so it comes back when any of the pose's clips lands.
- **Resolve each painted action through a chain of clips of the same posture** (chair sit, floor sit or crouch, ride,
  standing); where the character lacks the posture, recast with the reason. Never stand a seated figure up.
- **Seated clips move the body off the figure's spot:** people.js stands a seated figure at its feet (the ground ray),
  and the sit clip puts the hips behind them. Probe each seated clip's hips and feet (`node tools/char_props.mjs
  <raw.glb> --probe <clip> <t>` at t 1–6) and nudge so the hips sit on the built seat (the builder's `solids.json`
  `seats`), the seat's top at the clip's seat height (the hips joint − 0.1 m). Retargets keep the root under the hips,
  library sits at the feet. Measured: the woman's `sit` (library 32) puts the hips 0.58 m behind and 0.18 m left of
  the feet point, seat 0.56 m; library sit 33 0.32 m behind, 0.17 m left, seat 0.51; the official's `sit_talk` 0.27 m
  behind, 0.14 m right, seat 0.62 (S4's soldier sat on air 0.4 m in front of his stool until this).
- **Props come as variants** (`back_sack_dark`, `sack_shoulder`, `stick_shoulder`, `stick_ride`, `hand_dish_buns`): map
  each painted prop to its parts in order of preference, and pick a walker's clip from the clip its load is placed in.
  A prop placed in `idle` on the back or hip shows on every standing step; a hand prop needs a single-clip cycle.
- **Test spots against the builder's collider cells** (`solids.json`), not the footprints: a figure in a low collider
  (a sack, a block, a tub) is stood on top of it by the ground rays at its spot and ±0.12 m. Take furniture sizes from
  the props table's `args` as the placer reads them (tables anchored at their front edge unless `anchor` says
  otherwise; `yaw: "deck"`), and slide a seated figure off a table top by the smallest move in any direction. A head
  painted at an opening is placed from the builder's opening (the passage, the door leaf's hinge and swing), not from
  its estimated foot.
- **Spread the cast:** faint figures whose dress can't be read go to several plain characters, and look-alike
  neighbours to different ones (two light-robed, top-knotted men side by side read as twins), so one face doesn't
  repeat along a street. Check a character's model crop against the map before casting from it (the `woman`'s crop
  was S7's doctor).
