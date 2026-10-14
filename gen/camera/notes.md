# Camera views and filmed shots (2026-10-13)

The user: "a camera view that you can switch on almost at every setting, in every place ... on top and captures. It
sort of rotates to give you the feeling", with a shortcut on the main game UI. Next: short videos, (1) a slow
rotation ("a slow painting") and (2) a quick push into the scene, e.g. from high over the river down to what the
people there see.

## 鳥瞰, in the game (done)

- `web/src/birdseye.js`: a layer over the walking view.
  - The camera cranes up (2.4 s) to 24 m at about 40 degrees, near the scroll's own angle, with a 40-degree lens
    (walking uses 55). It then circles you once every 110 s.
  - It comes back down (1.2 s) to exactly the view you left.
  - Drag turns or tilts it; the wheel or a pinch sets the distance.
  - It keeps a clear line to you: blocked, it climbs first, then comes nearer; under a roof it stays under it.
- How you get in and out:
  - Turn it on with the HUD's 鳥瞰 tile (beside the eye and figure tiles) or C.
  - Walking, C, V, Esc or the tile bring you down.
  - The walking chrome fades out meanwhile; the sealed tile stays.
- On phones the HUD is a 2×2 block beside the time instrument.
- `__test.birdseye` exposes it for tools: `set(on)`, `el`, `dist`, `spin`.
- Checked:
  - crown, storyteller and under_arch, from first and third person;
  - C is blocked over the painting;
  - phones at 390 and 360 px;
  - low tier at the crown: 161 → 162 draws, about +5% triangles.

## Filmed shots (built 2026-10-13; the how-to is the skill `film`)

The user: "Another agent will be doing everything and needs to know exactly what the best ways are to capture and at
what speed to capture." So everything is a CLI plus a skill (`.claude/skills/film/SKILL.md`).

- `web/src/film.js`: the shot rig (orbit, keyed move), places (views, map IDs, coordinates, live follow), the film
  clock, the path check, and a live preview (`play`).
  - The film clock overrides `performance.now`, so every animated system follows it with no edits; world.js `tick`
    parks while it is held.
  - In film mode people pose every frame (`people.everyFrame`, people.js).
- `tools/film_shot.mjs`: check → preview → final.
  - The final is 1080p rendered at 4K (ss 2) with Lanczos down, optional motion blur (sub-frames averaged), and
    ffmpeg H.264 / ProRes / PNG.
  - It also writes the per-frame camera JSON, a manifest and a contact sheet.
- `tools/film_places.mjs`: views and map IDs for authoring, no browser.
- The first shots are `shots/crown_orbit.json` (slow orbit over the Rainbow Bridge) and `shots/river_dive.json` (from
  high over the 汴河 down to the boat lowering its mast). Renders are in `gen/films/<name>/`.
- Lessons:
  - The first dive's keys, placed by reasoning, ended inside the bridge's timbers: the bridge is diagonal to X. Check
    mode caught it; plan keys from `film_places`.
  - Wide high shots looking across the 40 m strip show the edge mist: look along X.
