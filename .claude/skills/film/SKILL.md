---
name: film
description: Film shots of the qingming world for video - a shot spec (shots/<name>.json - an orbit or a keyed camera move through map places) -> a path check -> a quick preview -> a frame-stepped render (supersampled, motion blur, never a dropped frame) -> MP4 / ProRes / PNG frames + the camera of every frame (JSON) + a manifest. Use when making a short video, a camera move, a fly-through, an orbit or turntable, a push-in or dive, a time-lapse, stills for editing, or when a video-editing tool or agent asks for footage of the world.
---

# Filming the world (qingming/)

The user, 2026-10-13: short videos of the world ("a slow painting" orbit; a quick push into the scene, e.g. from high
over the river down to what the people there see), made entirely by agents through CLIs, for video editing tools.
Nobody records a screen. The page itself is filmed: `web/src/film.js` evaluates a shot into a camera pose at any time
and steps the world one frame at a time on a film clock; `tools/film_shot.mjs` drives it and encodes. In the game, the
same idea is the 鳥瞰 view (C or the HUD tile, `web/src/birdseye.js`).

## Why this way (decided; don't re-litigate)
- **Frame-stepped, not real time.** While a film runs, `performance.now` is the film clock, which only `step()` advances
  (CCapture.js's trick). People, boats, water, sky, wind, birds and cloth all run on film time, the crowd finishes its
  pose bakes inside each frame, and slow 4K captures never drop or stretch a frame. A screen recording would.
- **The page, not Blender.** The ink pass, the people's routines, the tree cards and the daylight exist only in the
  page.
- **Shots are data,** taken from the scroll map's places, so a shot is re-rendered unchanged after the world improves.

## The loop: check -> preview -> final
Always run against the check server inside a Chrome slot (machine rules: skill `scroll-section`, "Machine resources"):
```
tools/check_server.sh start                     # once; http://127.0.0.1:5190
tools/chrome_slot.sh node tools/film_shot.mjs shots/<name>.json --mode check     # ~15 s
tools/chrome_slot.sh node tools/film_shot.mjs shots/<name>.json --mode preview   # ~20-30 s
tools/chrome_slot.sh node tools/film_shot.mjs shots/<name>.json                  # final, minutes
```
1. **check:** resolves every place, tests the camera's path against the world and writes 5 stills (0/25/50/75/100%)
   with the camera position on each: `<name>_check.jpg`, `<name>.check.json`. It exits 2 on path errors (the camera
   through a wall, the ground, a deck, a hull or a trunk); final refuses them too unless `--allow-errors`. Warnings:
   - through roofs, crowns or awnings (drawn but not solid);
   - the look point hidden;
   - the lens within 0.3 m of a surface.

   Read the stills: they are the fastest way to see a key in the wrong place. Fix keys with `film_places`, not by eye.
2. **preview:** the whole motion at 640x360, 15 fps, no supersampling or blur (`<name>_preview.mp4` + sheet). Judge
   timing and framing here. Watching it is optional; the sheet (12 frames) is usually enough.
3. **final:** the spec's render settings, flags over them. Writes:
   - `<name>.mp4`, `.mov` (ProRes), `frames/`;
   - `<name>.camera.json`, `<name>.manifest.json`;
   - `<name>_sheet.jpg`.

Exit codes: 0 done, 1 failed (a place unknown, the page didn't load, the encoder failed), 2 path errors. Page errors
don't stop a render: they are listed in the manifest (`page_errors`), so read it. `node tools/film_shot.mjs --help`
prints every flag. Templates: `shots/crown_orbit.json` (a slow orbit) and `shots/river_dive.json` (a dive along the
river to eye level); their renders are in `gen/films/`.
Outputs go to `gen/films/<name>/` (`--out` elsewhere). They are generated media, not source; shot specs in `shots/` are
source.

## Finding places: `tools/film_places.mjs` (no browser)
```
node tools/film_places.mjs                         # sections in scroll order, their X/D extent, every camera view
node tools/film_places.mjs rainbow_bridge          # that section's views and every map thing
node tools/film_places.mjs --near 165,17,22 --kind veh,water   # boats and water within 22 m of X 165, D 17
node tools/film_places.mjs --grep "grain|mast"     # by name (regex)    --json for machines
node tools/film_places.mjs --painter S3.fig.deck_capped_shouter_19492   # the painter's view there (bearing, angle, scan px/m)
```
Kinds: view, bld (buildings), fig (figures), ani (animals), veh (boats, carts, sedans), tree, prop, str (structures),
water, road, grd (ground). Then read `map/text/<S>.md` for what a place *is* (the painting's own description).

## The shot spec (`shots/<name>.json`)
```jsonc
{
  "name": "river_dive",                 // output base name (default: the file name)
  "about": "what the shot shows and why",
  "hour": 10,                           // solar hour 0-24 (default 10). flow: game minutes per second (time-lapse)
  "seconds": 20,                        // duration (an orbit: required; a move: default its last key's t)
  "fps": 30, "size": [1920, 1080], "ss": 2, "blur": 1, "shutter": 0.5,   // render settings (flags override)
  "formats": ["mp4"],                   // mp4 | prores | png
  "warm": 3,                            // seconds the world runs before frame 0 (people settle, crowd bakes)
  "stand": "<place>",                   // where the world is centred (streaming window, shadow box). Default: the
                                        // orbit's centre, a move's last look point
  "window": 1,                          // sections loaded either side of the stand's section ("all" for long moves)
  "settings": { "boats": "waves" },     // world settings for the shot (the page's settings keys)
  "shadow": { "half": 64 },             // optional: a bigger shadow box for wide shots (default: high tier's 48 m)
  "show_avatar": false,                 // the player's own body (hidden by default)
  "poses": { "S3.fig.deck_capped_shouter_19492": { "clip": "lean_over", "offset": 0, "speed": 1 } },  // below
  "passes": ["depth", "line"],          // extra images per frame for compositing (below); "depth_far": 300
  "track": true,                        // people's head/feet pixels in the camera JSON (false, or [ids] for some)
  "scan": "<place>",                    // the render-to-scan affine on any shot (a painting camera sets its own)
  "camera": { ... }                     // below
}
```
**Coordinates:**
- The map frame, in metres: X along the scroll, D into depth (north), H up.
- Bearings (deg) follow the views' facing_deg: 0 = +X, 90 = +D.
- Water is at H -0.7; a bridge deck or tower has its own H.

**A place** is any of:
- `"crown"`: a camera view. Its point is the floor it stands on. A name that two sections use is `"<section>:<view>"`.
- `"S3.veh.boat_mast_lowering_19518"`: a map ID. A figure's bare id works too.
- `[X, D]`: the ground under that point.
- `[X, D, H]`: an exact point.
- `{ "at": place, "up": m, "offset": [dX, dD, dH], "follow": true }`: shifted. `follow` tracks the live person,
  animal or boat with that ID every frame (only for things in the loaded window).
- `{ "around": place, "dist": m, "deg": bearing, "el_deg": angle, "up": m }`: the point at that bearing, distance and
  angle above level from another place.
- `{ "painter": place, "dist": m, "up": m }`: the painter's eye for a place, `dist` back along the scroll's own
  projection there. Use it as a move's first key to push from the painting into the world.

**Orbit**, round a place:
```jsonc
{ "kind": "orbit", "around": "crown", "look_up": 1.0, "dist": [38, 32], "el_deg": [34, 28],
  "from_deg": 150, "turn_deg": 60, "fov": 38, "ease": "sine" }
```
- `[from, to]` drifts a value over the shot.
- The camera sits at bearing `from_deg + turn_deg * ease(t/T)`. A positive turn goes counterclockwise seen from above.

**Move**, through keys:
```jsonc
{ "kind": "move", "ease": "inout", "keys": [
  { "t": 0,   "pos": [205, 10, 46], "look": [140, 15, 3], "fov": 40 },
  { "t": 9.5, "pos": [156, 12.5, 1.8], "look": { "at": "S3.veh.boat_mast_lowering_19518", "up": 2 }, "fov": 46, "roll_deg": 0 } ] }
```
- Positions, look points, fov and roll run on time-keyed Catmull-Rom curves through the keys, so the motion is
  smooth.
- `ease` warps the whole move's time: linear | in | out | inout (start and end at rest) | sine.
- Hold still by repeating a key. A fov missing from a key carries the previous one.

**Painting**, the painter's view of a figure (the trailer's swap: a painted figure on the scan becomes its live self):
```jsonc
{ "kind": "painting", "at": "S3.fig.deck_capped_shouter_19492", "up": 1.2, "dist": 45, "fov": 8.5 }
```
- The scroll is an oblique parallel projection (`map/frames/<S>.json`). The camera looks along its null direction at
  the figure (S3's shouter: bearing 292.8, 31.5 deg down), computed from the section's frames; no solver.
- With a long lens the render then matches the scan up to one 2D affine. Every frame's camera carries `scan` (below).
- `dist` and `fov` take `[from, to]` for a push. The affine's residual falls with distance: 45 m at fov 8.5 gives a
  mean 3.5 scan px (max 9.5) over 6 x 4 x 3 m round the figure; double `dist` and halve `fov` to halve it.

**Poses:** `"poses": { "<figure or walker id>": "clip" | { "clip", "offset": s, "speed": 1, "facing_deg" } }` plays
that clip for the whole shot, with the figure's routine paused (a walker stands still). `speed: 0` holds the pose at
`offset`, to match a painted pose. The clip runs from `prepare`, so warm moves it on unless it is held. A wrong clip
name fails with the character's clip list (`web/public/assets/chars/characters.json` lists them too).

## Capture settings: use these
| what | setting | why |
|---|---|---|
| frame rate | **30 fps** | the crowd's poses are baked at 30 fps (crowd.js FPS); at 60 every crowd pose shows twice (judder), and at 24 or 25 the steps are uneven. Ask for 30 and let the editor conform |
| sharpness | **ss 2** for finals (renders 3840x2160 for a 1080p frame, Lanczos down) | clean ink lines and edges; the ink's line weight is scaled to match the game's |
| 4K delivery | `--size 3840x2160 --ss 1` | ss 2 at 4K is an 8K buffer: too slow, no gain |
| motion blur | **blur 1** for slow moves (orbits under ~8 deg/s, pushes under ~3 m/s); **blur 4** for fast pushes and dives; **blur 8** for whip moves; shutter 0.5 (180 degrees) | without blur fast moves strobe; each blur sample costs a full capture |
| delivery | `mp4` (H.264 High, CRF 14, BT.709, faststart) | plays everywhere, visually lossless |
| editing | `prores` (ProRes 422 HQ, 10-bit) | survives grading and re-encoding |
| compositing / frame-exact tools | `png` (frames/<name>_00000.png...) | lossless, about 3-4 MB a 1080p frame |
| capture speed | `--capture jpeg` for MP4-only deliveries (2.5x faster); png (default) for ProRes and PNG masters | capture is about 97% of the render time |
| light | hour 10 (crisp, default); 15.5-17 (warm, long shadows); 6-7 or 17.5-18.5 (low sun); night 21+ (moon, lamps) | the world's daylight comes from the hour (daylight.js) |
| time-lapse | `"flow": 30` (game minutes per second) with `hour` the start | the light and shadows move; people keep their pace |

## Camera speed: what reads well
- **Slow painting (orbit):**
  - 2-4 deg/s (60 deg in 15-25 s);
  - dist 25-40 m, el_deg 25-40 (near the painting's own angle), fov 35-40;
  - ease `sine` or `linear`; a small drift in dist or el (`[38, 32]`) adds life.
- **Push-in or dive:**
  - 6-10 s over 50-80 m, about 7 m/s average and 12-15 m/s peak, ease `inout`, blur 4;
  - end 8-15 m from the subject at eye level (H 1.4-1.8 above its floor; over water, H 1.5-2), fov 44-50;
  - slow the last 2-3 s with a key close to the end key.
- **Crane or reveal:** rise at 1-3 m/s; tilt down as you rise to keep the subject.
- **Tracking:** a look point with `follow: true`; a camera position following the same thing (`at` + `offset` +
  `follow`) gives a side-by-side track.
- **Avoid:**
  - turns faster than ~25 deg/s at fov 40 (strobing);
  - looking straight down (no "up": the look is nudged);
  - the lens nearer than 0.5 m to anything;
  - passing through tree crowns (drawn, not solid: the check warns).

## Framing this world
- **The world is a long strip:** about 40 m deep (D -4 to 35) and hundreds of metres along X (the eight sections, X -110
  to 384). From high up, a camera looking across it (bearings near 90 or 270) sees the mist and painted panels past
  its edge. For wide shots, look along X (bearings near 0 or 180, the river and the street run that way) or stay low.
  The mist is the designed edge (map/BUILDING.md), never a bug to hide with props.
- **Only what is painted is there** (loyalty): nothing may be added for a shot. Choose angles; don't stage things.
- **Fog:** from 45 m it thins to 230 m (by the hour), and the camera's far plane is 300 m. Shots from more than about
  80 m away go pale.
- **Window:**
  - Only the stand's section and its neighbours are loaded (`window` 1). A move longer than about 150 m along X needs
    `"window": "all"` (slower to load, about 1.6 GB of Chrome) or a stand in the middle.
  - Shadows cover 48 m round the stand. For wide shots, raise them with `"shadow": { "half": 80 }` (softer shadows).
- **Things move:** walkers walk, boats sail if `settings.boats` is waves. A static map ID gives the thing's painted spot;
  `follow` its live body.

## Throughput (measured 2026-10-13, RTX 4070 SUPER, a check slot, an idle machine)
Rendering a frame takes about 10 ms; capturing it from the page takes about 97% of the time. So the cost is
captures: frames x blur.

| run | capture | rate | example |
|---|---|---|---|
| check | - | about 15 s with the page load | - |
| preview, 640x360 | png | about 16 frames/s | river_dive (9.5 s) in 17 s with the load |
| final, 1080p, ss 2 | png (lossless, default) | about 2.5 captures/s (384 ms each) | crown_orbit: 20 s, blur 1, 600 frames in 4 min; river_dive: 9.5 s, blur 4, 285 frames in 7.2 min |
| final, 1080p, ss 2 | `--capture jpeg` | about 6 captures/s (117 ms each) | river_dive at blur 4: 1.6 frames/s, so 3 min |

- **Use `--capture jpeg` when delivering MP4 only.** It is q95 before the Lanczos down, a mean 1.75/255 off PNG, and
  invisible after H.264.
- **Keep the default PNG** for ProRes and PNG masters.
- **Planning a final:** minutes ≈ seconds × fps × blur ÷ (captures/s × 60). For example, 30 s at 30 fps with blur 4
  and jpeg is about 10 min; with png about 24 min.
- Run finals in the background (Bash `run_in_background`), one per slot. Machine load slows them but never changes
  the film.

**Sizes:**
- MP4 at CRF 14 is about 4 MB per second.
- ProRes 422 HQ is about 29 MB per second, about 1.7 GB a minute.
- PNG frames are about 3–4 MB each.

## For editing tools: the outputs
- `<name>.camera.json`: `{ fps, size, frames: [{ frame, t, pos, look, quat, fov, roll, aspect, look_px, people, scan }] }`.
  - `people` (unless `track` is false): everyone in frame within 150 m (animals too): `{ id, clip, head, top, foot,
    d, occ }`. head is the middle of the head, top the top of it, foot between the feet on the ground; all in frame
    pixels from the top left. d is metres from the lens; occ `[head, foot]` is 1 where a solid surface hides it. The
    crowd's bodies are posed in the shader, so film.js poses a private copy of each rig at the person's clip time.
  - `scan` (painting cameras, or the spec's `scan`): `M`, the 2x3 affine from frame pixels to pixels of
    `reference/scroll/qingming_commons_38414x1800.jpg`, and `res_px` [mean, max]. For a painted figure, `subject`
    gives the painted head, foot and box, the live head and foot carried onto the scan, and `shift_px` (painted minus
    live). `scan px = M . frame px + shift_px.head` lays the living head on the painted one, with no hand-picked offset.
  - pos and look are in the map frame.
  - quat is in the page frame (x = X, y = H, z = -D; the three.js camera looks down its -z).
  - fov is vertical, in degrees.
  - look_px is where the look point lands in the frame (0..1 from the top left), for tracking titles and overlays.
- `<name>.manifest.json`:
  - the spec's path and settings: frames, seconds, fps, size, ss, blur;
  - the page state: stand, drawn buffer, tier, loaded sections;
  - the check result, timing (frames/s, step and capture ms), outputs and any page errors.
- `<name>.check.json`: the path check alone.
- **Passes** (`"passes"` or `--passes depth,line`), drawn from the ink pass's own buffers right after each frame:
  - `depth/<name>_depth_00000.png`: 16-bit grey, linear view depth. metres = value / 65535 × `depth_far` (default
    300, the camera's far plane; the sky is 65535). For haze that follows real distance in AE.
  - `line/<name>_line_00000.png`: the frame's own ink lines alone, black on white, with the same weight, break-up,
    fade and mist. For the ink-on-silk beat (Multiply over silk; invert for a luma matte).
  - Each pass costs one more capture (about +100% time for both at 1080p). The manifest's `passes` says how each is
    encoded. Blurred frames take their passes at the middle sample; passes are never blurred.

## The page API (for new tools)
`window.__test.film` on world.html once loaded (`?start=0&tier=high&adapt=0&sound=0`):
- `load(spec)`: compile a shot; returns { T, about, painter, scan }.
- `prepare({ ss, shadow, track })`: hide the UI and avatar, set the hour and settings, centre the world on the stand
  (waits until the stand's section is in, re-teleporting if the page's own spawn took the window back), apply the
  poses, then hold the clock.
- `warm(seconds, fps)`: run the world at shot time 0.
- `step(t, dt, quick)`: advance the world by dt, put the camera at shot time t, render; returns the frame's camera
  (quick: without people and scan).
- `check(samplesPerSecond)`: the path check.
- `pose(t)`, `place(p)`: evaluate without stepping.
- `pass('depth' | 'line', { far })`: draw the frame just stepped again as that pass (the CLI captures it).
- `end()`: real clock, UI, avatar, poses and routines back.
- `play(spec)` / `stop()`: a live, real-time preview in a normal page (for a person watching; no hold).

## Pitfalls
- Run check first. A key placed "by eye" ends up inside the bridge's timbers (it happened on the first dive).
- The bridge and other set pieces are diagonal to X: read their feet and crown from `film_places`, never assume.
- A place the window doesn't hold has no ground yet. `[X, D]` without H and map IDs without H are raycast after
  `prepare`; make sure the stand loads their section.
- Don't film while a regression or bench runs on the same machine. It only slows things down; film time is safe.
- `gen/films/` grows fast (ProRes about 1.7 GB a minute, PNG frames about 3-4 MB each). Delete trial renders.
- Stills for key art: `--from 4.0 --to 4.034 --formats png` renders the one frame at 4.0 s (`--size 3840x2160 --ss 1` for a 4K still).
