# Ink UI round: the ui agent's record

Brief: `gen/ui/brief.md` (the user's ask, standing rules, ownership). Standard written this round: `gen/ui/STYLE.md`.
The UI before: `gen/ui/current_ui.md`. Shots: `gen/ui/shots/` (`before/`, `after/`, `kit/`, `probe/`, `ref_small/`).

## 2026-10-12 evening

### What was done, in order

1. **Read** the brief, design, vignettes, Messenger's dialogue notes, `map/BUILDING.md`, the code of every UI element
   and every tool that reads one. Downsized the references to `gen/ui/shots/ref_small/` (and, after the lead's
   correction, jn4-6 and two crops: `crop_jn1_plaques.jpg`, `crop_jn2_title.jpg`). A web search for 江南百景圖's
   in-game UI (dialogue boxes, bubbles, name plates) found nothing usable in two tries; nothing was saved under
   `reference/jiangnan/ui/`.
2. **Before shots** (`gen/ui/shots/before/`, desktop 1920 × 1080 and phone 390 × 844 touch, day and night, the HUD)
   and **`current_ui.md`**: every element, its look and position, its code, and the tools that read it. The contract
   that matters: `#loading` must be gone (or lose its id) before `window.__test` is set, or `bench_page`/`check_page`
   call the load failed; `#stats` must keep being written; `#soundCtl .bar`, `.sh-*` and `.lil-gui` are read by
   `sound_web`, `hud_interact` and the shot tools.
3. **Data** (`sections/<name>/places.json` × 8, `talk.json` × 3), every name and line in 繁體 with its source, and
   `tools/ui_data.mjs` (check + bundle to `web/public/assets/ui/places.json`, `talk.json`, and the glyph list
   `web/src/ui/strings.txt`). Checks: map IDs exist, talk figures are placed by `people.json`, every beat cites a
   reading, no simplified characters (guard list), no Arabic digits, short lines. **PASS**: 8 sections, 7 regions,
   30 landmarks, 6 scenes, 26 beats.
4. **The UI modules** (`web/src/ui/`): `ui.css` tokens and components; `ink.js` brush frames (9-slice SVGs, seeded);
   `components.js`; `places.js`; `talk.js`; `loading.js`; `words.js`; `index.js`; `kit.js` + `web/ui.html`.
5. **The world** (`world.html`, surgical hooks in `world.js`, `scroll_hud.js`, `sound.js`; list below).
6. **Fonts:** the type agent's `CHOICE.md` landed at ~21:35. Wired `assets/ui/fonts/fonts.css` in `world.html` and
   `ui.html`; the tokens now use `QM Display` (Bakudai brush) and `QM Text` (霞鶩文楷 TC Medium); the brand seal
   `assets/ui/seal.svg` (「上河」) is on the title screen. Reran `uv run tools/font_subset.py` after the strings: 181.1 KB
   total (budget 250), core 17.2 KB (budget 60), no glyph missing.
7. **The lead's correction** (21:40): jn1-3 are a 江南百景圖-style 清明上河圖 map. Took from it: the **region title**
   now sits top left beside the sundial, written vertically inside a drifting mist block with its seal under it
   (「汴河漕運」, 「虹橋」); the **landmark marker** is now a **white vertical plaque on a dashed string with a red bead**,
   hanging over the place as you approach (茶棚, 石橋), and the corner toast stays as its echo.
   - **Why both:** the plaque is the reference's own language and tells you what you're looking at from across the
     street, with no words beyond the name; the toast carries the one line from the painting's reading (too long
     for a plaque) and gives the "you have arrived" moment the user asked for ("Steam-style notifications"). The
     plaque costs a projection per frame for at most three; the toast nothing per frame.
   - Plaques hide behind walls (one BVH ray per candidate per check) and never hang over the banner.
   - jn4-6 (official art: 行草 logo with a small seal, scattered 閑章, 祥雲, a vertical poem) went into the standard
     as material for the opening animation, not for the walking UI.
8. **Kit stills and kit shots** (`gen/ui/shots/kit_stills.mjs` → `web/src/ui/kit/`; `gen/ui/shots/kit/`), **after
   shots** in the world (`gen/ui/shots/after/`), fixes from looking at them (below), checks and costs.

### Fixes found by looking at the shots

- Bubbles rendered one glyph per line: an absolutely placed box in a zero-width anchor shrinks to its min-content.
  `width: max-content` on `.qm-say`, `.qm-toast`, the help slip.
- Every brush frame fell apart: an SVG with no `width`/`height` has no intrinsic size, so `border-image` sliced it at
  the element's size. The SVGs now carry their size (recorded in STYLE.md §4).
- The banner's seal sat on the sub-name's last glyph (東角子門 read 東角子); at night the sub-name sank into the dark
  street. New grid, a mist halo on the sub-name, a wider wash.
- Two open bubbles overlapped (稅吏 and 貨主 at the tax office). `talk.js` now pushes them apart along x (sizes read
  once per line, never per frame), or stacks the older one when they are too far apart to share a row.
- A banner and a toast could both be up (only through test hooks, but on a phone they collide): the banner now owns
  the top; a fresh toast goes back to wait, an old one ends.
- The first frame of a new bubble, prompt or plaque showed at the screen's corner: anchors start hidden until placed.
- The phone HUD title ran out of room: the region's name only on narrow screens.

### Edits to shared files (all surgical; nothing else in them touched)

| file | edit |
|---|---|
| `web/world.html` | `lang="zh-Hant"`, `<title>清明上河圖`, `viewport-fit=cover`; the fonts.css link; the `#loading` rule replaced by the title screen's inline CSS; the `#loading` markup (paper, mist, title, seal image, the stroke SVG drawn once and reused with `<use>`, 展卷). The other inline rules (`#help`, `#stats`, `.sundial`, `#crosshair`) are left and overridden from `ui.css`. |
| `web/src/world.js` | `import { createUI }`; `const ui = createUI({...})` + `hud.titleFor` after the help text; `ui.frame(dt)` in `tick()` before the render; `ui.progress()` at three milestones; `$('loading').remove()` → `ui.loaded()`; `ui: ui.test` in `window.__test`. The old English help text stays as the fallback content of `#help` (replaced by the UI at once). |
| `web/src/scroll_hud.js` | the section title takes `this.titleFor?.(…)` first (the 繁體 region name); `ICON` exported for the kit. The chrome's look comes from `ui.css` (`html .sh-*` selectors), its hint and credit text from `index.js`, so the file's CSS string is unchanged. |
| `web/src/sound.js` | `paintBell()` sets `bell.dataset.on` so the CSS can fade the bell when off. Look from `ui.css` (`html #soundCtl …`). |
| `web/src/people.js`, `crowd.js`, `sundial.js`, `daylight.js`, `settings.js` | not edited. Figures are found read-only (`sec.persons`, `p.id`, `p.root`, `p.model`, `p.clip`); the sundial is framed from CSS. |

New files: `web/src/ui/*` (+ `kit/` stills, dev-only), `web/ui.html` (dev-only: not in `vite.config.js`'s inputs, so it
never ships; its stills are under `src/`, not `public/`), `web/public/assets/ui/places.json`, `talk.json`,
`sections/*/places.json`, `sections/{gate,inner_city,outer_road}/talk.json`, `tools/ui_data.mjs` (new tool, outside
the brief's list but touching nothing shared), `gen/ui/shots/*.mjs|json`.

## What is in the world now

- **Title screen:** 清明上河圖 (vertical, 霞鶩文楷 until the type agent's logo SVG lands), the 「上河」 seal, one ink stroke
  that draws across (pre-script creep in CSS, then three milestones), 展卷; the paper wipes away right to left.
- **Region banners** at every section of another region (7 regions: 卷尾 · 十字街 · 城門 · 城門口外 (S4 + S4b) · 虹橋 ·
  汴河 · 郊野), the first one at the start.
- **30 landmarks** with plaques and toasts across all 8 sections (孫羊正店, 久住王員外家, 劉家香藥鋪, 方井, 「解」字招牌,
  街頭說書, 稅務, 軍巡鋪屋, 城樓, 平橋, 寺院, 遞鋪, 臨街神算, 大棕蓋車, 車鋪, 小鋪閒坐, 虹橋, 十千腳店, 新酒, 沿河雅座, 王家紙馬,
  望火樓, 望樓飯鋪, 草橋, 穀場, 隋堤煙柳, 踏青歸來, 趙太丞家, 官宦人家, 孫羊店).
- **Six conversations** (E on desktop, the 談 seal on touch; Esc or walking away closes):
  - **V5.1 貨到稅訖** at the tax office, about 9 m from the spawn (稅吏, 貨主, 車夫, 稅官, 更夫's thought);
  - **V6.2 正店門前賣花** at the 孫羊正店 door, about 11 m from the spawn (賣花人, 老者, the child on the shoulders);
  - **V6.5 鬧市說書**, the storyteller, about 22 m west of the spawn (說話人, 看官, 孩童);
  - **V5.5 城下修面** outside the gate (待詔, the customer's thought);
  - **V5.11 少年乞丐** on the moat bridge (小乞兒 ×2, 遊人 ×2);
  - **V4.2 臨街神算**, the fortune-teller on the outer road (賣卦先生, 客人, 閒人, his thought).
- **Help** in 繁體 with an English gloss, folding into its 說明 seal; **stats** only with `?stats=1`; sundial in a brush
  ring; paper-and-ink bell and volume; the HUD's chrome in ink with its 繁體 hint and region title; the tuning panel
  recoloured.

**How to see it:** `world.html` (check server `http://127.0.0.1:5190/world.html`). From the spawn (you face west), turn round: the
tax office's porch is about 9 m east and a little north, where 稅吏 stands; the flower seller is at the 孫羊正店 door north-west of the spawn. `?stats=1`:
stats. `?ui=0`: no notifications or talk (cost A/B). Kit: `http://127.0.0.1:5190/ui.html`.
Test hooks: `__test.ui.banner('gate')`, `.toast('S5.str.moat_bridge')`, `.talk('V5.5')`, `.next()`, `.state()`.

## Checks

- **Data:** `node tools/ui_data.mjs check` PASS (8 sections, 7 regions, 30 landmarks, 6 scenes, 26 beats, 377 glyphs).
  **Fonts:** `uv run tools/font_subset.py` rerun after the strings: 181.1 KB in all, the loading core 17.2 KB, nothing
  missing.
- **Shots, looked at** (`gen/ui/shots/after/`, desktop 1920 × 1080 and phone 390 × 844 touch, day 10:00 and night
  21:30, plan `plan_after.json`): loading, start (banner, help, plaques), toast, prompt (barber), talk (barber with
  the customer's thought; the tax quarrel with two tagged bubbles), plaques at the gate, night banner + toast, night
  talk, night help, the HUD. Kit: `gen/ui/shots/kit/` (6 scenes × desktop/phone × day/night; `sheet_desktop.jpg`,
  `sheet_phone.jpg`). Legible by day and night on both; the overlaps found are fixed (above). No console errors or
  warnings in any run.
- **Regression** (`regress.sh`, the known state before this round: world 210/211 with one flaky S2 walk, boats 12/12,
  rides 5/5, people FAIL on the two known "nobody went round the player" stands):
  - `ui1` (21:48, all four): **world 210/211** (the same S2 north-bank E→W walk), **boats 12/12, rides 5/5**, people:
    the same two known stands, nothing else. Not worse.
  - `ui2` (22:02, world + people, after the last edits): world 209/211: both S2 north-bank walks stopped at the sack
    porters' yard (X 201, D 20.5). The boat-flow session's run at 21:46 (`flow_painted`) failed the same two, and
    `ui1` passed one of them: walker timing, not the UI (nothing in the UI touches movement or bodies). People as
    known.
- **`tools/sound_web.mjs check`: PASS** in all 8 sections, the volume bar shown in the HUD and set by its slider
  (0.4), engine ≤ 0.07 ms/frame.
- **Build:** `vite build` of `world.html` (and `ui.html`) into the scratchpad succeeds; `/assets/ui/fonts/fonts.css`
  stays a runtime URL (public), as intended.

## Cost

`gen/ui/shots/ui_cost.mjs` (A/B on one page at the tax office: idle UI vs two tagged bubbles + a toast; three
3-second windows each; `cost_phone_4x.json`, `cost_desktop_1x.json`):

| | UI script per frame | style + layout per frame | page CPU per frame | fps |
|---|---|---|---|---|
| phone 390 × 844 dpr 3, CPU 4× slower, idle | 0.05 ms | 0.00 ms | 19.7 ms | 51 |
| same, busy (2 bubbles, tags, toast) | 0.34 ms | 0.16 ms | 19.0 ms (noise ±1) | 49 |
| desktop 1080p, 1×, idle → busy | 0.004 → 0.022 ms | 0 → 0.02 ms | 3.0 → 3.04 ms | 311 → 307 |

So the busy UI costs about 0.5 ms a frame on a 4×-throttled phone CPU (about 2.5% of that frame), within the noise of
the page's own frame time; nothing when idle. No per-frame layout reads; transforms are written only when they change.

**Download added at first load** (gzip):
- before the world shows: `world.html` +2.9 KB (the title screen's markup, CSS and stroke), `fonts.css` 1.7 KB,
  `text-core.woff2` 17.6 KB (the title's glyphs), `seal.svg` 2.1 KB, the UI's JS ≤ 11.6 KB (measured unminified) and
  CSS 4.1 KB inside the world bundle: about **40 KB**;
- once the world shows: `places.json` 3.2 KB, `talk.json` 1.5 KB, `display.woff2` 52.5 KB (the first banner),
  `text.woff2` 112.7 KB (help, bubbles): about **170 KB**;
- about **210 KB** in all, under 1% of a 26 MB window.

## Not built (the next step, in STYLE.md §5)

- **Intent marks** (far) and **earshot chatter**: the near talk is done and clean, but both need data that isn't
  written (icons per beat, loop periods) and the design's three distances aren't agreed by the user yet; the standard
  says how to add them (same anchored layer, the two-bubble cap shared, at most ~6 marks).
- **Visited places on the scroll HUD** (a dot per landmark seen): cheap (`places.js` keeps `m.last`), left for the
  HUD's owner.
- **The opening animation**: the title screen is built in layers for it (`Loading.done()` is where it starts).

## Known limits

- Esc closes a conversation only when the mouse is free (with the mouse captured the browser takes Esc to release
  it); E at the last line or walking 6.5 m away always close it.
- Bubbles and plaques are drawn over the world (no depth test); plaques test walls with one ray, bubbles exist only
  within 6.5 m, so this rarely shows.
- `gate.html` (the old single-section page) gets the restyle but keeps its plain loading line and no web fonts.
- The scroll HUD's figure tips are still the map's English names (data, not chrome).

## Questions for the user

1. **English gloss:** the controls help and the HUD hint carry a small English line under the 繁體 so non-Chinese
   players can play; banners, plaques, toasts and talk are 繁體 only. Keep the gloss, or 繁體 everywhere?
2. **Landmarks:** each has a white plaque hanging over it in the street (江南百景圖's) and a corner toast with a line
   from the painting's reading when you arrive. Keep both, or plaques only?
3. **Names to confirm:** S7's region is 「卷尾」 (the scroll's end, from the map's section name; there is no street name),
   and the gate's sub-title is 「東角子門」 (the Palace Museum catalogue's identification, which scholars dispute).
4. **Talk:** six scenes now (two near the start, one at the gate), roles in period words (待詔, 稅吏, 說話人, 賣卦先生,
   小乞兒), lines are our proposals in Song vernacular, each citing its reading. Which scenes next, and do you want the
   far intent marks and the overheard chatter (livelier) or only the near talk (calmer)?
5. **The tuning panel** (English, technical) still opens with the painting for every player. Hide it for the public
   (e.g. only with `?tune=1`)?
6. **The sundial's hover text** shows the clock in digits ("巳正 · 10:00"). Drop the digits?
7. **The HUD's figure names** are the map's English descriptions. Translate them to 繁體 (a data job over every mapped
   figure), or leave the HUD's tips in English?
