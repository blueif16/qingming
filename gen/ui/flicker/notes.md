# Labels that don't blink, the "way ahead" note, the maker's line (2026-10-13)

The user's three asks, one session:
1. "if you are just walking, there might be flashing of these tags and dialogues": the anchored labels (landmark plaques,
   intent marks, the E prompt, speech bubbles) blinked.
2. At the end of a section the walk sometimes stopped while the next section loaded: show that softly, in the ink style.
3. The start screen: the maker's Chinese name and "Hope you guys like it. 希望大家喜欢".

## 1. Why the labels blinked

Every layer chose its labels with hard cut-offs, re-checked 4–8 times a second, with no memory:
- plaques (`ui/places.js`): `d <= 30 m`, `d >= 1.5 m`, the bead inside a screen margin, one BVH ray to the bead (a ray
  grazing a roof edge flips with the camera's bob), and the nearest 3, so two places at about the same distance swapped
  as you walked. Under the region banner a plaque hid at the banner's edge, so it blinked as the view swung.
- intent marks (`ui/marks.js`): the same kinds of cut-offs, and the mark went in every pause between two exchanges.
- the E prompt (`ui/talk.js`): `d <= 3.2 m`, facing within 60°, the head on screen, re-checked every 0.12 s.
- bubbles (`ui/bubbles.js`): with two bubbles open, the layout (pushed apart / older stacked above / older hidden) was
  re-decided every frame from thresholds, so a pair at a threshold flipped between layouts each frame.
- chatter (`ui/chatter.js`): a nearer speaker could take a bubble's slot after 1.2 s. Groups woke and slept at the same
  distance.

## The fix: `web/src/ui/steady.js`

One small chooser that every label layer uses. Each check, a candidate gives two gates:
- `ok`, to appear (the old tight gates);
- `keep`, to stay (looser: a few metres farther, a wider screen margin, a wider facing angle, nearer under it).

A label at a threshold sits in the band between the two gates and holds still. On top of that:
- **debounce**: it appears once `ok` has held `showAfter` s, and goes once `keep` has failed for `hideAfter` s;
- **dwell**: it stays at least `minOn` s, and once gone it waits `minOff` s before it can come back;
- **sticky ranks**: with at most `max` shown, the labels already showing rank as if `stick` times nearer;
- `drop` takes a label away at once. A mark goes this way when its group's words are up in a bubble.

| layer | gates (appear / stay) | showAfter / hideAfter / minOn / minOff / stick |
|---|---|---|
| plaques | 30 m / 35 m; bead 120 px from the top / 70 px; off the sides / 30 px past them; 1.5 m / 0.8 m under it | 0.2 / 0.6 / 1.5 / 1.2 / 0.8 |
| marks | showM+1..wakeM / showM..wakeM+3; on screen / 60 px past | 0.3 / 1.6 / 2.5 / 1.5 / 0.8 |
| E prompt | 3.2 m, 60°, head on screen / 4.0 m, 78°, head in front | 0.1 / 0.3 / 0.6 / 0.5 / 0.75 |

Bubbles keep their own rule. The pair's layout steps up at once when the two would overlap (no overlap, ever). It
steps back down only with 24 px to spare and after 0.6 s in its layout (48 px and 1.2 s to bring a hidden line
back). The sideways push eases in over the last 24 px of height between them. Chatter: a line stays at least 2.2 s
before a nearer speaker can take its slot, and a group sleeps only 4 m past where it woke.

## The check: `tools/label_flicker.mjs`

It walks four busy routes (inner city, outer road, the Rainbow Bridge, the canal; about 85 s in all, the view swinging
±20–30° as a mouse does) on the page's film clock. That gives 30 whole frames a second however slow headless Chrome
is. After every frame it counts:
- a **blink**: the code hides a label and shows it again within 1 s;
- a **short** label: one shown for less than 0.7 s.

Math.random is seeded. A label sliding out past the frame's edge is motion and isn't counted.

`tools/chrome_slot.sh node tools/label_flicker.mjs "http://127.0.0.1:5190/world.html?hour=11" --json gen/ui/flicker/after.json`

| | shown | blinks | short |
|---|---|---|---|
| before (HEAD's five UI files) | 88 | 21 | 18 |
| after | 56 | **0** | 3 |

Per layer before: plaques 12 blinks, bubbles 5, marks 4. The 3 short ones after are a speaker's line replaced by
their next line, which is new words, not a blink. (`before.json`, `after.json`)

## 2. 前路漸展: the way ahead still coming in

- `world.js` `aheadLoading()`: true while a section you stand in, or are within 12 m of, is `out` or `loading`
  (its seam is a wall until it is in). A failed section never comes, so it doesn't count. It is passed to the UI as
  `createUI({ ahead })`.
- `ui/index.js` `aheadNote`: a small paper slip, bottom centre, above the 聞 note's place (higher on touch screens). A
  brush ring turns beside 前路漸展, with the gloss "the way ahead is unrolling" under 中英.
  - It shows only when the wait is real: Steady with `showAfter` 0.6 s, so a section that comes in on time never
    flashes it.
  - Once up it stays at least 1.6 s.
  - `__test.ui.ahead()` gives `{ loading, shown }`.
- Seen on a slow-4G teleport to the grain wharf: up from 1.0 s to 7.7 s (`shots/ahead_desktop.png`). The words are in
  the display and text subsets (`gen/ui/fonts/roles.json`).

## 3. The maker's line

- `world.html` start panel, after the intro: 王軾然 製作 · 希望大家喜歡。 with the gloss "Made by Shiran Wang · Hope
  you like it." (on the same line where there is room).
- 卷記 maker card (`ui/about.json`): the name is 王軾然, with Shiran Wang as its gloss (`start.js`, `start.css`).
- Written in 繁體 like the rest of the screen: 轼 → 軾, 欢 → 歡.
- The line would have pushed the credits and the 卷記 link onto the painting band on laptop screens. Before it, they
  already overlapped at 1280×800 and 1366×768. A short-landscape rule (561–1000 px tall) now sets a smaller logo
  (18vh) and tighter gaps, and short portrait phones get tighter gaps. `start_fit.mjs` measures every viewport: all
  clear the band except a landscape phone (844×390), where the link overlaps by a few pixels, as it did before.
- Fonts: `uv run tools/font_subset.py`. The first load grows 3.5 KB (183.5 KB of the 250 KB budget).

Shots: `shots/` (start_desktop, start_phone, maker_desktop, maker_phone, ahead_desktop).

## Checks after the change

- `gen/life/life_check.mjs flicker_fix` (default views on phone and desktop at the low tier) and `flicker_fix_high`
  (desktop at the high tier, at storyteller, crossroads, street, fortune, crown, grain_wharf and doctor):
  - at most 2 bubbles open;
  - two bubbles on screen in up to 19 of 78 samples per view, with 0 overlaps;
  - all 64 near talks reachable, and their lines change with who you play.

  The FAILs are the check's own: its default view `outer_road:carts` doesn't exist (the view is `carts`), and in the
  high run the hosts of V6.5 and V4.2 weren't found straight after its teleport. Reached directly, they stand
  1.4 m and 1.7 m away.
- The E prompt with the steady chooser (direct test, V6.5 and V4.2): it rises at 2.2 m facing the host, E starts the
  talk, it comes back after close and the cooldown, and it is gone at 5 m.
