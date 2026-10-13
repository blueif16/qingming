# Our mechanisms × 江南百景图 × Messenger: how compatible, and what to change

Look agent, ink UI round, 2026-10-12. This answers the user's ask: "compare Messenger with this style … all of our
current settings, and all of our current mechanisms. Think about how compatible they are and what kind of changes we
need."

**Inputs:**
- the look taken apart: `jiangnan_look.md` (palette numbers in `palette.json`);
- Messenger's sky: `messenger_sky.md`; Messenger's world: `reference/messenger_study/world_notes.md`;
- 江南百景图 on the web: `jiangnan_web.md`;
- the perf study draft: `gen/perf/proposal.md` and `draft_messenger_tiers.md`, and its logs;
- the ink sky prototype: `sky_design.md`;
- concept frames: `concepts/` (§5).

Palette, texture and post changes below are **proposals for the user**. Nothing here was applied, except the sky behind
`?sky=ink`.

## 1. The short answer

- **Compatibility is high.** We already chase the same thing both references do: a painted world with ink lines,
  colours from a small, controlled set, and no photographic shading. Messenger gave us the machinery (outline pass,
  palette discipline, per-section budgets); 江南百景图 gives a different paint.
- **What changes is mostly numbers and paint, not mechanisms:**
  - the palette's values and hues;
  - the ink line's colour and width;
  - the sky shader;
  - the shadow fill;
  - a repaint of about a dozen shared kit swatches.
- **Download and frame cost are close to zero** for everything ranked 1–9 below.
  - The sky was measured (v3 and v4): 0 bytes, ±0.05 ms at 4K, no measurable change on a throttled phone viewport.
  - The texture repaint keeps the same 2.1 MB budget, or +1–1.5 MB if thin lines need UASTC.
- **The real tension is the true-colours rule against 江南百景图's cream paper.** It resolves cleanly (§4): paper
  lives in the sky's 留白, the distance and the UI; line and wash live in the textures; hues move toward mineral
  pigments, not toward sepia. The ground gets lighter, never yellower.
- **Messenger and 江南百景图 agree on the sky:** both cut two flat tones hard from soft shapes; neither is a
  gradient. That is why the user saw them as alike.
  - jn5 (the user's sky reference) has no contour and lays long, level, dry-brushed strokes; Messenger outlines
    ragged blobs.
  - The `?sky=ink` v4 prototype follows jn5, in the hour's true blue.

## 2. The matrix

**Legend:**
- **Verdict:** Keep / Tune (numbers only) / Change (code or paint) / New.
- **MB:** download added per window. **Frame:** cost on a phone (m = measured, e = estimated).
- **Effort:** S < half a day, M about a day, L several days. **Risk:** L / M / H.

| # | Mechanism (ours, now) | 江南百景图 language | Messenger's recipe | Verdict | MB | Frame | Effort | Risk |
|---|---|---|---|---|---|---|---|---|
| A | **Palette** (`palette.js`: true colours; each texture's mean moved to its target) | Low chroma (C < 25); light paper ground (L 66–78); 汁綠 greens (bluer, greyer); 朱砂, 胭脂 and 藤黃 as small accents; 石青-grey water | One 16×16 atlas, 59 colours, no image textures; a 3D LUT grade over the frame | **Tune** | 0 | 0 | S | L–M |
| B | **Ink outline** (`post.js`: inverse-depth Laplacian plus normal Sobel, 3×3 = 17 fetches; one warm ink `#2a2521`, capped by `col×0.35`; noise break-up 30%; fade 20→70 m) | Local-colour ink (墨 on tile, 赭墨 on wood); two weights; inner lines from the paint; **no lines on ground, water, mist, shadows** | MRT surface ID, depth and normal in one pass; 5-tap cross; width × min(1, h/1300); `#363a3c`; fade 5→80 | **Tune** now; **Change** with MRT | 0 | 0 (tune); MRT saves time | S; M | L; M |
| C | **Grade, grain, stains** (`post.js`: grain 0.015, vignette 0.18, stains 0, warmth 0) | Paper with broad mottle; no fine grain visible; no warm cast in our reading | 3D LUT; no grain found | **Keep** (stains and warmth stay 0) | 0 | 0 | — | — |
| D | **Light by the hour** (`daylight.js` KEYS: sun, sky/ground fill, haze; PCF sun shadows) | No time of day in-game; flat light; **shadows as flat neutral grey washes** (about 0.45× luminance, half the chroma, no blue) | Fixed light tied to the character; hard-cut shadows on characters | **Tune**: neutral, lighter shadow fill; a higher key | 0 | 0 | S | M |
| E | **Sky dome** (`daylight.js` Sky: smooth gradient, sun glow, stars, phased moon) | jn5: two-tone grey dry-brush strokes over cream paper (about 5 L apart, combed edges, no contour, dense high, blank above the horizon). jn4: wet pink washes and a flat orange-vermilion disc with no halo. Night art: indigo/plum bands with specks | Two flat tones cut hard from a noise texture, ink contour via the outline pass; no time of day | **Change**: `?sky=ink` v4, built (jn5's strokes as a deeper wash of the true blue) | 0 | ≈0 (m) | done | L |
| F | **Night** (dark blue fill, stars, real moon; the town goes dark) | Darkness lives in the sky band; the ground stays paper-light; lantern halos; gold specks | None | **Tune**, if the user wants the painting's convention (question 3) | 0 | 0 | S | M (taste) |
| G | **Mist beyond the painted area** (`post.js` mistAt, `backdrop.js`) | White wash blocks in horizontal bands with streaky edges; the title rides in them | n/a (a small planet) | **Tune**: dry-brush mist edge. **Fix** the sky column bug (§3, item 4) | 0 | +0.02 e | S | L |
| H | **Painted panels** beyond the edges (`backdrop.js`, B1 style) | Map edges as ink mountains and cloud swirls | n/a | **Tune**: fade each panel's painted sky above its horizon so the dome shows (removes the seam) | 0 | 0 | S–M | L |
| I | **KTX2 kit textures** (`assets/tex/`: about 12 shared swatches plus atlases, 2.1 MB ETC1S; per-section sign atlases UASTC) | Hand-painted, with the **inner lines in the paint** (tile rows, plank seams, block joints, bark 皴), soft gradients inside washes | No textures on the world; detail is geometry plus palette | **Change**: repaint the swatches in ink-and-wash (shyfai i2i), re-encode | ±0.3, or +1–1.5 if UASTC | 0 | M | M |
| J | **Tree cards** (painted alpha cards, UASTC, 17 MB on disk) | Willow as layered green washes with strands; blossom dots; dark 汁綠 broadleaf clusters | Faceted stick trees | **Keep** the cards; **Tune** their palette targets to 汁綠 | 0 | 0 | S | L |
| K | **Water strips** (`water.js`: one 22 KB R8 tile of dark current lines, drifting; ink never lighter than the water) | Flat 石青-grey with many short streaks, **pale (鉛白) as well as dark**; a darker band at the banks | Shares the cloud noise texture | **Tune**: a second channel of pale streaks; shorter, denser lines | +0.01 | 0 | S | L |
| L | **Character textures** (Meshy, retextured from B1-style sheets; ETC1S bodies; post ink on silhouettes) | 工筆 figures: flat colour with ink folds | Palette atlas, sprite faces | **Keep** now; retexture later only if the user asks | 0 | 0 | L | H |
| M | **Streaming window and LODs** (3 sections; shared texture cache; LOD by distance) | n/a | One small planet, BatchedMesh LOD at 6/12/20 m | **Keep**: nothing here adds per-section bytes; the ink fade (20→70 m) hides LOD pops | 0 | 0 | — | — |
| N | **Fog / aerial haze** (45→230 m, horizon colour) | Distance fades to pale wash; mountains as pale bands | n/a | **Tune**: slightly nearer and paler | 0 | 0 | S | M (hides painted things) |
| O | **Ground surface** (textured swatch, true-colour mean) | Paper is never one colour: broad blotches, washes for roads and fields | Triplanar noise on palette colour | **New**: a world-space broad mottle (±4%) on ground/earth, reusing the sky's noise tile | 0 | +0.02 e | S | L |
| P | **UI** (type and ui agents) | Vertical 楷書 titles, small 白文 seals, paper slips, the poem on a white wash | — | Their brief. **New idea for them:** a mist band that carries the place name on arrival | ≤0.06 | ≈0 | S–M | L |

### Row details: the concrete changes

**A. Palette.**
- Proposed values (computed in Lab; nothing applied):

  | key | now | proposed | why |
  |---|---|---|---|
  | `ground` | `#9c917b` (L 61, b 13) | **`#afa592`** (L 68, b 11) | lighter, a touch less yellow: high key without paper colour |
  | `earth` | `#9d8e77` | `#ac9f8b` (L 66, b 12) | follows the ground |
  | `rammed` | `#a28d70` | `#ae9b83` (L 65, b 15) | |
  | `deck` | `#9c907f` | `#a39787` (L 63) | |
  | `grass` | `#7a8a52` (C 32) | `#778760` (a −13, b 19) | 汁綠: bluer and greyer, chroma 32 → 23 |
  | `willow_card` | `#7b8f58` | `#798962` | as 江南百景图's willows (`#728465`–`#828b62`) |
  | `willow` | `#8c9a6c` | `#869370` | |
  | `redwood` | `#7f3d2f` (C 35) | `#8e3f2f` (L 37, C 41) | toward 朱砂, still painted timber, not a seal red |
  | `reed` | `#a59472` | `#aa997d` | |
  | `bamboo` | `#ad9064` | `#ae9572` | |

- Unchanged: roof, brick, timber, plaster, stone and water. They already match 江南百景图's values.
- Because `trueColor()` moves each texture's mean to its target, repainted textures (I) inherit these colours. The
  two changes compose.

**B. Ink.** Now (zero cost, `post.js`):
- **local-colour ink:** `ink = mix(inkColor, col × 0.3, 0.6)`, which gives 赭墨 on wood, grey ink on tile, and
  keeps the "never lighter" rule;
- **resolution-scaled width:** Messenger's `× min(1, h/1300)`, so lines aren't fat on phones;
- **less break-up noise** on buildings, more on trees: needs a surface class, so it goes with MRT.

With the perf session's MRT pass (`gen/perf/proposal.md` borrows it):
- write a 1-bit "no ink" flag for ground, water and paving into `gInfo`, so creases in the ground stop drawing lines
  (江南百景图 draws none there);
- the flag rides on the MRT target, which the perf study already measures as saving the second geometry pass.

**D. Light.**
- Shadows go neutral and lighter:
  - day KEYS: `hemiSky` loses about half of its blue bias (e.g. `#bccde5` → `#c4ccd6`);
  - the ground fill rises a little, so shadow/lit lands near 0.5 in linear light, as in 江南百景图 (0.45).
- Exposure stays at 1; no warmth.
- This touches only the KEYS table in daylight.js, outside the Sky class, which is not mine to change.

**E. Sky.** See `sky_design.md` (v4).
- Turning it on is one line: drop the flag, or invert it to `?sky=plain`.
- The noise build already runs in idle time (v4): start costs 1.7 ms at 4× throttle.

**G. Mist.**
- Add a noise term to the mist threshold, as streaks along the horizontal, so the mist's edge reads as a dry brush
  pulled sideways. It reuses `noise()`, which `post.js` already has.
- **Fix:** no mist where depth = 1 (§3, item 4).

**H. Panels.**
- In the backdrop panel shader (`backdrop_ground_mist` program), fade `diffuseColor.a` to 0 above each panel's painted
  horizon line (it is already known: "its painted horizon at the viewer's eye"), so the dome shows above the panels.
- This removes the vertical seams seen in `sky_shots/base/c1730_*` and `c1830_*`.

**I. Kit textures.**
- Repaint `tex_roof`, `tex_timber`, `tex_wood`, `tex_redwood`, `tex_plaster`, `tex_stone`, `atlas_stone`,
  `brick_patch`, `tex_rammed`, `tex_earth`, `ground_road` and `tex_reed` through `python3 -I tools/shyfai_image.py`
  (i2i):
  - the current swatch as image 1, a 江南百景图 crop as image 2 (study only, language only);
  - the brief: "inner lines in ink (tile rows, plank seams, joints), flat washes with soft gradients, true colours";
  - then `tools/make_tileable.mjs`, `tools/match_tone.mjs` and `tools/ktx2.mjs`.
- **Ground swatches get no lines**, only mottle.
- **Thin lines risk** smearing in ETC1S and moiré in mips:
  - paint them about 2 px at 512 px;
  - review at walking distance on a phone viewport;
  - move only the line-heavy swatches (roof, timber) to UASTC if needed (+1–1.5 MB).

**K. Water.**
- The tile becomes RG8: R holds the dark lines (as now), G pale lines.
- The shader lightens by G × 0.25 toward `#eef0ee`. Lines are shorter and denser. +about 10 KB.

**O. Ground mottle.**
- One extra lookup into a shared noise tile at world xz/40 m on ground materials, multiplying by 0.96–1.04.
- About 0.02 ms (one fetch on ground pixels only).

## 3. Ranked by look gained per cost

Every change ranked 1–9 has zero or near-zero download and frame cost, so the ranking is by how much of the
江南百景图 feeling each one buys, against effort and risk.

| Rank | Change | Look gained | MB | Frame | Effort | Risk |
|---|---|---|---|---|---|---|
| **1** | **Ink sky on by default** (E). The sky is in most frames; it carries "poetic" and 留白 directly | high | 0 | ≈0 (measured, v3 and v4: ±0.05 ms at 4K; noise-level on a 4×-throttled phone viewport; 1.7 ms at start) | done (a decision) | L |
| **2** | **Palette retune** (A): lighter ground, 汁綠 greens, 朱砂-leaning red | high: the whole frame's key and hue | 0 | 0 | S | L–M (true colours, needs approval) |
| **3** | **Local-colour, resolution-scaled ink** (B, the zero-cost half) | medium-high: line is half the style | 0 | 0 | S | L |
| **4** | **Sky fixes**: no post mist on sky pixels (the pale column, with either sky) and panels' painted sky faded (H) | medium: the sky stops breaking | 0 | 0 | S | L |
| **5** | **Neutral grey shadow washes, higher key** (D) | medium-high: the flat-wash shadows are very 江南百景图 | 0 | 0 | S | M (real shadows are bluish) |
| 6 | **Kit swatch repaint with inner ink lines** (I) | high (tile rows, planks and joints are what reads as 工筆), but costs work | ±0.3, or +1–1.5 | 0 | M | M |
| 7 | Water: pale and dark streaks (K) | medium on river sections | +0.01 | 0 | S | L |
| 8 | Mist edge as dry brush, plus a title mist band on arrival (G, P) | medium | 0–0.06 | +0.02 | S–M | L |
| 9 | Ground mottle (O) | low-medium | 0 | +0.02 | S | L |
| 10 | Night with readable ground (F) | taste | 0 | 0 | S | M |
| 11 | No ink on ground and water via an MRT flag (B, part 2) | medium | 0 | saves time with MRT | M (with the perf session) | M |
| 12 | Colour bleed past lines (a 1-px colour offset in post) | low | 0 | +0.1 e | S | M (reads as blur) |
| 13 | Character retexture with ink folds (L) | medium | 0 (same size) | 0 | L, plus credits | H |

**The top five, with costs:**
1. **Ink sky:** 0 MB, ≈0 ms (measured), done.
2. **Palette:** 0 MB, 0 ms, half a day with review shots.
3. **Ink colour and width:** 0 MB, 0 ms, a few lines in `post.js`.
4. **Sky fixes** (mist column, panel sky): 0 MB, 0 ms, a few lines in `post.js` and `backdrop.js`.
5. **Shadows:** 0 MB, 0 ms, the KEYS table.

Together they move the whole frame (sky, key, hue, line, shadow) for no bytes and no frame time. Rank 6, the swatch
repaint, is the first one that costs real work and must hold the 2.1 MB budget.

**Perf context** (from `gen/perf/`, so these claims agree with it):
- On a phone at 4× throttle the page is **CPU-bound** at 11–23 fps: colour 28 ms, shadow 18 ms, normal 11 ms of CPU
  at crown; post only 0.56 ms.
- So every change here that adds no draw call and no pass costs nothing a phone can feel.
- Changes that add GPU work are only the sky (measured: none visible) and ranks 8, 9 and 12 (estimated
  0.02–0.1 ms).
- The ink pass itself measured 4–19% of GPU at 4K and 1080p (`ink_off` in `gen/perf/gpu_4k.log` and `desk_1x.log`). Tuning its colour and width changes none of that.
- Moving it to MRT (the perf proposal) removes the second geometry pass, and is where the "no ink on ground" flag
  should ride.

## 4. The true-colours rule, head on

**The conflict:**
- 江南百景图 sits on cream paper: town ground `#d1bd93`/`#d6bf93`, b +24; mist `#d7cdbd`; walls `#e5dbc1`.
- **Its skies are paper too.**
  - jn5's sky *is* the cream paper (`#dbd3c0`), with grey-beige strokes (`#cfc2af`).
  - jn4's is near-white paper (`#fbf6e3`) with pink washes.
  - So the user's favourite sky is, literally, a cream sky.
- Our rule (memory, `brief.md`): the world is the real Song town in real daylight, with no yellow cast and no paper
  stain over the 3D world.

**How to get the paper-and-ink feeling without yellowing the town:**

1. **Paper lives in the sky, the distance and the UI, not on the town.**
   - The ink sky takes jn5's *structure* (two tones, combed level strokes, 留白 above the horizon) but not its
     *colour*: the gaps are the hour's blue, and the strokes a deeper wash of it.
   - The cream stays out of the world sky. Whether the user wants jn5's cream literally is question 1.
   - Distance fades to a pale neutral wash.
   - Paper colour is allowed only in UI chrome: slips, panels, the sundial, the poem and title vignettes. The brief
     already allows it there.
2. **Line and wash live in the textures and the ink pass:** inner lines painted into the swatches, local-colour ink,
   flat grey shadow washes. None of these moves a colour's mean, because `palette.js` normalises every texture to its
   true-colour target.
3. **Hues move toward the mineral pigments, not toward sepia:** greens toward 汁綠 (bluer), red toward 朱砂, blue
   water toward 石青-grey, which it already is. A **hue map per material, never a global cast**: `warmth` and
   `stains` stay 0.
4. **The key rises, the yellow doesn't.** The ground goes from L 61 to 68 with b dropping from 13 to 11. Lighter, as
   江南百景图's and the concepts' grounds are, but greyer, not creamier. Trampled loess in April sun really is
   light.
5. **The checks:**
   - after any palette change, sample the shots: mean b* of the ground and plaster must not rise;
   - no surface's b* above +25 except straw, bamboo and gamboge accents;
   - the sky's day zenith stays blue (b* < −15).

**What stays open:** whether the ground may go lighter still (the concepts go to about L 85, near paper white),
whether night keeps a readable ground, and whether stars are gold. These are below.

## 5. Concept frames: what the whole world could look like

- **Files** (`concepts/`):
  - each frame is `<frame>_A_0.png` (gongbi line and wash, full true colour) and `<frame>_B_0.png` (lighter, more
    ink and 留白);
  - prompts are beside them as `<frame>_A.txt` and `<frame>_B.txt`; the batch is `jobs.jsonl`, the log `batch.log`;
  - the source screenshots are in `concepts/src/`;
  - quick comparisons: `ref_small/concept_<frame>.jpg` (source, A, B).
- **Frames:**
  - **`street_spawn`**: the inner-city street at the spawn, 10:00, third person; ref jn2.
  - **`bridge_west_a`**: the Rainbow Bridge from the south bank's west, first person; ref jn3.
  - **`country_willows`**: the great willows of the dyke (隋堤烟柳); ref jn1.
- **What they are:** made with gpt-image-2.5 through `tools/shyfai_image.py` (i2i: the screenshot as image 1, a
  江南百景图 frame as image 2), 1536×864. They show the target. **They are not assets** and break loyalty in places:
  - the street frame adds trees and hills at the end of the street;
  - the countryside frame invents a far shore;
  - the bridge frame redraws the arch's structure.
  Use them for the look only.

**Which visible differences the ranked changes reach, and which they don't:**

| Seen in the concepts (against our screenshots) | Reached by | |
|---|---|---|
| A high-key, light ground; low contrast overall | 2 (palette ground L 68), 5 (lighter shadows) | **yes**, partly: the concepts go paler (about L 85), which would read as paper (question 2) |
| Blue sky as a few flat wash bands, soft white cloud blocks, lots of empty sky | 1 (ink sky) | **yes** |
| Grey-blue tiles drawn row by row; plank seams; wall edges in fine ink | 6 (swatch repaint), 3 (ink colour) | **yes** near the camera. Inner lines blur into tone past about 30 m (mips); acceptable, since the concepts fade them too |
| Varied line weight and dry-brush breaks on bark and timber | 3 (break-up), 6 (bark paint) | **partly**: screen-space edges can't vary weight with stroke direction or pressure |
| Flat, soft, neutral grey cast shadows | 5 | **yes** |
| Washes with soft gradients inside each surface | 6 | **yes** (in the paint) |
| Colour bleeding slightly past lines | 12 | **partly**, at a small cost, with a blur risk |
| Distance fading into pale mist | N (fog tune), G | **yes** |
| Willow crowns as soft green washes with strands; first shoots | J (palette), existing cards | **mostly**: the cards are already painted; the hue moves with the palette |
| Clothing with ink folds and soft washes | 13 (retexture) | **not this round**: Meshy retextures of 35 characters cost credits and risk. The post ink gives silhouettes only |
| The painter's hand: slightly irregular, wobbling contours and geometry | — | **no**: a vertex-wobble or line-jitter shader is possible but risky (swimming lines) and not recommended |
| Invented detail (extra trees, far hills, a redrawn bridge) | — | **must not**: loyalty (`map/BUILDING.md`) |

## 6. Bugs and findings for other owners

1. **`post.js` mists sky pixels.**
   - A pale vertical column appears in the sky, with the default sky too, when looking along the scroll (east from
     the bridge at 06:40 and 10:00; north-west at night): see `sky_shots/base/c0640_sunrise.jpg`,
     `concepts/src/bridge_west_*.png`.
   - Cause: `mistAt()` rebuilds the far-plane point (300 m) for sky pixels, which lands outside the walkable area but
     inside the backdrop ellipse.
   - Fix: skip the mist where the depth sample is 1.0. One line, zero cost.
2. **Backdrop panels carry their own painted sky**, which shows as vertical seams against the dome at dusk
   (`sky_shots/base/c1730_afternoon.jpg`). Fix: H above.
3. **For the type and ui agents:**
   - the 2nd plaque word in jn1 reads **掃墓歸來** (the tomb-sweepers coming home), not 楊柳歸來
     (`gen/ui/fonts/notes.md` has the old reading; crop in `crops/plaques_jn1_jn3.jpg`);
   - the full place-name language of jn1–jn3 (region title in a mist block with a one-character 白文 seal; vertical
     plaques naming places **and the scroll's vignettes**, 縴夫拉縴 · 掃墓歸來 · 虹橋爭渡) is in `jiangnan_look.md`
     §10.
4. **"glGetProgramiv: Program object expected"** appeared in some screenshot runs of the ink page. A JS trace of
   every program call found no call on a deleted program. Likely Chrome-internal, during streaming plus screenshots.
   Watch for it in default runs.

## 7. Questions for the user

1. **The sky's colour: true blue or jn5's cream?**
   - The prototype `?sky=ink` v4 lays jn5's two-tone combed strokes and jn4's pink washes and flat red sun over the
     hour's true sky (`sky_shots/jn5_jn4_vs_ink_v4.jpg`, `sky_shots/compare_default_vs_ink.jpg`):
     - by day, a blue sky with deeper-blue strokes;
     - at dawn and dusk, pink;
     - at night, indigo.
   - jn5 itself is a cream paper sky with grey strokes.
   - Keep the true blue, as now? Go cream literally (it would read as a painted scroll, not as weather, and would
     break the true-colours rule for the sky only)? Or use cream only on the title, opening and map screens, which
     are UI?
2. **How light may the ground go?** I propose L 61 → 68 (lighter, slightly less yellow). The concept frames go near
   paper white (about L 85). That reads beautifully but starts to look like paper rather than earth.
3. **Night:** keep real darkness (now), or the painting's convention, where darkness lives in the sky band and the
   ground stays readable with lantern glows?
4. **Stars:** white specks (real) or soft gold dots (江南百景图's convention)?
5. **Shadows:** neutral grey washes (the painting) instead of the slightly blue shadows of a real clear sky?
6. **Texture repaint (rank 6):** approve a repaint of the ~12 shared kit swatches with inner ink lines? It keeps the
   2.1 MB budget, or up to +1.5 MB if line-heavy swatches need UASTC.
7. **Place names in mist:** should arriving at a section show its name in a drifting mist band with a seal, as in the
   江南百景图 shots? This is shared with the ui agent's notifications. The web study warns that this may have been
   the video uploader's edit, not the game.
