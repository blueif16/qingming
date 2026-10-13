# Details pass: eyes, contacts, carried children (plan, 2026-10-13)

The user's five screenshots (Desktop, 2026-10-13 00:10-00:12) and the rule they set: "We don't want to just use visuals
to make sure that it works. We need to use mathematical ways." Every fix below is gated by a number. A screenshot is
only the last look.

## What the screenshots show (measured)

| Shot | Figure | Cause, in numbers |
|---|---|---|
| 001104 | S4 `fortune_teller_12232` sitting on his table | His mapped foot (45.84, 14.38) lies on the edge of `S4.prop.table_12183`'s footprint (D 13.78-14.38). people.js grounds a figure with a ray from H + 1.2 m, which hits the table top, so he sits on the top. No seat is built under him: `build_choices.json` already notes that he "sits on air until one does". His client `client_seated_12185` (45.32, 14.15) is also inside the footprint, by 0.03 m. |
| 001012 | S4 sedan bearers (`bearer`, `sedan_carry`) | In `sedan_carry` (t 2 s) the right hand is at 1.59 m and the left at 1.48 m. The hands are 0.36 m apart and 0.23 m in front of the chest, so they hold nothing, and no pole rests on the shoulder. The kit (`kit_vehicles.sedan_chair`) puts its poles at 1.30 m, at ±0.45 m from the centreline, and the bearer stands on the centreline. That leaves the hands about 0.3 m above the nearest pole and about 0.45 m to the side of it. |
| 001047 | S4 `ox_driver_10635` (`idler`, `push_flank`) | The palms push the air beside the ox: the figure is placed at its painted foot, and the ox's flank surface is never consulted. |
| 001249, 001148 | Dot eyes | The turnaround sheets (gpt-image) drew the eyes as solid dots on 13 characters: boatman, butcher, carter, child, child_robed, fortune_teller, idler, inspector, monk, official, official_rider, sightseer, and camel_driver (borderline). child_red inherits child's texture. porter and townsman (gen/v1) are still to be measured. Texture resolution is not the cause: the face gets 72-123 texels square of the 512 body texture (about 1.7-1.9 mm per texel), so a 26 mm eye spans about 14 texels. |
| (user) | Carried children | `child_on_back`, `child_on_shoulders`, `child_in_arms` and `child_on_lap` are kit primitives: a ball head, red lumps and stick legs (`gen/characters/idler/props_child_on_back.png`). Four figures use them (S4, S6, S7). |

Size of the contact problem: of 754 figures, about 300 play a clip that touches something. Seated figures are
about 100 (sit, sit_floor, sit_talk, ...). Leaners on rails, walls and counters are about 55. Then come push (15),
sedan_carry (15), bridle (13), work_sweep (12), ride (14), push_flank (5), boat poles (17), tow and haul (8),
bend_goods (11), write and chop (5), and the carried children (4).

## The method: contacts as data, checked as distances

1. **Contact sites on the body.** Each site is a point fixed in a bone's frame. The palm is the hand joint plus
   0.08 m along the hand. The shoulder top is the arm joint plus 0.07 m up. The seat point is Hips minus 0.10 m. Each
   sole sits under its foot joint. The forearm site is halfway along the forearm.
2. **Joint tracks** (`tools/joint_tracks.mjs`, new). These are FK from the GLB, using `char_props.mjs` `pose()`.
   Each clip is first corrected the way people.js corrects it (`clip_meta.json`: grounding `k`, drift), so the numbers
   are what the page draws. Every site is sampled at 10 Hz over the clip, in root space, in metres at the
   character's size. The output is `gen/characters/<name>/joints.json`, cached by GLB hash and computed once per build.
3. **Anchors on objects.** Builders export the features a body touches into the section's solids, with map IDs:
   - **segments**: sedan poles, cart shafts, push bars, rails, rope ends;
   - **surfaces**: seat tops, table tops, decks;
   - **bodies**: an animal is its posed mesh at its people.json spot.

   Map groups pair the figure with its object (`S4.grp.sedan_chairs_10623` lists the bearers), so no pairing is
   done by eye.
4. **Rules** (`characters/contacts.json`): clip → required contacts and tolerance.
   - `sedan_carry`: the shoulder top on the pole ≤ 3 cm, and both palms on the same pole ≤ 3 cm.
   - `push`: both palms on the push bar ≤ 3 cm.
   - `push_flank`: palms on the animal's surface, gap ≤ 2 cm, penetration ≤ 1 cm.
   - `sit*`: the seat point 0-3 cm above a seat top, and soles on the ground ≤ 2 cm.
   - `lean_*`: forearms on the rail top ≤ 3 cm.
   - `ride`: the seat point on the saddle seat.
   - **Everyone**:
     - stance soles on the ground;
     - the root no higher than the terrain unless its support is a deck, a floor or a seat;
     - the 0.26 m body cylinder outside every collider cell.
5. **Check** (`tools/contact_check.mjs <section|all>`). It runs in node with no GPU and no Blender: about 750
   figures × 60 samples of vector maths, under a second per section. For each contact it reports:
   - the gap over the cycle, as a maximum and a mean;
   - the deepest penetration (signed distance);
   - PASS or FAIL against the rule.

   Distances are:
   - point to segment, minus the pole's radius;
   - signed height over a surface, inside its outline;
   - point to mesh for an animal, using a BVH, or the animals.json capsule as a first pass.

   The check is added to `gen/expand/round2/page_qa/regress.sh`. An in-page twin in `people_check` ("contacts")
   reads the page's real bone matrices at a few times. That catches anything people.js changes at runtime: ground
   rays, clamps, boat hosting.
6. **Solve, then re-check.**
   - **Move the figure.** Root offset and yaw are chosen to minimise the sum of squared gaps over the cycle. The
     offset has a closed form (the mean residual) and yaw uses a 1-D search. The result is written as `nudge` and
     `facing_deg`, with the reason "solved: contact". This alone fixes the fortune-teller type and most pushers and
     leaners.
   - **Fit the object to the body** where its size is the builder's free choice. Example: `pole_h` set to the
     bearers' measured shoulder-top height in `sedan_carry`, with the bearer standing under one pole.
   - **IK clip variant** where the clip cannot reach (`tools/ik_clip.mjs`, local and free, like
     `retarget_local`). Per frame, a two-bone IK on the arm or leg pins the site onto the feature in root space. The
     result is written as a new clip, e.g. `sedan_carry~pole`. The check runs again.
   - **Build the missing seat** for a figure painted seated with nothing under it. The fortune teller gets a stool;
     `map/BUILDING.md` rule 3 makes a painted-seated figure's seat part of the figure.

## Eyes: measured, then replaced with a passing character's eye

- `tools/eye_check.mjs` (new):
  1. Rasterise the rest-pose mesh in UV space, so every face texel has a 3D point.
  2. Project the face texels onto the head's front plane, in millimetres.
  3. Find the pair of dark blobs, mirrored about the midline, in the eye band between nose and brow.
  4. Measure each eye: width and height in mm, aspect ratio, sclera fraction, and the lid line's reach past the iris.

  Thresholds are calibrated so that the passing faces (groom, archer, woman, youth, bearer) and the dots (boatman,
  butcher, monk) separate with a margin. A first guess: width ≥ 22 mm and aspect ≥ 1.8. The output is a
  PASS/FAIL table.
- Fix: a `build_character` step, `"eyes": {"from": "<donor>"}` in `characters/<name>.json`, applied to the
  full-resolution texture before the 512 webp:
  1. Take the donor's eye texels in front-plane millimetres.
  2. Scale them to the target's face width and centre them on the measured eye positions; the other eye is
     mirrored.
  3. Swap the donor's skin for the target's skin tone, weighted by ink darkness.
  4. Write the result back through the same texel map.

  Variants inherit the change. Then re-check (it must PASS), run `ktx2.mjs encode` and `check`, and finally take one
  close look on the GPU.
- Cost: none. It runs locally, in minutes per character.

## Carried children: a real child model, posed by the same constraints

- The existing `child`, `child_red` and `child_robed` models are posed by IK, with the carrier's sites as targets:
  - on the back: hands on the carrier's shoulders, thighs at the carrier's hips, the carrier's hands under the knees;
  - on the shoulders: thighs astride the neck, hands on the head;
  - in arms and on the lap: the existing placements.

  Each pose is baked as the carrier's `prop_child_*` geometry, rigid on Spine, as now. The child's texture goes into
  the prop palette region, so the carrier still draws in one batch.
- Checks:
  - every contact pair is ≤ 2 cm;
  - interpenetration (child vertices inside the carrier's skinned body, at every sample of the carry clip) is ≤ 1 cm.
- Cost: none. Fallback: Meshy image-to-3D of a posed child (about 20-30 credits each) only if the posed model reads
  wrong.

## Order

1. **Measure:**
   - `joint_tracks`, `contact_check`, `eye_check`;
   - anchors exported from the builders, starting with the sedan, cart, barrow, seat, table and rail kits.

   This step changes nothing in the world and produces the full FAIL list with numbers.
2. **Pilot on S4 outer_road**, which has all three kinds: the fortune teller and client, five bearers and two
   sedans, and the ox pusher. Add the eyes of the S4 cast and one carried child. The standard is agreed on the pilot.
3. **Scale:** one agent per section works the FAIL list (solve, fit, IK, seat). The eyes go one character at a time.
   Then regress, look and hand over to the lead session for the deploy.

Shared-tree notes: the performance session owns `web/` engine files. This pass touches:
- data: `people.json`, `characters/*.json`, `contacts.json`;
- character GLBs (eyes, clip variants, child props);
- builders (anchors, seats).

It adds no engine code, except the optional `people_check` line. Deploys go through the lead session.
