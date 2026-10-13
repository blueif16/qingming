# Brief: contact fixes, rollout to the other sections (details pass)

The S4 pilot set the standard: `gen/details/contacts/fix_standard.md`. Read it first, in full, and follow it exactly.
Then read:
- `gen/details/contacts/fix_s4/notes.md`, `engine_patches.md`, `rollout_table.md`;
- the measurement record `gen/details/contacts/notes.md`;
- `qingming/CLAUDE.md`, `map/BUILDING.md`;
- the skill `characters` (Routines; Casting a big section) and the skill `web-scene` ("Before shipping").

Machine rules are the skill `scroll-section` "Machine resources":
- pages only via `tools/chrome_slot.sh` against `tools/check_server.sh` (5190), with `start=0`;
- Blender only via `tools/blender_slot.sh` / `tools/build_scene.sh`;
- `tools/machine.sh status` before heavy steps.

**Goal per section:** every figure PASSes `node tools/contact_check.mjs <section>` on a fresh page dump, or appears
in a short list of what remains, each with a reason and an owner. The user: "They need to actually make contact with
the object they are applying force to ... use mathematical ways."

## Who does what (one agent per row)

| agent | sections | failing figures (fresh dump) | owns, besides its sections |
|---|---|---|---|
| fix-gate | gate (S5), city_end (S7) | 35 + 4 | the shared hall-floor fix in `blender/song_kit.py` (`house`, `open_hall`; gate and inner_city use them). Do it **first** and tell the lead (SendMessage to `main`) the moment it has landed. |
| fix-inner | inner_city (S6) | 63 | the **leg-IK op** in `tools/ik_clip.mjs` (`via: leg`, pinning a sole: chair clips with uneven feet, ~22 figures in all). Do it **first**, prove it on two S6 figures, and tell the lead when it lands. Until then the others leave their uneven-feet figures for last. Also: the 7 S6 sedan bearers (reuse `sedan_carry~pole` / `~pole_ends`, kit `pole_fit`). Don't build the 3 seam `order` figures (engine item P4, 3d-director-04's); list them. |
| fix-bridge | rainbow_bridge (S3) | 69 | `seated_man_cap_18282`'s bench, the 28 lean/rail figures, the bridge's sedans. Keep the root_h data fix already in. |
| fix-river | canal (S2), countryside (S1) | 41 + 8 | – |
| fix-s4b | outer_road_2 (S4b), plus S4's last figure | 26 + 1 | `kit_outer_road_2.hall`'s floor-collide fix. Stand `S4b.prop.table_12645` on S4's hall floor (H 0.23), then rerun `ik_targets` for the S4 child at the table. |
| fix-boats | boat crews on every section | 116 unmeasured | Cover them first: owners from `blender/build_boats.py` (as `owners_dump` does for sections), and the boats' frozen-time poses in `people_dump`; rules for pole_boat, fend_pole, stand_pole, work_sweep, oars, tiller, the ladder and haul lines. Then measure and fix them by the same order. Boats move, so measure at a frozen clock and at several times. Don't change boats.js (3d-director-04's); propose diffs. |

## Shared files: rules every agent follows

- **Under the lock.** Six fixers run at once. These shared files are only ever changed by read-modify-write under
  `flock /tmp/qingming_charbuild.lock` (the same lock as character builds and KTX2):
  - `characters/*.json`, `characters/ik_variants.json`, `characters/contacts.json` (through its generator);
  - `web/public/assets/clip_meta.json`.

  After any character build, run these under the lock as well:
  - `node tools/clip_ground.mjs --add-missing --write-meta`;
  - `node tools/joint_tracks.mjs <that character>`;
  - `node tools/ktx2.mjs encode`.
- **Variant names.** Shared IK specs keep their names. A per-figure variant is named after its figure slug, so no
  two agents make the same name.
- **Shared tools.** `contact_check.mjs`, `place_predict.mjs`, `contact_solve.mjs`, `ik_clip.mjs`, `ik_targets.mjs`,
  `clip_ground.mjs` and `lib/*` are changed only by their owner in the table above: the leg op belongs to fix-inner,
  boat coverage to fix-boats. Anyone else who needs a change sends it to `main`, and the lead routes it.
- **Your sections only.** Each agent edits only its own sections' `people.json` (through `contact_fixes.json` and the
  casting script, never by hand), `build_choices.json` and builders.
- **Exports.** Message 3d-director-04 just before each section export and again when it's done; its cells agent is
  re-cutting the section GLBs. After the export, run `owners_verify <section>`.
- **Engine.** `web/src/` is 3d-director-04's. Send exact diffs (file, old text, new text) through it; never edit.
- **Iterate on the prediction.** Work with `contact_check --predict`, and take a real page dump only to confirm, so
  the three Chrome slots stay free for others. Run the full regression once, at the end of your sections.
- **Loyalty.** Never invent a rail, seat or prop the painting doesn't show. A painted-seated figure's seat is part
  of it (rule 3). Recast where the painting shows no contact.
- Never deploy. Ignore Pyright noise.

## Finish with

- per section, failing figures and FAILs before → after, by class (page dump);
- what remains, with its reason and owner;
- the IK variants added per character, and the character GLBs rebuilt;
- the exports done, and the checks (loyalty, owners_verify, people_check sizes, regression);
- notes in `gen/details/contacts/fix_<agent>/notes.md`.
