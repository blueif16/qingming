**Merged, 2026-10-12 (round-2 records agent):** into characters "Data" (variants), "Steps" (build, slots,
dry-run), "Reviewing actions" (hand positions), "Animals" (tone ramp, horns, lie_turn, tack kinds) and "Carried props"
(palette, review views, placements, boat poles), 2026-10-12. Left out: "use your own GPU browser and dev server"
(superseded by the Chrome slots and the check server).

# Workshop lessons, round 2 (2026-10-12): exact text for the `characters` skill

The round-2 workshop (catalogue §8 (a)): 92 free retargets, 37 carried props, animal variants with tones, tack and
kit-built horns, three recolour variants, then the boatman, the grain porter and eight takes on one 151-credit
account. Records: `characters/notes.md` (Round 2), `animals/notes.md` (Round 3), `gen/expand/round2/workshop_progress.md`.
Each block below says where it goes in `.claude/skills/characters/SKILL.md`.

---

## Data: add to the clip-source list and the config fields

- `"body_from": "<character>"` in `characters/<name>.json`: a **variant** of another character, nothing paid. It takes
  the base's rig, clips (the same retarget files: same rig) and carried props, and recolours part of the body texture
  with `"recolour": [{mask, to}]` (`tools/build_character.mjs --recolour`):
  - `mask`: texels whose colour matches (`hue` [h0, h1] degrees, `sat`, `val`), optionally only on faces of a part of
    the body in the rest pose: `y` [f0, f1] (height as a fraction of the body's, every vertex of the face inside) and
    `radial_min` (distance from the head's vertical axis as a fraction of the height: a hat's brim; `crown` keeps the
    faces above that height too);
  - `to`: a `ramp` [[value, "#rrggbb"], ...] (the texel's value mapped to a colour: a new tone that keeps the painted
    shading), or `hue`, `hue_shift`, `sat_mul`, `val_mul`, `val_add`.
  - Made: `hat_traveller_dark` (the straw hat as black felt), `woman_pale` (the slate over-robe pale), `child_red`.
  - Measure the texture's hues before writing a mask: Meshy's "teal" jacket was hue 100–120, not 160–200
    (`gen/characters/<variant>/recolour_check.jpg` is the GPU check).

## Steps: add under the table

- `build` builds with the clips that are made and lists the ones still to come (a take not landed yet); the
  registry (`characters.json`) lists only clips the GLB holds, so an area's casting never asks for a clip that isn't
  there.
- Headless Blender only through `tools/blender_slot.sh` (`character.mjs` converts take FBXs through it, and
  `animal.mjs` rigs through it): three slots are shared by every agent on the machine, so a rig or a review may wait
  minutes for one. Batch Blender work into one run where you can (`char_props.py -- review_many`).
- `node tools/character.mjs all clips --dry-run` hashes every clip source of every character and takes minutes on a
  busy machine; dry-run only the characters you changed.

## Reviewing actions: add

- Use your own GPU browser and dev server when several agents work at once: a second headless Windows Chrome on its
  own port and profile (`--remote-debugging-port=<port> --user-data-dir=C:\Temp\<profile>`; the first launch of a new
  profile takes 15–20 s before the port answers), `vite --port <own> --strictPort`, and `CDP_PORT=<port>` for
  `clip_sheet.mjs` and `animal.mjs frames` (`--base http://127.0.0.1:<own>`).
- A walking or poling take must say **where the hands are, together, and how high**, or the hands drift to the hips:
  `pole_boat` take 1 ("both hands high on a long pole ... leaning the weight down along it") kept the hands on the
  hips; take 2 ("both hands grip a long pole together at shoulder height, one hand above the other ... bending deep
  from the waist until his hands reach his knees") reads as poling. One retake in eight takes this round.

## Carried props: add

- `char_props.mjs` uses the **first prop's texture** for all of a character's props: every prop GLB must carry the
  same palette. After adding a palette cell (round 2 added `ceramic` and `sack`), rebuild every prop
  (`char_props.py -- build <gen/props>` with no list).
- Review renders look from the character's left (side 90°, three-quarter 35°): a right-hand prop is hidden. Give a
  `review_many` job `"views": [[-90, 6], [-35, 14]]` for right-hand things.
- New placements that worked: a bag at the hip is `at: back` with `bone_ref: Hips`, `follow: 1` and a sideways
  `offset`; a staff or stick on the shoulder is `at: shoulder` with `pitch` 65–75 (the rod rises behind); a seated
  child on a lap is `at: back` with `bone_ref: Hips`, `follow: 0`; a hood on the head is `at: head` with `lift: 0`,
  its cape a separate prop on Spine (`bone_ref: neck`), since one prop follows one bone.
- A long rod in the fist (`at: hand`, `rot [90,0,0]`) swings with the arm on `walk`; to keep a walking staff upright,
  use `hand_world`.
- Two-handed loads (`flat_basket`, `rope_coil`, `open_sack`, `bundle_small`) go on `at: hands` with a clip whose
  hands are together: `hold_tray`, `bend_goods`. The townsman got a free `hold_tray` for this.
- Boat poles are three geoms, one per grip: `long_pole` (foot 1.05 m under the fist: `stand_pole`), `long_pole_low`
  (gripped near the top: `pole_boat`), `long_pole_mid` (gripped at the middle: `fend_pole`). About 170 triangles each:
  the node bands come from the bamboo strip (`stube` breaks), not from rings.

## Animals: add to the section

- **Tone by ramp:** `"tone": {"ramp": [[luminance, "#rrggbb"], ...]}` maps each texel's luminance to a colour, so a
  white or grey body can become bay, near-black or slate (an HSV change can't add hue to a grey). Used for
  `horse_dark` (dark bay, near-black mane), `donkey_dark` (near-black, pale muzzle kept lighter) and `buffalo` (dark
  slate). Measure the body texture's luminance percentiles first and place the stops on them.
- **Horns as part of the body:** `"horns": {"shape": "swept" | "lyre", span, back, rise, r0, flat, sweep, uv_from}`
  builds two swept, flattened, tapering horns at the ear (horn) bones, weights them wholly to `head`, and **joins them
  into the body mesh** with the body's own material, their UVs on a body texel of the right colour (`uv_from: "hoof"`
  for dark horn, `"ear"` for the ox's pale horn). They show always and batch with the body (`crowd.js` draws only the
  body and `tack_*` parts, so a separate horn mesh would vanish in a crowd). The buffalo (ox body + slate ramp + swept
  horns, 0 credits) reads as a water buffalo, so the paid buffalo body (catalogue item 46) isn't needed.
- `"lie_turn"` (degrees, + = the animal's left) holds the head turned while lying (the buffalo looks toward the
  viewer); `"joints": {"lie_neck_raise": 16}` lifts the head higher.
- New tack kinds (`blender/rig_quadruped.py`): `halter` (noseband, crown piece, cheek straps: rope), `bridle` (the same
  in leather with bit rings and reins over the neck to the pommel), `breeching` (a band round the haunches and a strap
  over the croup), `crupper` (from the saddle along the spine to a loop at the dock, `tassels`), `skirt` (a long
  saddle skirt hanging straight from the barrel's widest point to `z_bot`, with a cord `fringe`; rigid on the spine so
  the legs move behind it), `bale` (one huge soft sack across the back, its ends hanging far down both sides, roped).
  Straps round the head or the tail are cast from the body's cross-section (`section_ring`) clamped to 1.3× its median
  radius, or the ring runs up round an ear or out round the rump.
- Variants carry their own `tack` (it isn't inherited from `body_from`): copy the base's variants the variant needs.
