# Ink UI round 2: the settings agent's record

Brief: `gen/ui/brief_r2.md` (ownership: the direct HUD, the settings screen, the help, the lil-gui exposure, the
bell and volume DOM). Standard: `gen/ui/STYLE.md` §14 (written this round). Shots: `gen/ui/shots/r2_settings/`.

## For the other agents (22:45, kept up to date)

**Time agent:** I use your contract as written in `r2_time.md`.
- The settings screen's 時辰 page reads and sets time only through `o.time` (`get`, `setHour`, `setFlow`, `toLocal`). Its
  pace row shows 靜 / 緩 / 常 / 疾 (今 shows as the current value while you follow your clock; ← from 今 goes to 靜, → to
  緩). The "light from the hour" row (`s.daylight`) is not in your contract, so it goes through the world setter. Without
  `o.time` the screen falls back to the setter with your table's values.
- The view tiles and the › sit **under** `#dial` on a desktop (`top: calc(var(--qm-top) + var(--qm-dial-h) + 8px)`) and
  **right of** it on a phone (`left: calc(var(--qm-left) + var(--qm-dial-w) + 8px)`, vertically centred). They read your
  `--qm-dial-w` / `--qm-dial-h`. Checked: nothing of mine overlaps the instrument's box (desktop 14,14–250,114; phone
  10,10–190,92).
- On a phone I move the landmark toasts below the instrument (`hud.css`).
- While the settings screen is open, `html.qm-set-open` is set; the screen takes every key but M and V in the capture
  phase, so your T and arrows don't reach the instrument, and `#dial` is hidden (opacity 0, no pointer events).
- The help lists your **T** (時辰 · the time).

**Lore agent:** `prefs.placeNotes` and `prefs.plaques` (added to `PREF_DEFAULTS`) are honoured in your `places.js`, so I
dropped my CSS fallback. The 介面 page's 圖志 row calls `ui.journal.open()` after closing the screen.

**Everyone:** world settings from the UI go through one setter in world.js, `setSetting(k, v)` (the tuning panel's
rules, saved per page, then `onSettingChange(k)`), passed to `createUI` as `o.settings.set`. Keys I take: **O**
(settings), **H** (help; `?` still works). While the settings screen is open, the scroll HUD's Space is held off
(`hud.blocked`) and E (talk) is ignored.

## What's in

1. **The direct HUD** (`web/src/ui/hud.js`, `hud.css`, `icons.js`): only the time instrument, the view switch (two ink
   tiles: an eye and a robed figure from behind; the chosen one sealed in cinnabar; one click; V still works; the tiles
   follow V and the tools within half a second) and a **›** that opens the settings (O). The 說明 seal (bottom left)
   and the scroll button (top right, touch) stay: they are navigation, and on a phone the only tap targets for H and
   Space. The bell and the volume leave the street (CSS: `#soundCtl:not(.open)`); they still show beside the painting
   while the scroll HUD is open, and the settings' 聲音 page has both. M still mutes.
2. **The settings screen** (`settings_screen.js`, `settings.css`, `settings_words.js`): Battlefield's layout in paper
   and ink. Title 「設定」 and six category seals (朱文 idle, 白文 chosen) between Q / E keycaps; a ruled paper sheet
   (朱絲欄) of 64 px rows, label left in 繁體 with an English gloss, the value right (ink ‹ › steppers with named steps
   and position dots, an ink switch with a seal knob, a brush slider, the view tiles, slip buttons); the highlighted
   row in a brush frame with a cinnabar diamond; the description slip right of the list (under it on a phone) with
   what it does (繁體 + English), its cost in words (不耗費 / 極小 / 小 / 中 / 大 + a phone sentence) and the Esc 返回
   keycap. Pages:
   - 時辰: follow your local clock, the hour (24 half double hours 子初 … 亥正, glossed "noon", "dusk" …), how fast
     time flows (靜 / 緩 / 常 / 疾; 今 while on your clock), light from the hour;
   - 視角: first / third person (the tiles), camera distance (off in first person), field of view;
   - 聲音: sound on / off, volume (both off with a note until sound has loaded or with `?sound=0`);
   - 介面: 名勝詳記 (`expandDescriptions`), 地名提示 (`placeNotes`), 名勝招牌 (`plaques`), 說明 (opens the help),
     圖志 (opens the journal);
   - 畫面: sharpness (`pixelRatioCap` 粗 0.75 / 中 1 / 細 1.5 / 精 2), shadows, ink lines;
   - 進階: shading, true colours, exposure, saturation, warmth, ink strength, ink thickness, haze begins / closes,
     paper grain, vignette, walking pace, running pace, eye height, 完整調校面板 (the lil-gui panel), 還原預設 (reset).
   Keys: ↑↓ rows, ←→ values (Shift: big slider steps), Enter toggles / runs, Q / E (or Tab, PageUp/Down) pages, Home /
   End, Esc / O close, H closes and opens the help. Touch: tap a row to read it, tap its control to change it, tap a
   seal for a page, 返回 to close.
3. **The lil-gui panel** is a developer's tool: built as before (so `hud.gui` and the tools that remove `.lil-gui` keep
   working), shown beside the painting only with `?tune=1` or the 進階 row 完整調校面板 (which also writes `?tune=1`
   into the address). H in the HUD hides it only then. Every value it edits stays reachable: the common ones on the
   進階 / 畫面 / 視角 / 時辰 pages, the rest (colours, sun azimuth and elevation, ink depth/normal/threshold/fade,
   shadow softness, crowd, avatar, copy settings) in the panel behind `?tune=1`.
4. **The help:** open on the first visit until you have walked a while (≥ 25 s and ≥ 12 m, or 75 s), then folded
   into its seal for good (`prefs.helpSeen`; a manual fold counts). Later visits start folded; the seal stamps in once
   after the paper wipes. H (or ?), the seal, or the 說明 row bring it back. It lists the new keys (T 時辰, J 圖志,
   O 設定, H 說明, M "sound on / off"), and on touch the view tiles and › (the bell row is gone).
5. **STYLE.md §14** (the direct HUD, the screen, the help, the keys table) and edits to §5, §10, §13.

**How to see it:** `http://127.0.0.1:5190/world.html` (check server): the tiles and › under the time strip; O or ›
for the screen. `?tune=1` brings the old panel back beside the painting. Test hooks: `__test.ui.settings.open('adv')`,
`.page(cat)`, `.select(id)`, `.state()`, `.close()`.

## Decisions (and why)

- **The world keeps drawing behind the screen** rather than pausing as the scroll HUD does: most settings (the hour,
  light, view, camera distance, field of view, sharpness, shadows, ink, every 進階 value) are judged by eye, so the
  change must show at once; Battlefield's own screen sits over its live scene. You stand still (`player.frozen`), the
  mouse is free. Measured: no cost above the noise (below). On a phone the screen covers the street (mist 0.9), so the
  world mostly reads as a wash there; a pause would save battery but break "see the change".
- **Closing:** O gives the mouse back (a key is a user gesture), as Space does for the scroll HUD; Esc and 返回 leave
  it free (click to walk), as the HUD's Esc and its close button do.
- **Space is inert inside the screen:** first wired as Enter, it toggled the highlighted row when a player reached for
  the scroll (found by the interaction check). Enter alone activates.
- **The bell leaves the street but stays beside the painting:** the user asked for the bell and volume behind ›; the
  scroll HUD is a screen, not the direct HUD, and `tools/sound_web.mjs` checks the volume slip there. No edit to
  `sound.js` was needed (CSS only).
- **Category seals as stacked blocks, not vertical writing:** a `writing-mode: vertical-rl` span inside the grid
  button mis-sized; and the 40 px seal mask keeps its aspect ratio, so a tall seal got cut to a square: a stretched copy
  (`--qs-seal-mask`, `preserveAspectRatio="none"`) is set by the screen.
- **The screen is a lazy chunk** (`import()` from hud.js, prefetched at idle 8 s after the world shows), and its words
  live in `settings_words.js`, which the font tool now puts in a **lazy subset** (`text-settings.woff2`): neither the
  first load's JS nor its fonts grow with the descriptions. Short HUD and help words stay in `words.js`.
- **Hours in the settings:** a 時辰 stepper (24 halves) mirrors the instrument for keyboard players; it goes through
  `o.time.setHour`, keeping the minutes.
- **No numbers** anywhere in the screen: paces, sharpness and costs are words, sliders have no scale; only the
  English gloss of 完整調校面板 names `?tune=1` (the address, for the developer).
- **`tools/font_subset.py`** (no owner listed; the brief asks for lazy subsets): a role's `lazy` groups
  (`suffix -> sources`) become `<role>-<suffix>.woff2` with disjoint unicode-ranges; `!glob` excludes a file from the
  main sources. Lore can add its long texts as another group.

## Edits to shared files (all surgical; re-read before each)

| file | edit |
|---|---|
| `web/src/world.js` | `setSetting`, `resetSettings`, `setTune` (after `onSettingChange`); `new ScrollHud({ …, tune: query.get('tune') === '1' })`; the English fallback help text; createUI options `settings`, `sound`, `canvas`, `tune` (after the time agent's `time`). |
| `web/src/scroll_hud.js` | header comment; constructor `tune`, `blocked`; `onKey` returns when `blocked()`; H only with `tune`; `show()` shows the panel only with `tune`; the hint text without "H" unless `tune`. |
| `web/src/ui/index.js` | imports `createHud`, `prefs`; the help's first-visit rule and `helpSeen`; `createHud(...)` (with `blocked: journal.isOpen`, so O can't open the settings over the journal) and `o.hud.blocked`; keydown: H, settings open; the HUD hint (tune variant); `ui.hud`; the stamp-in on later visits; `dhud.sync(dt)` in `frame`; test hooks `settings.*`, `state().helpSeen/settings`. (Lore added the journal around these; I kept to my lines.) |
| `web/src/ui/components.js` | `helpPanel`: `onchange` hook; `ICONS.view`, `ICONS.more` (from `icons.js`). |
| `web/src/ui/ui.css` | after `#help .qm-help-icon`: the help's touch-row icons (`.qm-help-ic`) and the seal's stamp-in (with the other `#help` rules, so the kit page draws them too). |
| `web/src/ui/words.js` | help rows (T, J, O, H; touch: view, ›; bell row gone), `helpAria`, `view`, `more`, `hud.hintDesktop`, `hud.hintTune`. |
| `web/src/ui/prefs.js` | `placeNotes`, `plaques` in `PREF_DEFAULTS`. |
| `gen/ui/fonts/roles.json` | display `extra` += 設定視角聲音介面畫面進階耗費; text: `!web/src/ui/settings_words.js`, `lazy.settings`. |
| `tools/font_subset.py` | lazy groups and `!` exclusions (docstring); stale-file cleanup by role prefix; the report splits the lazy KB. |
| `tools/hud_interact.mjs` | `CDP_PORT` (for chrome_slot); the panel checks run as before with `?tune=1`, else it checks that no panel shows and H brings none. |
| `gen/ui/STYLE.md` | §14 (new), rows in §5, stacking in §10, checks in §13. |

New files: `web/src/ui/hud.js`, `hud.css`, `icons.js`, `settings_screen.js`, `settings.css`, `settings_words.js`;
`gen/ui/shots/r2_settings/` (`plan_r2.json`, `plan_probe.json`, `plan_measure.json`, `settings_interact.mjs`,
`settings_cost.mjs`, the shots and cost JSON).

## Checks

- **Interaction** (`settings_interact.mjs`, real keys, clicks, touches; settings put back after): **40/40 PASS**,
  no console errors. Desktop: tiles and › clear of the instrument; bell off the street; a click on each tile switches;
  V switches and the tiles follow; O opens (mouse free, walking held, Space opens no scroll HUD and changes nothing);
  ↓ → steps the hour and leaves the clock; the pace steps; E / Q / Tab pages (wrapping); a seal click; a switch click
  and back; the brush slider drags; Esc closes and walking resumes; O closes; › opens, 返回 closes; H opens and folds
  the help. Phone 390 × 844: the HUD clear of the instrument and the scroll button, tap targets ≥ 34 px; a tap on a
  tile; › opens; the screen fits the width with the description under the list; a tap selects a row and the
  description follows; › steps the hour; a seal changes the page; 返回 closes; the 說明 seal opens the help.
- **Shots, looked at** (`gen/ui/shots/r2_settings/`, desktop 1920 × 1080 and phone 390 × 844 touch, day 10:00 and night
  21:30): `*_hud`, `*_help`, `*_set_{time,view,sound,ui,display,adv}`, `*_closed`. Fixed from looking: the row-kind
  classes collided with control classes (rows collapsed); the category seals were clipped (mask aspect, vertical
  writing); the cost seal was illegible; the keys line floated at the screen's foot (now under the list); the night
  wash was too heavy over the dark street. Legible by day and night on both.
- **Data and fonts:** `node tools/ui_data.mjs check` PASS; `font_subset.py --check`: nothing missing (lore now uses the
  same lazy groups: `display-lore`, `text-lore`). `uv run tools/font_subset.py`: display 58.7 KB (+3.8 KB, ten
  brush glyphs for the title and seals), text 118.7 KB at first load (round 1: 112.6; my words add about none, the
  rest is the time agent's), **text-settings.woff2 56.6 KB lazy** (only when the screen first shows). Without the lazy
  subsets 197.4 KB (budget 250).
- **Console:** no errors or warnings in the final runs (interaction, shots, landscape, kit help). One earlier shot run
  (23:08) logged `section city_end failed to load … reading 't0' at endOp` from world.js's streaming while another
  session was mid-change there (`stream.pending`, the deferred first section, `tiers.js`); gone once it settled.
- **Regression** (`regress.sh r2_settings`, 23:25, after world.js had been quiet 4 min): **world 209/211** (the two
  known S2 north-bank walks at the sack porters' yard, X 201 / 190, as ui2), **boats 12/12, rides 5/5**, people: the two
  known "nobody went round the player" stands, nothing else. Same as ui2. (A first run at 23:10, while the other session
  was editing streaming, had 206/211 with S6|S7 seam walks failing because city_end failed to load: theirs, not this.)
- **`tools/sound_web.mjs check`: PASS** (the volume slip shown beside the painting and set by its slider, 0.4).
- **`tools/hud_interact.mjs`**: default url 24 PASS, 0 FAIL (no panel in the HUD, H brings none); `?tune=1` the panel
  checks as before (shows in the HUD, H hides and shows it, hidden after close).
- **Landscape phone** (844 × 390): a short-screen rule (head on one line, page name and keys hidden, sheets as tall as
  the screen allows): `landscape_844x390_*.png`.
- **Kit page** (`ui.html?scene=help`): the help renders with the new rows, no console errors (the help icons' CSS now
  sits in `ui.css` with the other `#help` rules, so the kit draws them). The kit still shows round 1's bell and has no
  view tiles: `kit.js` is not mine; a later kit update can add the direct HUD.

## Cost

`settings_cost.mjs` (A/B/C on one page at the tax office: closed, open on 時辰, open on 進階; three 3-second windows each;
`cost_phone_4x.json`, `cost_desktop_1x.json`):

| | page CPU per frame | style + layout per frame | fps |
|---|---|---|---|
| phone 390 × 844 dpr 3, CPU 4×: closed / 時辰 / 進階 | 28.7 / 24.8 / 24.0 ms (noise ±7: the machine was shared) | 0.003 / 0 / 0.002 ms | 33 / 39 / 44 |
| desktop 1080p, 1×: closed / 時辰 / 進階 | 4.28 / 4.40 / 4.62 ms | 0 | 220 / 214 / 207 |

So the open screen costs nothing measurable on the phone proxy and at most ~0.3 ms a frame on the desktop (compositing
the wash and the sheets); the direct HUD costs nothing per frame (a half-second attribute check). The headless GPU timer
doesn't see the compositor, so a real phone's cost of the full-screen mist is not measured; it is one static layer.

**Download** (gzip): first load **about 7 KB** (the HUD chunk 1.8 KB JS + 1.0 KB CSS, the help / words / index deltas
about 0.6 KB, the display font +3.8 KB); the screen's chunk **13.4 KB** (10.3 JS + 3.1 CSS) fetched at idle; its font
subset **56.6 KB** on first open.

## Questions for the user

1. **The world behind the settings keeps moving** (people walk, time flows) so a change shows at once. Pause it
   instead, as the scroll does?
2. **English glosses** in the settings (labels and the description's second paragraph), as in the help. Keep them, or
   繁體 only (round 1's open question)?
3. **The 進階 page** shows the common look values as sliders without numbers; the full numeric panel is only behind
   `?tune=1` (or the 完整調校面板 row). Is that the split you want, or should 進階 be hidden from players entirely?
4. **The bell beside the painting:** it now shows only while the scroll is open (and in 聲音). Drop it there too?
