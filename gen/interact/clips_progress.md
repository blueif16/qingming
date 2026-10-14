# Clips for the player's "join the pose" (interactions round, 2026-10-13)

Brief: `gen/interact/brief_clips.md`. Agent: clips (spawned by the lead, 3d-director-07). Outputs: `gen/interact/slots.json`,
`gen/interact/clips_check.json`, this file. Tools of this job: `gen/interact/tools/`.

## State

- Stage 0 (read): done. What the 8 playable characters lack (characters/<name>.json, before this job):
  - crane: official, monk, woman, child, soldier (scholar, porter t2m; sightseer motion:)
  - lean_chin: official, monk, child, soldier, porter (scholar, woman t2m; sightseer motion:)
  - lean_chin~moat_rail: everyone but the sightseer
  - lean_over: official, monk, woman, child, soldier (scholar, porter, sightseer t2m)
- Stage 1 (base clips): DONE 20:58. crane / lean_chin / lean_over added (gen/interact/tools/add_clips.py, only where
  missing) and built: official, monk, woman, child (crane only), soldier, porter. Joint tracks + clip_ground cycle done
  for those six; other characters' clip_meta entries kept exactly (gen/interact/tools/meta_keep.mjs puts back the 1 mm
  flips clip_ground makes on hat_traveller, fortune_teller, woman sit_hold_child ...).
  - Found: tools/retarget_local.mjs was edited at 14:40 (another session: --fps/--align, defaults unchanged), so every
    local clip's key went stale; re-retargeting gives byte-identical files (checked: woman lean_chin, child reach), and
    the child's two IK variants remade byte-identical too. Nothing existing changed.
- Stage 1b (lead's addition, 20:52; corrected 21:00: the drum's axis runs along X): the drum strike.
  - Take 1 (10 credits, msy_VYNl) struck three times, the first at waist height: kept in
    gen/motions/strike_drum/take1_msy_VYNl/ (prompt.txt). Take 2 (10 credits, the last allowed; prompt
    prompts/motion_strike_drum.txt, 3 s): one strike, the fist drawn back by the ear and swung forward and down to the
    front of the chest, back to the waist. In use (gen/motions/strike_drum/msy_VYNl/). Sheet: gen/interact/sheets/official_new.jpg.
  - Prop `drumstick` (blender/char_props.py prop_drumstick, gen/props/drumstick.glb, 90 tris, 0.41 m): characters/props.json
    _defaults (RightHand, at hand, grip [0,0.08,0], rot [-33,0,-34]: the stick points forward out of the fist at the hit;
    the mallet's [90,0,0] pointed it up the thumb axis) + {clip: strike_drum, t: 1.2} on the 8.
  - The drum (S5.prop.tower_drum_6898, measured from gen/sections/gate/owners): axis along X, the visible faces are the
    rope rims' caps at X -18.40 (east) and -19.14 (west), r 0.632 (the drum skin itself 2 cm behind, -18.42 / -19.12),
    centre D 5.93 H 13.36; the floor H 12.06.
  - gen/interact/tools/drum_tip.mjs: the stick tip at 100 Hz; hit_s 1.13-1.14 for all 8.
- Stage 2 (geometry and specs):
  - moat bridge: the BUILT rails are straight (blender/gate_scene.py: y0 + 0.12 and y1 - 0.12): near centre D 0.12,
    far D 7.88, top 1.075 over the deck X -0.15..12.58; the map's far line (8.0 -> 7.77) is slanted, the build is not.
    Posts every 1.776 m with caps 1.12-1.2. The deck's planks lie at -0.023..+0.025: grounding the root on them moved the
    elbows by as much, so the slot holds the root at a fixed H (as a root_h figure).
  - lean_chin~moat_rail (shared spec moat_rail) on official, scholar, monk, woman, soldier, porter (+ the sightseer's
    own); each character's distance from the rail searched by clips_check (contacts nearest, nothing through, both feet).
  - crown: the rail figures stand 0.46-0.68 m apart from s -0.6 to s 8.23 (rail frame: origin (134.94, 14.01), U
    (0.6603, 0.7510), crown at s 4.25 H 5.285): no free 1.2 m near the crown. Slots: player_crown_a s 9.0 (X 140.642,
    D 20.98, H 3.629 on the lower tread, facing 319; between deck_rail_leaner_19715 and deck_stooping_hat_19765) and
    player_crown_b s -1.335 (X 133.818, D 13.219, H 2.943; beyond man_reaching_with_stick_18930). Treads 0.32 deep,
    risers 0.18-0.22; the roots stand at a riser so each foot has its own tread. Shared specs by
    gen/interact/tools/crown_ik.mjs (gen/interact/crown_slots.json); own specs where a take can't take the shared one:
    player_crown_a_official (chest y 1.06, z 0.08: its take holds the downhill foot 8 cm up), player_crown_b_soldier
    (chest z 0.10: its lower hand swung out of reach). The clip name stays lean_over~player_crown_a / _b.
  - child: `look` (a calm stand, the head looking about; chosen on gen/interact/sheets/child_candidates.jpg over reach,
    crane and reach_over_rail) holding the rail top, hands carried on along the forearm (hand "follow": reaching up, a
    hanging hand fell 14 cm short). look~moat_rail_child: both hands, 0.26 m from the rail. Crown: only the downhill
    hand reaches (the rail rises 0.11 m between the hands on the 30 deg ramp; the uphill hand fell 9 cm short):
    look~player_crown_a_child (palm_L, s 8.91, one tread, H 3.811), look~player_crown_b_child (palm_R, s -1.485, H 2.943).
- Stage 3 (builds): build 1 (base clips) 20:58; build 2 (variants, strike_drum, prop) 21:20; build 3 (the drumstick
  turned, the official/soldier crown specs, the child's follow hands) 21:50; the child once more (one-handed crown) 22:00.
  After each: joint_tracks (the 8), clip_ground --add-missing --write-meta, meta_keep, joint_tracks, clip_ground --write-meta,
  meta_keep, joint_tracks, clip_ground (0 off by more than 5 mm).
- Stage 4 (checks): DONE 22:20.
  - gen/interact/clips_check.json (gen/interact/tools/clips_check.mjs): 88 PASS, 0 FAIL: moat near 24 and far 24 (8
    characters x 3 points in their own free ranges), crown a 8, crown b 8, storyteller 8, drum east 8, drum west 8.
    Rails: contact sites within 3 cm at the 80 % hold quantile; soles (stance + each foot, a foot the take itself lifts
    at its own height); nothing through (palms, forearms, elbows, chest, belly, head, hips, soles: <= 3 cm into any visible
    piece of the railing's owner, post caps included) + contact_check site/head inside; body cylinder; 0.6 m clear of
    every painted person and walker path. Drum: tip on the face at hit_s (0..3 cm), never more than 2 cm past it (the
    rope rim's cap is 2 cm proud of the skin), nothing of the body in the drum, stance, clear.
  - Moat: the root held at H -0.01 (planks -0.023..+0.025); each character's distance from the rail centre searched.
  - gen/interact/slots.json (gen/interact/tools/slots.mjs).
  - node tools/cast_clips_check.mjs: PASS (split current for 34 characters). node tools/eye_check.mjs on the 8: 8 PASS
    (gen/interact/eyes/). ktx2 encode 0 new, check PASS. budget_check --no-load: rainbow_bridge 21.87/28 MB, gate and
    inner_city PASS.
  - Existing assets: tools/glb_diff.mjs on the 8 GLBs (before: the shipped ones at 20:50): every existing animation's data
    identical; image 0 (body) same bytes; the props of 7 identical. The monk's prop_back_frame changed (252 of 1082
    triangles, its palette texels): the rebuild took gen/props/back_frame.glb as it is now (rebuilt 10-12 12:37, after the
    monk's last build); it looks right (gen/interact/sheets/monk_back_frame.jpg). 1 painted figure (inner_city) carries it.
    characters/*.json, ik_variants.json, props.json, motions.json, clip_meta.json and characters.json: only additions
    (checked against git HEAD).
  - Frame sheets: gen/interact/sheets/official.jpg, woman.jpg, child.jpg, child_rails.jpg (gen/interact/tools/
    clip_sheet_props.mjs = tools/clip_sheet.mjs + --props; with ?props=drumstick the stick shows in every clip: the page
    shows it only in strike_drum).

## Next command

```
# done; to re-measure after any change to these characters or the two sections:
cd ~/3d_director/qingming && node gen/interact/tools/drum_tip.mjs && node gen/interact/tools/clips_check.mjs && node gen/interact/tools/slots.mjs
# (meta_keep's baseline, clip_meta before this job: git show HEAD:web/public/assets/clip_meta.json)
```

## Open (for the lead)

- The page (web/src/interact.js) must set the avatar's root to the slot's H while the clip plays: the moat line at
  H -0.01 (not grounded on the planks), the crown at the lower tread (H; the player walks on the hidden ramp ramp_H,
  0.10-0.13 m over it), the child's crown spots at their own place; and face square to the rail (moat 270 / 90,
  crown 319). The moat lines and the drum spots are per character (slots.json `lines`, `free_by_character`, drum
  `spots`); `line` is the official's.
- The crown slots are not at the crown: the painted rail crowd leaves no 0.6 m gap from s -0.6 to s 8.23, so slot a is
  4.75 m down the NE ramp (H 3.63) and slot b 5.6 m down the SW ramp (H 2.94), the crown being H 5.29.
- Show prop_drumstick only while strike_drum plays; the drum's hit_s is 1.13-1.14 s (per character in slots.json).
- The monk's back frame (one inner_city figure) now shows the current gen/props/back_frame.glb (see Stage 4).
- The map's far moat rail is slanted (lines.rail_far 8.0 -> 7.77); the builder lays it straight at D 7.88.
- clip_ground's convergence flips 7 other characters' sole_m by 1 mm each cycle (woman sit_hold_child, hat_traveller
  sit/drink, hat_traveller_dark sit/drink, fortune_teller tell_fortune, woman_pale sit_hold_child); kept as they were.

## Log

- 20:50: started; read qingming/CLAUDE.md, the brief, skill characters, fix_standard.md, fix_bridge notes + rail_ik.mjs,
  contact_check.mjs.
- 20:52-21:00: the lead added the drum strike (credits allowed: one take, at most two attempts), then corrected the
  drum's axis. Both takes used (20 credits, msy_VYNl 150 -> 130).
- 21:00-22:20: builds 2-3, the crown specs (shared + official/soldier own), the child one-handed on the crown, the moat
  root height and distances, drum spots by the farthest tip; checks 88/88; slots.json written. No deploy, no commit.
