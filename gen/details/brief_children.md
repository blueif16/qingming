# Brief: carried children (details pass, agent "children")

Read first:
- `gen/details/plan.md`;
- `qingming/CLAUDE.md`;
- the skill `characters`, especially "Carried props" (binding, `char_props.mjs`, `char_props.py review`, carried
  children) and `gen/expand/workshop_props_notes.md`.

Machine rules: the skill `scroll-section` "Machine resources". Blender only through `tools/blender_slot.sh`; pages
only through `tools/chrome_slot.sh` against `tools/check_server.sh` (5190).

The problem, in the user's words: "the man who has the child on his back: the child right now is not a 3D asset and
it's just composed, which looks a bit creepy." All four child props are kit primitives: a ball head, red lumps and
stick legs (`gen/props/child_*.glb`, built by `blender/char_props.py`; see
`gen/characters/idler/props_child_on_back.png`).

| Prop | Carrier and clip | Where it plays |
|---|---|---|
| `child_on_back` | idler `carry_child` | S6 |
| `child_on_shoulders` | townsman `carry_child` | |
| `child_in_arms` | woman `hold_child` | S4 `person_with_child_10430` |
| `child_on_lap` | woman_pale `sit_hold_child` | S7 `seated_woman_child_1535` |

The carried figures are map figures cast with `carried_by`, so the carrier's prop draws them. Find every use with
`grep -n carried_by sections/*/people.json`.

## Do

1. **Pose a real child model onto each carrier, by constraints.** Use the existing rigged `child`, `child_red` or
   `child_robed` (`gen/characters/<name>/<name>_raw.glb`, or the shipped GLB). Pick the one closest to each painted
   child's dress in the map (`map/text/<S>.md`).
   - At the carrier's clip time that the prop binds to (`characters/props.json`: `t`), solve the child's joints by
     IK so its contact sites land on the carrier's:
     - **back:** the child's hands on the carrier's shoulders; its thighs at the carrier's hips/waist, legs wrapping
       forward; the carrier's hands under the child's knees or thighs if the clip holds them there;
     - **shoulders:** the child's thighs astride the carrier's neck, its hands on the head;
     - **arms:** seated in the carrier's forearm crook, against the chest;
     - **lap:** on the thighs, the carrier's hands at its waist.
   - Blender (headless, slot), with IK constraints and empties at the carrier's posed sites, is the natural tool.
     `char_props.mjs` `pose()` gives the carrier's joint world matrices in node.
   - Bake the posed child mesh, decimated to about 1.5-2.5k triangles and keeping its UVs, into the prop geometry
     in the carrier's canonical prop frame, so `char_props.mjs` binds it as today, rigid to one bone.
2. **Texture.** Each prop part is already its own draw in `web/src/crowd.js` (batchOf(model, part)), so a child prop
   may carry its own material with the child's body texture. Then keep it out of `char_props.mjs`'s "first prop's
   texture for all props" rule:
   - give the child props their own material;
   - leave every other prop on the shared palette;
   - check that `tools/ktx2.mjs encode` picks the child texture up. Ideally it reuses the child character's KTX2,
     found by the image's bytes.

   If a separate material proves impossible, atlas the child's texture into an enlarged prop palette instead, and
   say why.
3. **Checks, by numbers.** Write `tools/carry_check.mjs`. For each carrier and its child prop, at 10 Hz over every
   clip the prop is shown in (the carry clip, plus any clip people.json plays with that prop on):
   - **contact gaps** between each pair of child and carrier sites (child hands to shoulders, thighs to hips, ...).
     The child is rigid to one bone while the carrier's other bones move, so report the drift over the cycle, max
     and mean. Target: ≤ 2 cm at the bind time and ≤ 4 cm over the cycle;
   - **interpenetration**: the depth of child vertices inside the carrier's skinned body mesh, at every sample.
     Target: ≤ 1 cm;
   - **floating**: no child vertex further than 3 cm from the carrier where a contact is required.

   Print PASS/FAIL with the numbers. A pose that fails gets re-solved, never waved through.
   - If a carry clip itself makes contact impossible (e.g. the carrier's hands never come near the child), say so
     with the numbers, and propose a local IK clip variant or a different clip. Don't buy a new take.
4. **Build and review.**
   1. Run `node tools/character.mjs <carrier> build` for each carrier. Run `status` first, so no paid step reruns,
      and diff the GLB: only the child prop may change.
   2. Run `ktx2.mjs encode` and `check`.
   3. Render with `char_props.py review` at several times, as before/after images in `gen/details/children/`, for the
      lead's final look.
5. **Fallback.** Use Meshy image-to-3D of a posed child (about 20-30 credits each, account `msy_VYNl`) only if the
   posed child model reads wrong after the constraints pass. Stop and report before spending any credits.

## Rules

- **Shared tree.** The performance session (3d-director-04) owns `web/src/`; don't edit it. Keep the GLB format as
  it is: only the prop's mesh and material change. Don't deploy.
- Record as you go in `gen/details/children/notes.md`, and save state to the repo after each stage.
- Finish with:
  - the check table, before and after;
  - triangle and byte costs per carrier GLB;
  - the files changed;
  - anything left.

## Shared build lock

Three details agents run at once: contacts, eyes and children. Character builds and KTX2 runs write shared files
(`web/public/assets/chars/`, `characters.json`, `ktx2/`). So every `node tools/character.mjs ... build`,
`tools/build_character.mjs` and `node tools/ktx2.mjs ...` runs under one lock:
`flock /tmp/qingming_charbuild.lock <command>`.

A build reads every input of the character, so the eyes agent's `eyes` field and the children agent's new prop both
land in whichever build runs last. Never revert a field in `characters/*.json` or `characters/props.json` that
you didn't add. Re-read those files right before each edit.
