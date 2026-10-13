**Merged into web-scene "The atomic scripts" (Backdrop) and "Backdrop panels: keying, picking, the horizon",
2026-10-12** (records agent; checked by the round-2 records agent).

# The painted backdrop: method and lessons

From the backdrop agent, 2026-10-12. The tool is `tools/backdrop.mjs`, the page side `web/src/backdrop.js`, the
prompts `prompts/backdrop_panel.txt` + `prompts/backdrop_<name>_<side>.txt`, the configs `sections/<name>/backdrop.json`.
Before/after shots: `gen/sections/gate/backdrop/before_joined/`, `rekey_joined/`, `rekey_hours/`, `before_gate/`,
`rekey_gate/`. Review sheets per panel: `gen/sections/<name>/backdrop/review_<side>.jpg`.

## The four faults and what fixed each

1. **Stretched.** The image model answers about 3584×1290 (≈ 2.8:1) whatever size is asked (3584×1024 was asked);
   the old page then stretched it over a fixed 27 m × (80° of ring) panel, about 1.3× too wide.
   **Fix:** the page never chooses a panel's height. It measures the arc the panel spans (its angles, or for a north
   panel in the joined world, its section's top edge plus 12% each side, on the ellipse) and makes the panel as tall
   as the image's own aspect asks, with u running evenly along the arc length (not the ellipse's angle). The tool
   trims the empty paper rows above and below, so the texture holds only painting.
2. **Too high.** The model paints the scroll's bird's-eye view: horizon 44–60% up, the near road and roofs below it.
   On a vertical panel 55–115 m away that puts the far ground 6–8° above eye level, and the painted ground front 3–5 m
   above the misty floor, so the town floats.
   **Fix, two halves:**
   - *Placement* (page): the tool measures two rows of each panel, the **horizon** (where the paper stops showing
     between things: the far ground closes) and the **foot** (where the painted ground gives way to the bottom mist),
     and ships them in `assets/<name>/backdrop.json`. The page stands the horizon at the viewer's eye: the panel
     follows the camera's height (`onBeforeRender`), like any far view, so it is right from the street, the bridge,
     third person and the gate tower. If that would sink the foot more than 2.5 m under the floor, the panel is lifted
     instead (the old bird's-eye paintings: their horizon still sits about 4° high, but nothing floats). The panel's
     foot stands in **ground mist**: over 2.5 m above the floor its colour turns to the fog colour, which is the
     floor's, so floor and panel meet without a line.
   - *Painting* (prompt): `backdrop_panel.txt` now asks for an eye-level view: one level horizon a quarter up, every
     standing person's head on it, things standing on it, a ground strip of a tenth of the height at most, never a
     view down onto roofs or roads. With such a painting the horizon lands at eye level and the ground strip fits
     between the floor and the eye. This is the real fix; the placement rule only makes old paintings tolerable.
3. **Halos.** Three causes, all fixed in `ship`:
   - the sky was keyed by a soft threshold but the colours of half-keyed pixels stayed paper-cream: now every
     part-transparent pixel is **unmixed** from the paper colour B: alpha = min(1, d/0.14) (d = colour distance to
     B, with a knee that drops d < 0.06: haze wisps), colour = B + (C − B)/alpha. Over the paper the panel gives back
     the painting exactly; over any other sky it carries no paper at all;
   - **texture filtering and mipmaps** mixed the cream RGB stored under alpha 0 into every edge (at 70–115 m the
     panels are drawn from small mips, so this was most of the halo): now the colours of the opaque pixels are pushed
     out into the transparent ones (push-pull fill), and the WebP keeps them (`exact: true`);
   - the paper colour was one row median that drifted into pale ground (whole fields keyed out): now the paper is
     tracked down from the top and up from the bottom only while it stays paper-pale and shows in ≥ 4% of the row; the
     rows between (the ground strip) are never keyed except for paper-white haze.
   Check every panel on a dark and a light ground: the review sheet does both.
4. **Not loyal.** The old content prompts asked for "fields and groves beyond, the river far off, a faint line of
   distant hills"; the model added a watchtower, hills, ponds, a lake with boats. **Fix:** each content prompt
   describes only what the strip paints, in the viewer's frame (see below), and ends with what is not there; the
   panel prompt forbids hills, far tree lines, water, towers, walls, clouds unless named. The strip itself leaves out
   what must not be copied: `scan` may be several rects joined (the gate's north strip skips the gate tower's roof,
   the collector's seal, and the far path's riders and house, which are built in 3D). A panel whose painting has not
   passed the side-by-side review carries `hold` and is not shipped: the page shows mist there, which is always
   loyal.

## Writing a content prompt

- **Rotate the strip into the viewer's frame.** The scroll's u is east and its v runs north up the silk. Looking
  east past an east seam: the strip's left end is nearest, its right end farthest, its **top edge is on the left**,
  its bottom on the right. Looking west: right end nearest, top edge on the right. Looking north past the top edge:
  the strip's left is on the left. The model cannot rotate a picture; say it in words, and name things by side.
- **Name things from the map**, not from the restyle: `map/text/<S>.md` lists what stands where; take the side (N/S of
  the road) from it.
- **Say what is not there**: "no leaves and no hanging willow strands" on a bare tree the model likes to make a willow;
  "no buildings, people, animals" where the strip has only ground and trees.
- **North panels:** the silk's top edge is the end of the painting. A north panel is right only where the top band
  paints open ground that runs on (the gate: bare ground, mounds, bare trees and pines); where the edge cuts roofs or
  crowns with nothing beyond (the outer road, the inner city), there is no north panel: mist.

## Pitfalls

- `size` is a wish: the model returns its own aspect. Never trust the asked size; read the image's.
- `gen` overwrites `<side>_0.png`. The first round is kept in `gen/sections/<name>/backdrop/v1_2026-10-11/`.
- With `candidates: 2` the model paints two; read both beside the strip (the review sheet stacks the strip, every
  candidate with the picked one framed red, and the keyed panel on night, day and paper), set `pick`, drop `hold`,
  `ship` again.
- A dark panel at night is right: the panels take the page's own light (sky fill + sun or moon from the scene's lights,
  relative to 10:00), so at dusk they go dim and warm and at night dark blue with the town. Taking brightness from the
  fog colour alone kept them in daylight at dusk (the dusk horizon is bright).
- The keyer assumes a paper-pale sky at the top and, if there is one, a paper-pale mist at the bottom. A panel painted
  to its bottom edge keeps its whole ground; one with a coloured sky must be redrawn (or given `horizon`/`foot` by hand,
  fractions of the raw image from its top, which override the measured rows for both the keying and the placement).
- The ink pass draws a line wherever depth jumps within 70 m (`inkFadeEnd`): the misty floor's rim used to sit 2 m
  past the ring, so a grey line ran through every panel's foot. The floor now reaches 90 m past the ring, beyond the
  ink's reach, and where no panel stands the misty ground runs on to the horizon.
- The old bird's-eye paintings keep a pale strip of haze along their horizon (it lies inside the ground strip, so it is
  not keyed). The eye-level prompt asks for no haze; check for it on the dark row of the sheet.

## The commands

```
node tools/backdrop.mjs <name> cut       # strips from backdrop.json scan -> gen/sections/<name>/backdrop/<side>_scroll.jpg
node tools/backdrop.mjs <name> gen       # stale panels only (key over prompt text, model, size, candidates, refs)
node tools/backdrop.mjs <name> ship      # key, unmix, bleed, fade the ends, trim, measure; review sheets; held panels stay off the page
node tools/backdrop.mjs <name> ship --review   # the same, but the page keeps its current panels (read the sheets first)
node tools/backdrop.mjs <name> sheet     # the review sheets again
```

## The redraw queued on 2026-10-12 (the image API returned 403 INSUFFICIENT_BALANCE all session)

The prompts, strips and configs are ready; `status` shows every panel stale. When
`python3 -I tools/shyfai_image.py --list-models` answers:

```
node tools/backdrop.mjs gate gen && node tools/backdrop.mjs outer_road gen     # 4 panels x 2 candidates
node tools/backdrop.mjs gate ship --review && node tools/backdrop.mjs outer_road ship --review
```

Then for each panel read `gen/sections/<name>/backdrop/review_<side>.jpg` beside its strip: reject any candidate that
adds what the strip does not paint, or that looks down on roofs (horizon high, a deep ground strip: the log prints
`ground strip`, which should be under about 0.03 of the width). Set `pick`, delete `hold` (gate east and north), and
`ship` without `--review`. Then shoot the joined world and the gate alone at 10:00, 18:30 and 22:00. If the model
still paints from above, add a layout guide as a third reference (a white canvas of the output size with one grey
level line a quarter up) before anything else.

## The web-scene skill's Backdrop row (proposed text)

| Backdrop | `node tools/backdrop.mjs <name> [cut\|gen\|ship\|sheet\|all]`; `web/src/backdrop.js` | The painting beyond the edges (`sections/<name>/backdrop.json`): one panel per edge that has something painted beyond it. Each restyles the scroll strip past that edge (`scan`, one rect or several joined to leave out what is built or a seal) with `prompts/backdrop_panel.txt` + `prompts/backdrop_<name>_<side>.txt` (B1 as style): an **eye-level** view on plain white, the content only what the strip paints, described in the viewer's frame (looking east, the strip's top edge is on the left). `ship` keys the white out and unmixes every edge from it (no paper fringe on any sky), bleeds colour under the transparent pixels (no halo from mipmaps), trims, and measures the painted horizon and the ground's foot; read `gen/sections/<name>/backdrop/review_<side>.jpg` (strip, candidates, keyed panel on night and day) and reject anything the strip does not paint (`pick`; `hold` keeps a panel off the page: mist). The page stands the panels on one ellipse round the joined world at their true aspect, the horizon at the viewer's eye (they follow its height), the foot in ground mist that meets the misty floor; a panel on a seam with a loaded neighbour drops; north panels sit over their own section's top edge. They take the page's light (sky fill and sun or moon, relative to 10:00). The ink pass (`post.js`) veils everything outside the painted area in mist (the hour's horizon haze). South of the silk's bottom edge: mist only. |

## The redraw, 2026-10-12 (after the top-up)

What ran: `gate gen --only east,north` and `outer_road gen` (2 candidates each), then `--force` once more for the two
east panels; 10 panel images and the tree card `bamboo_5`, 11 images in all. The billing counter
(`GET https://agent3.shyfai.cn/v1/dashboard/billing/usage?start_date=…&end_date=…`, `total_usage`) went from 150 to
161: one unit per gpt-image-2.5 image at 3584×1280 or 1024². `/dashboard/billing/subscription` only gives the limit
(`hard_limit_usd` 21.5), not the balance. Each draw of two took 33–85 s.

| panel | candidates | picked | ground strip | shipped |
|---|---|---|---|---|
| gate east | 4 (draws 1 and 2) | 2 | 0.080 | yes, 340 KB |
| gate north | 2 | 0 | 0.014 | **held**: the keyer turns its bare crowns white (below) |
| outer road east | 4 (draws 1 and 2) | 0 | 0.106 | yes, 324 KB (was 183) |

Every pick and every rejection is written in the panel's `picked` field in `sections/<name>/backdrop.json`. Shots:
`gen/sections/gate/backdrop/redraw_joined/` (the joined world at 10:00, 18:30, 22:00, north held),
`redraw_joined_north_shipped/` (the same with the north panel on the page), `redraw_gate/` (the gate alone).

What it taught:
- **Open ground comes out at eye level; a street does not.** The north panel (ground, mounds, trees) put its horizon
  where asked (ground strip 0.014 of the width). Every street candidate, looking down a road, painted the road as a
  deep wedge (ground strip 0.055–0.106, against the prompt's tenth of the height, about 0.035), so the page lifts
  those panels and their horizon stands about 5° above the eye. A second draw did not help. The layout guide (a third
  reference with one grey line a quarter up) is still the untried next step.
- **"Willow" in a content prompt paints a weeping willow**, every time: all four gate-east candidates and the north
  panel's second one hung curtains of green strands. `backdrop_gate_east.txt` asks for "old willows" and "a huge old
  pollard willow … with … long bare whips" without saying what they are not. The tree cards' fix carries over; add to
  the prompt: "The old willows are pollard willows before their leaves open: from each knobbly head a half-open fan of
  long, straight, stiff shoots springs upward and outward. They are NOT weeping willows: no hanging curtains, no
  drooping strands, no foliage." The outer road's prompt already says "no leaves and no hanging willow strands" for
  its big tree, and that tree came out bare in all four draws.
- **The keyer frosts bare crowns.** `key()` treats a sky pixel up to 0.14 from the paper as a mix of paper and a
  colour 0.14 from the paper, and anything farther as opaque. A fine dark twig covers only part of a pixel, so its
  pixels come out pale and half-transparent, or opaque with paper still in them. A crown of fine twigs becomes a pale
  cloud: white blossom by day, a glow at night. Share of visible pixels (alpha ≥ 0.5) near-white (min RGB > 200),
  white walls included: gate north 37%, gate east 15%, outer road east 10%, gate west (the old painting) 2%. Read the
  dark row of the review sheet for it, and measure it. The fix belongs in the tool: take an edge pixel's colour from
  the confident pixels near it, and its alpha from where it lies on the line from the paper to that colour, as
  `tools/tree_cards.mjs` does (`trees/notes.md`, Keying).
- **A painting that reaches the bottom edge keys to nothing.** When the foot is measured at the last row,
  `ss(Math.min(H - 1, foot + 0.06 * H), foot, y)` in `ship` runs backwards and zeroes every row above it. That is what
  emptied gate east's draw-1 candidate 1, whose bottom band is cream: the log said `raw rows 535-730 of 731`,
  `foot 1.000`. A trim to a sliver means the keying failed; read that line before the picture. The fix is to skip the
  foot fade when the foot is the last row. Until then, such a panel needs `foot` set by hand.
- **Measure every candidate, not only the pick.** `ship --review` keys only `pick`. Set `pick` to each candidate in
  turn and run `ship --review --only <side>`: the log's ground strip and its raw rows sort them before any picture is
  read.
- **Keep earlier draws as candidates.** `gen --force` overwrites `<side>_0..n-1.png`. Copy them to
  `gen/sections/<name>/backdrop/draw<k>_<date>/` first, then put the earlier ones back as `<side>_2.png`, `_3.png`:
  the review sheet shows every `<side>_<i>.png`, and `pick` can name any of them (the cache key does not include
  `pick`). Delete the extra files before a fresh `gen`, or they stay on the sheet as stale candidates.
- **Sizes:** the eye-level paintings carry more detail and key to 320–340 KB at the tool's webp q86 (the old outer road
  east was 183 KB). The joined world gains 141 KB now, and 210 KB more once the north panel ships.

## The keyer, the gate's two panels and the horizon (2026-10-12, later)

What ran: the keyer in `tools/backdrop.mjs` (`key()`, `ship`), `gate gen --only east` once (2 images), and one
horizon trial of 2 images on the outer road's east panel, made outside the tool (below). 4 images in all.

### The keyer: an edge matte, as the tree cards have

- **What it does now.** The old rule (alpha from the blurred distance d to the paper, colour unmixed toward DREF =
  0.14) stays for everything away from the paper. Where clear paper shows close by (weight z: the share of pixels with
  e < 0.03 within about 2 px, e the unblurred distance to the paper; z runs 0 to 1 between shares 0.02 and 0.1):
  - a pixel at least 0.35 from the paper is solid;
  - any other pixel takes the colour of the confident ink near it (the mean of the pixels at least 0.35 from the paper
    within about 1.2 px, else 3.5 px, else 10 px: a fine twig's own branch), and its alpha from where it lies on the
    line paper -> that colour. Thin twigs stay dark, and the paper between them goes;
  - a pale stroke off that line (cos < 0.85: a pale-green shoot by a brown twig) or with no ink near is a wash: its
    own hue, unmixed toward 0.3 from the paper instead of 0.14 (more transparent, deeper);
  - pale washes inside a crown away from the paper, with no ink within 3.5 px but textured (e varies by 0.1 within
    2 px) or open (a tenth of the pixels within about 6 px are paper), are washes too: the haze of new shoots.
  z blends the edge treatment with the old rule, so a speck of paper inside a crown or a wall leaves no hole. The
  ground strip keeps the old rule, except that a paper pixel among things (z, e < 0.06) goes: the white between far
  heads and carts where the road meets the horizon had keyed to opaque paper halos round every far figure.
- **Numbers** (share of visible pixels, alpha >= 0.5, with min RGB > 200; pale walls and ground count too; `ship` now
  prints it as `near-white`): gate north 37.1% -> 7.9%; gate east, the painting shipped this morning (draw 2's first)
  15.1% -> 5.6%; outer road east 10.3% -> 2.4%; gate west (the old painting) 1.9% -> 1.3%. The new gate east
  candidates key to 4.1% and 3.0%.
- **It leaves the rest alone.** Keyed losslessly with the old and the new keyer, the outer road east panel changes in
  0.9% of the pixels that were not frost, 96% of those within 3 px of the sky; away from the sky 0.04%. Gate west:
  3.8%, 63% at the sky's edge; the rest is the inside of its weeping willow, whose pale wash now has a few more
  rounded holes where the old painting's wash is paper-coloured. (Compared as webp, every panel seems to change in
  5-12% of its pixels: that is the re-encoding, not the keyer.) Gate west was not reshipped; it shows only when the
  inner city is not loaded.
- **Shots.** `gen/sections/gate/backdrop/frost_joined/` (the joined world at 10:00, 18:30, 22:00, with the re-keyed
  outer road east and the gate north panel on the page), `frost_gate/` (the gate alone, with the new east panel).
  Before: `redraw_joined_north_shipped/` (the same spots, the old keyer). Kept for comparison:
  `gen/sections/<name>/backdrop/frost_before/` (the old keyed panels and configs). By day the north crowns are now
  bare brown twigs; at 22:00 they no longer glow.
- **What did not work**, so as not to try it again:
  - a hard zone (every pixel within 2 px of a paper pixel) made square holes in the old west painting's willow,
    wherever one paper-coloured pixel sat inside the crown. The soft weight z fixed it;
  - the open-crown wash without the "no ink near" condition made the same holes (pale wash beside strands, in a
    painting whose paper is cream and grainy);
  - blurring the paper field B did not help those holes. They came from the zone, not from B;
  - keying at the painting's own width (3585 px) and averaging down left more pale fringe on gate north (11% against
    8%), probably because its twigs are mid-tone at full size and key solid in their own pale colour. The keying
    stays at 2048.
- **What is left.** Pale bud dabs and the pale hazes inside the north crowns (the model painted them as cream washes,
  and inside a dense crown nothing tells them from a pale wall), and the dense heads of the small far pollards on gate
  east, whose fans of shoots read pale at night. Neither reads as blossom on the page.
- **The bottom edge.** `ship` no longer fades below a foot on the last row (the fade ran backwards and zeroed the
  panel). Draw 1's second gate-east candidate, which keyed to rows 535-730 before, now keys to rows 100-730.

### The gate's two panels

- **East, draw 3** (`gen/sections/gate/backdrop/draw3_2026-10-12/`), after the prompt's new sentence that the old
  willows are pollards with stiff shoots, not weeping willows. Both candidates paint pollards with fans of straight
  shoots; neither weeps. The prompt line works. Picked 0: it has the spiked earthen wall with its gate building and
  idle soldiers, the round fan, the stalls and parasols, the temple hall, the banner, the hut and the tea house. Its
  departures are a grassed bank under the temple, a row of five or six pollards down the right side, and no huge burled
  trunk. 1 lost the spikes and ran its wall to the horizon like a city wall, with a second gate tower, and its rider
  has no fan. Both still paint the road as a deep wedge (ground strip 0.076, 0.074). Shipped: 279 KB (the old one was
  340 KB). The reasons are in `picked`. Draws 1 and 2 are no longer candidates; their files are in their draw folders.
- **North:** shipped as it was (pick 0, `hold` removed), at 7.9% near-white, 198 KB.
- **KTX2:** `tools/ktx2.mjs` (another agent's) keeps KTX2 copies of the panels. The `panel` kind is not adopted, so the
  page loads the webps. The copies of gate east and outer road east are now stale, and the north panel has none. Run
  `node tools/ktx2.mjs encode --kind panel` before the panels are ever adopted.

### The horizon

- **How high it stands.** The page (read only; numbers from its own placement rule) lifts a panel whose ground strip
  is deeper than about 4.2 m (eye 1.6 m + sink 2.5 m). That is under 0.036 of the width for the outer road's east
  panel in the joined world (arc 117 m), and under 0.043 for a 70 m circle. Shipped now: outer road east, strip 0.1055,
  lifted 8.1 m, horizon 4.1 deg over the eye; inner city west 0.121, 4.5 deg; gate east alone 0.076, 2.6 deg; gate west
  alone 0.141, 7.8 deg; gate north 0.014, no lift.
- **Trial 1, in the tool: cap the ground strip** (panel field `ground`, a fraction of the width; the foot moves up to
  horizon + ground and the rest fades out). With `ground: 0.035` on outer road east, the horizon stood at the eye, but
  the street went with it: the model paints the carts, the crowd and the hall *in* the deep strip, so only roofs and
  crowns stayed above the floor's mist (`gen/sections/outer_road/backdrop/horizon_trial_crop/`). Rejected. The field
  stays in the tool, unset, documented as a trial.
- **Trial 2, a prompt line** (2 images, outer road east, the prompt composed outside `prompts/`:
  `gen/sections/outer_road/backdrop/horizon_trial/prompt.txt`). After "a road running away from us is a thin wedge of
  ground narrowing to the horizon." in `backdrop_panel.txt`'s eye-level rule, the line in
  `horizon_trial/line.txt`:

  > Everything in this picture is far away: its nearest things stand some seventy paces from us, so even the nearest
  > people are small, about a twentieth of the image height, with their heads on the horizon and their feet just under
  > it. The painted ground under the horizon is no deeper than those people are tall, and the road is a flat sliver of
  > it, already narrow at its near end, never a wide wedge opening toward the bottom of the image. Below that sliver
  > of ground there is only white mist.

  Ground strip 0.043 and 0.057 of the width. Every street candidate before it ran 0.055-0.106 (ten of them, the two
  new gate-east ones included), and the shipped outer road east is 0.106. On the page (shown for one shot set, then put back:
  `horizon_trial/shots_trial0/`, side by side in `horizon_trial/compare_shots.jpg`), candidate 0's horizon stands
  0.4 deg over the eye instead of 4.1. The town reads as far away: small sheds, carts and moored boats at the end of
  the road, rising out of the ground mist. Neither candidate is loyal enough to ship: 0 adds green weeping willows
  behind the hall, and 1 adds leafy green trees. The line also makes everything smaller, which is right for 70-115 m
  but leaves the near hall and crowd small.
- **Proposal (the user's call, since it is a prompt change):** add that line to `backdrop_panel.txt`. Then redraw the
  street panels (outer road east, gate east, inner city west), 2 candidates each, with the usual side-by-side review;
  add "no willows" where the strip paints none. If a candidate still lands over about 0.04, the next step is the
  layout guide (a third reference: white, one grey line a quarter up). Do not crop.
