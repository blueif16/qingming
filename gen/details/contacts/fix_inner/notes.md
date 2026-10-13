# Fix inner: contact fixes for inner_city (S6), the leg-IK op, S6's sedans (details pass, agent "fix-inner", 2026-10-13)

Brief: `gen/details/brief_contacts_rollout.md` (row inner_city). Standard: `gen/details/contacts/fix_standard.md`.

## Log

- 03:14 PDT: started. Read the brief, the standard, fix_s4 notes / engine_patches / rollout_table, the measurement record,
  CLAUDE.md, map/BUILDING.md, the skills (characters: Routines, Casting a big section; web-scene: Before shipping;
  scroll-section: Machine resources).
- Before (page dump 03:06, `gen/details/contacts/inner_city.json`): inner_city 178 people, 63 failing.
- Lead, while starting: P4 (seam re-grounding) has landed (recheck the 3 `order` figures, load in both orders);
  fix-gate's hall-floor fix (song_kit house/open_hall floor boards collide) has landed; inner_city may be exported.

## The leg-IK op (`tools/ik_clip.mjs` `via: "leg"`), landed 03:40

- `{site: sole_L|sole_R, via: "leg", to, foot: "keep_world"|"follow"}`: analytic two-bone IK on UpLeg/Leg, the knee on
  the side the clip has it, the hips untouched; the foot keeps the clip's world orientation (default), so the same
  sole vertex stays lowest; up to 4 passes take up the skin's blend round the ankle (residual 0 to the mm).
- Shared spec `soles` (`characters/ik_variants.json`): both soles to `{y: 0}` (the ground under the root). The middle of
  the soles stays at 0, so the variant's own sole_m comes out as its base's and the seat stays put.
- **Frame bug fixed on the way.** ik_clip loads the model without clip_meta (the merged GLB is a temp file), so
  people.js prepareClip never applies sole_m there, and `three_node.mjs applyProposed` skips its lift once people.js
  applies sole_m (P1 landed). Every variant rebuilt after P1 would have had its targets sole_m off (the bearer's 3 cm,
  the official's write 8.5 cm). ik_clip now lifts the base clip by its sole_m itself. Proof: `sedan_carry~pole`
  rebuilt with the edited tool equals the shipped one channel for channel (72 channels, max diff 0). Because the tool's
  hash is in every variant's cache key, every character's variants rebuild on its next build; they come out the same.
- Built (flock charbuild): official `sit~soles`, `sit_talk~soles`, `write~soles`; clip_ground `--add-missing
  --write-meta`, joint_tracks official, clip_ground `--write-meta`, joint_tracks official, ktx2 encode (nothing new).
  As the page draws them: both soles 0.000-0.001 m over the floor all cycle (base: +0.047..0.067 / -0.065..-0.043),
  hips identical, seat within 5 mm; clip_ground: 0 clips off by more than 5 mm.
- Proof on S6 (predict, `contact_check inner_city --predict`): cloth_shop_seated_3752 and shop_interior_seated_4752 (and
  seated_cap_man_3905, jie_listener_west_2062, scholar_upstairs_3912): every sole check FAIL (gap_q +0.06 / -0.06) ->
  PASS (0.000-0.011). Their seat FAILs (no seat) are the next step, not the leg op's.
- Other sections' chair clips with uneven feet use the same spec: `"<clip>~soles": "ik:<clip>@soles"` in
  `characters/<name>.json` (official sit / sit_talk / write are built; sightseer listen ±0.024, scholar listen ±0.033,
  robed_man sit -0.017/+0.018 are candidates), then switch the figure's do in contact_fixes.json.
- `gen/sections/inner_city/make_people.py` applies `sections/inner_city/contact_fixes.json` last (tools/contact_fixes.py);
  a rerun before the change reproduced people.json and build_choices.json byte for byte.

## ik_clip / character build fixes asked by the lead (03:40-06:50)

- **Shared hips arrays** (dedup merged two variants' equal hips tracks; people.js grounds an array once): ik_clip signs
  each variant's hips track with its clip name (x of the first key, z of the last, 1-4096 x 4 float32 ulps of the hips
  height, at most ~1 mm sideways); `character.mjs build` fails if two clips of the shipped GLB share a hips accessor.
  carter, idler, scholar, sightseer, inspector rebuilt under the flock (03:50-04:05): 0 shared arrays in every
  shipped GLB, clip_ground 0 off by > 5 mm, cast_clips_check PASS.
- **Registry** (characters.json) lists the clips each shipped GLB holds, not the cache-key states (a stale key no
  longer drops a variant when another character builds). `build` remakes stale local clips (twice, then fails) and
  fails rather than drop a clip the current GLB holds (`--drop <clips>` to mean it). child_red / hat_traveller_dark
  were listed with clips their own GLBs lack: their owners rebuild them.
- **Elbow op**: an arm op on elbow_* had a zero-length lower bone and turned the forearm 163-164 deg (canal
  sightseer lean_chin~man_at_railing_27650); now a one-bone aim of the upper arm, forearm untouched. Sightseer rebuilt.
- **Bone-frame op** (children): `frame: "<bone>"`, `to: {hold_t}` (holds the elbow and hand turn too), `{damp, k}`,
  `{freeze: [bones], t}`, spec `trim`, `--spec-file` for trials.
- **Locomotion**: clip_ground gives every `~` variant of a walking clip its base's locomotion, speed and stride (the
  wrong "not walking" came from the shared hips array, the base's travel held in place first).
- **PropertyMixer trap** (fix-boats): poseAt now evaluates each track's interpolant onto its bone (the mixer skips a
  write when the value repeats, so after resetPose a repeated value left the bone at rest). ik_clip re-reads the
  written GLB with three's GLTFLoader and fails if any op misses its target by more than its solve residual + 1 cm
  (`verify_max_m` in the report). Tested: bearer pole identical (7.6e-6 local units on the hips), official soles
  verify 0.
- **Knee twist** (found here, 06:25): hips ops with keep_soles and the leg op took the knee's pole as the old knee point
  (moved with the hips) projected on the new hip-ankle axis' plane; with a nearly straight leg (knee 1-2 cm off the
  line) the axis' own tilt dominated and the twist swung the knees sideways: bearer sedan_carry~pole 49/31 deg, canal
  sightseer lean_chin~man_at_railing_27650 64/67 deg (knee direction vs the base clip). Now the knee's offset from the
  old line is turned with the line onto the new one (`sidePole`): bearer 5/3 deg, thigh turn 50 -> 10 deg, residuals 0.

## S6 state at the web hold (06:20, predict)

- 11 failing on predict before the hold; done since: recasts (both grooms: hands not painted on the animals; the awning
  leaner: the mat stands 2.35-2.7 m up), placements (shaft carter between the shafts 1.25 m from the casting's spot,
  the footboard block gone; butcher at his block; handcart man; cart pusher), the stall keeper on his tall chair
  (root_h 0.434, a foot rail as the chair's painted low bar, builder), specs ready for the locked batch
  (`scratchpad/inner/locked_batch.sh`: steer x3, sit soles on the footboard, push, chop, the stall keeper's rail).
- To the lead: contact_check's support check treats a root_h figure with map support "ground" as standing on furniture
  (the stall keeper, 0.256 "ledge" on the corner shop's plinth). Proposed: skip the support classes for root_h figures.

## Rebuild of every variant (06:26-06:50) and the S6 finish

- Locked runs: (1) the S6 specs + all 21 characters with variants; (2) arm pole carried + `fade`, the S6 steer targets,
  again all 21 + butcher; (3) carter with `fade_from`; then carter / inspector spec adjustments. The no-drop guard
  stopped one build (official_rider: fix-s4b had renamed its variant; theirs to `--drop`). Every variant passes the
  independent re-check (`verify_max_m` <= 2 mm). Moved variants and their figures: `moved_variants.md` (45 rows).
- **clip_meta stale entries** (third trap): a rebuilt variant's hips key count can change by one (the signature changes
  the resample); people.js then ignores its clip_meta entry (n mismatch) and clip_ground kept patching it, diverging
  (official sit_talk~soles -0.035 -> -0.21). clip_ground now re-measures an entry whose n differs from the shipped
  GLB's hips key count (`--add-missing`) and never patches one (`--write-meta`). The lead added `meta_stale` to
  joint_tracks v7.
- **More ik_clip options**: `fade` / `fade_from` (a hand pinned only while the take has it near its usual place),
  `ik_targets --fade --fade-sites --no-elbow-down --point-sites` (a rod target as its true surface point: S6's wagon
  shaft bends 4 cm off its fitted line where the hand rests).
- **Lessons**: a chair-clip variant whose leg op puts the soles under its root gets lifted by its own sole_m (the
  page grounds a chair clip by the soles' middle): give such a figure root_h at its soles' surface, not at seat - clip
  seat height (the wagon rider: 0.761 -> 0.603). Drawing the feet in under a seat lowers the thighs and the seat site
  (the stall keeper +1.5 cm).
- Dropped official `sit~soles` and `write~soles` (unused after the officials moved to sit_talk~soles: the official's
  library sit drops its seat point 7 cm for a third of the cycle, so no seat holds it; others casting official `sit` on
  a seat will hit the same).

## Result (page dump 06:5x after the export)

inner_city: 178 people, **63 -> 0 failing, 147 -> 0 FAILs** (before: the 03:06 dump, `before_fails_0306.txt`).

| class | before | after |
|---|---|---|
| contact:seat (no seat 40, gap 4) | 44 | 0 |
| contact:vehicle | 27 | 0 |
| contact:floor (clip) | 21 | 0 |
| contact:floor (placement) | 11 | 0 |
| stance_soles (placement) | 7 | 0 |
| furniture | 6 | 0 |
| contact:table | 6 | 0 |
| contact:animal | 6 | 0 |
| body_cylinder | 4 | 0 |
| order | 3 | 0 |
| contact:wall | 3 | 0 |
| head_inside | 2 | 0 |
| contact:rail | 2 | 0 |
| site_inside | 2 | 0 |
| hidden_collider | 2 | 0 |
| contact:ridden | 1 | 0 |

How (contact_fixes.json, 62 figures; builder; specs):
- leg-IK `soles` for the officials (5), then sit_talk~soles where the seat must hold;
- recasts: 11 storyteller listeners painted standing (listen was the seated take) -> crane / look; 3 arms-folded
  standers lean_wall/arms_folded -> stand_sleeves (the inspector got the t2m take); the child hugging a man's waist
  reach -> look; two grooms (hands not painted on the animals) bridle -> look / idle; the awning leaner lean_over ->
  look (the mat is 2.35-2.7 m up); the cart's rear pusher push_flank -> push; the barrow / handcart stay steer;
- the 7 sedan bearers on sedan_carry~pole with the kit's pole_fit 1.47 (2 turned 33 deg to the poles, noted); the
  matchmaker on her own bench in the west sedan (root_h 0.903);
- figure-owned stools for 12 painted-seated figures whose seat is hidden (fig_seats.json, builder figure_seats()), the
  cloth bench and the small stool fitted to their sitters, single seated clips where two clips' seats differ;
- drivers on their seats by root_h (the footboard blocks gone), the wagon rider's soles on the footboard (leg IK), the
  stall keeper on his tall chair with its painted low bar as a foot rail (leg IK), the shaft carter between the shafts
  (1.25 m from the casting's spot: the block had filled the space), IK hands for the three steer figures, the cart's
  rear pusher and the butcher; 11 placement solves; the staff figure on staff_foot; the ridden horse on head_low.
- Load order (P4): archer_waistguard_5465, pole_man_5578, crouching_dark_5515, bearded_carter_5428 stand the same in
  both orders (inner_city first / gate first) and on the hook (`order_check.mjs`, `order_check.json`).

Checks: export (04 told before and after), people_precompute, owners_verify inner_city MATCH, loyalty S6 PASS,
cast_clips_check PASS (shipped, source, split current), budget inner_city 15.73 / 28 MB, ktx2 check PASS, predictor
689/694 (the 5 are rainbow_bridge's), people_check PASS (sizes 0; routes on three S6 walker lines), regression
`fix_inner`: world 209/211 (S3 north edge, S2 cargo-boat boarding: not S6; both passed in fix_s4b / fix_river),
boats 12/12, rides 5/5, people only the gate's two baseline lines, contacts 807 people, 54 failing, 108 FAILs (all
sections).
