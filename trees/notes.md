# Tree cards: notes

The tree-card workshop, 2026-10-12.
- **The problem:** every tree in the world was drawn with one painted willow card (`willow_card.webp`).
- **The aim:** to be loyal to the painting ("replicate exactly what the painting has, even to the amount of trees")
  and to show nothing copy-pasted.
- **What was made:**
  - 9 forms and 32 cards (`bamboo_5`, the 32nd, drawn on 2026-10-12 after the image API's top-up): `web/public/assets/trees/`, `trees.json`;
  - an assignment for all 74 mapped trees: `assign/S4.json`, `S5.json`, `S6.json`;
  - round 2 (the tree factory, 2026-10-12, `gen/expand/round2/catalogue.md` §8 (b)): 20 more cards, among them the new
    forms `willow_weep`, `sapling` and `hedge` (12 forms, 52 cards), and the assignments of all 150 trees of S7, S4b,
    S3, S2 and S1 (`assign/S7.json` … `S1.json`; S4b's stump is `{"card": "kit"}`);
  - the typology: `types.md`;
  - one tool: `tools/tree_cards.mjs`.

## Files

| file | what |
|---|---|
| `trees/cards.json` | the forms: reference crops of the scan (`scan` = u0, v0, u1, v1), and per variant the image size and `height_m` (the real height of the tree, foot to crown top); optional per variant `refs` (which of the form's crops it is sent, by index) and per form or variant `ship_h` (shipped height in px, for small trees) |
| `prompts/tree_card.txt` | the frame around every card prompt: style, one tree, whole and centred, true colours, plain white background |
| `prompts/tree_<form>.txt` | the form (what the scroll paints, the colours), then one `[n]` block per variant |
| `trees/types.md` | the forms, which trees, the scan crops |
| `trees/assign/<S>.json` | `{map id: {card, flip, why}}`; `tools/map_layout.mjs` copies `card` and `flip` into `layout.json` |
| `gen/trees/refs/` | the reference crops sent as images 2 and 3 |
| `gen/trees/look/` | the crops looked at for the typology |
| `gen/trees/raw/<card>/<key>_0.png` | every draw, by prompt key, with `<key>.prompt.txt` and `<key>.json` (shyfai record); API cut-outs kept as `<key>_cutout_<i>.png` |
| `gen/trees/keyed/<card>.png` + `.json` | the full-size keyed card, its box, its foot, the paper colour |
| `gen/trees/check/<card>.jpg` | the review image: alpha-tested on dark, on light, blended on grey, and a 1:1 crop on dark |
| `gen/trees/check/form_<form>.jpg` | a form's scan reference beside its cards (dark and light): the loyalty check |
| `gen/trees/lineup_<S>.jpg` | the section's trees seen from the south at the page's scale and mirroring (sizes and neighbours by eye) |
| `gen/trees/sheet.jpg` | every shipped card, named, on grey (blended) and dark (alpha-tested), with the trunk foot marked red |
| `gen/trees/test/` | the background tests (magenta, transparent, white) |
| `gen/trees/round2/` | round 2's resolver (`prefs.mjs`: each tree's readings; `solve.mjs`), `lineup.mjs`, `form_sheet.mjs`, `texbudget.mjs` (a section's panel and card GPU MB from its assignment, as `budget_check.mjs` counts them) and the solve's output |

## The pipeline

```
node tools/tree_cards.mjs refs      # crop the reference strips from the scan
node tools/tree_cards.mjs gen       # draw what is missing or stale (shyfai, 3 at a time; --jobs 4)
node tools/tree_cards.mjs key       # white -> alpha, review images in gen/trees/check/
node tools/tree_cards.mjs ship      # crop, <= 1024 px tall, webp <= 300 KB, trees.json
node tools/tree_cards.mjs sheet     # gen/trees/sheet.jpg
node tools/tree_cards.mjs check     # every mapped tree has a card; none within 6 m share a card, none within 15 m unmirrored
                                    # (both radii x min(1, H / 8 m) for small trees; {"card": "kit"} = a kit model)
node tools/tree_cards.mjs status    # ok / stale / missing per card
```

- **Caching:** each card is cached by a key over its assembled prompt, the model, the size, the `retry` number and the
  hashes of its reference images. Editing a variant's `[n]` block redraws only that card, and going back to an old
  text reuses its image. Editing the form body redraws all of that form's cards, so put a fix in the variant blocks
  when the other variants are good (the pine fix did this).
- **Options:** `--form a,b` and `--only card,card` narrow any step; `--force` redraws or re-keys anyway.

## Runs

| run | what | result |
|---|---|---|
| test (4 draws) | the willow on magenta, on "transparent", on magenta with `background: opaque`, on white with `background: opaque` | Without `opaque`, the API cuts the tree out itself, with a soft, blobby matte over the crown. On magenta, the model paints the crown's green wash as a translucent glaze over the key colour, so the crown keys pink. White keys clean. |
| 1 (26 cards) | all forms, 2–4 variants each | 25 drawn, 1 HTTP 400 `upstream_reference_upload_failed` (transient). 2 came back cut out by the API despite `opaque` (`willow_burl_3`, `elm_claw_1`): flattened on white, the soft matte leaves a white haze between the shoots. |
| 2 (6) | the failures and the cut-outs drawn again; new variants `pine_fan_4`, `elm_claw_4`, `bamboo_3` (needed to give neighbours different cards) | all good |
| 3 (4 + 1) | `pine_fan_1`, `_3`, `_4` drawn again: the first draws were clipped, bonsai-like cloud pads. `leafy_2` drawn again: the first read as a lush summer oak. | good; `pine_fan_1` came back cut out once, and `gen` set it aside and drew it again |

| review | an independent reviewer compared every card with the scan crops | The `willow_fan` cards were weeping, fully leaved summer willows: 17 trees, the landmarks among them. The scroll paints half-open fans of stiff shoots rising from knobbly heads, bare but budding. The pines were still tidy garden pads. The elms had near-white bark and pink buds (plum in blossom). `leafy_2` was a summer oak, and the scan shows crab-claw twigs at its tree. The keyer frosted porous crowns (`pine_fan_1`: 7% near-white). 12 assignment fixes. |
| 4 (19 + 1) | all willows, pines, elms and slender trunks drawn again with new form bodies; `slender_3` and `bamboo_3` drawn again; new variants `pine_fan_5` (slender, leaning), `slender_4` (steep lean) and `bamboo_4` (mixed heights); `leafy_2` retired; `willow_fan_1` made square | all good (see `gen/trees/check/form_*.jpg`); 1 cut-out, drawn again |
| 5 (1) | `bamboo_5`, a low young clump for `S4.tree.leafy_shrub_10865` | **HTTP 403** from shyfai, and `--list-models` also 403 for several minutes: the key looks blocked or out of credit. Pending. |
| 6 (1), 2026-10-12 | `bamboo_5` again, after the top-up | good at the first draw (45.6 s): a low clump, sprays to the ground, 152 KB hard alpha; assigned to `S4.tree.leafy_shrub_10865`; `check` PASS (74 trees on all 32 cards). Shots: `gen/trees/shots_bamboo_5/` |
| 7 (19 + 1), round 2 | `willow_burl_4`–`_7`, `elm_claw_5`, `_6`, `slender_5`–`_7`, `bamboo_6`, `willow_weep_1`, `sapling_1`–`_7`, `hedge_1` (`gen_run7.log`) | 18 good at the first draw; `bamboo_6` came back cut out by the API and was drawn again. `slender_5`–`_7` read as round branching crowns (birch-like), not the grove's fans of single shoots: redrawn. |
| 8 (3) | `slender_5`–`_7` with the stroke spelled out (see Prompts) | good: pale branchless trunks, each ending in a knob with a fan of single straight shoots |
| 9 (1) | `slender_8`, a 20th card (S1's grove of seven needs seven fan-headed cards) | good at the first draw |

In all: 57 draws plus 4 tests, about 42 s each; 4 of the draws were cut out by the API (7%). Round 2: 24 draws for 20
cards (34–56 s each), 1 cut out by the API. Every card was read
before it shipped: the check image for each, the form strips beside the scan, then the sheet.

## Prompts that worked

- **References:** the style image (`prompts/style_B1.png`) plus two plain crops of the scan showing that form
  (`cards.json` `refs`, enlarged to at least 640 px so the strokes read). The frame tells the model to take only the
  tree's form, branching and stroke from the crops, and to ignore the people, roofs, umbrellas and the silk's colour.
- **Describe the strokes**, not the species alone:
  - "fans of long, straight, slender shoots that spring upward and outward and arch over a little";
  - "dense, rounded fans of fine, short, straight needles radiating from one point like half-open fans";
  - "crab-claw twigs: short, bent, knobbly twigs that hook and turn like claws".
- **Give colours as hex** next to their words ("fresh pale willow green (about #8fa35f)"), and add "true natural
  early-spring daylight colours of the real tree, never the yellowed, darkened silk of the scroll". No card came out
  yellow.
- **Say the season in the plant's own terms:** "tiny new leaves just opening", "buds dark with a few fresh pale green
  specks", "no leaves at all".
- **One sentence per variant** with a clear silhouette difference: the lean, where it forks, wider or taller, one
  trunk or two. These gave distinct cards from one form prompt.
- **Pines:** without care they come out as Japanese garden pines, as solid clipped pads. What fixed it was describing
  the stroke itself, in the form body so every variant gets it: "loose, see-through fans of fine, straight needle
  strokes: each fan a half-circle of separate lines radiating from one point, like a half-open folding fan, with sky
  showing between the strokes … never solid pads". Leave out "tiers".
- **Evergreen:** "drawn in the scroll's dotted-leaf manner (点叶) … branches that stay visible through the crown …
  sky between the clusters … not a lush round summer tree".
- **Willows:** the word "willow" pulls the model to a weeping willow in full leaf, whatever else the prompt says.
  These words fixed it:
  - "before its leaves have opened";
  - "a half-open fan of long, straight, stiff, slender shoots springs upward and outward like the ribs of a fan";
  - "the way the shoots rise from the clubbed head of an old pollard willow";
  - "This is NOT a weeping willow: no hanging curtains, no drooping strands, no full foliage";
  - "fine red-brown lines under a faint pale-green haze".

  The burled pollard willow (`willow_burl`) came out right the first time, because its head and whips leave no room
  for a weeping reading.
- **Elms:** "the twigs dark brown-grey, darkest toward their tips; buds dark brown, never pink or red. No leaves, no
  blossom." Without it they read as plum in bud.
- **Fan heads on a slender trunk** (S1's pale grove): "a small fan-shaped head of fine, straight, rising shoots" gave
  round branching crowns. What worked: "ending at the top in a small knobbly head from which many long, fine,
  straight, unbranched shoots radiate upward and outward like the ribs of a half-open folding fan … The shoots are
  single straight lines from the knob, not a branching crown, never drooping".
- **The one weeping willow** (`willow_weep`, S7): "long, thin, flexible bare whips in loose curtains, falling straight
  down like strings, the way a willow's twigs hang before its leaves open … no leaf masses, no full foliage, no summer
  green crown; the curtains are see-through". It came out bare and hanging at the first draw.
- **A wide row** (`hedge`): the frame says "filling the height of the picture"; the variant overrode it with "This one
  is a wide, low row, so it fills the width of the picture rather than its height: about three times wider than it is
  tall". It came out 3.2 : 1.
- **Saplings:** "a young tree a little taller than a man, not a miniature of an old tree: the trunk is thin and
  smooth, with no burls, knots or hollows". The seven variants differ by one silhouette each (single, fork, lean,
  whip, two stems, low fork, S-bend).

## Keying (white paper -> alpha, no halo)

- **The background:** paint on plain white, with `extra: {background: 'opaque'}`. White beats a chroma key because
  the model paints crowns as translucent washes. Over white the wash is just paler green, but over magenta it is pink.
  Nothing in a tree is whiter than the paper, so `d = max over channels (paper - pixel)` says how much tree a pixel
  holds. The paper is the median of a 1.5% border band (0.996 on every card so far).
- **Clear:** `d < 0.035` is paper, alpha 0.
- **Solid:** more than 2 px from any clear pixel, a pixel deeper than `gap` (0.10) is tree, alpha 1, if the tree around
  it is dense (`dense`: at least 70% confident pixels within about 3 px, as on a trunk or a limb). So bark highlights
  never become holes.
  - In a porous crown (needles, leaves, twigs) such pixels are paper showing through, and they go through the edge
    matte below.
  - Without `gap` and `dense`, dense crowns kept white specks and the pines looked frosted: 4.8% of `pine_fan_1`'s
    solid pixels were near-white. Now every card is at 0.5% or less (frost check:
    `share of solid pixels with min(rgb) > 200`).
- **Confident:** `d >= 0.42` is tree, alpha 1.
- **The edge band** is everything else, the 2 px along the paper.
  - **The local tree colour** is the mean of the confident pixels around it (a float blur, sigma 1.2 px, then
    3.5 px).
  - **Alpha** is the projection of the pixel on the line paper -> local colour. The pixel takes the local colour,
    not its own, so the paper never tints an edge: no light fringe on dark, no dark fringe on light.
  - **Pale strokes** with no confident pixel near them (pale buds on their own) keep their own colour,
    decontaminated, with alpha rising with `d` up to 0.2.
- **Coverage boost:** alpha^0.8, so one-pixel shoots survive alphaTest 0.5.
- **Colour under the clear pixels:** the colour of the tree nearby (a premultiplied blur), kept by webp `exact`. Then
  mipmaps and bilinear filtering never pull white into the edges.
- **API cut-outs:** when the API returns its own cut-out (alpha < 250 on more than 1% of pixels), `gen` sets it aside
  and draws again (up to 3 rounds). `key` would flatten such an image on white, but its soft matte leaves a haze, so
  never ship one.
- **Checks:** `gen/trees/check/<card>.jpg` (dark, light, grey, 1:1 zoom on dark), then the sheet.

## Shipping

- **The crop:** the tree's box (rows and columns with at least 3 solid pixels), 6 px of margin, and 2 px under the
  foot. Then scaled to at most 1024 px tall; wide trees stay up to about 1500 px wide.
- **The foot:** `base_uv` is the alpha-weighted mean x of the solid pixels in the bottom 2% of the tree, at the bottom
  row (v from the bottom, about 0.002).
- **Heights:** `height_m` is the plane height that makes the tree on the card exactly `tree_m` (the form's real
  height) tall, and `width_m = height_m * aspect`.
- **The 300 KB budget:** each card takes the first that fits of soft alpha q88, soft q84, then alpha cut at 0.5 (hard)
  at q86, q82, q78, q74 (`alpha`, `webp_q` in `trees.json`).
- **Retired cards:** a full `ship` (no `--form`/`--only`) drops cards that `cards.json` no longer lists, from
  `trees.json` and from the assets folder.
  - **Why alpha costs so much:** in a dense crown, the alpha is as costly as the colour. On `willow_fan_1` it was
    about 270 KB of 556. Hard alpha is what alphaTest 0.5 shows anyway.
  - **The result:** 27 cards keep soft alpha; the dense crowns (`pine_fan_1`, `_3`, `_4`, `leafy_1`) are hard. All 31
    are 33–299 KB, 7.0 MB in all (most 200–300 KB).
- **Small trees ship smaller** (round 2): `ship_h` in `cards.json`, per form or variant. Saplings and the hedge row
  ship at 512 px tall (14–49 KB), and `willow_burl_6`, `_7` (wide crowns that hit 165 KB at the end of the quality
  ladder) at 704 px (157 KB). `ship_h` is not in the cache key, so changing it reships without redrawing.
- **True colours:** `trees.json` `mean` is the mean sRGB of each card's solid pixels. The cards are painted in true
  colours, so the page must not retint them. The page already names each card's material by its card name, which has
  no `palette.js` entry, so `trueColor` leaves it alone. Don't map them to `willow_card`, or bare elms turn green.

## The assignment

- **The choice:** for every tree, a form from its `what`/`note` and the scan, a preferred variant where the painted
  shape matches one, and a lean direction where the painting gives one (a `flip` preference).
- **The rule** (across seams: one world frame):
  - no two trees within 6 m share a card at all, because a mirrored twin that close reads as a copy (the reviewer);
  - within 15 m, two trees may share a card only mirrored.
- **The resolver** (scratch, one-off) is greedy, over 400 random orders with preferred trees first, keeping the best
  total. Its score:
  - +60 for the same card within 6 m; +100 for the same card and flip within 15 m;
  - +2 for the same card mirrored within 15 m, +0.5 within 30 m;
  - +4 for leaving the preferred variant, +1.5 for going against the lean;
  - the fit of the drawn crown width (at the page's scale) to the painted crown, and for trees with no preferred
    variant also the fit of height.
- **Small trees** (round 2, the lead): both radii scale with the height the page shows, `min(1, H / 8 m)`, where H
  is the taller tree of the pair: its card's `tree_m` times the page's scale `clamp(mapped height / card height, 0.7,
  1.4)`. Two 2 m saplings get 1.5 m and 3.75 m, so S1's 14 saplings, 0.2–2 m apart, fit on 7 cards. Shrinking only
  drops conflicts, so every earlier assignment still passes. A tree with no mapped height keeps the full radii.
- **Kit trees:** a tree built as a solid model (S4b's stump) is `{"card": "kit"}`. `check` accepts it and leaves it
  out of the rule.
- **The round 2 resolver** (`gen/trees/round2/solve.mjs`, readings in `prefs.mjs`):
  - each tree lists its cards, first its shape as painted (cost 0), then the next best (1.5 + 0.5 per place), then
    the rest of its form (4);
  - plus 1.5 against its lean, 0.3 for an unneeded mirror, and `8 ln(ratio / 1.4)` when the card is too small for a
    big tree (the page caps scale at 1.4);
  - the check's rule is hard. Variety is soft: +1 for the same card within 15 m, +0.25 within 30 m, and +3 within 6 m
    where only the scaled radii allow it;
  - a greedy over random orders, then an ejection chain: give a tree another card, let the neighbours it now clashes
    with choose again, and keep the change if the total drops.
  - The greedy alone left a straight-trunk pair in S4b on a curved card, and S1's slender elm on the young elm card.
    The ejection chain fixed the first. The second needed a pin (`elm_slender_33906` takes only `elm_claw_6`).
  - Each `why` is the reading, the card's meaning, why it is not the first choice (the neighbour on it and how far)
    and why it is mirrored.
- **`node tools/tree_cards.mjs check`** must PASS after any change. Now: 74 trees on all 31 cards, no clashes, and 4
  pairs 6–15 m apart share a card mirrored.
- **Width:** most trees whose drawn width differs from the painted crown by more than 1.7x are far crowns. The
  painter draws those at about 0.55–0.6 scale, and real size (rule 5) makes them about twice as wide. The near
  exceptions:
  - `S5.tree.willow_6460`, about 1.9x on `willow_fan_2`, the narrowest willow;
  - `S5.tree.elm_7118`, about 2x, but its painted crown is cut where it merges with 6935's;
  - `S5.tree.pine_9125`, about 2.6x: three neighbours within 6 m leave it only `pine_fan_1`.
- **Far trees** (crowns at the top of the silk, painted 0.5–3 m tall because the painter draws them small) take
  narrow variants. The page floors their scale at 0.7, so they stand 4–8 m tall behind the roofs.
- **Mirroring for lean:** `S4.tree.gnarled_10950` (leans NW), `S4.tree.twin_trunk_elm_11968` (its vertical stem is the
  west one) and `S5.tree.far_6765` (leans E) are mirrored because of their lean. The others are mirrored only to
  differ from a neighbour. Lean is kept where the map states it:
  - 9025 and 9090 lean west in parallel, on two different cards;
  - 9776 is unmirrored on the west-leaning `pine_fan_5`;
  - 6880, 6935, 5748 and 2330 keep their painted limbs.

## Pitfalls

- **An assignment reaches the page only through the layout.** The page reads each tree's card from
  `web/public/assets/<name>/layout.json`, which `node tools/map_layout.mjs <S>` copies from `trees/assign/<S>.json` and
  `node tools/export_web_scene.mjs <name>` ships; `check` reads the assignment files, so it passes either way. On
  2026-10-12 six of S4's 23 trees were still on their cards from before the review in the outer road's layout (the
  shrub at 10865 on `bamboo_1`, not `bamboo_3`). After any change in `assign/`, run both, and diff the layout's cards against the assignment.
- **`background: 'opaque'` is not always obeyed:** check for alpha and draw again (`gen` does this).
- **Chroma keys fail** on painted foliage, because the model glazes its washes over the key colour.
- **The colour-to-alpha formula** (GIMP-style, `a = max(1 - p)`) makes every pale colour translucent: pale buds
  vanish under alphaTest. Treat a pale stroke as solid unless it touches the paper.
- **8-bit blurs** for the local colour (sharp on raw buffers) quantise the premultiplied colour and give cyan and blue
  specks at edges. The keyer blurs in float.
- **The key stamp** must include the raw file's size and mtime, not only its path: a redraw has the same path.
- **The API reference upload sometimes fails** (HTTP 400 `upstream_reference_upload_failed`): rerun `gen`; it draws
  only what is missing.
- **Resizing** a dense card down does not make the webp smaller (lanczos keeps the detail). Cut the alpha or lower
  the quality instead.
- **HTTP 403 from shyfai**, even for `--list-models`: the key is refused. It is not transient; tell the lead.
- **Adding refs to a form changes its old cards' keys.** A variant without `refs` is sent every crop of its form, so
  a new crop makes every old variant stale and `gen` would redraw them all. Before adding crops, give the old
  variants `"refs": [0, 1]`, and diff `status` before and after: the keys must not move. Re-cropping with `refs` is
  deterministic (same bytes), but check it.
- **`{"card": "kit"}` reaches the page and `budget_check` as an unknown card.** `web/src/world.js` `placeTrees` and
  `tools/budget_check.mjs` both fall back to `willow_card` for a card missing from `trees.json`. So until they skip
  `kit`, S4b's stump also stands on a willow card, and the budget counts that card (1.3 MB). The lead owns both
  files.
- **Read the cards beside the scan, not alone.** The first willows looked good as trees and were wrong as this
  painting's trees. `form_<form>.jpg` puts the scan reference first.

## Best practice

- Look at the scan before naming a form: the map's words ("pine-like", "needle-leaved") are readings. The S6
  "needle-leaved" courtyard trees are bamboo on the scan.
- One form per way the painter draws a tree, 2–5 variants each. Add variants where trees of one form stand close: the
  S4/S5 pine grove has three trees within 4.2 m of each other, the far willows behind the tax office six within 7 m,
  and the S6 courtyard four bamboos within 2.3 m.
- Have someone else review the cards against the scan; the willow error was caught that way.
- Read every check image, then the sheet, before shipping. Redraw any card that reads as another species, a blob or
  a sticker.
- Keep a card's real height honest (`height_m` in `cards.json` = the real tree). Let the page scale by the mapped
  height within limits; never shrink a card to fit a far painted height.

## Shipped smaller (lead, 2026-10-12)

The user's sizing note ("mind the sizings and do optimizations for both quality and sizing"): the cards now ship at
768 px tall within a 160 KB budget (`tools/tree_cards.mjs` `CARD_H`, the budget in `ship`), from the same keyed
images: 31 cards 7.1 MB -> 4.0 MB. Read on the contact sheet (`gen/trees/sheet.jpg`): the shoots, needles and bark
still read. A few dense crowns stay at 170-220 KB (the last step of the quality ladder). The page loads only the
cards the loaded sections use.
