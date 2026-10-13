# 江南百景图: the look taken apart into parts we can act on

Look agent, ink UI round, 2026-10-12. Study only: `reference/jiangnan/` never ships, and we take the language, not
the pixels. Evidence crops are in `crops/`; sampled colours are in `palette.json` (made by `tools_palette.mjs` and
`tools_pigments.mjs` with the regions in `palette_regions.json`); the swatch sheet is `crops/palette_swatches.png`.

## 0. The six images: two sets (read this first)

The user sent six images on 2026-10-12. `reference/jiangnan/README.md` describes both sets.

**Set 1: `jn1`–`jn3`, the files from `C:\Users\ran\brain-hot`** (byte-identical).
- They are frames of a Bilibili video by 反向弯曲 showing a 清明上河图-like map in the 江南百景图 style. They are
  compressed and slightly soft: lines measured here are about 2× their in-game width.
- All three are top-down map views and **show no sky**. Their file names ("pink_sky", "ink_sky") are wrong; ignore
  them.
  - `jn1` is the countryside: the river, 石橋, flower fields, willows, vertical name plaques, and a poem
    (程顥 《郊行即事》) with a seal.
  - `jn2` is the 汴河漕運 canal town with a water wheel.
  - `jn3` is 虹橋 and its crowd.
- They are the evidence for the **ground, line, palette, foliage, water and the place-name language** (§1–8, §10).

**Set 2: `jn4`–`jn6`, official 江南百景图 art pasted in the chat.** These are the **sky references** (§9).
- `jn4_keyart_pink_wash_red_sun`: cream paper, pink wet washes, a flat red sun, pale blue-grey mountain washes, and
  the 行草 logo with a seal.
- `jn5_bridge_poem_ink_streak_sky`: the sky is grey dry-brush ink streaks and blocks over cream paper. This is the
  user's "small blocks of ink … poetic". Also a vertical 行書 poem, scattered 閑章 seals, ink line with flat fills,
  and distance fading to paper.
- `jn6_ingame_isometric_town` (597×335): in-game, with ink-black tile roofs, white plaster, pink blossom, willows,
  祥雲 cloud wisps and the logo.

**An earlier version of this doc** (before the chat images were saved) read the "sky" as the drifting mist blocks of
jn2/jn3. That was wrong; §9 now describes jn4 and jn5. The web study's caveat stands: titles riding in drifting
clouds may be the video uploader's edit (`jiangnan_web.md` §2).

## 1. Paper ground and 留白 (white space)

- **The ground is the paper.** Open land is bare paper with only a faint mottle. Fields, roads and plazas are flat
  washes laid on it.
  - Countryside (jn1): sage paper `#a4a37c` (L 66, b +20). Its lightness varies by only 3 L units inside a patch
    (`L10–90 64.9–67.9`), but there are broad blotches across the map (`crops/jn1_paper_mottle.png`).
  - Town (jn2, jn3): cream paper `#d1bd93` / `#d6bf93` (L 77–78, b +24). Paving is a cooler grey-cream wash
    (`#c8bfa1`, `#938878`).
- **留白:** about a third of each frame is open paper or near-paper (k-means: the two paper clusters hold 24–30% of
  pixels). The poem in jn1 sits on a **white wash vignette** (`#d3c8b8`, `crops/jn1_poem_paper.png`) that lightens the
  paper toward white rather than adding a frame.
- The paper carries **no texture you can see** at this resolution: no fibres and no grain. Its life comes from the
  broad mottle and from wash edges.

## 2. Line

- **Weight:** two weights.
  - Outer contours (roof edges and ridges, wall corners, figure silhouettes, the bridge's arch) are about 3–4 px in
    the capture, about 1.5–2 px in game.
  - Inner lines (tile rows, timber frames, plank seams, robe folds, lattice) are about half that.
  - Contour weight barely changes with distance, because the map is isometric with no perspective.
- **Colour: local, not one black.**
  - On tiles and stone it is a green-grey ink, `#303229` (L 20).
  - On timber and earth it is a brown ink (赭墨), `#39220e` (L 16, warm).
  - Very little pure black. Willow strands and blossom branches are drawn in a dark warm brown.
  - Crops: `crops/jn2_roof_line.png`, `crops/jn1_house_shadow.png`, `crops/jn3_bridge_arch.png`.
- **Dry-brush breaks:** almost none on buildings, which are clean 工筆 line. Breaks and texture strokes (皴) appear
  on tree trunks and rocks (`crops/jn1_willow.png`: the bark is short broken strokes) and in the water.
- **Where lines fall:** every building edge, every tile row, every timber member, every figure, boat and cart. The
  edges of field rows and the dark foliage clusters of broadleaf trees.
- **Where they don't:**
  - the ground (roads, plazas and field borders are colour changes with soft edges, never inked);
  - the water's edge (a slightly darker band, no line);
  - mist and clouds;
  - shadows;
  - willow masses, whose outline is the wash edge;
  - anything far away (map-edge mountains are washes).

## 3. Fills

- **Flat washes with a small gradient inside.**
  - Walls are flat white `#e5dbc1` / `#ebe1c5` with a faint grey at the foot.
  - Roofs are flat slate `#5a605a` / `#5f6056`, with lighter tile-row lines `L 30→48` inside the wash
    (`roof_jn3 L10–90 30–48`).
  - Willows are layered translucent greens, darker toward the crown and lighter at the tips (`L 44→63`).
- **Bleed past the line:** slight, and mostly on soft things: willow washes and blossom dots go past their strokes,
  and water streaks run across the bank line. Buildings stay crisp, because they are game sprites.
- **Gradients inside washes** are the main shading. There is no lit/shadow side per face on buildings, only flat
  faces with a value step between roof and wall.

## 4. Palette (sampled with code, named against the Song mineral pigments)

All values are medians of the sampled pixels (sRGB hex, CIELAB). "Ours" is `web/src/palette.js`.

| Pigment | Where in 江南百景图 | Sampled | Lab (L, a, b) | Ours (closest) | Lab ours |
|---|---|---|---|---|---|
| 墨 ink (on tile, stone) | roof lines | `#303229` | 20, −3, 5 | post ink `#2a2521` | 16, 2, 4 |
| 赭墨 brown ink (wood) | house frame lines | `#39220e` | 16, 9, 17 | same ink | |
| 墨 wash (roof) | tile roofs | `#5a605a`, `#5f6056` | 40, −3, 3–6 | roof `#5c6064` | 40.5, −1, −3 |
| 鉛白 lead white | lime walls | `#e5dbc1`, `#ebe1c5` | 88–90, −1, 14–15 | plaster `#d9d6ce` | 86, 0, 4 |
| 鉛白 + paper | mist, cloud blocks | `#d7cdbd`, `#c2b9a7` | 75–83, 0, 9–10 | (backdrop mist from fog) | |
| 赭石 ochre | dirt path | `#b09872` | 64, 3, 23 | ground `#9c917b` | 61, 0, 13 |
| 赭石 dark | bridge timber | `#776149` | 43, 5, 17 | timber `#6d5c4b` | 40, 4, 12 |
| 石青 azurite (thinned, with 墨) | river | `#6b8587`, `#668589`, `#68868b` | 53–54, −9, −4 to −6 | water `#6f8e8f` | 57, −11, −4 |
| 石綠 / 汁綠 (花青 + 藤黃) | willows | `#728465`, `#7e8869`, `#828b62` | 53–56, −10 to −13, 15–21 | willow_card `#7b8f58` | 57, −17, 27 |
| 汁綠 + 墨 | broadleaf foliage | `#565e3d` | 38, −9, 18 | (tree cards' own paint) | |
| 石綠, purest | greenest leaves | `#74875d`, `#6f8259` | 52–54, −15, 20 | grass `#7a8a52` | 55, −16, 28 |
| 朱砂 cinnabar | seal, bridge rail | `#ae4c38`, `#9b4329` | 40–45, 35–39, 31–33 | redwood `#7f3d2f` | 34, 27, 22 |
| 朱膘 (lit cinnabar) | lanterns | `#ee793e`, `#dc7339` | 60–64, 37–41, 49–52 | — | |
| 胭脂 carmine | peach/plum blossom | `#b77062`, `#a96c5f` | 52–55, 23–27, 17–20 | — | |
| 藤黃 gamboge | yellow flower fields | `#cfbb64` | 76, −4, 46 | — | |
| 藤黃 + 赭石 | straw awnings | `#cd9f5a` | 68, 9, 42 | reed `#a59472` | 62, 1, 20 |
| paper (town) | open ground | `#d1bd93`, `#d6bf93` | 77–78, 1–2, 24–25 | ground `#9c917b` | 61, 0, 13 |
| paper (country) | open ground | `#a4a37c` | 66, −6, 20 | ground, grass_dry | 61–63 |

**What the numbers say:**
1. **Values already agree** for roof (L 40 against 40.5), timber (43 against 40), water (54 against 57) and walls
   (88 against 86). Water is nearly the same colour.
2. **The ground is where we differ most.** Theirs is light paper (L 66–78); ours is a mid grey-brown (L 61, lit by
   the sun to about 70 on screen). Their paper is also yellow-cream (b +24), and that we must not copy (true colours).
3. **Greens:** theirs are bluer and greyer (a −10 to −15, b 15–21, chroma about 20); ours are yellower and more
   saturated (chroma 26–32). 汁綠 (indigo plus gamboge) toned with ink, not spring yellow-green.
4. **Reds:** their 朱砂 is lighter and more saturated (C about 48) than our red-ochre (C 35). In both games red is a
   sparing accent: seals, rails, lanterns, blossoms.
5. **Overall:** low chroma everywhere (most surfaces C < 25), a high-key ground, a mid-dark roof and timber
   skeleton, and small saturated accents. Blue appears only in water and the occasional robe; there is no
   saturated blue at all (the azurite filter found no blue cloth).

## 5. Shadows

- **Flat grey washes with soft edges.** Each building casts a parallelogram of neutral grey wash
  (`crops/jn1_house_shadow.png`). Inside it the paper goes from L 61.7 to 44.6, about 0.45× in linear light, and
  loses about half its chroma (b +19 → +10). There is **no blue in the shadows**: neither cool sky fill nor warm
  bounce.
- Trees cast soft round grey blots. Figures cast small grey ellipses.
- There is no self-shadowing on buildings beyond the flat roof/wall value step.

## 6. Distance and atmosphere

- In the top-down map there is no aerial perspective. Distance is shown only at the map's edge, where:
  - ink mountains fade as pale blue-grey washes;
  - cream cloud swirls close the edge (web study, `snow_map_edge_*`);
  - the **mist blocks** drift over the corner (jn2, jn3).
- **The mist blocks** are white wash (`#d7cdbd`, L 83, almost neutral) and partly transparent: the map shows through
  at 40–70%. Their edges are streaky, like a half-dry wide brush pulled sideways, and they sit in horizontal bands
  (`crops/jn2_mist_title.png`, `crops/jn3_mist_title.png`).

## 7. Foliage

- **Willows** (隋堤烟柳, the scroll's own motif) are the signature:
  - a dark, gnarled trunk in broken brown strokes;
  - crowns of hanging strands drawn as many thin green lines over soft green washes, lighter and yellower at the tips;
  - no outer contour (`crops/jn1_willow.png`, `crops/jn3_tree_foliage.png`).
- **Broadleaf trees:** dark 汁綠 leaf clusters, each with a thin dark edge, over brown branches.
- **Blossom:** dots of 鉛白 and 胭脂 over ink branches (`crops/jn2_blossom.png`). It is spring in all three shots;
  peach, plum and pear are in flower beside the willows.
- **Fields:** rows of dots in 藤黃, 胭脂, 鉛白 and lilac (flowers), or rows of 石綠 heads (vegetables), on 赭石 soil.

## 8. Water

- One flat 石青-grey wash (`#6b8587`, L 54) with **many short streaks**:
  - pale ones (`L +10`) and a few darker ones, about 15–40 px long and 2 px wide in the capture;
  - all running with the current at a slight diagonal (`crops/jn1_water_streaks.png`, `crops/jn3_water.png`).
- A slightly darker band runs along each bank, and lily pads and reeds sit at the edges.
- No reflections, no highlights, no transparency. This is the same idea as our `water.js` (the scroll's current
  lines). Theirs has more and shorter lines, with pale ones as well as dark.

## 9. The sky (jn5 and jn4; values in `sky_regions_out.json` and `sky_regions2_out.json`, made with `tools_sample.mjs`)

**jn5: the ink-streak sky, the user's "small blocks of ink"** (`crops/jn5_sky_full.png`,
`crops/jn5_sky_blocks_zoom.png`, `crops/jn5_sky_left_streaks.png`, `crops/jn5_sky_right_mountains.png`):
- **Exactly two tones**, cut hard:
  - the paper, L 84–85 (`#dbd3c0`);
  - the strokes, L 79–80 (`#cfc2af`–`#d1c4b1`).
  The histogram is bimodal, with about 15% of pixels between the two, so the edges are crisp. Overlaps are hardly
  darker.
- **The strokes are subtle:** only about 5 L darker than the paper, and a hair warmer (b +11 against +9.5). It is a
  second thin wash of the same colour (積染), not black ink. There is **no contour** on any stroke (Messenger inks
  its clouds; jn5 does not).
- **Shape:**
  - long level strokes, 6–10× longer than tall, laid like a wide flat brush pulled sideways;
  - **tapered, torn ends**, and **comb-like fringes**: the brush's hairs leave thin level streaks of paper along the
    edges (dry brush, 飛白);
  - near the top centre the strokes **fan diagonally**, rising toward the middle;
  - between strokes, the paper shows as soft blank channels.
- **Distribution:**
  - dense at the top (50–65% of the upper band is stroke) and thinning downward;
  - **a blank band of paper above the horizon** (留白), where the distant mountains stand as **pale grey flat washes**
    (`#c9c5b9`, L 79.5, cooler than the paper);
  - the mountains fade to paper at their feet.
- The seals (閑章), the 行書 poem and the logo sit **on** the sky, as on a scroll.

**jn4: the pink-wash sky with the red sun** (`crops/jn4_sky_full.png`, `crops/jn4_sun_zoom.png`):
- **Wet-in-wet washes, not cut shapes:**
  - soft pink horizontal blotches (`#f9d2c5`, L 87, a +12) on near-white paper (`#fbf6e3`, L 97);
  - lightness runs continuously from L 85.5 to 95.7, with no bimodal cut;
  - edges are soft, with brush-drag streaks and a little pooled colour at some edges.
- **The sun** is a flat, slightly irregular disc:
  - an orange-vermilion (`#f09b6a`–`#f1a173`, L 72, a +26, b +37), between 朱砂 and 朱膘;
  - watercolour blooms inside: lighter patches and a slightly darker rim;
  - **no halo, no glow, no rays.**
- Mountains are pale blue-grey dry-brush streaks (`#ede9dd`) cut by mist. The town below is drawn in ink with flat
  colour; the river reflects the pink.

**jn6** (in-game, small): white 祥雲 wisps drift over the town, flat white with a thin grey edge, in curling bands
(`crops/jn6_xiangyun.png`).

**What we take for a true-colour sky** (built in `?sky=ink` v4, `sky_design.md`):
- jn5's structure: two tones, level combed strokes, dense high, blank above the horizon, no contour.
- The strokes are a deeper, slightly greyed wash of **our** sky's colour: blue by day, never cream.
- jn4's soft pink washes and flat vermilion disc at dawn and dusk.
- The cream paper itself stays out of the world sky (the true-colours rule). That tension is a question for the user.

**In 江南百景圖's other key art** (web study, `reference/jiangnan/web/`):
  - **Dawn or dusk:** blush-pink horizontal washes (`#f8d2c3`) across the top of a pale paper sky, and a **small
    flat vermilion sun disc** (`#ee965c`, or deeper `#bd6944`) with **no halo or bloom**
    (`dawn_blush_wash_red_sun_wallpaper_v330.jpg`, `day_red_sun_peach_mountains_wallpaper_v442.jpg`).
  - **Night:**
    - the sky is a warm near-black (`#2d2c2d`) or horizontal gouache bands of indigo `#28314a` and plum `#443035`;
    - dry-brush streaks let the paper show through;
    - stars are sparse soft **gold dots** of mixed size;
    - no moon disc anywhere;
    - the ground stays light: "darkness lives in the sky band".
  - **Day:** mostly bare paper sky (留白) with pale mountain bands cut by mist.
- **Messenger's sky**, which the user compares it to, is two flat noise-cut tones (sky and cloud) with an ink contour
  on every cloud edge. It has no gradient and no time of day (`messenger_sky.md`).
- jn5 and Messenger share the language: **two flat tones cut hard from soft shapes, never a smooth gradient.** They
  differ in that jn5 has no contour and its strokes are long, level and dry-brushed, while Messenger's are ragged
  blobs.

## 10. Calligraphy, seals and place names (印章; for the ui agent)

**Set 1 (jn1–jn3): how a 清明上河图-style map in this language names its places.** Crops:
`crops/jn2_mist_title.png`, `crops/jn3_mist_title.png`, `crops/jn2_seal.png`, `crops/jn1_sign_slip.png`,
`crops/plaques_jn1_jn3.jpg`.

- **Region title in a mist block, with a seal** (汴河漕運 in jn2, 虹橋 in jn3):
  - 2–4 characters set vertically at the top-left of the view, in a calm 楷書 with visible brush entry and exit,
    dark ink;
  - it sits inside a drifting white mist block (soft white wash, streaky dry-brush edges, the map showing through at
    40–70%), so it reads on white without a panel or frame;
  - under the last character is a **small square red seal** (`#ae4c38`, 白文: the character left white, cut into red)
    bearing **one character of the name** (汴河漕運 → a single-character seal; 虹橋 → 虹).
- **Vertical name plaques on the landmarks themselves** (jn1, jn3):
  - places: 村塾, 茶棚, 石橋;
  - **the scroll's vignettes as scenes**: 掃墓歸來 (the tomb-sweepers coming home), 縴夫拉縴 (the trackers),
    虹橋爭渡 (the race under the bridge). These name what is happening, not just where.
  - Each is a narrow vertical cream slip (`#e5dbc1`-ish) in a thin two-tone wooden frame (dark brown outside, lighter
    inside), 2–4 characters of dark grey-brown 楷書.
  - It hangs from or stands on a slim post at the landmark, small (about the height of two figures), upright to the
    screen.
  - No seal on the plaques.
- **The poem block** (jn1, bottom-left):
  - five columns of regular 楷書, right to left, on a soft white wash vignette (no frame);
  - a smaller signature column (宋程顥郊行即事), the seal at its foot.
- **The web study's caveat:** the title-in-mist and the plaques may be the video maker's overlay rather than the
  game's own UI (`jiangnan_web.md` §2). Either way, they are a complete, consistent naming language for a
  清明上河图 map.

**Set 2 (jn4–jn6, official):**
- The logo 「江南百景圖」 is 行草, set in a stepped vertical cluster with a tiny red seal.
- jn5 scatters several 閑章 (leisure seals) of different shapes across the sky, and has a vertical 行書 poem with the
  painter's signature and a seal, all **on the sky as on a scroll**.

- **Red is rare:** seals, lanterns, the bridge rail and blossom. The type agent's notes agree (`gen/ui/fonts/notes.md`;
  its "楊柳歸來" should read **掃墓歸來**).

## 11. Day, night and seasons (summary of `jiangnan_web.md`)

- **No day/night cycle in the cities:** night shots online are edits. The game uses the real clock only for events
  (fireworks 每晚八點至八點半, lantern releases). Two special maps are night (鸡鸣山) or have day and night (棕影岛).
- **Seasons** come as themed towns and events, not as a cycle: snow in the winter event and in 白雪鎮, autumn in
  存秋鎮. Rain is a rare random event: thin slanted streaks, ring ripples, a slight cool wash, and the ground stays
  pale.
- The lead artist (千九) says the style is **"not really 水墨"**: 吳冠中 more than the Ming masters, saturation
  above 國畫, designed for phone screens. The style rules are 「重色描線，低飽和顏色，非虛構的細節設計」.
- **Production:** hand-painted 2D sprites, each building painted from one side. The ink-to-colour reveal is one
  shared material with a per-vertex time.

## 12. What this means for us (details in `compatibility.md`)

1. Our world is already in the same family: ink edges, flat-ish painted swatches, true-coloured water and roofs.
2. The four biggest differences:
   - a **light ground** (paper-light, but not paper-yellow for us);
   - **local-colour ink** (brown on wood, grey on tile) with inner lines from the textures;
   - **flat grey shadow washes**;
   - **bluer, greyer greens with cinnabar accents**.
3. The sky follows jn5 and jn4 in the hour's true colours (the `?sky=ink` v4 prototype, `sky_design.md`):
   - by day, two-tone combed ink-wash strokes;
   - at dawn and dusk, pink wet washes and a flat vermilion disc;
   - at night, indigo bands.
   jn5's cream paper sky is the open colour question.
4. Region titles in mist with a one-character seal, vertical plaques naming places and the scroll's vignettes, and
   the poem block are UI language (§10): the type and ui agents' work.
