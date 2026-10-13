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
