**Merged, 2026-10-12 (round-2 records agent), all of it:** into web-scene "The atomic scripts" (Tree cards, KTX2)
and "Trees", and scroll-section playbook step 3 (the tree factory), 2026-10-12. The `card: "kit"` bullet holds now:
`world.js` and `budget_check.mjs` skip kit trees.

# Tree factory lessons (round 2, 2026-10-12)

The tree-card factory for S7, S4b, S3, S2 and S1 (`gen/expand/round2/catalogue.md` §8 (b)). It drew 20 cards in 24
draws and wrote assignments for all 150 trees. `node tools/tree_cards.mjs check` PASSes: 223 card trees on 52 cards,
plus 1 kit tree. The records are in `trees/notes.md` (runs 7–9) and `trees/types.md` (Round 2). Each block below is
exact text for a skill, with where it goes.

## For `web-scene`

**Replace the "Tree cards" row's middle with:**

> One painted alpha card per tree form the scroll paints, 1–8 variants each (`trees/types.md`): shyfai on plain white
> with `background: opaque` (API cut-outs are set aside and drawn again), keyed to clean alpha with no halo, shipped
> to `web/public/assets/trees/<form>_<n>.webp` (768 px tall, `ship_h` 512 for saplings and the hedge row; ≤ 160 KB) and
> listed in `trees.json` (`file`, `base_uv` = the trunk foot, `height_m` × `width_m` = the card plane at scale 1,
> `tree_m` = the real tree). Every mapped tree has a card and a mirror flag in `trees/assign/<S>.json`, which
> `map_layout.mjs` copies into `layout.json`; a tree built as a solid kit model (S4b's stump) is `{"card": "kit"}`.
> `check` must PASS: no two trees within 6 m share a card, and none within 15 m show the same card the same way
> round. Both radii shrink for small trees by min(1, H / 8 m), where H is the taller of the pair as the page shows it
> (card `tree_m` × clamp(mapped height / card height, 0.7, 1.4)). It reads the sections from `map/sections.json`:
> every key with a folder and a `map/world/<S>.json`.

**In "Trees", replace the forms bullet and the willow bullet with:**

> - The forms: spring willow with fans of shoots, old burled pollard willow, pine-like needle fans, crab-claw elm,
>   young bare shoot tree, low stem clump, slender trunk (and the pale grove's slender fan-headed pollards), bamboo,
>   dotted-leaf evergreen, young sapling, knee-high hedge row, and one old willow with bare hanging whips.
> - Willows are painted as half-open fans of stiff rising shoots, never as weeping willows. The one exception is the
>   old willow at the scroll's cut end (S7 855, `willow_weep_1`): its whips hang, bare, as painted.

**Add to "Trees", "The page":**

> - a tree whose card is `kit` is a solid model in its section's GLB: the page plants no card on it, and
>   `budget_check.mjs` counts no card for it.

That bullet holds only once `web/src/world.js` `placeTrees` skips `t.card === 'kit'` and `tools/budget_check.mjs` skips
it in its card set; both are the lead's. Until then, both fall back to `willow_card`.

## For `scroll-section` (the playbook, the factories)

**Add after the factories sentence ("Factories, one agent per kind: …"):**

> The tree factory works in this order:
> - it reads each tree's `what` and `note` and the needs lists' suggested cards;
> - it adds a variant only where a painted shape has no card or the check runs out of cards in a cluster;
> - before adding scan crops to a form, it pins the old variants' `refs: [0, 1]` and diffs `tree_cards.mjs status`,
>   so no old card goes stale;
> - it draws, then reads every check image and each `form_<form>.jpg` beside the scan;
> - it assigns with the resolver (`gen/trees/round2/solve.mjs`, the readings in `prefs.mjs`: a greedy over random
>   orders, then an ejection chain), writes `trees/assign/<S>.json` and a lineup per area
>   (`gen/trees/lineup_<S>.jpg`);
> - it runs `ktx2.mjs encode --kind tree` and `check --kind tree`, then `tree_cards.mjs check`;
> - it reruns `map_layout.mjs` only for areas whose agent reports done, and leaves `export_web_scene.mjs` to the area:
>   it rebuilds the boats when the layout is newer.

## Lessons (for `trees/notes.md`, already there; the short form for the skill's pitfalls)

- **Spell out the stroke, not the shape's name.** "A small fan-shaped head of fine rising shoots" drew round branching
  crowns, like a birch. "A knobbly head from which many long, fine, straight, unbranched shoots radiate … like the ribs
  of a half-open folding fan … single straight lines from the knob, not a branching crown" drew the grove's fans.
- **A grove needs as many cards as it has trees inside the close radius.** S1's seven pale fan-headed trees stand
  within 4 m and are 6–8 m tall, so the radius stays about 5.5 m and each needs its own fan-headed card. Count the
  cluster before ordering. Add a cheap narrow card rather than put a slender trunk on a stout one.
- **Tight clusters of one form want pins.** Eight elms in 9 m (S1's farmhouse) on six cards: the greedy gave the
  slender elm the young elm's card, and the ejection chain could not undo a four-tree swap. Pin the tree whose shape
  is unmistakable, then solve.
- **The height-scaled radii only matter for small trees.** On round 2 they let 10 pairs pass: the 14 saplings on 7
  cards, the low bushes and S7's bamboo. Every full-size pair keeps 6 / 15 m.
- **Texture:** S1 takes 34 cards, 16.5 MB of GPU texture as UASTC, plus 1.4 MB for its west panel: 17.9 MB of 24.
  Its cards download as 5.7 MB of KTX2 (S4 part 1: 5.4). Wide cards cost the most: `whip_clump_1` 1.19 MB, `elm_claw_3`
  1.06, `elm_claw_4` 0.98; the saplings cost 0.09–0.32 MB each at 512 px.
- **The shared manifest:** run `ktx2.mjs encode --kind tree` and `check --kind tree`. A full encode also encodes other
  agents' pending panels and atlases, and a full `check` fails on them (on round 2, S2's `signs_canal` atlas and the
  toned buffalo).
