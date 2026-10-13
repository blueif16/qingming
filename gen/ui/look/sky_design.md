# An ink-wash sky that follows the hour (`?sky=ink`, prototype v4)

Look agent, 2026-10-12. Code: the `Sky` class in `web/src/daylight.js`, behind `?sky=ink`, which daylight.js reads
itself (`Sky.INK`). Without the flag, the constructor and `set()` take the old path line for line (an md5 check is in
`notes.md`). Shots are in `sky_shots/`; the measurements are in `perf/`.

## What it is after

- **The user's words:** "not … just a single color … small blocks of ink … pretty poetic … a bit like the original
  Messenger".
- **The references**, now that the chat images are saved (`jiangnan_look.md` §9):
  - **jn5 is the day sky:**
    - grey dry-brush strokes over cream paper, in exactly two tones about 5 L apart, cut hard, with no contour;
    - long level strokes with combed, torn fringes and a diagonal fan;
    - dense high up, a blank band above the horizon, pale grey mountains.
  - **jn4 is dawn and dusk:** wet pink washes with soft edges, and a flat orange-vermilion disc with watercolour
    blooms and no halo.
  - **Night** follows 江南百景图's night art (indigo and plum bands, specks) and keeps our phased moon.
  - **Messenger** shares the two-tone hard cut. jn5 overrules it on the contour (none) and on the shapes (level
    strokes, not blobs).
- **Our rules:**
  - **True colours:** the day sky stays the hour's blue (`daylight.js` KEYS). jn5's cream paper is not copied. Its
    strokes become a deeper wash of the blue (積染, a second wash). This tension is a question for the user.
  - **The hour drives everything:** zenith, horizon, sun colour, elevation, night, moon phase.
  - **Phones first:** no download, a cheap shader, nothing blocking at start.

## The recipe (all procedural; one fragment shader on the same 32×16 dome)

1. **Three broad washes** from the horizon up instead of the smooth gradient:
   - 70% quantised into 3 bands, 30% smooth, so it never looks posterised;
   - each band's top edge wavers round the compass;
   - a faint tide line (4% darker) where each wash ends.
2. **Blush** (jn4): at a low sun, a pink wash (`#e9a9a0`, 胭脂 thinned, mixed with the hour's sun colour) lies along
   the horizon on the sun's side, with a wavering top edge. It is gone by −11°.
3. **The sun:**
   - a faint soft wash round it, much weaker at a low sun (jn4 has no halo);
   - a **flat disc** 1.7° across with an uneven rim: pale `#fff4e2` by day, **vermilion** as the sun gets low (from
     18° down to 4°);
   - when low, the disc gets a **watercolour bloom**: ±10% lighter and darker patches inside, and a slightly darker,
     pooled rim.
4. **The strokes** (jn5):
   - **Lie:** noise sampled on the compass circle and up the elevation, so strokes lie long and level whichever way
     you look (v1's cloud plane gave spikes converging on vanishing points).
   - **Tilt:** a slow wave tilts them here and there into a diagonal fan.
   - **Cut:** two octaves (58/42, which breaks ribbons into blocks), **cut hard** (anti-aliased with `fwidth`) into
     **two tones**: a stroke, and a slightly deeper tone where strokes overlap.
   - **Dry brush:** fine level hairlines (about 1/70 of the sky's height) move the cut, so the edges are **combed**
     into streaks, with tapered, torn ends.
   - **Density:** `cover = 0.5` high up, thinning to about 55% of that lower down; **none in a band above the
     horizon** (fades in from 3° to 12°), where the backdrop panels and the misty floor meet the sky.
   - **Colour (day):** the sky under the stroke, desaturated 30% and darkened to 0.88. A blue sky gets deeper,
     slightly greyer blue strokes; it never turns grey or cream. **No contour** (jn5 has none).
   - **Dawn and dusk:** the strokes go **wet**: soft edges (+0.035 of the cut), a lighter comb, a 6% darker pooled
     rim, and they take 50% of the blush (jn4's soft pink washes).
   - **Night:** darker ink (0.78) on the indigo bands.
   - **Motion:** one layer turns slowly round the sky (about 0.07°/s) while the second re-forms the shapes.
5. **Night:** star specks as before, and the moon as a flat lead-white disc with its real phase, a thin ink rim and a
   pale halo wash (月暈). Strokes pass over both.
6. **Below the horizon:** the same haze as the default sky.

**The noise:**
- one 256×256 two-channel tile (R soft and broad, G finer; tileable fbm value noise, mipmapped);
- **made in idle time** (`requestIdleCallback`, falling back to a 300 ms timeout). Until then a 1×1 empty tile shows
  the washes, disc and stars without strokes;
- 128 KB on the GPU, **0 bytes downloaded**.

**The draw:** `renderOrder = 1000`, after the opaque world, so the depth test skips every pixel the town covers. The
default dome draws first and shades every pixel. Still before the transparent cards and panels.

**No texture was needed.** A painted ≤150 KB KTX2 sky was considered and rejected: it would not follow the hour, would
show a seam and a repeat on a full dome, and costs bytes.

**History:**
- v1: cloud plane (spikes);
- v2: compass/elevation bands with Messenger-like outlined blocks;
- v3: calmer, more 留白;
- **v4**: jn5's two-tone combed strokes with no contour, jn4's wet pink washes and bloomed disc, noise in idle time;
- v4.1: blockier strokes, less greying.
- Shots of v2, v3 and v4 are kept (v1 was replaced).

## Shots (`sky_shots/`)

- **`jn5_jn4_vs_ink_v4.jpg`**: jn5's sky beside v4 at 13:00 and 10:00; jn4's beside v4 at 06:40 sunrise, 18:18
  sunset (bridge) and 18:18 (street).
- **`compare_default_vs_ink.jpg`**: default (left) against v4 (right) at sunrise, morning, noon, sunset, dusk and
  night, and the inner-city street at 10:00 and 18:18.
- `base/` (default), `ink_v2/`, `ink_v3/`, `ink_v4/`, `ink_v4_moon/` (a gibbous moon, `&date=2026-10-24`). Spots are
  in `sky_spots.json` and `sky_spots_moon.json`; hours are pinned as in `sections/gate/shots_daylight.json`.
- Taken with `tools/chrome_slot.sh node tools/shots_page.mjs "http://127.0.0.1:5190/world.html?sky=ink" <out> gen/ui/look/sky_spots.json`.
- From 21:50 the ui agent's place titles and plaques appear in shots. Those are its work.

**What v4 shows:**
- **Noon and morning:** a true blue sky with long level strokes of deeper blue wash, combed edges, a few diagonal
  fans, and blank sky above the horizon. It is jn5's structure in day colours.
- **Sunrise and sunset:** lilac-pink sky, soft pink washes, the vermilion disc low.
- **Dusk:** plum with stars beginning.
- **Night:** indigo bands with darker ink streaks and specks.
- **The street at 10:00 and 18:18** keeps its true colours; the sky reads as painting.

## Cost

**Download:** 0 bytes (procedural). The code adds about 12 KB of source to daylight.js (comments included), about
5 KB gzipped, less once minified.

**GPU, the sky alone** (v4: `perf/skybench_v4.json`; v3: `perf/skybench.json`; `tools_skybench.mjs`):
- Method: each dome drawn full screen 10× per timer query into a half-float 4× MSAA target like the page's colour
  pass, alternated over 24 rounds, with the real noise tile installed. Hours 13:00, 06:40 and 22:00. RTX 4070 SUPER.

| size | flat-colour dome | default | ink v4 | ink − default (13 / 06:40 / 22 h) |
|---|---|---|---|---|
| phone 585×1266 (390×844 @1.5) | 0.17–0.27 ms | 0.13–0.24 | 0.17–0.86 | −0.06 / +0.62 / +0.11: at the timer's noise floor (p90 about 1.5 ms for every variant) |
| 1080p | 0.54–0.60 | 0.51–0.59 | 0.55–0.60 | +0.03 / +0.09 / −0.01 |
| 4K (weak-GPU proxy) | 1.93–2.51 | 2.17–2.75 | 2.15–2.80 | +0.05 / −0.02 / −0.01 |

- **Reading:** a full-screen sky is **bandwidth-bound** (writing a 4× MSAA half-float target). At 4K, v4 costs the
  same as the default to ±0.05 ms, both about 0.25 ms over a flat colour. v3 measured the same.
- **On a phone GPU**, ALU matters more. v4 does 9 texture fetches and about 160 ALU ops a pixel, against 0 and about
  40 for the default. At a full 0.74 Mpx sky on a mid Adreno or Mali, that is roughly **0.3–0.6 ms** at most
  (estimated).
- But the ink dome shades **only the pixels where sky shows** (drawn after the opaques), while the default shades
  them all. In a street view (sky about 25–35% of the screen), the ink sky should cost about the same as the default
  or less.

**CPU, 4× throttle** (v4):
- `inkInit` at start: **1.7 ms** (v3 blocked about 30 ms);
- the noise tile: 26.6 ms, **in idle time**;
- `set()` per light change: 1.5 µs (default 0.35 µs), called every 10 s;
- the per-frame `onBeforeRender` sets one float.

**The whole page, phone viewport 390×844 @3 (capped 1.5), touch, 4× CPU throttle**
(`tools_skyab.mjs`; alternating page loads, 2 reps, hour 13). Measured on the 4070 with the CPU throttled.

| view (hour 13) | fps, 4× (default → ink v4) | CPU ms, 4× | GPU ms, 4× | GPU ms, 1× |
|---|---|---|---|---|
| crown (Rainbow Bridge deck) | 12.5 → 14.1 | 80 → 72 (−10%) | 50.8 → 47.6 | 6.07 → 5.73 |
| storyteller (inner-city street) | 26.3 → 23.3 | 37 → 41 (+11%) | 22.6 → 24.6 | 3.28 → 3.88 |
| threshing_floor (open countryside) | 18.2 → 17.6 | 53 → 55 (+4%) | 31.7 → 32.2 | 4.54 → 4.20 |

- `perf/skyab_phone4x_v4.json`; v3's run is `perf/skyab_phone4x.json`, with gaps of −2% to +5%.
- **Reading:** the differences go both ways and sit **inside the noise**. The same variant moved 20–30% between its
  two reps: storyteller default 30.0 and 22.5 fps; crown ink 12.6 and 15.5 fps.
- The page is CPU-bound on a phone (37–80 ms of CPU a frame at 4×), and the sky adds no CPU work per frame.

- My default numbers match the perf study's quiet-machine phone run: crown 11–13 fps here against 12.4 fps in
  `gen/perf/phone_4x`.
- **Verdict:** the ink sky is free at the scale we can measure:
  - 0 bytes;
  - ±0.05 ms of GPU at 4K;
  - no measurable change on a throttled phone viewport;
  - 1.7 ms at start, with the noise in idle time.

## Known issues and next steps

1. **The pale column in the sky** is not the sky's and shows with either sky.
   - Looking along the scroll (east from the bridge, north-west at night), a pale vertical band rises from the
     horizon.
   - It is `post.js`'s mist acting on sky pixels: their depth is the far plane, which lies past the world's end but
     inside the backdrop ellipse.
   - Fix in `post.js` (not mine): `mist = 0` where the depth sample is 1.0.
2. **Backdrop panels show a seam against the dome** (their own painted sky). Their sky part should fade above their
   painted horizon (`backdrop.js`, not mine).
3. **To make it the default:**
   - the user decides (`compatibility.md` §7);
   - then remove the flag or invert it to `?sky=plain`.
4. **Possible next touches:**
   - a cream-paper option for the strokes' gaps (if the user wants jn5 literally);
   - 祥雲 wisps (jn6) as a rare accent;
   - stars as soft gold specks;
   - strokes stepping in stop-motion like Messenger's intro.
5. **Grain:** `post.js` grain (0.015) already lies over the sky; no paper fibre was added, so it stays a true sky.
