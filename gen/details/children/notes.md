# Carried children: notes (details pass, agent "children", 2026-10-13)

Brief: `gen/details/brief_children.md`. Goal: the four primitive child props become the real rigged child, posed by
IK onto each carrier, baked as the carrier's `prop_child_*`, and checked by numbers (`tools/carry_check.mjs`).

## State before (saved in `before/`)

- `before/props/child_*.glb`: the kit-primitive children (`blender/char_props.py`), 678-902 tris each, palette.
- `before/chars/{idler,townsman,woman,woman_pale,child,child_red,child_robed}.glb`: the shipped GLBs (md5 idler
  206cb5ec, townsman e20a759e, woman ff9a41d0, woman_pale 2f391fa6).

| prop | carrier · clip (t) | bone | where it plays |
|---|---|---|---|
| child_on_back | idler · carry_child (2.0) | Spine (at back, Spine, follow 1) | S6 man_carrying_child_2790 |
| child_on_shoulders | townsman · carry_child (3.0) | Spine (at back, neck, follow 0.6) | S6 man_child_on_shoulders_4975 |
| child_in_arms | woman · hold_child (0.0) | Spine (at shoulder left) | S4 person_with_child_10430 |
| child_on_lap | woman (woman_pale inherits) · sit_hold_child (2.0) | Hips (at back, Hips, follow 0) | S7 seated_woman_child_1535 |

Each carrier plays only its carry clip in people.json (checked: no walker or other figure uses these props).

## Findings while setting up

- Shipped GLBs (gltf-transform optimize) give every quantised mesh its own copy of the skin, the IBMs carrying the
  dequantisation, and store rotations as normalised int16: a reader must take each mesh's own skin and denormalise
  (`tools/carry_lib.mjs` does both). Measuring the shipped GLB with the body's skin draws the props wrong.
- Joint drift relative to the bind bone over the cycle (cm, one-sided from the bind time; `carry_lib` FK):
  - idler carry_child vs Spine: hands 4.5/5.5, hips 2.2, thighs 3.4/3.1;
  - townsman carry_child vs Spine: hands 4.0/3.4, head 1.5;
  - woman hold_child vs Spine: left hand 9.6, left forearm 7.9, right hand 2.7;
  - woman sit_hold_child vs Hips: hands 8.0/9.0 (the lifts), thighs 0.

## Method (tools, 2026-10-13 morning)

- `tools/carry_lib.mjs`: GLB rig reader (raw or shipped: per-mesh skins, denormalised quantised attributes and
  animation outputs), FK at a clip time, skinning, a triangle grid (closest point by rings, inside by ray parity),
  carrier sites snapped on the posed body and tracked on their triangle, the measures (gap, floating, penetration).
- `tools/carry_pose.mjs <prop|all> [--search] [--preview png] [--no-write]`: spec `gen/props/carry.json`.
  1. The child (`gen/characters/<child>/<child>_raw.glb`) decimated by meshoptimizer to ~2000 tris (UVs and skin
     weights kept: the simplifier keeps a subset of vertices).
  2. A recipe per support (back, shoulders, arms, lap) places the pelvis from the carrier's body, spreads hunch and
     head turns over the spine, and solves the limbs by two-bone IK to their contact sites (the elbow/knee pole
     swung to the angle whose limb sinks least into the carrier: `twoBoneClear`, `chainClear`); a CCD reach puts the
     head where it belongs (beside his head on the back, beside hers in the arms).
  3. Contact flattening: child vertices inside the carrier or within 4 mm of him are pushed out onto his surface + 4 mm,
     fading over 3 cm (soft flesh and cloth giving at a contact); seam copies move together.
  4. Follow weights (why not rigid on one bone: below): each child bone follows the carrier bones under its contacts
     (his skin weights at the surface within 3 cm, weighted by nearness); an untouched child bone takes its nearest
     touching neighbour's mix along the child's skeleton; a child vertex lying on him (within 0.6-2.5 cm) follows the
     surface under it. `follow_exclude` keeps a part from riding bones that slide over it (the woman's lifting hands).
  5. A seeded (1+1) evolution strategy then a pattern search over the recipe's free numbers (`free` ranges) on the
     cycle objective (gaps at bind and over the cycle, floating, penetration after flattening, the size of the push).
  6. Writes `gen/props/<prop>.glb`: the child posed in the carrier's Armature frame at the bind time (metres;
     char_props.mjs `at: "root"`), its UVs, `_PART` (child joint per vertex, for carry_check), `_CARRY_JOINTS` /
     `_CARRY_WEIGHTS` (carrier bones per vertex, names in extras.carry.bones), a small copy of the child's texture.
- `tools/char_props.mjs`: placement `root`; per-vertex multi-bone bind `v_bind = (sum w_j W_j(t) IBM_j)^-1 v`;
  `texture_from: <character>` gives the prop its own material `prop_tex_<character>` with that character's
  full-size body texture from its raw GLB (so `gltf-transform optimize` makes the same webp bytes as the child's own
  GLB, and `ktx2.mjs` finds the same KTX2); the palette comes from the first palette prop; a guard throws if a carried
  child's geometry was posed for another carrier, clip, time or placement.
- `tools/carry_check.mjs`: the numbers on the shipped GLBs (and inherited variants), 10 Hz over the clip.
- `tools/carry_preview.mjs`: a flat-shaded rasteriser for quick looks (no Blender slot).

## Why not rigid on one bone

The carriers' contact surfaces move against each other during their clips, so a rigid child cannot keep both
contacts without one carrier part sweeping through it:
- idler carry_child: his palms (under the child) sweep 3.1-4.8 cm (half-range) against his Spine, Hips or any torso
  bone (right palm mostly sideways, sd 3.3 cm). Rigid on Spine the best search left 3.3 cm penetration of his hands
  in the child's thighs over the cycle (bind penetration 1.1 cm, palms 4.0-4.8 cm gap).
- townsman carry_child: his head sites (where the child's hands rest) move 6.5-9.4 cm against his Spine (he turns
  his head, looking round).
- woman hold_child: her left forearm (the seat) moves up to 9.6 cm against her Spine.
- woman sit_hold_child: her hands lift 7-10 cm against her Hips (t 0-2.5 s), then hold still (t 3-8 s).
So each child part follows the bones it rests on (step 4 above). The GLB format is unchanged: the prop is a skinned
`prop_` mesh on the body's skin with JOINTS_0/WEIGHTS_0 (up to 4 bones a vertex instead of 1). crowd.js `rigidFix`
still shares the body's bake: under quantisation every bone's K is the same transform, so multi-bone vertices pass
its check. carry_check reports how far the child departs from rigid motion ("departure from rigid").

## Findings while solving (02:00-03:00)

- **The page skins a multi-bone vertex with the blended matrix, bound in bind space** (char_props.mjs:
  v_bind = M_v(t0)^-1 v, M_v = sum w_j W_j IBM_j). A blend of bones that moved differently by the bind time (the
  idler's two forearms) shrinks M_v(t0), and the vertex then swings far: the first back child departed 21.9 cm from
  rigid in places (carry_check on the raw and the shipped GLB agree), while the solver's simpler model ("each bone
  moves the posed point") said 7 cm. Fixed in both places: the solver measures the exact page skinning
  (carry_pose.mjs `moved`), and a vertex blends only bones whose skinning rotations at the bind time are within 25
  degrees of its dominant one.
- **Shipped weights are quantised**: a multi-bone vertex lands within ~1 cm of its baked place at the bind time
  (idler: 95% within 3 mm, worst 9.5 mm); carry_check matches its child parts within 1.5 cm.
- **Clip limits found:**
  - woman `hold_child`: her right hand stays at her own left side under her left arm (5-11 cm left of the neck,
    0-7 cm forward, 11-14 cm below it) all cycle; her arms cross in front of her chest. So the child sits in the crook
    of her left arm against her chest, her left forearm across it, its bottom by her right hand (the old primitive's
    place), not on top of the forearm.
  - woman `sit_hold_child`: the hands lift 7-10 cm (t 0-2.5 s), then hold at her belly (t 3-8 s). Bound at t 5 (the
    still part), the child sits on her thighs and her hands slide up its back during the lift
    (`follow_exclude` her hands and forearms).
  - townsman `carry_child`: his head turns (head sites move 6.5-9.4 cm against his spine); the child's hands on his
    head ride his head (follow weights).
- characters.json at 02:43:14 (not my write: my build's registry ran at 02:42:41) lacks the `~` IK clip variants of
  carter, child, child_red, fortune_teller, hat_traveller(_dark), idler and robed_man: tools/ik_clip.mjs changed at
  02:42:50, so their keys are stale until the fix-S4 agent rebuilds them (for the lead, in the final report).

## Result (2026-10-13 ~04:10)

Shipped (web/public/assets/chars, KTX2 encode + check PASS, the child's texture KTX2 reused by bytes, 0 new encodes):
- **child_on_back (idler): new, PASS.** The rigged `child` (0.85 m, 1994 tris), lying on his back, its seat in his
  hands, hands on his shoulders, thighs round his flanks. Worst gap 2.0 cm at the bind time and 2.5 cm over the
  cycle, penetration 0.2 cm. It departs up to 7.2 cm from rigid, and one edge stretches up to 160% over the cycle,
  near his hands. Look: from behind it reads as a child; from the side and front little of it shows (it lies low and
  flat). A higher piggyback, with its head beside his (`_tried_child_on_back_s8` in carry.json), reads better but
  failed: his right palm 4.4 cm, penetration 1.2 cm.
- **child_on_lap (woman, woman_pale): new, PASS.** The `child_red` (0.8 m) sits on her thighs facing out, its hands
  on its own thighs, and her hands slide up its back during her lift. Gaps up to 0.9 cm at the bind time and 3.3 cm
  over the cycle, penetration 0.9 cm, edge stretch 7%.
- **child_in_arms (woman, woman_pale): old primitive kept.** The new pose (child_red 0.62 m in the crook of her
  left arm; spec in carry.json, geometry `work/child_in_arms_new.glb`, preview `preview_unshipped_child_in_arms.png`)
  passes every contact (worst 1.2 cm at the bind time and 1.3 cm over the cycle). It fails penetration at 1.5-1.6 cm in
  the last 0.5 s of hold_child (t 7.3-7.6 s, her arm drops and her hips shift into the child's dangling legs), and
  still 1.8 cm when sampled as the page cross-fades the loop (`carry_check --page`). Restored to the old prop at the
  lead's request (03:50) so the deploy shows the old child or a passing new one.
- **child_on_shoulders (townsman): old primitive kept.** Best new poses: his right palm or right thigh 2.3-3.1 cm at
  the bind time (limit 2), penetration 1.1-1.6 cm. His head turns and pitches 4-11 cm against his spine (hat top 10.6,
  side 7.5-9.4, back low 4.0) and sweeps into the child's thighs that straddle his neck. A 0.78 m child was tried too:
  his right palm was 5.0 cm off over the cycle.

### Proposal (not done: needs the IK-variant tool's owner)

Both failures come from the clips: the support moves against the spine faster than a baked child can follow without
stretching. Local IK clip variants (free) fix the cause:
- `hold_child~child` (woman): hold her left forearm and hand where they are at t 0 in her spine's frame, and drop the
  last 0.6 s arm fall (or end the loop at 7.3 s);
- `carry_child~child` (townsman): hold his palms at their t 3 places in his spine's frame and damp the head turn to
  about a third (he can still look round).
tools/ik_clip.mjs pins targets in the root frame; these need a target in a bone's frame (`frame: "Spine"`). Then
people.json casts the variant (`do: [["hold_child~child", 12]]`) and carry_pose re-solves with the child rigid on the
spine, with no follow weights and no stretch.

## Round 2 (2026-10-13 06:10-08:00): the arm and shoulder children, on IK clip variants

The lead landed bone-frame ops in tools/ik_clip.mjs (fix-inner): `freeze`, `damp`, `frame` + `hold_t`, `trim`,
`--spec-file`. Two shared specs (characters/ik_variants.json):
- `child_arms` → woman (and woman_pale) clip `hold_child~child`: both arms frozen on the spine as at 0.1007 s, neck
  and head damped to 0.3, trim 0–7.3 s (the take's last arm fall cut). Its arm turns against the base stay at 9–22°
  (the frame sheet `clips_woman_hold_child.jpg` reads natural).
- `child_shoulders` → townsman clip `carry_child~child`: both arms, the neck and the head frozen on the spine as at
  2.8007 s; his body keeps the take's sway. A first try damped the head to 0.3, which still pushed it 2.2 cm into the
  child. Turns 6–43° (`clips_townsman_carry_child.jpg`).
- The freeze times are 0.7 ms off the frame times (the ik_clip same-t workaround). Both built variants were checked
  frame by frame against their base clips (frozen bones within 0.03°, others within 0.04°). An arm *hold* (palm IK)
  turned her right arm 144° and was dropped for the freeze.
- Hold times are where the take's hands are nearest the middle of their paths (woman 0.1 s: wrists move ≤ 5.9 cm,
  forearms ≤ 14°; townsman 2.8 s: wrists ≤ 4.4 cm, forearms ≤ 15°).

With the supports still on the spine, both children are **rigid on Spine** (no follow weights, no stretch):
- child_in_arms: child_red, 0.62 m, in the crook of her left arm against her chest, bound at hold_child~child 0.1 s;
- child_on_shoulders: child, 0.85 m, astride his neck, its shins in his hands, its hands at the back of his neck (his
  head turns 4–11 cm in the take), bound at carry_child~child 2.8 s.
carry_check on the shipped GLBs: **6/6 PASS**, both strict and `--page`.
- Penetration: 0.8 cm (arms) and 0.4 cm (shoulders).
- Gaps at the bind time: up to 1.5 cm (arms) and 1.9 cm (shoulders).
- Contact flattening still dents the arm child by up to ~3.9 cm in places (head 3.1 cm against her shoulder); in the
  textured renders it reads as pressed against her, not dented.

Wired in: contact_fixes.json (outer_road person_with_child_10430 → hold_child~child; inner_city
man_child_on_shoulders_4975 → carry_child~child), both casting scripts rerun. inner_city's rerun also applied 7
pending fix-inner IK recasts. After them: joint_tracks → clip_ground --write-meta → joint_tracks; KTX2 check PASS;
cast_clips_check --source PASS; budget_check --no-load PASS everywhere (rainbow_bridge 27.73 / 28 MB casts idler,
woman and townsman).

**Until outer_road's and inner_city's people.json are exported, the shipped people.json still asks for hold_child and
carry_child.** On those clips the new children fail (carry_check --play: penetration 3.5 cm arms, 6.0 cm shoulders),
so the next deploy must ship those two people.json with the GLBs.
