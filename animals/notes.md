# Animals: the record

How to run everything: `node tools/animal.mjs <type|all> <step>` (the header of `tools/animal.mjs` lists the steps).
This file says what was made, from which painted animal, what it cost and what we found. The pipeline mirrors the
characters' (skill `characters`): one painted animal → B1 turnaround sheet (shyfai) → Meshy body (Smart Topology +
retexture from the views) → **our** quadruped rig (`blender/rig_quadruped.py`; Meshy rigs only humanoids) → clips
keyed procedurally → tack and loads from the kit → web GLB + registry.

## The animals (Run 1, 2026-10-11)

| type | painted animal (ref) | body | tris (body) | GLB | tack variants (tris) | clips |
|---|---|---|---|---|---|---|
| donkey | the trace donkey of the 串车, S5 `S5.ani.trace_donkey_8814` (restyle) | grey-dun, pale muzzle and belly, dark mane stripe, rope halter | 3,784 | ~270 KB | `saddle_cloth` (dark cloth, red hem, girth), `pack_saddle` (felt, sawbuck frame, two roped bundles), `collar` (padded collar, wooden hames) | idle 8 s, walk 1.07 s, graze 6 s, lie 8 s |
| ox | the lead ox of S4's three-ox covered cart (scan, u 10680–10980) | yellow draught ox, small hump, dewlap, short horns | 3,854 | ~210 KB | none (the neck yoke is the cart's) | idle, walk 1.27 s, graze, lie |
| camel | the rear camel of the caravan, S5 `S5.ani.camel_6060` (restyle) | Bactrian, fawn, shaggy beard and forelegs | 3,958 | ~290 KB | `pack` (frame between the humps, two boxes, two bundles, top roll, hanging pink cloth), `pack_sheaf` (the same with dark bundles and the fan-shaped sheaf of `S5.ani.camel_6335`) | idle, walk 1.3 s (near-pace), graze, lie |
| horse | the white horse lying in S4's courier post yard (scan, u 11700–11960) | small pale grey-white horse, grey mane and tail | 3,794 | ~230 KB | `saddle` (red cloth with dark hem, girth, padded seat with pommel and cantle, stirrups) | idle, walk 1.07 s, graze (head low), lie |
| mule | the wagon mules at S6's crossroads (scan, u 3380–3720) | dark bay mule, long ears, pale muzzle | 3,840 | ~250 KB | `collar`, `pack_saddle` | idle, walk 1.07 s, graze, lie |
| pig | the small animal and the lying animal at the top of S5's silk (`S5.ani.small_animal_6390`, `S5.ani.animal_lying_6320`; scan) | black Song pig, bristled spine, floppy ears | 3,208 | ~200 KB | none | idle, walk 0.8 s, graze (rooting), lie |

Every GLB: one skinned body mesh, one 512 px webp texture (the Meshy retexture), the tack meshes (skinned to the same
skeleton, one 64 px palette texture shared by all of an animal's tack), 4 named clips, 32 joints. Sizes and the
measures the page needs are in `web/public/assets/animals/animals.json` (written by the build step from each
`gen/animals/<type>/rig.json`).

## Which view Meshy builds a quadruped best from (donkey, 10 credits)

Smart Topology (meshy-t2, mesh only, 5 credits) from the side view and from the three-quarter view of the same
sheet, rendered side by side (`gen/animals/donkey/mesh_test.png`): the **side view** gave the cleaner body (upright
ears, separated legs, a mane of spikes, a tufted tail); the three-quarter view gave thinner ears and the rope halter as
floating loops (bad for skinning). Every animal since is built from the side view: mesh-only test (5) → read the
test render → retexture with all four views, the side view first (10). 15 credits an animal.

## The rig (`blender/rig_quadruped.py`)

- **One skeleton for every body plan**, 31 bones with the same names (`root > hips > spine1 > spine2 > chest >
  neck1–3 > head > ear.L/R`, `hips > tail1–3`, fore `scapula > humerus > forearm > cannon_f > hoof_f`, hind
  `femur > tibia > cannon_h > hoof_h`), fitted per model from the mesh: the four leg columns near the ground, joint
  heights from per-plan anatomy fractions (equid, bovid, camelid; a config's `joints` overrides any), the ears from the
  head's highest points (the poll sits between their bases), the neck root in front of the withers, the neck as a
  bowed line to the poll (the camel's U-neck is marched along its cross-sections), the tail down its hanging line.
  `gen/animals/<type>/frames/rig_check.png` shows the bones through the see-through body.
- **Skinning:** heat weights on a welded copy (the retextured mesh is split along its UV seams and the heat solve
  fails on it), mapped back by position; fixes: a leg never moves the other side or the other end of the body, the tail
  only its own vertices; loose shells the heat solve misses (the camel's fur locks) take the nearest weighted
  vertices; at most 4 influences.
- **Clips are keyed procedurally**, not hand-posed: the body, neck, head, ears and tail by forward kinematics (small
  periodic motions, all periodic in the clip length so every clip loops), the legs **solved analytically every frame**:
  each hoof follows its gait target, the cannon angle and the hoof's flexion come from the gait phase, and a 2-bone IK
  from the shoulder or hip finds the elbow (bends back) or stifle (bends forward). A leg stretched past its reach
  straightens its cannon toward the girdle instead of letting the hoof leave its target.
- **Walk:** a true lateral four-beat walk (left hind, left fore, right hind, right fore, a quarter cycle apart; duty
  0.62–0.64); the camel's is a near-pace (each hind lands just before the fore on its side), as camels walk. In place:
  a planted toe moves backward at exactly `walk.speed_mps`, so the page moves the root at that speed. The rig step
  measures it: over two cycles no planted toe moves more than ~1 mm over the ground (camel 11 mm), printed as
  `RIG walk slip` and stored as `walk.slip_mm`. Breakover (the heel lifts about the toe), knee fold, hoof flip, scapula
  swing, head nod twice a cycle, a small body bob and roll, tail and ear swing.
- **Idle:** weight shifts with the hooves planted, breathing, a slow look round, ear flicks and two tail swishes.
- **Graze:** the neck bends from its base until the muzzle reaches the ground with the face hanging nearly straight
  down, small nibbling nods, one fore hoof forward. `graze_z` raises it for the long-maned horse (head low, not on the
  ground: its mane is a single sheet that would stand out).
- **Lie:** sternal, the body lowered onto its belly, the fore cannons folded back under the forearms with the knees on
  the ground in front, the hind legs folded under the belly (a hind hoof that peeks out from under the lowered barrel
  reads as a stray piece, so they stay tucked in), head up, breathing.
- Review: Blender frame sheets per clip in `gen/animals/<type>/frames/<clip>.png` (side and three-quarter, written by
  the rig step), and on the real GPU with the ink pass `node tools/animal.mjs <type> frames --move` →
  `gen/animals/<type>/clips.jpg` (the walk advances over 0.25 m stripes).

## Tack and loads

Built in the rig script from the kit's primitives (`song_kit.beam`, `street_b1.tube` / `cyl`) plus three soft-piece
builders of its own: `drape` (a cloth with thickness cast onto the body's back, hanging straight down past the barrel's
widest point, an optional hem band), `soft_roll` (a bellied, lumpy bundle; no boxes) and `collar` (a padded ring round
the neck's own cross-section with wooden hames). Every variant is one skinned mesh `tack_<name>`: soft pieces take
the weights of the body under them, rigid pieces (frames, boxes, bundles) ride on one spine bone. Colours come from a
16-cell palette (true colours, `PALETTE` in the script). `gen/animals/<type>/frames/tack.png` shows every variant.

## Riding

`ride` (Meshy Text to Motion, prime; `prompts/motion_ride.txt`) on all 8 characters. The page seats a rider by
putting its Hips bone 0.09 m (× the rider's scale) above the seat point (the tack variant's `saddle_rest`, or
`saddle.rest` on a bare back) and parenting the rider to the saddle bone so it moves with the back; the `ride` clip
must not be grounded. `web/creatures.html?only=donkey&tack=donkey:saddle_cloth&rider=donkey:carter` does exactly
this; frame sheets `gen/animals/donkey/ride_carter2.jpg`, `gen/animals/horse/ride_sightseer.jpg`. `seat_back` in a
config moves the seat toward the tail (a donkey is ridden on its loins: 0.1 m).

## Credits (Meshy, account in use, 387 at the start of the run)

| what | credits |
|---|---|
| ride motion: take 1 (unusable: a half squat) 10 + its retarget onto the carter 3 | 13 |
| ride motion: take 2 ("sits up high on a tall narrow stool, straddling it as if riding a horse") 10 + retargets onto 8 characters 24 | 34 |
| donkey: Smart Topology tests from the side and three-quarter views 10, retexture 10 | 20 |
| camel, horse, mule, ox, pig: side-view test 5 + retexture 10 each | 75 |
| **total** | **142** (387 → 245) |

Images: one shyfai turnaround sheet per animal (the ox's twice: the first had different horns in each view).

## What worked, what to watch

- The sheet prompt (`prompts/animal_turnaround.txt`, 2 × 2: side, three-quarter, front, back; bare, standing square,
  legs apart) gives Meshy a clean, riggable body every time. Ask for the same horns in every view (the ox's first sheet
  drew bigger horns in the three-quarter view).
- Text to Motion has a 400-character prompt limit. "Riding" alone gave a half squat with the feet on the floor;
  describing a tall stool gave a true seat with the feet hanging.
- The glTF exporter turns frames into seconds at the scene's frame rate: set it (the first build ran 25% slow).
- The ink pass doesn't update world matrices (post.js): a page that moves animals must call `scene.updateMatrixWorld()`.
- Long single-sheet manes (the horse) stand out when the neck bends far: keep the horse's head-down shallow.

## With the vehicles

`blender/kit_vehicles.py` `HARNESS` now holds the numbers measured on these models (collar hooks of the donkey's and
the mule's `collar` variant, the top of the ox's neck where the yoke rests), and its review imports the rigged
animals at the team spots instead of grey blocks (`gen/vehicles/with_animals/`): the ox yoke sits on the oxen's
necks, the traces end at the donkeys' and mules' hames.

## Run 2 (2026-10-12): the dog, the kush, the ox's tone, the white horse, the bird, new tack

### What was made

| type / change | how | tris | GLB | clips |
|---|---|---|---|---|
| **dog** (S6 `dog_4335`; ref: the faint scan dog at u 4290–4378) | Meshy body (side view, account `msy_B7y3`), new `canid` plan | 3,185 | ~210 KB | idle, walk (0.73 s, slip < 1 mm), sniff, lie (sphinx) |
| **camel** `lie` → a real **kush** | new lie mode, no new body | — | — | lie |
| **ox** coat → yellow-dun | `"tone": {"hue": 5, "saturation": 0.8, "value": 0.98}` on the body texture | — | — | — |
| **ox** tack `draught` | girth band (with trace points), breast strap with five red tassels, nose rope | 220 | | |
| **horse_white** (S4 `white_horse_lying_11840`) | the horse's body (`"body_from": "horse"`), `"tone": {"saturation": 0.3, "value": 1.1, "lift": 0.04}`: clean white with grey shading | 3,794 | ~260 KB | idle, walk, graze, lie, head_low, walk_low |
| **horse** `head_low`, `walk_low` | muzzle at about knee height, face slanting down (S4's horses standing or walking with the head hanging) | — | — | +2 clips |
| **donkey** tack `pannier_charcoal` | felt, pack saddle, two wicker panniers (rim rings, uprights) heaped with dark lumps rising over the back | ~1.5k | | |
| **bird** (S4 `bird_12433`, a crow perched in a willow) | kit shapes, no Meshy: `"build": "kit"`, its own 6-bone rig (root, body, head, tail, wing.L/R) | 382 | ~25 KB | idle (perched: jerky head turns, two tail flicks, a wing shuffle) |

### Workflow: a new body plan (the dog)

1. Write `animals/<type>.json` with a new `plan` and `prompts/animal_<type>.txt`; ref → sheet → views (read
   `views.jpg`) → test from the side (5) → read `mesh_test.png` → mesh (retexture, 10) — the Meshy steps in one
   account (`MESHY_API_KEY=$(grep '^msy_B7y3' ~/.meshy_keys) node tools/animal.mjs dog test|mesh`).
2. Add the plan to `PLANS` in `blender/rig_quadruped.py`: joint heights as fractions of the back height. For a
   digitigrade animal the bone names stay (one skeleton for every plan) but mean: `fetlock` = top of the paw,
   `knee` = carpus (low, ~0.22), `hock` fairly high (~0.3). Walk numbers per plan (dog: 0.72 s cycle, stride 1.05 ×
   back height, duty 0.6). `lie_mode` picks the lying pose.
3. `node tools/animal.mjs <type> rig` and read `frames/rig_check.png` first: are the ears found (the head's highest
   points per side), does the tail follow the mesh? A tail that curls **up** (a dog's sickle tail) can't be found by
   the hanging-tail search: give it as `joints.tail_path` (`[y, z]` in units of the back height; read them off a side
   profile of the vertices).
4. Read every clip in `frames/<clip>.png`, then on the GPU (`frames --move`).

### Workflow: a variant of a body (`body_from`) and a recolour (`tone`)

- `"body_from": "horse"` reuses that type's Meshy body (ref/sheet/views/mesh are skipped, nothing paid); the variant has
  its own clips, tack and tone. `"tone": {hue (deg), saturation (×), value (×), lift (+)}` is an HSV change of the
  whole body texture, saved as `gen/animals/<type>/<type>_body_toned.png` and exported in its place.
- Ox: the Meshy coat came out a saturated orange; saturation 0.7 + value 1.05 went too pale (cream); 0.8 / 0.98 with
  a +5° hue reads as the yellow-dun draught ox (`gen/animals/ox/clips_toned2.jpg`).

### Workflow: a kit-built animal (`"build": "kit"`, the bird)

- No Meshy: `rig_quadruped.py bird` builds the body from low-poly ellipsoids, a cone beak, a three-feather tail fan and
  stick legs with toes, all on the tack palette, skins each part rigidly (the legs blend from root to body), keys the
  clip and exports. Its registry entry has `perch` (the feet's grip, the root's origin) instead of hooves; put that
  point on the branch.

### The lie, reworked

- Every `lie` is now **grounded**: after keying, the chest's midline (between the fore and hind legs) is measured on the
  deformed mesh and the body raised or lowered until it rests 1.2% of the back height above the ground (two passes;
  `RIG lie:` in the log). The Run 1 lies were off by up to 18 cm (the ox and the pig sank about 18 cm, the horse 9 cm, the camel floated 14 cm).
- `lie_mode` per plan:
  - `fold` (equids, bovids): as Run 1.
  - `kush` (camelids): forelegs folded tight, the carpal pads on the ground just ahead of the chest (the knee is placed
    by solving backwards from it: `toe_for_joint`), cannons and feet folded back under; hind legs in a flat Z (stifle
    forward beside the belly, hock under the hip, cannon and foot forward under the belly); the neck lifted 34° at its
    base and the forequarters 5° (`lie_pitch`), as a camel rests high on its sternal pad.
  - `sphinx` (canids): forelegs stretched forward along the ground, hind legs folded under, forequarters lifted 6°.
- The camel's long throat beard still dips under the ground plane in the kush (hidden by the street; it would show on a
  bridge deck).

### Tack added

- `breast_strap` (cast round the chest front at a height, tassels hanging), `nose_rope` (from the nose ring, slack, to
  the chest), `girth` with `"traces": true` (writes `harness.trace_girth_l/r`: where a cart's traces hook onto the
  girth band; the ox's are at about 0.74 m), `panniers` (wicker baskets + a lumpy load, `load` colour, `rise`).
- The tack palette grew to 5 × 5 (wicker, charcoal, crow, beak): every animal's tack was re-rigged so its UVs match.

### Credits (Run 2, animals)

| what | account | credits |
|---|---|---|
| dog: Smart Topology test from the side 5, retexture 10 | `msy_B7y3` | 15 |
| everything else (kush, tone, white horse, head-low clips, bird, tack) | — | 0 |

Shyfai: one dog sheet.

### Pitfalls met

- A WSL `UtilAcceptVsock` error can kill a headless Blender run silently: the step prints nothing and the key isn't
  written. Rerun (`--force`).
- A pose that looks wrong in a frame sheet: render it big with the bones' world positions before changing numbers
  (the dog's "high rump" was the thigh's bulk, not the bones).

## Open

- The dog's `lie` reads as a play bow on the GPU sheet (forelegs flat, hindquarters still up): the canid hind fold needs
  the hocks brought to the ground. S6's dog walks, so nothing uses it yet.

- Small animals: the pig scaled to about 0.55 is the piglet.
- The horse has no collar variant yet (S4/S6 horses are ridden); add one if a cart team needs horses.
- `walk` is the only locomotion; a trot or `pull` (leaning into the collar) if an area paints one.
- The bird has only `idle`; a hop or take-off if one is painted in flight.
