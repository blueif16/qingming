# For the `web-scene` skill (`.claude/skills/web-scene/SKILL.md`)

## 1. Replace the "Tree cards" row of the atomic-scripts table with:

| Tree cards | `node tools/tree_cards.mjs [status\|refs\|gen\|key\|ship\|sheet\|check\|all] [--form f] [--only card]` (forms and variants in `trees/cards.json`, prompts `prompts/tree_card.txt` + `prompts/tree_<form>.txt`) | One painted alpha card per tree form the scroll paints, 1–5 variants each (`trees/types.md`): shyfai on plain white with `background: opaque` (API cut-outs are set aside and drawn again), keyed to clean alpha with no halo, shipped to `web/public/assets/trees/<form>_<n>.webp` (≤ 1024 px tall, ≤ 300 KB) and listed in `trees.json` (`file`, `base_uv` = the trunk foot, `height_m` × `width_m` = the card plane at scale 1, `tree_m` = the real tree). Every mapped tree has a card and a mirror flag in `trees/assign/<S>.json`, which `map_layout.mjs` copies into `layout.json`. `check` must PASS: no two trees within 6 m share a card, and none within 15 m show the same card the same way round. Read `gen/trees/check/form_<form>.jpg` (the scan reference beside the cards), the `gen/trees/check/<card>.jpg` images and `gen/trees/sheet.jpg` before shipping. Trees are cards, never AI meshes. |

## 2. Add under "What a scene must be before it's worth showing", after the colour paragraph:

**Trees (the user, 2026-10-11: "replicate exactly what the painting has, even to the amount of trees").**
- **One card per tree, as painted:** every mapped tree stands on the card of the form the scroll paints there.
  - The forms: spring willow with fans of shoots, old burled pollard willow, pine-like needle fans, crab-claw elm,
    young bare shoot tree, low stem clump, slender trunk, bamboo, dotted-leaf evergreen.
  - The season is early spring: bare or budding, the willows pale green.
  - Never one card for every tree, and never one card twice side by side: trees within 6 m differ in card, and trees
    within 15 m in card or mirroring (`node tools/tree_cards.mjs check`).
  - Willows are painted as half-open fans of stiff rising shoots, never as weeping willows.
- **The page:**
  - one InstancedMesh per card, facing the camera about its trunk;
  - the plane `width_m × height_m`, moved so `base_uv` sits at the tree's map position;
  - scale `clamp(mapped height_m / card height_m, 0.7, 1.4)`, so far trees painted small still stand a real 4–8 m
    behind the roofs;
  - `flip` mirrors x.
- **Colour:** the cards are painted in true colours, so their materials (named by card) take no `palette.js` retint.
- **Alpha:**
  - `alpha: soft` cards are anti-aliased;
  - `alpha: hard` cards (the dense crowns, cut at 0.5 to fit 300 KB) suit alphaTest 0.5;
  - alpha-to-coverage with MSAA, or alphaTest about 0.4, keeps the fine shoots continuous at a distance.
- **Loading:** a card costs 33–300 KB (7.0 MB for all 31), so load only the cards the loaded sections use.
