# Brief: eyes (details pass, agent "eyes")

Read first: `gen/details/plan.md`, `qingming/CLAUDE.md`, and the skill `characters` (Data, Steps, `body_from`
variants and `--recolour`, the KTX2 step after every build). Machine rules: the skill `scroll-section` "Machine
resources"; pages only through `tools/chrome_slot.sh` against `tools/check_server.sh` (5190).

The problem: some characters have eyes drawn as solid round dots, which looks odd. The turnaround sheets
(gpt-image) drew them that way, and Meshy carried them into the texture. A first look at the sheet fronts
(`gen/characters/<name>/front.png`) points to about 13 of them: boatman, butcher, carter, child, child_robed,
fortune_teller, idler, inspector, monk, official, official_rider, sightseer, and camel_driver (borderline).
porter and townsman (`gen/v1`) and the variants (child_red, woman_pale, hat_traveller_dark) are not looked at yet.
That look is only a hint. The user wants it measured by numbers on all 34 shipped characters ("we don't want to
just use visuals ... use mathematical ways"; "there are a lot of characters and we are generally not sure").

Texture budget (measured): the face gets about 72-123 texels square of the 512 body texture, about 1.7-1.9 mm per
texel. A good eye of about 26 mm spans about 14 texels, so the 512 texture is enough.

## Build

1. **`tools/eye_check.mjs <character|all>`**: works on the shipped GLB (`web/public/assets/chars/<name>.glb`,
   meshopt) and on the full-resolution source texture that `tools/build_character.mjs` starts from (find where it
   takes it from).
   - Rasterise the rest-pose body mesh in UV space, without the `prop_`/`tack_` meshes, so that each texel of the
     head has a 3D point and a normal.
   - Take the head frame from the Head bone and project the front-facing face texels onto the face plane, in mm.
   - Find the two eyes: the pair of dark blobs mirrored about the midline, in the band between the nose and the brow.
     Find the brow too, so a brow isn't taken for an eye.
   - Measure each eye:
     - width and height (mm);
     - aspect ratio;
     - the lid line's reach past the iris;
     - the fraction of sclera (light, unsaturated texels inside the eye outline);
     - eye width over face width;
     - left/right agreement.
   - **Calibrate** so that the passing faces (groom, archer, woman, youth, bearer, storyteller) and the dots (boatman,
     butcher, monk, official) separate with a margin. Report the margin. A first guess: width ≥ 22 mm and aspect ≥ 1.8.
   - **Output:**
     - `gen/details/eyes/eyes.json`: metrics per character and eye, plus PASS/FAIL;
     - a face contact sheet `gen/details/eyes/faces.jpg`, the projected face images with the detected eye boxes drawn
       on them;
     - the PASS/FAIL table in `gen/details/eyes/notes.md`.
2. **The fix, as data.** Add `"eyes": {"from": "<donor>", ...}` to `characters/<name>.json`, applied by
   `build_character.mjs` (like `--recolour`) to the full-resolution texture before the 512 webp:
   - Take the donor's eye texels, in its face-plane mm, from a passing character of the same sex and age where
     there is one. Use the woman for women and youth or a child-like donor for children; if no donor fits, draw the
     eye procedurally: an almond outline, a dark iris, a hint of sclera and an upper lid stroke in the ink line style.
   - Scale them to the target's face width, centre them on the measured eye centres with the corners level, and
     mirror them for the other eye.
   - Replace the donor's skin with the target's skin tone, weighted by ink darkness, so no patch shows. Cover the
     old dot fully.
   - Write the result back through the same texel map. Texels on UV seams get every chart they belong to.
   - Variants (`body_from`) inherit the eye fix through the base texture. Check that `--recolour` still applies on
     top of it.
3. **Apply it to every FAIL.**
   - Before running `node tools/character.mjs <name> build` (local, no credits; `status` first, so no paid step
     reruns), check what else a rebuild would change. Clips and props must stay identical: diff the animation and
     node lists before and after. The rebuild must change only the texture.
   - Then run `node tools/ktx2.mjs encode` and `check`.
   - Re-run `eye_check`: every fixed character must PASS, and the ones that passed before must be unchanged.
4. **One look on the GPU.** Make before and after face close-ups through `web/chars.html` (`window.__test.focus(name,
   0, ~0.6, head height)`, chrome slot, `?props=`), as `gen/details/eyes/before_after.jpg`, for the lead's final
   review. The numbers decide; the image is the last look.

## Rules

- **Shared tree.** The performance session (3d-director-04) owns `web/src/`; don't edit it. Its crowd LOD and
  per-clip files will land on top of your rebuilt GLBs later, so keep the GLB format exactly as it is (only texture
  pixels change). Don't deploy.
- No paid Meshy or shyfai calls. If a character can't be fixed by the texture, say why and stop on that one.
- Record as you go in `gen/details/eyes/notes.md`, and save state to the repo after each stage.
- Finish with:
  - the before/after PASS/FAIL table with numbers;
  - the characters changed;
  - the KTX2 check result;
  - anything you could not fix.

## Shared build lock

Three details agents run at once: contacts, eyes and children. Character builds and KTX2 runs write shared files
(`web/public/assets/chars/`, `characters.json`, `ktx2/`). So every `node tools/character.mjs ... build`,
`tools/build_character.mjs` and `node tools/ktx2.mjs ...` runs under one lock:
`flock /tmp/qingming_charbuild.lock <command>`.

A build reads every input of the character, so the eyes agent's `eyes` field and the children agent's new prop both
land in whichever build runs last. Never revert a field in `characters/*.json` or `characters/props.json` that
you didn't add. Re-read those files right before each edit.
