# Brief: the player's "join the pose" clips (interactions round, 2026-10-13)

Lead: session 3d-director-07. Records for this job go in `gen/interact/clips_progress.md` (write the next command at
each stage; /tmp dies at reboot). Final output the lead reads: `gen/interact/slots.json` + `clips_progress.md`.

## Why

The user wants the player to join the painted people's poses: walk up to a group, press E, and your avatar does what
they do. Three spots (the lead builds the page side in `web/src/interact.js`):

1. **平橋 the gate's moat bridge** (`sections/gate`, `S5.str.moat_bridge`): 11 painted watchers lean on the rails with
   `lean_chin~moat_rail` (characters/ik_variants.json `moat_rail`: the right elbow held 1.10 m over the root, the rail's
   top 1.075 m over the deck). The near (south) rail runs along D ≈ 0 (layout `lines.rail_near`), its watchers face
   270; the far (north) rail along D ≈ 7.8-8.0 (`lines.rail_far`, slanted), its watchers face 90. The player may lean
   anywhere along either rail that is clear of the painted watchers.
2. **虹橋 the Rainbow Bridge's crown** (`sections/rainbow_bridge`): the crowd on the downstream rail near the crown
   (views `crown` 134.4, 19.6, H 5.3 and `rail` 135.2, 19.2, H 5.3) leans over watching the boat lower its mast:
   `lean_over~<figure>` variants solved per placement by
   `gen/details/contacts/fix_bridge/tools/rail_ik.mjs` (both palms on the top rail, chest steady, soles on the treads).
3. **說書 the storyteller's ring** (`sections/inner_city`, view `storyteller` -64, 7): ten listeners `crane`. No contact;
   the player stands in the ring and plays `crane`.

## The job

Give the 8 playable characters (`web/src/ui/settings_screen.js` PLAY: official, scholar, monk, woman, child, soldier,
porter, sightseer; the default avatar is `official`) these clips, all free and local:
- `crane`: `t2m:crane_listen` where missing (official, monk, woman, child, soldier);
- `lean_chin`: `t2m:lean_chin_on_hands` where missing; then `lean_chin~moat_rail`: `ik:lean_chin@moat_rail`;
- `lean_over`: `t2m:lean_over@msy_B7y3` where missing; then one IK variant per player slot on the Rainbow Bridge.

**Rainbow Bridge player slots:** find one or two free standing spots on the downstream rail at or near the crown, among
the leaning watchers (as close to the crown as the deck allows): clear of every painted figure there by at least
0.6 m between body centres (people.js BODY_R 0.26 + player RADIUS 0.3), not blocked by a walker's path
(`people.json` walkers), on the deck. Solve them exactly as `rail_ik.mjs` solved the painted watchers (palms on the top
rail where it passes each hand, chest held, soles on the treads), as new `characters/ik_variants.json` entries named
`player_crown_a` (and `player_crown_b`), so the clip names are `lean_over~player_crown_a` and so on. Note what each
variant does in its `why`, like the existing entries.

**The child** (1.15 m) can't put its elbows on a 1.075 m rail: choose what it does at each spot from what reads right
on a frame sheet (e.g. `reach_over_rail`, or `look` holding the rail), and record the choice.

**Moat rail standing lines:** compute, from the `moat_rail` variant and the rail lines, where the player's root must
stand to lean on each rail: the distance from the rail's centre line (it varies along the slanted far rail), the
facing, and the X ranges that are clear of the painted watchers (same 0.6 m rule).

## Output: `gen/interact/slots.json`

```json
{ "about": "...",
  "moat_bridge": { "section": "gate", "rails": [
      { "id": "near", "facing_deg": 270, "clip": "lean_chin~moat_rail", "line": [[X, D], [X, D]], "free": [[X0, X1], ...] },
      { "id": "far",  "facing_deg": 90, ... } ],
    "child": "<clip>" },
  "crown": { "section": "rainbow_bridge", "slots": [ { "id": "player_crown_a", "X": .., "D": .., "H": .., "facing_deg": .., "clip": "lean_over~player_crown_a" } ], "child": "<clip>" },
  "storyteller": { "section": "inner_city", "clip": "crane" } }
```
`line` is where the root stands (map X, D; H from the ground).

## Checks (numbers, not screenshots: the user's rule)

For every playable character at every slot (and at three points along each moat rail's free ranges): hands/elbows on
the rail within 3 cm over the cycle, soles on the deck, nothing through the rail. Reuse the contact tools
(`gen/details/contacts/fix_standard.md`, `tools/contact_check.mjs` sites, the rail_ik tools); write the results to
`gen/interact/clips_check.json` with PASS/FAIL per character x slot. Then `node tools/cast_clips_check.mjs` and
`tools/eye_check.mjs` must still pass (no painted figure changes). Look at a frame sheet (`tools/clip_sheet.mjs`) of
each new clip on at least official, woman and child before calling it done.

## Rules

- Skill `characters` for every step (`tools/character.mjs`: clips, build; char_lod and clip_split run inside it).
  Shared files (characters/*.json, clip_meta.json, character builds, KTX2) change only under
  `flock /tmp/qingming_charbuild.lock`. clip_ground is idempotent.
- Machine: Blender only through `tools/blender_slot.sh` / the build scripts; pages only through `tools/chrome_slot.sh`
  against `tools/check_server.sh` (5190). `tools/machine.sh status` before heavy steps. Another session works on
  label flicker (web/src/ui/steady.js, film.js): don't touch web/src at all; the lead owns the page.
- Only additions: every existing clip and every painted figure stays exactly as it is.
- No Meshy credits are needed (t2m:, ik:). If something seems to need a paid step, stop and write why in the progress
  file instead.
- No deploy, no commit. When done, the final message is one paragraph: what landed, the check results, open issues.
