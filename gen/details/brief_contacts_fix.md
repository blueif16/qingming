# Brief: contact fixes, pilot S4 (details pass, agent "fix-S4")

Read first:
- `gen/details/plan.md`;
- the measurement record `gen/details/contacts/notes.md`, `summary.md`, `summary.json` and `outer_road.json`;
- `characters/contacts.json` (the rules);
- `qingming/CLAUDE.md`;
- `map/BUILDING.md` (rule 3: a painted-seated figure's seat is part of it; loyalty);
- the skill `characters` (Routines, "Seated clips move the body off the figure's spot", Casting a big section) and
  the skill `web-scene` ("Before shipping");
- `sections/outer_road/people.json` with its `*_why` notes, and `build_choices.json`;
- S4's casting script, if it has one (`gen/sections/outer_road/`).

Machine rules: the skill `scroll-section` "Machine resources". Pages only via `tools/chrome_slot.sh` against
`tools/check_server.sh` (5190), with `?start=0`. Blender only via `tools/blender_slot.sh` / `tools/build_scene.sh`.

The user: "They need to actually make contact with the object they are applying force to ... not only do we make
sure his feet are on the ground ... but we can also make sure he is interacting with all the forces." And: "We
don't want to just use visuals ... use mathematical ways." The measurement found 343 of 807 people with at least one
FAIL. **S4 outer_road** has 28 failing people:
- the fortune teller on his table, and his client sitting on air;
- all the sedan bearers;
- the ox pusher pushing air;
- the porters at the sedan poles;
- table and rail leaners;
- a few sole and furniture cases.

**Your job:** make S4 PASS `node tools/contact_check.mjs outer_road`, and while doing it, set the standard (tools and
rules) the other sections will follow.

## The standard to establish (write it in `gen/details/contacts/fix_standard.md`)

For each FAIL class, decide and record the fix order. The likely order:
1. **Rule wrong?** Read the figure's map text (`map/text/S4.md`).
   - If the figure isn't really touching anything in the painting (a "lean_chin" chosen for a standing pose with no
     rail painted), recast the clip to one whose rule fits, keeping the painted action. Never invent a rail.
   - If the rule is wrong for that clip in general, fix `characters/contacts.json` (via its generator
     `gen/details/contacts/tools/make_contacts_json.py`).
2. **Move the figure.** Solve the root offset and yaw that minimise the squared contact gaps over the cycle. Use the
   predictor (`tools/place_predict.mjs`) and `tools/lib/owners_index.mjs`. Write the result as people.json `nudge` /
   `facing_deg`, with the reason in `nudge_why` ("solved: contact <site>→<owner>, gap before/after").
   - Set a limit on how far from the painted spot a solve may move a figure (say 0.6 m), and record it.
   - The fortune teller and his client are the template: onto the built stool that already exists for him,
     0.22 m north, and off the table edge.
3. **Fit the object to the body** where its size is the builder's free choice (`choice:` in the builder).
   - Template: the sedan poles' height `pole_h` set to the bearers' measured shoulder-top height in their carry clip
     (from `gen/details/joints/`).
   - The bearer stands under the pole (as painted: "the pole on his right shoulder"), or between the pole ends with
     both hands on them (the front bearer "bending to the pole ends"): read each bearer in the map.
   - Builder changes go in `blender/kit_vehicles.py` / the section builder, with `choice:` reasons.
4. **IK clip variant** where the clip can't reach. Build `tools/ik_clip.mjs`, local and free:
   - it takes a character's clip and, per frame, an analytic two-bone IK on the arm (or the leg) that pins a site
     (palm, shoulder top, sole) to a target given in the root frame;
   - it writes a new clip into the character's GLB under a derived name (`sedan_carry~pole`, `push_flank~ox`);
   - targets come from the object's geometry in the figure's frame; where several figures share the same relative
     setup, they share one variant clip;
   - each variant is added through the character's normal build (`characters/<name>.json` clips get a new source
     kind, e.g. `"ik:<base clip>@<target spec>"`, handled in `tools/character.mjs` / `build_character.mjs`), so it is
     cached and rebuilt like any clip;
   - character builds run under `flock /tmp/qingming_charbuild.lock`;
   - frame sheets confirm the look (`tools/clip_sheet.mjs`), but the PASS is numeric.
   - The sedan bearers and the ox pusher (`push_flank` palms onto the ox's flank surface) are the templates.
5. **Build the missing seat** (BUILDING rule 3) for a painted-seated figure with no seat under it: a stool, bench
   or box owned by the figure's map ID, in the section builder. Only where the painting seats it.
6. **Engine-level classes**, which you only propose, never edit (people.js and world.js belong to the performance
   session, 3d-director-04):
   - **Clip-level soles:** the page grounds by the lowest foot bone, not the mesh sole. Proposal: a per-clip `sole`
     correction measured from the mesh by `tools/joint_tracks.mjs`, written into `web/public/assets/clip_meta.json`,
     and added by people.js `prepareClip` to its `k` (a few lines). Write the exact patch and its numbers, and
     message 3d-director-04 with it. They land it, or OK you to land it.
   - **Figures grounded on hidden colliders** (Rainbow Bridge's walk ramp: 24 figures 6-16 cm above the visible
     steps): propose that figure grounding ignores `hidden` collider material.
   - **Seam ground order:** say what the fix would be.

## Rules

- **Section rebuilds and exports.** The performance session's cells agent is re-cutting the section GLBs (export).
  Before you run `tools/export_web_scene.mjs` for outer_road, message 3d-director-04 and ask which exporter state
  to use and whether S4 is being re-cut at that moment. Never run two exports of one section at once.
- After each change, rerun the measurement:
  - `tools/chrome_slot.sh node tools/people_dump.mjs` (or the predictor while iterating), then
    `node tools/contact_check.mjs outer_road`;
  - finally the regression (`tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh <tag>` with
    `start=0`), plus `loyalty_check S4` PASS and `people_check` sizes 0.
- Before and after stills of the fixed S4 cases at the same views (the fortune teller, the sedans, the ox pusher)
  in `gen/details/contacts/fix_s4/`, for the lead's final look.
- Never deploy. Don't edit web/src. Ignore Pyright noise.
- Record as you go in `gen/details/contacts/fix_s4/notes.md`.
- Finish with:
  - the S4 before/after numbers per class;
  - the tools made;
  - `fix_standard.md`;
  - the engine patches proposed, and their status with 3d-director-04;
  - what the other sections will need: a per-section estimate from `summary.json` of which classes each needs.
