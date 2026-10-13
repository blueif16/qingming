# Ink UI round 2: the time agent's record

Brief: `gen/ui/brief_r2.md` (ownership: everything inside `#dial`; `sundial.js`, `sundial_glyphs.js`,
`web/src/ui/time.js` + `time.css`; the time hooks in world.js; `loading.js` and the init order for the stall).
Shots: `gen/ui/shots/r2_time/`.

## For the other agents, early (22:40; sizes updated 23:30): the instrument's size and needs

**Read this first, settings agent.** The new time instrument replaces the round dial. It is wider than the dial:
a short horizontal strip of painted sky (the day as a little handscroll) with a vertical ivory hour tablet (時牌) on
its left, and a row of small words and seals under the strip.

| | box of `#dial` (frame included) | tap targets inside |
|---|---|---|
| desktop | **236 × 100 px** (final) | the strip (drag), the pace word (about 34 × 32 with its hit area), the 歸今 seal (about 33 × 39) |
| phone (≤ 640 px) | **180 × 82 px** (final) | the same; the pace word and the seal reach about 30 × 30 with their hit areas |

- `#dial` stays `position: fixed` at `top: var(--qm-top); left: var(--qm-left)`, `z-index: 805`, as today. My
  `time.css` sets two custom properties on `:root`, **`--qm-dial-w`** and **`--qm-dial-h`** (the footprint, frame
  included, desktop and phone). Place what sits beside or under it from those (for example the view tiles at
  `top: calc(var(--qm-top) + var(--qm-dial-h) + 8px)`), not from fixed numbers, so a later size change moves them too.
- It takes pointer events (drag, taps) inside its own box only. Nothing else should sit over that box.
- The region banner (`ui.css` `.qm-banner`, `left: calc(var(--qm-left) + 128px)`) now sits right of the instrument:
  I change its `left` to use `--qm-dial-w` (one surgical edit, listed below). On a phone it moves under the
  instrument (there's no room beside it at 390 px).
- Key: **T** focuses the instrument; then ← → scrub it, ↑ ↓ change the pace, Home (or 0) returns to your own clock,
  T / Esc / a click in the world leaves. Walking keys are held off while it has focus.

### The time contract (world.js → createUI → time.js, and the settings screen)

world.js passes one small object `time` into `createUI` (`o.time`); the settings screen should use the same object,
never `s` directly:

```js
time.get()          // { hour, local, flow: '靜'|'緩'|'常'|'疾'|'今', name: '午時', sub: '正一刻', night: 0..1 }
time.setHour(h, { scrub })   // set the hour (leaves your clock); scrub: true while a finger or mouse drags
time.setFlow(step)  // '靜' | '緩' | '常' | '疾' (leaves your clock); '今' = toLocal()
time.toLocal()      // 歸今: back to the viewer's own clock (s.localTime = true)
time.on(fn)         // fn(time.get()) after every change of hour step, pace or clock
```

**Pace steps** (the settings screen's 時辰 row uses the same words and values; `s.timeFlow` is game minutes per
real second):

| word | `s.timeFlow` | a 時辰 (two hours) passes in | a day in |
|---|---|---|---|
| 今 | (your clock: `s.localTime = true`, one minute a minute) | two hours | a day |
| 靜 still | 0 | never: the hour holds | |
| 緩 slow | 1 | 2 min | 24 min |
| 常 even | 4 | 30 s | 6 min |
| 疾 fast | 15 | 8 s | 96 s |

今 is not a pace you pick from the cycle; it is the state the 歸今 seal (or Home, or a double tap) returns to.
Dragging the strip while on 今 leaves your clock and holds the new hour (靜); dragging while 緩/常/疾 keeps that pace
after you let go.

## Log

### 22:55 the loading stall: found and fixed (details in "The loading stall" below)

- Filmed with `gen/ui/shots/load_film.mjs` (CDP screencast + rAF times + long tasks + GL waits, from the page's first
  script). Films: `gen/ui/shots/r2_time/film/` (`before_*`, `live_desktop`, `after_*`).
- **The huge text is the logo.** `loading.done()` takes the id off `#loading` at once (the tools' contract), but every
  rule of the title screen in `world.html` was keyed on `#loading`. From that moment the logo `<img>` painted at its
  own size (a single 清 filling the screen), the paper lost its fixed position, and the wipe rule (`#loading.ld-out`)
  no longer matched, so nothing wiped: the huge 清 stood until `done()` removed the element 1.4 s later. The live site
  shows the same (`live_desktop_film.jpg`, 382 → 1394 ms).
- **The freeze is the first frame.** `ui.loaded()` was called before the first `tick`; that first frame took 650 ms on
  the desktop (311 ms of it waiting on shader links: shadow, post and people programs `compileAsync` can't reach; the
  crowd's first pose bake 134 ms) and about 790 ms at a 4× throttled phone.
- **Fixed at the cause** (below): the title screen's rules are keyed on a class, the wipe runs on the compositor,
  and the first frames run under the paper.

### 23:00–23:45 the instrument, the checks, the lead's 巳 question

- Built `web/src/ui/time.js`, `time.css`, `time_words.js`; wired world.js (the `time` contract, applyLight, the clock
  tick); the kit's "time" scene with the three options not chosen (`web/src/time_mocks.js`); shots, checks, cost.
- **The lead (23:35): the big 巳 read as 已.** It did: Bakudai's 巳 leaves the top of its hook open, and its 戌 reads
  as 戍 (`gen/ui/shots/r2_time/glyph_si_specimen.png`, `glyph_branches_specimen.png`). The tablet is now set in the
  楷 face (QM Text, 霞鶩文楷), whose 巳 closes fully and whose 戌 is unmistakable, at 24 px desktop and 19 px phone
  (`gen/ui/shots/r2_time/si/sheet_si.png`). Reasons beyond legibility: one face for all twelve hours (no patched
  glyph), and the Song 時牌 were carved standard script, not running brush. The brush face stays for the pace word and
  the seal. The branches and 時 left the display subset's `extra`.
- **The second line now reads the whole hour, 巳正初刻,** not 正初刻 (a fragment next to the tablet). After dark it is
  the watch, 二更三點, a whole phrase too; the hover title carries both (亥初二刻 · 二更二點).

## The time instrument: 晝夜卷 with its 時牌

### What made the round-1 sundial unclear (`gen/ui/shots/r2_time/before/`)

- The twelve branches were about 11 px on a desktop and 8 px on a phone, light grey on grey stone; the current one
  changed only its colour, so the hour had no name you could read.
- The grey disc with a dark rim and one dark shadow line reads as a modern wall clock with one hand, not as a 日晷.
- Day or night showed only as a tint on the stone; at night the disc went blue-grey with the moon a small dot on the
  rim, low contrast against the night street.
- Nothing said whether the hour was yours or set by hand (only the hover title, which also carried "10:00").
- It could not be set: the hour lived in the developer panel.

### Options (live in the kit: `web/ui.html?frame&scene=time&device=desktop&tod=day`; shots `gen/ui/shots/r2_time/kit/`)

| | option | how you set the hour | for | against |
|---|---|---|---|---|
| 甲 | **日晷**, the round-1 dial redrawn larger with the 時辰 named beside it | drag the shadow round | the most literal period object | an equatorial dial reads as a clock face; a ring of twelve glyphs can't be legible at phone size; dragging round a 72 px circle is fiddly; no night |
| 乙 | **蓮花漏**, 燕肅's lotus clepsydra (1030): water lifts an arrow with its 刻 marks, the vessel's lip reads the hour | drag the arrow up or down | true Northern Song timekeeping, vertical like our names | you can't tell day from night at a glance; few players know how to read it; a tall shape fights the top-left corner and the HUD under it |
| 丙 | **十二時辰輪**, the twelve hours as brush characters on a turning ring, the current one large in the middle | drag the ring round | very clear names; day and night arcs | a dial again; a turning ring is hard to read in motion; it shows a name but nothing of the light |
| 丁 | **晝夜卷 with its 時牌** (chosen): the day painted as a short handscroll of sky under a "now" thread, and the hour's name on an ivory tablet | drag the scroll left or right (or flick it) | the product is a handscroll; the sky's own colour, sun and moon say day, dusk or night at a glance; the name is large; dragging sideways is natural with mouse and thumb; the ruler shows the hours on either side | a new object, not an instrument the Song had as such (the tablet is; the scroll is our language) |
| — | the user's other idea, a day handscroll alone | as 丁 | | without a name it isn't clear enough; merged into 丁 |

**Why 丁.** It is clearer (the 時辰 named large on a tablet, the reading under it, the sky itself showing day, dusk or
night in true colours), it is our language (a handscroll read right to left; east is the scroll's right, so the sun
rises on the right and sets on the left, exactly as the painting's geography and its reading direction go), and it is
period: by day the Song court showed the hour on seven ivory tablets carved and filled with gold, 卯 to 酉, and at
night told it by drum and bell in five watches of five 點 (宋史·律曆志三, 卷七十: 「牌以告時於晝。牌有七，自卯至酉用之，製以
牙，刻字填金」). The instrument shows exactly that: the tablet, and after dark the watch. 甲, 乙 and 丙 stay in the kit
(`web/src/time_mocks.js`, dev only) if the user wants one of them.

### What it is

- **時牌 (the tablet):** ivory, our plaque frame; the 時辰 in 楷, vertical (巳時, 戌時).
- **晝夜卷 (the scroll):** a window on six hours of a painted day (three either side of now), mounted in silk with
  rollers at its ends, the paper shaded where it rolls away. A cinnabar thread with a bead (the plaques' string) marks
  now. On the strip: the sky of every moment in its true colours (daylight.js `lightAt`, zenith to horizon), a few
  thin wash strokes, a far bank of willows and roofs in ink wash tinted by the sky, the sun's path as a faint dotted
  arc, stars at night. On the thread: the sun at its true height (pale high up, vermilion when low, sinking behind
  the far bank through the twilight), or after dark the moon at tonight's real phase when it is up. Under the sky, a
  paper ruler: a fine tick per 刻, longer per hour, a rule between 時辰, and the twelve branches under their middles,
  the current one in cinnabar.
- **The row:** the reading (巳正初刻; after dark 二更三點), the pace word, and when the hour isn't yours the 歸今 seal.
- Words: `web/src/ui/time_words.js` (`hourWords(h)` → name, half, 刻, watch, 點; `PACES`). No digits anywhere, not
  in the hover title either (「巳正初刻 · 今 · your own time」, 「戌初二刻 · 一更二點 · a set hour · 歸今: double-click」).

### How to use it

- **Drag the scroll** (mouse or finger): the paper follows your hand; pulled right, later hours come in. Sky, sun,
  shadows and light follow live; let go and the world stays at that hour. A quick flick runs on and slows (at most
  8 hours a second). The wheel over the scroll turns it a 刻 a notch (and doesn't zoom the camera).
- **Back to your clock:** the 歸今 seal, a double-click / double-tap on the scroll, or Home. The seal shows only when
  the hour isn't yours, and the pace word then reads 今 in cinnabar, so you always know whether you see your own time.
- **Pace:** tap the pace word: from 今 it goes 緩, then 常, 疾, 靜, 緩 … (values in the table at the top).
- **Keyboard: T** takes the keys (a cinnabar glow and a hint beside it): ← → a 刻 (Shift: to the next 時辰; held, the
  scroll runs on), ↑ ↓ the pace, Home or 0 back to your clock, T / Esc / Enter or a click in the world lets go.
  Walking keys are held off while it has them; WASD still walk.
- **Tools:** `?hour=` still pins the hour (the instrument then shows 歸今); `__test.set('hour', h)` as before; new:
  `__test.time` (`get`, `setHour(h, { scrub })`, `setFlow(word)`, `toLocal()`, `cost()`).

### Sound while scrubbing

A jump in time is not a passing hour: every `setHour` / `toLocal` sets `sound.lastHour` to the new hour, so the dusk
drum, the watches, the shutters and the bells never fire while you drag (checked: three passes across dusk and the
first watch, no event). When time runs (緩 常 疾) they fire as the hour passes them (checked: 疾 across 18.3, the
drum once).

## The loading stall

**Film:** `gen/ui/shots/load_film.mjs` (CDP screencast with times, every rAF, long tasks, the GL calls that wait on
the GPU process, the moments #loading loses its id, the wipe, the banner, any text of 40 px or more).
`gen/ui/shots/load_profile.mjs` (a CPU profile of the first frames). All against the check server unless noted.

| run | what happened after `ui.loaded()` |
|---|---|
| before, desktop (`film/before_desktop_zoom_film.jpg`) | a 650–685 ms frozen frame (the first `tick`), then the logo at its own size, one 清 filling the screen, from 0.66 s to 1.40 s, then the world at once |
| before, phone 4× (`film/before_phone4x_film.jpg`) | 791 ms frozen, then the huge logo until 1.57 s, then hitches of 100–400 ms for 7 s (the rest of the window streaming in) |
| **live site**, desktop (`film/live_desktop_film.jpg`) | 374 ms frozen, the huge 清 from 0.38 s to 1.40 s: the user's bug |
| after, desktop (`film/after_desktop_film.jpg`, `final_desktop_film.jpg`) | the first frame's 588–643 ms now runs under the paper, 0.6 s before the wipe; the wipe starts with frames already running; worst gap after it 85 ms on a quiet machine (251 ms on a loaded one, a neighbour section streaming in, with the wipe still moving) |
| after, phone 4× (`film/after_phone4x_film.jpg`, `final_phone4x_film.jpg`) | the two first-frame stalls (689 and 683 ms) under the paper; the streaming hitches during the wipe (350–360 ms) no longer stop it: the frames show its edge moving through them |

**What the huge text was:** the logo. `Loading.done()` removes the id at once (the tools take a remaining
`#loading` as a failed load), but every title-screen rule in `world.html` was keyed on `#loading`. So from the
moment the world was "in", the logo `<img>` (no width or height) painted at its intrinsic size, the paper lost its
fixed position, and the wipe rule `#loading.ld-out` no longer matched: nothing wiped, and the element stood until its
1.4 s removal timer. Round 1 shipped with a text title; the logo image landed after the ui agent's checks, so the
text title was small enough not to show it.

**Why it froze:** the first `tick` came after `ui.loaded()`. The first frame compiles the programs `compileAsync`
on the section can't reach (shadow, normal and outline passes, sky, people, the avatar: 311 ms of waiting on links
on the desktop), bakes the crowd's first poses (134 ms) and uploads.

**The fix:**
1. `world.html`: the title screen's rules keyed on the class `.ld` (the element keeps its class when it loses its
   id). The wipe is now two opposite transforms (the box slides left, an inner `.ld-in` slides right), which the
   compositor runs even while the main thread streams sections; reduced motion keeps its 0.3 s fade.
2. `world.js` `warmUp()`: `compileAsync(scene)` first (the stroke keeps creeping), then the frame loop starts under
   the paper; `ui.loaded()` waits for three frames in a row under 60 ms (or steady frames after 2.5 s, or 6 s at most).
   The paper stays up about 0.6 s longer, which is the time the frozen frame took anyway; the world now appears
   moving.
3. Not changed: the streaming of the neighbouring sections right after the start (the 100–560 ms hitches on a
   throttled phone) belongs to the streaming window; they no longer touch the wipe. A question for the perf owner
   whether to hold streaming for the 1.1 s of the wipe.

## Checks

- **Interaction** (`gen/ui/shots/time_check.mjs` → `gen/ui/shots/r2_time/time_check.json`): **PASS 12/12**: mouse drag
  sets the hour, no hour sounds while scrubbing across dusk and the first watch three times, frames keep coming
  while dragging (worst 17–84 ms on a shared machine), 歸今 shows and the hour holds, a fling runs on and settles,
  double-click back to 今, T and → → ↑ (two 刻, 緩; the walker stays put), Home and Esc, the pace cycle 緩 常 疾 靜, 疾
  across dusk fires the drum once, a touch drag at phone size sets the hour and doesn't turn the camera, a double tap
  goes back to 今. No console errors or warnings.
- **Shots, looked at** (`gen/ui/shots/r2_time/`): desktop and phone, day with the region banner (beside the instrument
  on a desktop, under it on a phone), dusk dragged, night set, your own clock (night), the focus hint
  (`sheet_final_desktop.png`, `sheet_final_phone.png`; v1 and v2 are the iterations; `si/` the tablet after the 巳
  fix; `check/` the shots from the interaction check; `kit/` the options). Legible over the bright day and the night
  street on both.
- **Regression** (`gen/expand/round2/page_qa/r2_time/summary.txt`, 23:12): **world 211/211, boats 12/12, rides 5/5**,
  people with the two known stands only ("nobody went round the player" at X 7 and X -8). Better than ui1/ui2.
- `node tools/ui_data.mjs check` **PASS**. Fonts re-subset: display 55.3 KB, text 120.4 KB, first load in all 195.7 KB
  (budget 250); the instrument's glyphs are all in `text.woff2` (first load) and its brush words (今靜緩常疾歸) in
  `display.woff2`.

## Cost

Phone viewport 390 × 844, dpr 3, CPU 4× slower, tier low, the spawn, the hour at 16.5 (`gen/ui/shots/time_cost.mjs`
→ `r2_time/cost_phone_4x_low.json`, three rounds each):

| | page CPU per frame | re-lighting (applyLight + the instrument) per frame | style + layout per frame |
|---|---|---|---|
| idle (hour held; your own clock re-lights once in 10 s) | 31.4 ms | 0.01 ms | 0.06 ms |
| dragging (a finger every 16 ms) | 28.9 ms | 0.36 ms | 0.63 ms |
| time running at 疾 | 30.2 ms | 0.51 ms | 0.56 ms |

The three are within the machine's noise (±3 ms). One thing was not: **a moving hour used to redraw the shadow map
every frame** (applyLight set `shadowState.dirty`), +4 to +8 ms a frame on the phone tier. Now, while the hour moves,
the sun's direction turns at the tier's shadow rate (`peopleHz`: 15 Hz low, 20 Hz mid, every frame high) and the
shadow map follows it through `shadowPolicy`; colours, sky and haze still change every frame, and a held hour is
always exact. The instrument writes only transforms while it runs (the strip, the sun) and its words at each 刻 or
點 boundary; nothing per frame when idle. Download: `time.js` 5.1 KB and `time.css` 1.7 KB (minified, gzip), the words
about 1 KB; the world no longer loads `sundial.js` + `sundial_glyphs.js` (about 9 KB gzip) or `sundial_face.webp`
(19 KB), so the page is about 20 KB lighter at first load.

## Edits to shared files (all surgical; regions re-read before each)

| file | edit |
|---|---|
| `web/world.html` | the title screen's inline rules re-keyed from `#loading` to `.ld`, the compositor wipe (`ld-wipe`, `ld-wipe-in`), `class="ld"` and an inner `<div class="ld-in">` in the `#loading` markup; the dead `.sundial` rules replaced by a one-line pointer |
| `web/src/world.js` | imports (`TimeScroll`, `PACES`/`paceOf`/`hourWords`; `Sundial` and `clock` dropped); the `time` object (get, setHour, setFlow, toLocal, on, cost) and `timeJumped()` before `dial`; `dial = new TimeScroll(...)`; `applyLight(moving)` (the instrument's set, the sun turning at the tier rate while time moves, the shadow redraw only for setting changes); the clock tick (re-light at most once a frame through `timeDirty`, flow held while dragging); `warmUp()` and its call before `ui.loaded()`; `time` passed to `createUI` and in `window.__test` |
| `web/src/ui/loading.js` | a comment only (the CSS is keyed on `.ld`) |
| `web/src/ui/ui.css` | `.qm-banner` `left` from `--qm-dial-w`; on a phone it hangs under the instrument |
| `web/src/ui/kit.js` | the instrument instead of the sundial (on a stand-in time object), the "time" scene with the options |
| `gen/ui/fonts/roles.json` | display `extra`: 今靜緩常疾 歸 (the branches and 時 were added, then taken out again after the 巳 fix) |
| `gen/ui/STYLE.md` | the component row (Sundial → Time instrument), §9 (the digits exception gone), §10 layout and stacking words |
| new | `web/src/ui/time.js`, `time.css`, `time_words.js`; `web/src/time_mocks.js` (dev only); `gen/ui/shots/load_film.mjs`, `load_profile.mjs`, `time_check.mjs`, `time_cost.mjs`, `plan_r2_time*.json` |

Not touched: `sundial.js`, `sundial_glyphs.js` (kept for the kit's option 甲), `daylight.js`, `sound.js` (the scrub fix
needs only `sound.lastHour`, set from world.js), `index.js` (the settings agent passes `o.time` on to its screen).

## Notes for the others and the lead

- **settings:** the contract is live (`o.time`); `settings_screen.js` has its own 初/正 function (line ~34); it can
  use `hourWords()` from `ui/time_words.js` for the same words. The `.tm-hint` sits right of the instrument while T is
  held, over where the region banner shows on a desktop (only while focused).
- **talk.js** keeps a bubble's top below 112 px (desktop) / 150 px (phone) "below the sundial"; the instrument is
  100 px tall plus the view tiles under it on a desktop, so a bubble at the far left could touch the tiles. Owner's
  call (`--qm-dial-h` is there to use).
- **CLAUDE.md** (qingming) and the memory note "period instruments" still name `web/src/sundial.js` as the time
  display; it is now `web/src/ui/time.js` (the 時牌 and the painted day). Lead's to update.
- The lil-gui tuning panel still `.listen()`s to the hour (0.4 ms a frame on a throttled phone while time runs); gone
  with `?tune=1` if the settings agent hides it.

## Questions for the user

1. **The instrument:** 晝夜卷 with its 時牌 (the day as a little handscroll, the hour on an ivory tablet). The three
   other designs are live in the kit (`ui.html?frame&scene=time`): 日晷, 蓮花漏, 十二時辰輪. Keep this one?
2. **The tablet's face:** standard 楷 (as the Song tablets were carved), because the brush face's 巳 reads as 已. Or
   would you rather have the brush look with a hand-drawn 巳 and 戌?
3. **The pace steps:** 靜 holds, 緩 a day in 24 minutes, 常 in 6 minutes, 疾 in 96 seconds; 今 is your own clock.
   Right speeds?
4. **A set hour is remembered** (saved with the settings), so a reload keeps your dusk until you press 歸今. Or should
   every visit start on your own clock?
