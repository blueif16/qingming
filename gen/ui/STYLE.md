# The ink UI: the standard

The UI's counterpart to `map/BUILDING.md`. Every screen element of the qingming world, now and later, follows this
file. It was set in the ink UI round (2026-10-12) from the user's ask, "check out the art style and the text style,
the text bubble's ink style … set up the overall language for our UI … the text fonts we want to use 古代繁体", with
江南百景圖 (`reference/jiangnan/`, study-only) and the scroll itself as the references.

**Where things are**
- Code: `web/src/ui/`: `ui.css` (tokens and every component's look), `ink.js` (brush frames), `components.js` (the
  components as DOM), `places.js` (banners, plaques, toasts), `talk.js` (prompt, name tags, bubbles), `loading.js`,
  `words.js` (every fixed word), `index.js` (`createUI`, what `world.js` calls), `kit.js` (the kit page).
- The kit: `web/ui.html` (every component on a still of the world; desktop and phone, day and night). It builds them
  with the same modules the world uses, and lifts the title screen out of `world.html`, so the two can't drift.
- Data: `sections/<name>/places.json` and `sections/<name>/talk.json`, checked and bundled by
  `node tools/ui_data.mjs build` into `web/public/assets/ui/places.json`, `talk.json`.
- Fonts: `gen/ui/fonts/CHOICE.md` (the type agent); `uv run tools/font_subset.py` after any new string.
- Shots and checks: `gen/ui/shots/ui_shots.mjs` (plans in `gen/ui/shots/plan_*.json`), `gen/ui/shots/kit_stills.mjs`.
- Records: `gen/ui/current_ui.md` (the UI before this round), `gen/ui/ui_progress.md` (what was done and measured).

## 1. The language in one paragraph

Paper and ink on top of the true-colour town. Words are written, not typed: vertical where they name a place, in a
brush hand, signed with a cinnabar seal. A place's name rises out of a drifting block of mist (江南百景圖's
「汴河漕運」); a landmark's name hangs over it on a white plaque on a string (their 茶棚, 石橋); a person's words come
on a slip of paper over their head, their role on a small vertical tag. The chrome is paper slips, brush-ringed paper
buttons and seals; nothing is glass, gradient or icon-font. Colour on the UI is three things only: ink, paper,
cinnabar. The 3D world behind keeps its true colours: no sepia or paper cast is ever laid over it (the standing rule
"true colours, not aged yellow"); only the UI's own slips are paper-coloured.

## 2. Materials (CSS tokens on `:root`, `ui.css`)

| token | value | what it is |
|---|---|---|
| `--qm-ink` | `#2a2420` | ink: text, frames, icons (also `scroll_hud.js` INK) |
| `--qm-ink-soft`, `--qm-ink-faint` | ink at 0.72, 0.38 | secondary text, glosses, credits |
| `--qm-cinnabar` | `#b5321e` | accents: the bead on a plaque's string, the dot under a name tag, "you" in the HUD |
| `--qm-seal` | `#ae3a26` | seal paste (measured from 江南百景圖's seal, `gen/ui/look/palette.json`) |
| `--qm-paper` | `#efe4cc` | paper slips: toasts, help, the HUD title, the volume slip (also `scroll_hud.js` PAPER) |
| `--qm-paper-hi` | `#f7efdc` | bubble paper, button faces |
| `--qm-mist` | `246, 241, 230` (rgb) | the white wash behind titles and prompts |
| `--qm-mount` | `#4e4033` | the scroll's mount (the HUD frame) |
| plaque paper | `#faf6ec`, ink `#1d1916` | the landmark plaques are white, as 江南百景圖's |
| `--qm-shadow`, `--qm-lift` | | the one shadow a slip casts (box-shadow / drop-shadow) |

**Night** (`html[data-night]`, set by `index.js` from the hour's light): the paper is lamp-lit, a little deeper
(`#e8d9b8`), with a firmer shadow so a slip holds against the dark street. The frames are regenerated in that paper.
Nothing else changes: ink stays ink.

## 3. Type roles (fonts: `gen/ui/fonts/CHOICE.md`; CSS `--qm-font-*`)

| role | font | token | use |
|---|---|---|---|
| display | `QM Display` (莫大毛筆 Bakudai, a 行楷 brush) | `--qm-font-title` | region names, plaques, toast names, seals, the prompt's 搭話, name tags |
| text | `QM Text` (霞鶩文楷 TC Medium) | `--qm-font-text` | bubbles, toast lines, help, the HUD's words |
| seal | `QM Seal` (霞鶩篆書) | `--qm-font-seal` | seal-script ornaments only (about 165 characters exist) |
| gloss | system Latin serif (Iowan, Palatino, Georgia) | `--qm-font-latin` | the English gloss in the help, keycaps |

- Display sits small in its em box: set it about 1.15× the size you'd give the text face, tighter
  (`letter-spacing: -0.06em`; vertical about -0.04 to -0.1em).
- Sizes: bubbles 18 px desktop, 15 px phone (13 px is the floor, for name tags); toast name 24 px / line 16 px;
  region name about 85 px desktop, 58 px phone; plaques 18 px / 15 px.
- Vertical text (`writing-mode: vertical-rl; text-orientation: upright`) for names: region titles, plaques, name tags,
  the title screen. Horizontal for anything you read as a sentence: bubbles, toast lines, help.
- After adding a string anywhere (`words.js`, `places.json`, `talk.json`), run `node tools/ui_data.mjs build` and
  `uv run tools/font_subset.py`. A glyph missing from a subset falls down the stack to a system 楷: it looks wrong
  but never breaks.

## 4. Ink frames: brush edges that stay cheap

- A frame is a **9-slice `border-image`** made from one small SVG: four hand-drawn strokes that overshoot their
  corners (`slipSvg`), one closed brush ring with a varying width (`bubbleSvg`), scallops for thought (`cloudSvg`), a
  brush circle for round buttons (`ringSvg`), a stamp's worn edge (`sealMaskSvg`). `ink.js` draws them once from a
  fixed seed and sets them as `--qm-frame-*` custom properties; they are redrawn only when day turns to night.
- Usage: `border: 12px solid transparent; border-image: var(--qm-frame-slip) 24 / 12px / 0 stretch;
  border-image-slice: 24 fill;` (the paper is inside the SVG, so the slip's paper edge follows the brush). Cloud:
  slice 32, `round`. The SVGs carry `width`/`height`: without an intrinsic size, `border-image` slices the image at
  the element's size and the frame falls apart.
- **Never** a live SVG filter (`feTurbulence`, `feDisplacementMap`) on anything that moves or is redrawn; it costs
  a phone a frame. A filter inside a static `<img>` (the brand seal, `assets/ui/seal.svg`) is rasterised once and is
  fine.
- Shadows: one `drop-shadow` per slip (`--qm-lift`), no blur stacks, no `backdrop-filter` outside the scroll HUD.

## 5. The components

Every component passes the **period-object test** before it is built: what would a person in Northern Song Kaifeng
have used for this? The answer is written next to it here.

| component | what | where (desktop / phone) | when | period object |
|---|---|---|---|---|
| **Title / loading** (`#loading`, inline in `world.html`) | paper, mist, the title (the logo once `assets/ui/logo_v.svg` exists), the 「上河」 seal, one ink stroke that draws across as the world loads, 展卷 | full screen | until the first section is in; then the paper wipes away right to left, like a handscroll unrolling | a handscroll being unrolled |
| **Region banner** | the region's name large and vertical in a drifting mist block, its seal under it, the sub-name a smaller column to its left, a brush rule | top left, beside the time instrument (under it on a phone) | on walking into a section of another region; about 3.8 s | a title slip on a painting, signed with a seal (江南百景圖's 「汴河漕運」) |
| **Landmark plaque** | a white vertical plaque with the name in black brush, on a dashed string with a cinnabar bead over the place | over the landmark, in the world | the nearest three landmarks within 30 m that are in view and not behind a wall | a shop's hanging signboard (招牌), 江南百景圖's plaques |
| **Landmark toast** | a paper slip: the landmark's seal, its name in display brush, one line from the painting's reading, and under a fold (R 詳 / a tap) the long text, a quote and its sources (§15) | top right (below the scroll button on touch screens) | on coming within r m of the landmark; about 9 s folded, 16–45 s unfolded, held while the pointer rests on it; one at a time | a note slipped into the scroll at that place |
| **圖志 journal** (J, the 志 seal on touch, the settings' 圖志 row, the toast's foot) | an album leaf: the whole scroll inked in where you have been, the leaves as seals, each region's text and its landmarks with the painting's crop (§15) | centre, over a mist | until J or Esc | a 冊頁 album of the places, with the colophons |
| **HUD marks** (`scroll_hud.js` `decorate`) | a small cinnabar seal on each landmark reached, named on hover; a cinnabar tick on the strip | on the painting | while the scroll HUD is open | a collector's seal on the silk |
| **Interaction prompt** | desktop: an ink E keycap and 搭話 on a mist pill; touch: a cinnabar 談 seal to tap, 搭話 under it | over the host's head | within 3.2 m of a talk scene's host, facing it (60°), host on screen | (a gesture: no object) |
| **Name tag** | a small vertical paper slip with the role in period words (待詔, 稅吏, 說話人), a cinnabar dot under it | on the bubble's left shoulder | while that figure's bubble is open | a name slip (簽條) |
| **Speech bubble** | paper with a brush ring and a curled tail; glyphs step in three stop-motion frames each | over the speaker's head | a talk beat; at most two open at once | a slip of paper (the scroll has no words, so this is the reader's aid) |
| **Thought bubble** | the same on scalloped cloud paper, two small paper dots for a tail | over the thinker's head | a `think` beat | as above |
| **Help** | a paper slip: keycaps, 繁體, a small English gloss; the ElevenLabs credit | bottom left | open on the first visit until you have walked a while (§14), then folded into its 說明 seal; H, `?`, the seal or the settings' 說明 row open it again | (controls: no object) |
| **Time instrument** (`ui/time.js`, `time.css`; round 2, `gen/ui/r2_time.md`) | 晝夜卷 and its 時牌: a paper slip with an ivory tablet naming the 時辰 (巳時) in 楷, a small mounted handscroll of the day's painted sky under a cinnabar thread (sun or moon at its true height, the twelve 時辰 on its ruler, read right to left), and a row: the reading (巳正初刻; after dark the watch, 二更三點), the pace word (今 · 靜 · 緩 · 常 · 疾) and, when the hour isn't yours, the 歸今 seal. Drag the scroll to set the hour; double-tap or 歸今 returns to your clock; T takes the keys | top left (`--qm-dial-w` × `--qm-dial-h`: 236 × 100 desktop, 180 × 82 phone) | always | the Song court's ivory hour tablets (時牌) and the sky itself, as a handscroll |
| **Bell and volume** (`sound.js` `#soundCtl`) | a paper button with a brush ring and an ink bell (faded when off); the volume as a paper slip with an ink track and a seal for its knob | bottom right | only while the scroll HUD is open (round 2: off the street; the settings' 聲音 page has both) | a bronze bell; a seal sliding on a ruled slip |
| **Scroll button** (`.sh-open`, touch) | paper button, brush ring, scroll icon | top right | always on touch screens | the handscroll |
| **Scroll HUD chrome** (`scroll_hud.js`) | title slip 「清明上河圖」 + the region's 繁體 name, brush-ringed buttons, 繁體 hint with a gloss, 故宮博物院藏 credit | as before | Space / the scroll button | the scroll on its mount |
| **Tuning panel** (lil-gui) | recoloured to paper and ink (`--background-color` etc.) | top right, HUD only | only with `?tune=1` or the settings' 完整調校面板 row; H in the HUD | (a developer tool) |
| **View switch, ›** (`ui/hud.js`) | two ink tiles (eye, figure; the chosen one sealed) and a brush-ringed › | under the time instrument (beside it on a phone) | always | §14 |
| **Settings screen** (`ui/settings_screen.js`) | Battlefield's layout in paper and ink: seals for pages, a ruled sheet of rows, a description slip | full screen, the list left | O or › | §14 |
| **Stats** (`#stats`) | debug only: hidden unless `?stats=1` (still written every 0.5 s: the tools read its text) | top left | `?stats=1` | (none) |
| **Crosshair** | an ink dot on a paper halo | centre | mouse captured | (none) |

**The life layer (built in the details pass, 2026-10-13; record `gen/life/progress.md`, code `bubbles.js`,
`chatter.js`, `marks.js`, `talk.js`):** the three distances of `gen/life/design.md`. **Opt-in with `?talk=1` until the
user signs it off;** without it the page keeps the ink UI round's six press-E scenes and nothing else of this layer.

| component | what | where | when | period object |
|---|---|---|---|---|
| **Earshot chatter** | the painted groups' own exchanges, as the speech and thought bubbles above (name tag and all) | over each speaker's head | a group within the tier's `wakeM` keeps talking (turn-taking, quiet gaps, alternatives never repeated); a line is drawn only when its speaker is within `showM` (≈ 10 m) and on screen, nearest first | as the bubbles |
| **Bark** | a lone figure's word now and then (a hawker's cry, a porter's grunt, a sleeper's thought); a `close` bark calls to you once as you come near | over its head | rare: every 45–120 s while you are within `barkM` | as the bubbles |
| **Intent mark** | a small paper disc in a brush ring with an ink pictogram (cash coin, steelyard, bow, manifest, Zzz, !?, cup, sack, book, boat, voice, sprig, fan, wheel, rope, bowl) | over the speaker of a group whose exchange is playing, seen from beyond earshot (`showM` < d ≤ `wakeM`), not behind a wall | at most the tier's `marks` (0 / 4 / 6), nearest first | a painted thing of the scroll, as on a shop's sign |
| **Heard note** | a small paper slip: the 聞 seal, a plot line's title in display brush, 記入圖志 under it | bottom centre | the first time a step of a plot line is overheard, about 4 s | a note slipped into the album |

- **Two bubbles at most, shared:** the near talk and the street use one pool (`bubbles.js`); the near talk wins (it
  takes a chat slot; chat never takes its slot); the tier's `chatterOpen` (1 low, 2 mid/high) caps the chat bubbles.
  While a near talk, the journal or the settings are open the street goes on silently.
- **Calm by subtraction:** at most one new chat bubble every 0.8 s; gaps between exchanges per group (10–30 s), ×1.8
  at night and ×`gapScale` on the light tier; barks every 45 s or more.
- **Lines fit the body:** a figure whose clip is asleep only thinks; `when` ties a line to a clip of its cycle.
- **Who you play** (settings 扮作; world setting `avatar` → a kind: 官 guan, 士 shi, 僧 seng, 婦 fu, 童 tong, 軍 jun,
  力 li, 民 min): a beat's `as` gives its line for a kind, `only`/`not` keep beats for kinds; the next talk with the same
  host plays its `again` set.
- **Chinese plus English** (the user, 2026-10-13): every talk string has an `_en` gloss; with `prefs.lang` `zh_en` it
  shows under the Chinese in the bubble (italic Latin serif, the role first) and in the journal's plot lines.
- **Tiers** (`gen/details/tier_contract.md`): `tiers.js` `detail.talk` = `chatterOpen`, `marks`, `scanHz`, `wakeM`,
  `showM`, `barkM`, `gapScale`; `applyTier` re-scales live (counts × detailScale, never below one bubble); the
  scheduler runs at `scanHz` (≤ 10), per frame only the open bubbles' and marks' projections.
**Next step (not built yet):**

- **Visited places on the scroll HUD:** a small cinnabar dot on the HUD strip for each landmark whose toast you have
  seen this session (cheap: `places.js` already keeps `m.last`).
- **The opening animation** grows out of the title screen: its layers (`.ld-paper`, `.ld-mist`, `.ld-mark`,
  `.ld-stroke`) are what it animates, and `Loading.done()` is where it starts. Later: the logo brushes itself in,
  the seal stamps, the paper unrolls right to left over the first view of the street. 江南百景圖's key art adds
  scattered 閑章 seals, 祥雲 wisps and a vertical poem in a corner (jn1, jn5): candidates for that opening, not for
  the walking UI.

## 6. Motion

- **Ink bleeds in** (`qm-bleed`: opacity with a 3 px blur clearing, 260–500 ms) for small text: toast lines, the
  prompt. **A brush wipes** (`qm-wipe-x` / `qm-wipe-y`: a `clip-path` inset opening along the writing direction,
  360–700 ms) for names: region titles, plaques, tags, toast names. **A seal stamps** (`qm-stamp`: from 1.7× and -11°
  to 0.93× then 1×, 240–260 ms) for every seal, after its name. **A bubble pops** (`qm-pop`, 380 ms, a little
  overshoot), its glyphs stepping in three stop-motion frames (Messenger's reveal: about 30% of the reading time).
- Leaving: fade with a slight blur (`.qm-out`, 600 ms; bubbles 400 ms).
- Mist drifts (`qm-drift`: a 36 px transform over 9 s). Only transforms and opacity animate on anything large.
- All durations sit in 150–700 ms (`--qm-t-fast` 160, `--qm-t-mid` 320, `--qm-t-slow` 600).
- **`prefers-reduced-motion: reduce`:** every animation becomes a 150 ms fade; glyphs appear at once; the loading
  wipe becomes a 300 ms fade.

## 7. Sound hooks

- Reuse what exists; add no new files for the UI. The page passes `sfx(name, gain)` (world.js: `sound.voice(name,
  { group: 'ui' })`, only once sound is on).
- `bubble_tap` (`sounds/core.json`, "a soft paper tap"): each bubble that opens (0.8; a thought 0.5), the seal
  landing on a region banner (0.55) and on a toast (0.45). The first prompt warms it (a silent play).
- `scroll_unroll` stays the HUD's (`sounds/rules.json` `ui.hud`). The bell and M stay `sound.js`'s.
- Voices: none yet. The user rejected ElevenLabs' Chinese voices; real lines wait for a provider. When they come,
  a line's audio starts with its bubble and the bubble stays until both the reading time and the audio end.

## 8. Language

- Everything a player reads is **繁體** (Taiwan-standard forms as the fonts draw them: 裏, 著, 說). Names and lines come
  from the painting and its readings; every one cites its source in the data (`src`). Period terms for roles (a
  barber is 待詔, a storyteller 說話人; no invented personal names unless a reading gives one).
- **English** only as a small italic gloss in the controls help and the HUD hint, so a non-Chinese player can play,
  and in `title` / `aria-label` text. Talk, banners, plaques and toasts have no English. (Whether to keep the gloss is
  a question for the user.)
- `tools/ui_data.mjs check` fails on simplified characters (a guard list of the common ones), Arabic digits, missing
  sources and over-long lines (names ≤ 6–7, toast lines ≤ 16, bubble lines ≤ 16 characters).
- Bubble lines are short Song vernacular (not modern slang, not classical prose), 1–2 lines on screen.

## 9. No numbers

- No digits anywhere a player looks: no counters, distances, times, percentages or progress numbers. Progress is an
  ink stroke; time is the 時牌 and the painted day (the time instrument); sound level is a slip with a seal.
- Chinese numerals inside speech are speech (「三枝十文」), not UI.
- The round-1 exception is gone: the time instrument's hover title is words only (巳正初刻 · 今 · your own time).

## 10. Layout

- **Desktop:** the time instrument top left; region banner beside it (from `--qm-dial-w`); toasts top right; help (or its seal) bottom left; bell
  bottom right; plaques, prompt and bubbles in the world.
- **Phone (≤ 640 px):** the same corners, smaller (time instrument 180 × 82 px, the region banner under it; banner at 11 px base size; toasts under the scroll
  button, at most `100vw - 108px` wide, so they never reach the instrument); bubbles 15 px, at most 13 em wide.
- **Safe areas:** every corner offset is `env(safe-area-inset-*) + 14px` (10 px on phones); `world.html` has
  `viewport-fit=cover`.
- **Stacking:** world UI `.qm-ui` 800 < time instrument 805 < view tiles and › 806 < help 810 < scroll HUD 900 < bell 950 <
  settings screen 960 < loading 1000. The HUD covers the walking UI, which stops updating while it is open (the page
  stops drawing). The settings screen and the scroll HUD never open together. Round 2's direct HUD layout: §14.
- **Collisions avoided by rule:** the banner owns the top while it shows (toasts wait; a toast already up goes back to
  wait or ends; no plaque hangs over it); the banner and toasts are never in the bottom corners; bubbles are clamped
  inside the screen (a bubble's top stays below 112 px on desktop, 150 px on a phone) and two open bubbles are pushed
  apart, or the older one stacked above, or, on a phone with no room above, only the newer one shown;
  at most two bubbles, three plaques and one prompt are anchored at once.

## 11. Performance rules

- DOM overlay only: no WebGL for UI, no canvas redraws per frame.
- Updates happen on change. The only per-frame work is the transform of anchored elements (bubbles, the prompt,
  plaques): one `Vector3.project` and one `style.transform` each, `translate3d`, no layout reads. The searches (a
  host to talk to, which plaques to hang, landmark distances, the region) run every 0.12–0.25 s.
- At most **6 anchored elements** (2 bubbles + their tags, 1 prompt, 3 plaques), plus the intent marks of the tier
  (`detail.talk.marks`: none on low, 4 mid, 6 high; one projection each). The chatter's scheduler runs at the tier's
  `scanHz` (3–4 a second) over the loaded sections' groups (a distance each), never per frame. A plaque's wall test is
  one BVH ray per candidate per check; a mark's likewise.
- Animate only `transform`, `opacity` and `clip-path` on large elements; a blur only on small text, once.
- Budget: the UI's script time under 0.1 ms a frame on a desktop; its first-load download (CSS, JS, the title
  screen's markup and the core font) under 60 KB; the full font set under 250 KB. Measured numbers are in
  `ui_progress.md`.

## 12. Data

**`sections/<name>/places.json`**
```json
{ "region": { "id": "chengmen", "name": "城門", "sub": "東角子門", "seal": "門", "src": "…" },
  "landmarks": [ { "id": "S5.str.gate_tower", "name": "城樓", "line": "樓內架著一面大鼓，暮時擊鼓。",
                   "seal": "樓", "r": 7, "top": 18, "src": "…" } ] }
```
- `region.id` groups sections into one region (S4 and S4b are both 城門口外, so no banner between them).
- A landmark's `id` is its map ID; its position, footprint and plaque height (`top`, else the measured eaves + 2.5 m)
  come from `layout.json` through `ui_data.mjs`. `r` is the toast radius from its footprint.
- Trigger rules: a landmark fires on entering r, re-arms only after you leave `r × 1.5 + 3` m, and waits 240 s before it
  can fire again; a region is not announced again within 120 s; one toast at a time, two waiting at most.

**`sections/<name>/talk.json`** (the life pass; the full format is the header of `tools/talk_data.mjs`; the model is
`sections/outer_road/talk.json`)
```json
{ "scenes": [ { "id": "V4.1", "title": "懶兵候主", "title_en": "The Idle Soldiers", "host": "box", "reading": "…",
    "roles": { "box": { "fig": "soldier_behind_box_11580", "name": "軍士", "name_en": "soldier", "src": "…" } },
    "beats": [ { "who": "box", "say": "看甚麼？公文還沒下來。", "say_en": "…", "src": "…",
                 "as": { "guan": "官人可是來催公文的？" }, "as_en": { "guan": "…" } } ],
    "again": [ { "beats": [ … ], "step": "tax.3" } ] } ],
  "chatter": [ { "id": "c4.courier", "title": "…", "mark": "zzz", "gap": [14, 32], "roles": { … },
    "exchanges": [ { "beats": [ { "who": "stool", "say": ["差官還不出來？", "日頭都快晌午了。"], "say_en": ["…", "…"], "src": "…" },
                                { "who": "lying", "think": ["呼……"], "think_en": ["Zzz…"], "optional": true, "src": "…" } ],
                     "linked": false, "step": null } ] } ],
  "barks": [ { "id": "b4.teller", "who": { "fig": "fortune_teller_12232", "name": "賣卦先生", "name_en": "…", "src": "…" },
    "close": true, "every": [40, 80], "say": ["客官，看命？決疑？"], "say_en": ["…"], "src": "…" } ] }
```
- `fig` is a painted figure's slug in that section's `people.json`; a figure carried by another (`carried_by`) speaks
  from over its carrier's head. `optional: true` skips a beat whose speaker is off screen. 2–6 beats for every kind of
  player.
- `sections/world/talk.json`: `kinds` (avatar → kind) and `threads` (the plot lines: `id`, `title`, `lead`, `steps`
  with `section` and `note`, each with `_en`); a scene, `again` set, exchange or bark carrying `step` tells it.
- Timing: a line stays `max(2.2, 1.0 + characters / 5.5)` s (+1.2 s with English); in a near talk E (or a tap on a
  bubble) first shows the whole line, then the next; Esc or walking 6.5 m from the host closes it.

## 13. Checks

- `node tools/ui_data.mjs check` (data), `uv run tools/font_subset.py --check` (glyphs).
- The life layer: `node tools/ui_data.mjs build` → `uv run tools/font_subset.py` → `node tools/ui_data.mjs check`
  (talk_data's checks: speakers placed and painted, sources, lengths, English glosses, sleepers only think, clips,
  kinds, plot-line steps told, every glyph in a subset); `tools/chrome_slot.sh node gen/life/life_check.mjs <tag>`
  (bubbles sampled at the standard views: at most two open, no two overlapping; lines and steps heard; every near talk
  by three kinds of player and twice); `gen/life/life_cost.mjs` (the phone proxy at the low tier, chatter off/on A/B).
- `tools/chrome_slot.sh node gen/ui/shots/ui_shots.mjs <out> gen/ui/shots/plan_after.json` (every component in the
  world, desktop and phone, day and night) and `plan_kit.json` (the kit). Look at them: legibility, overlap, style.
- `window.__test.ui` on the world page: `banner(folder)`, `toast(id)`, `talk(sceneId)`, `next()`, `close()`,
  `help(open)`, `heads(sceneId)`, `state()`, `cost()`.
- The direct HUD and the settings screen: `tools/chrome_slot.sh node gen/ui/shots/r2_settings/settings_interact.mjs`
  (real keys, clicks and touches; it puts back every setting it changes), shots `gen/ui/shots/r2_settings/plan_r2.json`,
  cost `gen/ui/shots/r2_settings/settings_cost.mjs`; `window.__test.ui.settings`: `open(cat)`, `page(cat)`,
  `select(id)`, `close()`, `state()`.
- The page's regression (`gen/expand/round2/page_qa/regress.sh`) and `tools/sound_web.mjs check` after touching shared
  files; the cost run (`ui_progress.md`, "Cost") after anything that adds per-frame work.

## 14. The direct HUD, the settings screen, the help (round 2; record `gen/ui/r2_settings.md`)

The user (2026-10-12): "leave only the time related setting + first/third person switch on direct hud, can have a right
arrow and place else stuff there, settings be space and not in row form like this, think [Battlefield's advanced
settings screen], we have more spacings and we keep the exact ink style"; "for the few settings we point out, like 1/3
person, we can have icon/container based switch so they just click". Reference: `reference/settings_battlefield_ref.png`
(its layout and spacing, never its colours).

**The direct HUD** (`ui/hud.js`, `hud.css`): what stays on screen while you walk. Nothing else may join it without the
user.

| element | look | where (desktop / phone) | period object |
|---|---|---|---|
| the time instrument (`#dial`) | the time agent's (`ui/time.js`) | top left | (see the time agent's section) |
| **view switch** | two 40 px tiles (36 on a phone): an eye (first person) and a robed figure from behind with its shadow (third person), brush strokes from `ui/icons.js`; idle tile: paper in a slip frame, ink at 0.62; chosen tile: **sealed** (cinnabar ground, paper ink, the stamp's worn edge, tilted 3°). One click switches; V still works | under the instrument / right of it, centred on it | a seal stamped beside the chosen one (the choice is ours: a camera has no Song object) |
| **›** | a paper disc in a brush ring with a brush chevron; opens the settings (O) | after the tiles | the help seal's and the scroll button's kin |
| 說明 seal (H), the journal's seal (J, lore) | as §5 | bottom left | |
| scroll button (Space) | as §5 | top right, touch only | |

- **Moved off the street:** the bell and the volume (the settings' 聲音 page; they still show beside the painting while the
  scroll HUD is open, where `tools/sound_web.mjs` checks them); M still mutes. The lil-gui panel (below).
- **Kept on the street:** the 說明 seal and the scroll button are navigation, not settings, and on a phone they are the
  only tap targets for H and Space.
- **Placement:** from the instrument's footprint, `--qm-dial-w` / `--qm-dial-h` (set by `time.css`), never from fixed
  numbers. Nothing sits over `#dial`'s box. Desktop: `top: var(--qm-top) + var(--qm-dial-h) + 8px`. Phone: right of the
  instrument, vertically centred on it (the region banner goes under the instrument there, and the landmark toasts below
  it: a toast reaches under a 186 px instrument).
- Nothing per frame: the tiles repaint on a click and on a half-second check (V and the tools change the view too).

**The settings screen** (`ui/settings_screen.js`, `settings.css`, words in `settings_words.js`): O or ›; Esc, O or 返回
close it.

- **Layout** (Battlefield's, in paper and ink): the title 「設定」 top left in the display brush, beside the category seals
  between Q and E keycaps; the page's name over a ruled paper sheet; one setting per row (64 px tall on a desktop, 54 on
  a phone), the label left (20 px 繁體, an English gloss under it), the value right; the keys under the list (↑↓ 選擇,
  ←→ 調整, Enter 開關, Q E 換頁). The **description slip** sits right of the list (under it on a phone): the setting's
  name, what it does in 繁體 and in English, a brush rule, its **cost** (a 耗費 seal, a word: 不耗費 / 極小 / 小 / 中 / 大,
  and a sentence about phones, from `gen/perf/proposal.md`), and the Esc keycap 返回.
- **The sheet** is ruled as Song manuscripts rule their paper (朱絲欄): a faint cinnabar line between rows. The highlighted
  row gets a brush frame in brighter paper (`--qs-frame-row`, `slipSvg` seed 57) and a cinnabar diamond at its left.
- **Categories** are seals of two stacked glyphs: 朱文 (red strokes on paper) idle, 白文 (paper strokes on red) chosen:
  時辰 time · 視角 view · 聲音 sound · 介面 interface · 畫面 display · 進階 advanced. A non-square seal takes the stretched
  mask `--qs-seal-mask` (the 40 px `--qm-seal-mask` keeps its aspect and would cut a tall seal to a square).
- **Values:** named steps between brush chevrons, with dots for where the step sits; a switch (a slip with a seal for its
  knob: pale ink on the left 關, cinnabar on the right 開, the word and a gloss beside it); a brush slider (the loading
  stroke, pale, inked up to a seal knob); the view tiles; a slip button (打開, 還原).
- **No numbers:** paces are 靜 緩 常 疾 (今 while you follow your clock; the time agent's table), sharpness 粗 中 細 精,
  hours 子初 … 亥正 with a gloss that names the part of the day, costs are words, sliders have no scale. The full
  lil-gui panel (English, numbers) is the developer's: it shows beside the painting only with `?tune=1` or the 進階 row
  完整調校面板 (which puts `?tune=1` in the address); H hides it there.
- **Behaviour:** the world keeps drawing behind the screen, so a change shows at once (Battlefield's screen sits over its
  live scene; measured: no cost above the noise, below); you stand still (`player.frozen`); the mouse is free; closing
  with O asks for it back (a key is a user gesture, as Space for the scroll HUD); Esc and 返回 leave it free (click to
  walk). While it is open it takes every key but M and V (which still work and repaint it); Space is inert there (it is
  the scroll's key outside); the scroll HUD and the journal can't open over it, nor it over them.
- **Wash:** a mist over the left of the street (0.84 → 0 across 78 % of the width by day, thinner after dark); a phone is
  one column on mist 0.9 with a 返回 button and no keycaps.
- **Wiring:** world settings only through world.js's `setSetting(k, v)` (createUI `o.settings.set`: the panel's rules,
  saved per page, then `onSettingChange`); time only through the time agent's `o.time`; UI prefs through `prefs.js`;
  sound through its own `setOn` / `setVolume`.
- **Adding a setting:** an entry in `specsOf()` (kind: toggle, step, slider, tiles or action; get / set; `disabled()`
  returning a reason) and one in `SW.rows` (label and gloss, `zh`, `en`, `cost`, optional `costZh` / `costEn`).
- **Cost and size:** the screen is a lazy chunk (13.4 KB gzip, fetched at idle 8 s after the world shows) with a lazy
  font subset of its own (`text-settings.woff2`, 56.6 KB, only when it first shows); the direct HUD adds about 3 KB gzip
  of JS and CSS at first load.

**The help** (`components.js` `helpPanel`, rules in `index.js`): open on the first visit until you have walked a while
(at least 25 s and 12 m, or 75 s), then folded into its 說明 seal for good (`prefs.helpSeen`; any fold counts). Later
visits start folded, the seal stamping in once after the paper wipes. H (or ?), the seal, or the settings' 說明 row bring
it back. It lists every key: WASD, Shift, 滑鼠, 滾輪, V, E, T (time), Space, J (journal), O (settings), H, M, Esc; on touch
the thumbs, the view tiles, the scroll button, 談 and ›.

**Keys** (check here before adding one; every key has a tap target on touch):

| key | does | tap target |
|---|---|---|
| WASD / arrows, Shift | walk, run | left thumb |
| V | first / third person | the view tiles |
| E | talk | the 談 seal |
| T | the time instrument (time agent) | the instrument |
| Space | the scroll HUD | the scroll button |
| J | the 圖志 journal (lore agent) | its seal, the settings' 圖志 row |
| O | settings | › |
| H (or ?) | help | the 說明 seal, the settings' 說明 row |
| M | sound on / off | the settings' 聲音 page |
| R | open a landmark toast's long text (lore agent) | a tap on the toast |
| Esc | release the mouse; close a conversation, the settings, the journal | 返回 |

## 15. Lore: the toast's fold, the 圖志 journal, the HUD marks (round 2; record `gen/ui/r2_lore.md`)

- **Texts.** Every landmark and region has a `long` text in `places.json` (landmark 90–220 characters, region 140–320):
  modern prose with a Song flavour that says what the painting shows there, what scholars read in it, and where they
  disagree (one clause, the choice recorded). A `quote` is copied exactly from a source in `gen/ui/lore/sources/`
  (`quoteSrc` names it); `cite` is the sources as the player reads them (據…); `longSrc` holds one note per claim and is
  never shown. Outside quotes and names the long texts carry no numerals (`ui_data.mjs` checks it: 三…萬 fail; 一, 兩
  pass as words).
- **The fold.** Name in display brush, short line, then the fold: hidden until R, a click or a tap opens it, or
  `prefs.expandDescriptions` opens every toast. Its long text comes from `assets/ui/lore.json`, fetched on the first
  unfold (or ahead when `expandDescriptions` is on); its glyphs live in the lazily fetched `*-lore.woff2` subsets
  (`roles.json` `lazy.lore`), so a folded toast costs no font and the first load does not grow.
- **The journal.** A lazy chunk (`journal.js`, `journal.css`, `journal_words.js`). Leaves west to east as the strip
  lies: 題跋 (the colophons, mounted after the painting, so at its left end), the seven regions, 見聞 (the talk heard), 印譜 (the interactions: a seal stamped for each
  the first time it is done, a faint blank till then; interact.js, 2026-10-13).
  A place not reached is a faint empty leaf with 未至; progress is only the strip inked in round each landmark reached.
  Crops: `tools/place_crops.mjs` (480 × 320 webp, about 19 KB, `loading="lazy"`).
- **Discovery** is `prefs.discovered` (landmark IDs, `r:<region>`, `t:<scene>`) and `prefs.lastPlace`, kept even when
  the place notes are off.
