# Contact fixes: the standard (details pass; set on the S4 pilot, 2026-10-13)

The user: "They need to actually make contact with the object they are applying force to... use mathematical ways." A
section is fixed when `node tools/contact_check.mjs <section>`, run on a fresh page dump, shows every figure PASS, or
lists the figures that remain, each with a reason and an owner. The S4 pilot (outer_road) went from 28 failing figures
and 56 FAILs to 1 and 1 (record: `contacts/fix_s4/notes.md`). The one left is a cross-seam table in S4b's builder.

## The loop (per section)

1. Measure:
   - `tools/chrome_slot.sh node tools/people_dump.mjs`, then `node tools/contact_check.mjs <section>`;
   - list the failing figures: `node gen/details/contacts/fix_s4/tools/fails.mjs gen/details/contacts/<section>.json`.
2. For each failing figure, read its map text (`map/text/<S>.md`) first, then fix in the order below. Stop at the first
   step that makes it PASS.
3. Iterate without the page:
   - `node tools/contact_check.mjs <section> --predict`: placements from the current `sections/<s>/people.json`, through
     the page's own ground rule, as `tools/place_predict.mjs`;
   - it agrees with the page for 690 of 694 static figures within 1 cm.
4. Record every fix in `sections/<section>/contact_fixes.json`:
   - the section's casting script applies it last, via `tools/contact_fixes.py`
     (`apply_contact_fixes(people, '<section>')`; the gate has no script: `python3 tools/contact_fixes.py gate`);
   - every entry carries its reason (`why` → cast_why, `nudge_why` → nudge_why);
   - never edit people.json by hand.
5. Ship and confirm:
   - copy people.json to `web/public/assets/<section>/`, or let the export copy it;
   - redump and recheck. The page's numbers decide, not the prediction.
6. Before handing over:
   - `tools/chrome_slot.sh` + `WORLD_URL=http://127.0.0.1:5190/world.html?start=0 gen/expand/round2/page_qa/regress.sh <tag>`;
   - `node tools/loyalty_check.mjs <S>` must PASS;
   - `people_check` sizes 0 (its two "nobody went round the player" lines at the gate failed before this pass too);
   - `node tools/owners_verify.mjs <section>` after any export;
   - the predictor's agreement (`node tools/place_predict.mjs`).

## The fix order

### 0. Engine (landed by 3d-director-04, 2026-10-13: `contacts/fix_s4/engine_patches.md`)

- **P1, clip ground offsets.** `people.js` adds each clip's `clip_meta.json` `sole_m`, so the clip's own mesh soles
  touch the ground, not just its lowest foot bone. It puts a rider's seat site (`seat_m`) on the saddle. 102 of 342
  static clips were 3-13 cm off. After any character build:
  - `node tools/clip_ground.mjs --add-missing --write-meta`: new clips get entries measured by people.js's own
    prepareClip, and offsets converge as old + residual;
  - then `node tools/joint_tracks.mjs all`.
  - The tracks are keyed on people.js, so an engine change redoes them.
  - Postures:
    - standing: the lower sole;
    - chair: the middle of both soles;
    - floor and lying: the lowest of seat and soles.
- **P2, `root_h`.** A figure's root height from people.json instead of the ground ray. Two uses:
  - a figure seated up on a vehicle with its feet hanging: the seat top less the clip's seat height;
  - a figure on a stepped deck whose walkable surface is a hidden ramp (rule 6).
- **Not landed:**
  - P3 (visible-floor grounding) was landed, then reverted: the Rainbow Bridge's visible steps are nocol, so 73 deck
    figures fell under the bridge;
  - P4 (re-grounding seam neighbours after a section joins) is described only. Its 3 inner_city `order` figures are
    an engine item.

### 1. The rule is wrong, or the painting shows no contact

- If the painting shows no contact for the clip, recast it to a clip whose rule fits and that keeps the painted
  action. Never invent a rail or a wall. S4 examples:
  - a groom "hands together at his waist holding the reins": bridle → idle (no reins are built);
  - an onlooker "arms folded", nothing behind him: lean_wall → stand_sleeves (from:farmer);
  - a fortune-teller whose take sits leaning back with the hands at the chest: tell_fortune → write~table.
- If the rule is wrong for the clip everywhere, fix it in `gen/details/contacts/tools/make_contacts_json.py` and rerun
  it. Done so far:
  - `lift_pole`: the pole is the figure's own carried prop;
  - `push`: palms on the vehicle's surface, a bar where it has one, a cart's tail where not.
- An IK variant `<clip>~<variant>` takes its base clip's rule. Give it its own rule only where the variant means
  something narrower: `sedan_carry~pole_ends` (palms only), `write~table`, `listen~table`, `browse~bearded_man_10142`
  (the painted left hand only).

### 2. Move the figure: `tools/contact_solve.mjs`

`node tools/contact_solve.mjs <section> <ids|--failing> [--write]` searches nudge and facing:
- on a 0.1 m / 10° grid, then a pattern search down to 1 cm / 1°;
- it minimises the contacts' squared excess over their tolerance, with a 5 mm margin;
- it penalises (×20) standing on furniture or a hidden collider;
- it penalises (×10) the body overlapping a collider, a site or head inside geometry, a foot in a wall, another
  figure's body (0.23 m × the scales), or a root within 0.15 m of an animal's real-size body;
- among the placements that pass, it takes the least move.

Limits and options:
- **Limit:** 0.6 m from the casting's spot (painted spot + the casting's own nudge) and ±30°.
  - Going over the limit needs a written reason (`--note`) and is recorded in `nudge_why`.
  - S4's front bearer went 0.74 m: his role is read from the map, between the pole ends, and his painted foot is an
    estimate.
- **Idempotent:** the solve starts from `base_nudge` / `base_facing` (the casting's), stored in the entry.
- `--at dX,dD,f` evaluates or records an analytic placement.
- `--base-clips` re-solves a figure on its base clip when its IK variant's targets are stale.
- `--root-h` is rule 6.

### 3. Fit the object to the body (builder `choice:`, in the frame the page draws, P1 applied)

Where a size is the builder's free choice, set it from the body's measured site, over the ground where the figure
stands:
- **Sedan poles:** kit `sedan_chair(pole_fit=…)` sets each pole end's axis over the ground under it:
  - shoulder top 1.432 in `sedan_carry~pole` + radius 0.038 = 1.47;
  - a pair (rear, front) when the two ends' bearers hold them differently: S4's front ends are 1.25 in the front
    bearer's hands;
  - two chairs carried by the same middle bearers have pole ends that meet over their shoulders (S4: u 10725).
- **Tables:** the top over the ground where the sitter sits, at the clip's palm height less the palm's 2 cm. S4's
  fortune-teller table is 0.83.
- **Stools and benches:** the top at the clip's seat point less 0.005-0.01, centred under the seat point (the seat
  is 0.03-0.09 m off the root and differs by clip). Stools don't collide.
- **A painted, mapped seat that real size puts out of reach** moves under the sitter as a recorded move in
  `build_choices.json`: S4's client stool moved 0.55 m.

### 4. IK clip variant, where the clip can't reach

`tools/ik_clip.mjs` + `characters/ik_variants.json`, with the clip source `"<clip>~<variant>": "ik:<clip>@<variant>"`
in `characters/<name>.json`. It is built by `tools/character.mjs` under `flock /tmp/qingming_charbuild.lock`, cached
by base clip, rig, spec, tool and the base's ground offset. The ops, in the figure's root frame (page metres, P1
applied):
- `via: arm`: analytic two-bone IK pinning a palm (the hand keeps its turn), forearm or elbow;
  - `elbow: "down"` gives a natural elbow for long reaches;
- `via: hand`: a hand laid onto a surface;
- `via: hips`: a whole-body pin, e.g. a bearer's shoulder held under the pole or a rider's seat held steady;
  - `keep_soles` puts the feet back with leg IK.

Targets:
- **Shared setups get one variant:** `pole` (every bearer with the pole on his right shoulder), `pole_ends`,
  `table_palms`, `table_forearms`, `steady_seat`.
- **Per-figure targets come from the geometry, at the solved placement:**
  `node tools/ik_targets.mjs <section> <figure> --clip <clip> [--sites] [--owner <map id>] [--level dz] --write`;
  - point targets: the nearest surface point to the site's median, off its surface (animals 1.6 cm, things 1.5 cm);
  - the nearest point within the arm's reach;
  - the figure's do switches to the variant;
  - remake the targets whenever the placement changes.
- Then: rebuild the character; `clip_ground --add-missing --write-meta`; `joint_tracks`; check.
- Frame sheets (`tools/clip_sheet.mjs`), or the GPU-free stick sheets (`fix_s4/tools/pose_svg.mjs`), confirm the look.
  The PASS is numeric.
- **Trap:** gltf-transform's dedup made each variant share its base's hips array, and people.js grounds in place, so
  the base clip moved with the variant. ik_clip now writes every variant its own hips track, and people.js guards
  shared arrays.

### 5. Build the missing seat (map/BUILDING.md rule 3)

Only for a figure painted seated:
- a stool, bench or box owned by the figure's map ID in the section builder;
- fitted (rule 3) under its seat point, non-colliding.

S4's fortune-teller stool: "the seat is part of his figure".

### 6. Raised supports: `root_h`

- **A figure on a stepped deck** whose walkable surface is a smooth hidden ramp (the Rainbow Bridge) takes `root_h`
  from the visible step under its feet: `node tools/contact_solve.mjs <section> <ids> --root-h --write`.
  - It writes only where the change clears the hidden collider and leaves no other check of the figure more than
    2 cm worse.
  - A seated deck figure's seat goes onto its seat (1 cm over it), not its feet onto the steps.
  - A figure whose feet straddle two treads gets a nudge under 0.3 m onto one tread instead.
  - The player's ramp stays as built (the user's walk stays smooth). The reason goes in nudge_why.
  - Rainbow Bridge: 23 of 24 done: 21 root_h, 3 nudges (one of them a sedan bearer whose sedan fit is still to do).
    The 24th, seated_man_cap_18282, needs its seat fitted (its bench is 7-12 cm low for the treads under his feet).
- **A figure seated on a vehicle's seat:** `root_h` = seat top + 0.005 − the clip's seat height (S4's cart driver).

### 7. Builder hygiene found on the way

- **Visible floors that don't collide over a collide plinth.** People and the player stand 4-5 cm inside the boards.
  The S4 halls are fixed (floor boards collide). The same pattern is in `kit_outer_road_2.hall` (S4b),
  `song_kit.house` and `song_kit.open_hall`. Check `stance_soles (placement)` figures in halls first.
- **Cross-seam furniture.** `S4b.prop.table_12645` stands on S4b's ground
  inside S4's south-hall plinth (its top 0.40 m over the floor the child stands on). S4b's builder should stand it on
  that floor (H 0.23 at X 57.9-58.5, D -2.2..-2.8) at about 0.6 m. Then rerun
  `node tools/ik_targets.mjs outer_road child_at_table_12597 --clip reach --owner S4b.prop.table_12645 --write`.

## Coordination

- Section exports: message 3d-director-04 before and after `tools/export_web_scene.mjs` (its cells agent writes the
  section GLBs).
- Engine changes go to 04 as exact diffs; never edit `web/src`.
- Character builds run under the flock. Run `ktx2.mjs encode` and `check` afterwards.
- Pages and Blender only through the slot scripts.
- Never deploy: the lead session ships with batch 2's deploy.

## Boat crews (covered since 2026-10-13, fix-boats: `contacts/fix_boats/notes.md`)

- Owners: `build_boats.py` writes `gen/sections/<name>/boat_owners.{json,bin}` (blender/boat_owners.py); check them
  with `tools/boat_owners_verify.mjs`.
- `people_dump` records each boat's root and node matrices plus each crew member's boat and spot; take frozen-clock
  samples with `--boatflow moored --boat-times 0,5,...`.
- `contact_check` poses the boats at every instant. Crew classes: deck_support, head_through, boat_body,
  pole_through, contact:boat, contact:pole, contact:water.
- The crew solve is `tools/crew_solve.mjs` + `crew_ik_targets.mjs`. Pole ends per clip: `tools/prop_tracks.mjs`.
  Crew jobs and haul clips go in the `boats` section of contact_fixes.json.
- Boats exports belong to whoever fixes crews. Section fixers export with `--no-boats`. A people.json ship carries
  only your own entries.

## Not covered yet
- Animals are checked at frame 0 of their current clip: a grazing head moves away from a groom's hand.
- Walkers are checked at the dump instant only.
