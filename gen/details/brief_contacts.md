# Brief: contact measurement (details pass, agent "contacts")

Read first: `gen/details/plan.md` (the whole pass), `qingming/CLAUDE.md`, the skill `characters` (Routines, Carried
props, "Seated clips move the body off the figure's spot"), the skill `web-scene` ("Before shipping") and the skill
`scroll-section` "Machine resources" (the hard rules: Blender only through `tools/blender_slot.sh` /
`tools/build_scene.sh`, pages only through `tools/chrome_slot.sh` against `tools/check_server.sh` (port 5190)).

The user's rule: "We don't want to just use visuals ... use mathematical ways." The screenshots were examples:
"there are a lot of characters and we are generally not sure." So the job is to **measure every figure in all
eight sections**, numerically, and produce the full FAIL list. You fix nothing in this brief except the
check-only plumbing below. The pilot fixes come next, in a separate brief.

## Build these (each an atomic script, cached by its inputs)

1. **Per-owner geometry from the builders.** `blender/street_b1.py` `Buckets.add` already knows the owner (map ID,
   `edge:*`, `ground`) of every face. Also record each face per owner, in world coordinates, keeping its material
   and collide flag. After `build()`, write `gen/sections/<name>/owners.bin` + `owners.json` (index: owner →
   ranges, material, collide). `blender/build_web_scene.py` is the shared entry point (check that every section
   builder fills `street_b1.B`; boats are built separately by `kit_boats`, so note them as not covered).
   - Rebuild all eight sections with `tools/build_scene.sh <name>`: gate, outer_road, outer_road_2, inner_city,
     rainbow_bridge, canal, countryside, city_end. That is three slots, so they queue.
   - **Never export or ship a rebuilt GLB.** Instead, prove that the owners data matches what is live: triangles
     per material from the owners equal the shipped `web/public/assets/<name>.glb` per-material counts
     (`g_<mat>__col/nocol`, meshopt-decoded).
   - If a section's builder has drifted from what shipped, record it and measure against the owners anyway, flagged.
2. **`tools/joint_tracks.mjs <character|all>`.** FK of the **shipped** GLB (`web/public/assets/chars/<name>.glb`,
   meshopt), reusing `tools/char_props.mjs` `pose()`. Apply each clip's corrections exactly as `web/src/people.js`
   `prepareClip` does (`web/public/assets/clip_meta.json`: drift, grounding `k`). Then the sites are in the root
   frame the page draws, in metres at the size people.js gives the character (it sizes from the body alone, without
   `prop_`/`tack_` meshes).
   - **Sites:**
     - L/R palm (hand joint + about 0.08 m along the hand toward the fingers; measure the offset from the mesh);
     - L/R shoulder top;
     - seat point (under the hips, at the buttocks surface; measure from the mesh);
     - L/R sole (lowest point under each foot);
     - L/R forearm middle;
     - head top;
     - chest front.
   - 10 Hz over every clip. Output `gen/details/joints/<name>.json`, cached by the GLB's hash.
   - Validate the frame once against `char_props.mjs --probe`.
3. **Final placements.** `tools/people_dump.mjs`: one page load (chrome slot,
   `world.html?window=all&sound=0&tier=high` or whatever loads every section). It dumps per figure, walker and
   animal: id, section, character/model, root world position, yaw, scale, its `do` cycle, its support (ground, boat,
   seat), and the page's ground height under the root with the furniture ignored, if people.js can give it. Output
   `gen/details/placements.json`. This is the truth the checks use. Read `web/src/people.js` to learn how a figure is
   placed (layout X/D/H + `nudge`, `facing_deg`, scale, the ground ray from H + 1.2 m, boats' `host()`), and say
   which of those the dump captures.
   - Also write a node predictor that replicates the placement for static figures from layout + people.json +
     owners (ground ray against the collide owners). It must agree with the dump within 1 cm. The fixers' solver
     will need it to predict a nudge without reloading the page.
4. **`characters/contacts.json`: rules as data.**
   - **Clip → required contacts.** Each rule gives:
     - the site;
     - the target class: `vehicle` in the figure's map group or the nearest vehicle owner, `seat` (any non-ground
       surface under the seat point; ground for floor sits), `rail`/`wall` (nearest structure), `animal` (the
       people.json animal in the figure's group or the nearest), `self-prop` (by construction, skip);
     - the tolerance: gap and penetration.
   - **Start with these clips:** sedan_carry, push, steer, push_flank, bridle, hold_rope, lead, sit, sit_talk, sit_*,
     sit_floor, knees_up, lean_chin, lean_over, lean_wall, reach_over_rail, write, chop, bend_goods, ride,
     ride_side, work_sweep, pole_boat, fend_pole, stand_pole, tow_walk, haul_line, climb_ladder.
   - Run `node tools/clips_used.mjs` for the full list; give every clip a rule, even "no contact".
   - **Universal checks for every figure:**
     - stance soles on the surface under them;
     - "standing on furniture": the root raised above the ground owner by more than 5 cm while the layout support
       is ground;
     - the body cylinder (people.js BODY_R) inside a collide owner's cells;
     - head top inside geometry (low roofs, cabins);
     - any body site more than 2 cm inside a closed collide mesh (walls, tables, cabins, other vehicles).
5. **`tools/contact_check.mjs <section|all> [--json out]`.** Pure node: placements × joint tracks × owners (a BVH or
   uniform grid per owner; animals as their posed mesh if feasible, else the `animals.json` length/width capsule,
   said in the output).
   - Per contact: max and mean gap over the cycle, deepest penetration, PASS/FAIL. Per figure: the universal checks.
   - Output `gen/details/contacts/<section>.json` and a summary: counts per defect class and per clip, and the worst
     30 with numbers.
   - Calibrate on the known bad cases, which must FAIL:
     - S4 `fortune_teller_12232`: on the table top, 0.0 m from `S4.prop.table_12183`'s edge;
     - `client_seated_12185`;
     - the S4 bearers on `sedan_carry`: hands about 0.3 m over the pole and 0.45 m to the side;
     - `ox_driver_10635` `push_flank`: palms in the air.

     Also spot-check two that look right in a frame sheet; they must PASS.
6. Add `contact_check all` to `gen/expand/round2/page_qa/regress.sh` as a reported line. Don't make it fail the
   suite yet.

## Rules

- **Shared tree.** Another session (performance batch 2) owns the engine files in `web/src/`; don't edit them.
  Reading is fine. Don't deploy.
- If people.js needs a tiny hook for the dump (e.g. exposing the ground height under a figure), put it in the
  existing `window.__test` and record it in your notes. Re-read the file right before the edit and keep it to a few
  lines.
- `tools/machine.sh status` before heavy steps. Save state to the repo after each stage; /tmp dies at reboot.
- Record what you did and what you found in `gen/details/contacts/notes.md` as you go.
- Finish with:
  - the summary table: per section and per defect class, counts and worst gaps;
  - every script made, with its run time;
  - the S4 calibration cases' numbers;
  - anything that blocks the fixes.

## Shared build lock

Three details agents run at once: contacts, eyes and children. Character builds and KTX2 runs write shared files
(`web/public/assets/chars/`, `characters.json`, `ktx2/`). So every `node tools/character.mjs ... build`,
`tools/build_character.mjs` and `node tools/ktx2.mjs ...` runs under one lock:
`flock /tmp/qingming_charbuild.lock <command>`.

A build reads every input of the character, so the eyes agent's `eyes` field and the children agent's new prop both
land in whichever build runs last. Never revert a field in `characters/*.json` or `characters/props.json` that
you didn't add. Re-read those files right before each edit.
