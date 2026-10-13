# The "weird symbol" in the sky (2026-10-13)

User: "up on the sky, there's a weird symbol or something." No view or hour was given.

## What it is

The symbol is a pale lens of mist painted on the sky, not an object. Looking straight up you see a long cream ellipse
with a blue four-sided hole in it, stepped at the bridge where the walkable boxes are. Looking up at an angle it shows
as a pale band or column across the sky. In third person at the usual look-up limit (pitch 0.45) it shows as a pale
column near the top of the screen, e.g. at the inner city facing west and at the grain wharf facing south.

- It shows at every hour and takes the hour's mist colour: cream by day, peach at dawn, grey-violet at night.
- It shows in every section, on desktop and phone, on tiers high and low, and on the live site.

## Root cause

`web/src/post.js:115` (before the fix): `float mist = mistOn > 0.5 ? mistAt(vUv, dc) : 0.0;`. Nothing excluded the
sky.

`mistAt()` (`post.js:91-106`) rebuilds each pixel's world point from depth. A sky pixel has depth 1, so its point lies
on the far plane, 300 m along the view axis.

- **Looking level:** that point is about 300 m away horizontally, past the backdrop ring. The ring factor
  (`post.js:104-105`) zeroes the mist. That is the only thing that "left the sky alone" (the header comment,
  `post.js:17`).
- **Pitched up:** the far plane tilts and the point lands a few dozen metres from you horizontally. It is then inside
  the ring ellipse (`backdrop.js:144-145`) but outside the walkable area (the edge lines and `mistBoxes`), so it gets
  full mist.

Projected onto the sky, that region is the ring ellipse minus the walkable strip, which is the lens with the stepped
hole.

## Fix (made, not deployed)

`web/src/post.js:115-117` now skips mist on depth-1 pixels:

    // never on the sky (depth 1: the dome on the far plane, and the backdrop panels over it): rebuilt from the far plane,
    // a pixel looked at upward lands just above you, inside the ring, and painted a lens of mist on the sky
    float mist = mistOn > 0.5 && texture2D(tDepth, vUv).x < 1.0 ? mistAt(vUv, dc) : 0.0;

The header comment (line 17) now reads "The sky (depth 1) and the backdrop ring ... are left alone".

- **Owner:** post.js belongs to the perf session 3d-director-04, which was messaged with the change and the reason.
- **What it changes:** only depth-1 pixels. These are the sky dome and the backdrop panels where they cover the sky,
  which the comment already meant to leave alone.
- **Ink:** unaffected. Ink fades out by 70 m (`inkFadeEnd`) and the sky is at 300 m.
- **Cost:** one more depth fetch per pixel.

## Proof

### One page load, the shader swapped live (`tools/sky_ab.mjs`)

Time, people, boats and the walker were frozen. Each frame was shot three times: a (as loaded), b (the other line
swapped in) and a2 (back to a, as the noise floor).

Before the fix (`ab_desk_high/`, a = old, b = fixed):

- Sky frames in third person changed 0.35-5.5%, all in the sky band.
- The first-person "up" frames in this run were not posed: a script bug that was later fixed.

After the fix (`ab_after_desk_high/`, a = fixed, b = old line put back):

| Frame | a vs b | a vs a2 |
|---|---|---|
| crown_up_h11 | 14.9% (the lens) | 0 |
| storyteller_up_h20 | 19.1% | 0 |
| storyteller_third_y270_h11 | 10.9% | 0 |
| crown_third_y0 / y270 | 0.18% / 0.63% | 0 |
| grain_wharf ground | 0% | 0 |
| crown ground | 0% | 0 |
| farmsteads ground | 0.019% | 0 |
| tea_house ground | 0.032% | 0.032% (the noise floor) |

The *_diff.jpg images mark the changed pixels in red: only the lens and band in the sky. The farmsteads 0.019% is on
hairline cracks in the countryside ground mesh, where the sky dome shows through (see "Side findings").

### Before and after, same frames

- `before_after_desktop.jpg`: run1 (before) vs run4 (after); desktop 1600x900, tier high, first person, five frames.
- `before_after_phone.jpg`: run2 (live site, before) vs run5 (check server, after); 390x844x2, tier low, third person.

## Runs

All runs went through `tools/chrome_slot.sh` on the check server (5190) with `?start=0`, except run2, which used the
live site.

| Run | Viewport and tier | Camera | Views | Hours | Code |
|---|---|---|---|---|---|
| run1_desk_high | desktop, high | first person; 4 directions at pitch 0.9 plus straight up (1.4) | storyteller, crown, grain_wharf, farmsteads, stalls, tea_house, gatehouse, street | 6, 11, 17, 20, 23 | before |
| run2_live_phone_low | phone, low (live) | third person, pitch 0.45 | crown, storyteller, grain_wharf | 11, 20 | before |
| run3_desk_low_third | desktop, low | third person, pitch 0.45 | crown, storyteller, tea_house, farmsteads | 6, 17, 23 | before (loaded before the edit) |
| run4_after_desk_high | desktop, high | first person | 4 views | 6, 11, 20 | after |
| run5_after_phone_low | phone, low | third person | as run2 | 11, 20 | after |

Each folder holds `sheet_<view>.jpg`. The raw shots were converted to JPEG.

## Ruled out

- **Backdrop panels** (`panels/panels_on_magenta.jpg`, `tools/panel_blobs.mjs`): no stray marks in their keyed-out
  skies; the strays are tens of pixels at the panel foot.
- **Moon** (`moon/`, `moon_1016/`): today it is a 9% crescent, up only at dusk (about 18:30-20:00), and hidden by the
  willows from the bridge. On 10-16 it stands higher: a crescent inside its thin ink rim with a soft halo, as designed
  (daylight.js "a flat lead-white disc, a thin ink rim, a pale halo wash"). It reads as a moon. Not changed.
- **Sun disc, stars, ink strokes** (the strokes fade out before the zenith), **tree cards, birds and UI**: nothing
  else odd in any shot. The vertical plaques over landmarks and the region banner are the intended ink UI.

## Side findings (not fixed)

- **Ground cracks:** the countryside ground mesh near farmsteads has hairline cracks (pale dotted lines on the ground,
  `ab_after_desk_high/farmsteads_ground_y90_h11_*.jpg`), where the sky dome shows through. This is likely T-junctions
  or gaps between ground pieces. It is for the countryside builder or export.
- **Test-hook note:** `__test.player.update` drives the first-person camera, so freezing it before the pose applies
  leaves the camera unposed.

## Next

- The lead deploys (skill `deploy-web`) with the post.js change.
- Recheck on the live site: look straight up at the bridge (V for first person, then drag up). The sky should be
  clean.
