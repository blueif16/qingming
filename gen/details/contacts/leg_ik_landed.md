# Leg-IK op landed (fix-inner, 2026-10-13 ~03:20): for every fixer

- **The op.** `tools/ik_clip.mjs` op `{site: sole_L|sole_R, via: "leg", to, foot: "keep_world"|"follow"}` runs a
  two-bone IK on UpLeg/Leg.
  - The knee stays where the clip has it, the hips don't move, and the foot keeps its world turn.
  - The residual is 0 to the mm.
- **The shared spec `soles`** (characters/ik_variants.json) puts both soles at y 0.
  - The middle of the soles stays at 0, so the variant's sole_m equals its base's and the seat stays put.
- **How to use it.**
  1. Under the flock, add `"<clip>~soles": "ik:<clip>@soles"` to characters/<name>.json.
  2. Build the character.
  3. Run `clip_ground --add-missing --write-meta` and `joint_tracks <name>`, then `ktx2 encode`.
  4. Switch the figure's `do` in `contact_fixes.json`.
- **Already built:** official sit~soles, sit_talk~soles, write~soles.
- **Candidates:** sightseer listen (±0.024), scholar listen (±0.033), robed_man sit.
- **Frame trap, fixed at the same time.** ik_clip loaded the model without clip_meta, and after P1 three_node skips
  the sole_m lift, so any IK variant built after P1 landed (~02:55) had its targets off by its base's sole_m.
  - ik_clip now applies the base's sole_m itself.
  - The tool's hash is in every variant's cache key, so every variant rebuilds on its character's next build and
    comes out identical to the shipped ones.
  - **Check your own:** any variant you built between ~02:55 and the fix shows `sole_shift_m` 0 in
    `gen/characters/<name>/local/<variant>.ik.json` while its base has a sole_m. Rebuild those under the flock.

## New guard (lead, 2026-10-13 ~04:00): `node tools/cast_clips_check.mjs [--source]`

A clip that people.json asks for but characters.json lacks plays **idle** on the page: a seated figure stands up.
After every character build and before every export, run `node tools/cast_clips_check.mjs --source`; it must PASS
for your sections. A rebuild with a stale variant key once dropped S4's `sedan_carry~pole` and four more from the
registry.

## clip_meta incident and fix (lead, 2026-10-13 ~04:30)

- **The incident.** Between 03:45 and 04:20, repeated `clip_ground --write-meta` runs on stale joint tracks added
  the same residual again and again (robed_man sit~soles reached −18 m). fix-river and fix-gate repaired it.
- **Now idempotent:** `tools/clip_ground.mjs` bases each new sole_m on the sole_m the tracks were made with
  (joint_tracks v6 records `sole_m_tracked` per clip). A run on stale tracks rewrites the same value, and clips whose
  tracks predate v6 are skipped. The safe order is still joint_tracks → clip_ground --write-meta → joint_tracks.
- **Shared hips arrays:** joint_tracks v6 records `hips_shared_with`. A variant sharing its hips accessor with a
  sibling can't get its own sole_m (people.js grounds a hips array once). clip_ground leaves those clips alone and
  removes their sole_m. fix-inner is fixing the build so each clip keeps its own hips accessor.
- **Pre-deploy (3d-director-04):** |sole_m| ≤ 0.2, except sightseer and scholar knees_up (floor sits, real).
