# The UI before the ink round (2026-10-12, ~21:00)

What a player sees on `web/world.html` today, where it sits, what makes it, and which checks read it. Shots of
this state: `gen/ui/shots/before/` (desktop 1920 × 1080 and phone 390 × 844 with touch, day 10:00 and night 21:30,
made by `gen/ui/shots/ui_shots.mjs` with `plan_before.json` through `tools/chrome_slot.sh`).

`gate.html` runs the same `world.js` with its own copy of the same inline CSS, so everything below holds there too
(its loading line says "Loading the gate…").

## Elements

| element | text | look | desktop | phone | made by |
|---|---|---|---|---|---|
| **Loading screen** `#loading` | "Loading the world…" (English); on failure "Failed to load: <message>" | flat beige `#e9dcc0`, 15 px system-ui, dark brown text, nothing else; the empty `#stats` and `#help` pills show over it as two small dark blobs | full screen, text centred | same | `world.html` markup + inline CSS; `world.js` removes it (`$('loading').remove()`) once the first section is in; the catch block writes the failure text |
| **Help** `#help` | desktop: "Click to walk · WASD / arrows · Shift run · mouse look · wheel zoom · V first / third person · Esc release mouse · Space the painting and the tuning panel · M sound" + "Sound effects: ElevenLabs" (small). touch: "Left thumb: walk · Right thumb: look · Scroll button top-right: the painting and the tuning panel · Bell: sound" + credit | dark translucent pill `rgba(40,28,18,.55)`, cream 12 px system-ui, radius 6, `pointer-events: none` | bottom left 12/12, one long line (940 px), always on | bottom left, four lines over the street, always on | inline CSS in `world.html`; text set in `world.js` (`$('help').innerHTML = isTouch ? … : …`) |
| **Stats** `#stats` | "182 fps · cpu 5.21 ms (anim 0.51) · gpu 4.85 ms · 502 draw calls · 3302.9k tris (all passes) · 308 people · dpr 1.00", rewritten every 0.5 s | dark pill, 11 px monospace | top left 12/12, always on, above the sundial | top left, runs off the right edge under the scroll button | `world.js` `tick()` writes `textContent` |
| **Sundial** `#dial > .sundial` | none on screen; hover title "巳正 · 10:00 (your local time)" (the only place a clock time in digits appears) | painted stone disc (`assets/ui/sundial_face.webp`), carved 刻 ticks and the twelve branch glyphs (SVG outlines from Ma Shan Zheng, `sundial_glyphs.js`), current branch in cinnabar, gnomon shadow, the moon after dark, tinted by the hour's light; drop shadow | top 42 left 14, 104 px | top 38 left 10, 76 px | `web/src/sundial.js` (`new Sundial(#dial)`, `set()` on every light change); CSS inline in `world.html` |
| **Scroll HUD** (Space; touch: the scroll button) `.sh-root` | title slip "清明上河圖" + the section's name from `assets/scroll/sections.json` in **simplified** Chinese + English ("城内十字街 · 闹市 · the inner city"); hover/tap tips with the map's **English** names ("a porter …"); foot "Space or Esc · back to the street · H · the settings panel" / "Tap a box to see who it is"; credit "Palace Museum, via Wikimedia Commons" | blurred, darkened street behind a radial mask; the painting in a mount-brown frame (`MOUNT #4e4033`), paper title slip (`PAPER #efe4cc`), round paper buttons (+, −, find me, ×) with thin ink icons, cinnabar ring for you (`CINNABAR #b5321e`), ink corner brackets on the people near you, the whole scroll as a strip below; Latin serif stack (Iowan Old Style, Palatino, Georgia, then Songti/STSong/Noto Serif CJK SC) | frame up to 1200 × 640, centred; strip and foot below | frame 64 vh from the top, title runs out of space ("the i…"), foot stacked | `web/src/scroll_hud.js` (CSS string `CSS`, `build()`, canvas drawing in `draw()`) |
| **Scroll button** `.sh-open` | title "The scroll" | 46 px paper disc, scroll icon | not shown | top right 12/12 | `scroll_hud.js` `build()` (touch only) |
| **Bell and volume** `#soundCtl` | title "Sound (M)", aria "Sound on or off (M)"; slider aria "Volume" | 40 px dark translucent round button, gold bell (grey with a slash when off); while the HUD is open a dark pill with a gold track and bronze knob | bottom right 12/12 | bottom right | `web/src/sound.js` `controls()` / `paintBell()`, its own injected `<style>`; built after the first section shows |
| **Tuning panel** `.lil-gui` | "World: city_end · inner_city · … — tuning", folders Look, Sun & shadow, Ink lines, Silk & haze, Camera & walking, Load test, Time of day, You, "copy settings", "reset to defaults" (all English, technical) | lil-gui default dark theme | top right, only while the HUD is open (H hides it there); folded to its title bar under 1500 px | only in the HUD, folded | `web/src/settings.js` `buildGui()`, folders added in `world.js`; shown/hidden by `scroll_hud.js` |
| **Crosshair** `#crosshair` | none | 4 px brown dot | centre, only while the mouse is captured | never (no pointer lock) | inline CSS; `world.js` `pointerlockchange` |
| **Touch controls** | none drawn | invisible: a drag on the left half walks, on the right half looks | | whole canvas | `web/src/player.js` (touch listeners on the canvas) |
| `#ref` | | CSS only (a leftover of `index.html`'s B1 overlay) | | | `world.html` CSS |
| **Page** | `<title>Qingming World</title>`, `lang="en"`, empty favicon, `body` background `#e9dcc0`, system-ui | | | | `world.html` |

**Not there yet:** speech or thought bubbles, name tags, an interaction prompt, region or landmark notifications, a
logo or seal, any Chinese type of our own (only the sundial's glyph outlines and the HUD title), any place where the
painting's names reach the player in the street.

## What reads these elements (keep every id and behaviour)

| element | read by | how |
|---|---|---|
| `#loading` | `tools/bench_page.mjs`, `check_page.mjs`, `shots_page.mjs`, `film_page.mjs`, `animal.mjs`, `clip_sheet.mjs`, `check_deploy.mjs` | wait for `window.__test` **or** `#loading` text starting with "Failed". `bench_page` and `check_page` call it a **failed load if `#loading` still has any text** once `__test` exists, and `check_deploy` reports that text: the element must be gone (or have no id) before `window.__test` is set. |
| `#stats` | `shots_page.mjs` and `check_page.mjs` print its `textContent`; `ktx2.mjs` and `walk_film.mjs` hide it | it must exist and keep being written every 0.5 s, visible or not |
| `#help` | `shots_page`, `film_page`, `clip_sheet`, `walk_film` remove it; `ktx2.mjs` hides it | removable without breaking the page |
| `#dial` | `ktx2.mjs` hides it | |
| `.lil-gui` | the shot tools remove it; `hud_interact.mjs` reads `hud.gui._hidden` and its box | |
| `#soundCtl`, its `input`, `.bar` | `tools/sound_web.mjs check` | the bar's computed `display` is not `none` while the HUD is open; an `input` event on the slider sets the volume |
| `.sh-tip`, `.sh-btn[data-a=…]`, `.sh-frame`, `.sh-view`, `.sh-open`, `.sh-strip`, `.sh-foot`, `.sh-tools` | `tools/hud_interact.mjs` | positions, the phone layout fitting the width, taps; `.sh-open` shown on phones |
| `window.__test` (`hud`, `sound`, `set`, `goto`, `view` …) | every page tool | set by `world.js` after the window settles |
| `body > div` without an id | `clip_sheet.mjs` removes them (on `chars.html`) | new overlay roots on `world.html` should carry an id |
| `gen/expand/round2/page_qa/` (`regress.sh`, `ride_test.mjs`, `wade_test.js`) | no UI selectors; they use `window.__test` | |

## Problems the shots show

- Two languages of chrome side by side: the HUD is paper and ink; the street's help and stats are dark web pills in
  system-ui; the bell is gold on dark glass.
- English everywhere a player reads in the street; simplified Chinese in the HUD's section name.
- The stats line is debug data shown to every player; on a phone it runs off the screen under the scroll button.
- The phone help covers a quarter of the street, forever.
- Numbers on screen (fps, ms, counts in `#stats`; the clock time in the sundial's hover text).
- The loading screen is a blank page with one English line: nothing of the painting, no logo, no progress.
- Nothing tells you where you are in the street, or who anyone is, unless you open the HUD.
