# How Messenger's sky is made (study for the ink-UI look, 2026-10-12)

Study only. Messenger's code and textures are third-party: nothing here may be copied into the project.
Identifiers and uniform names are quoted, and the logic is paraphrased.

**Marks:**
- **[JS]**: read in `reference/messenger_study/js/App3D-DwM1eiaC.js`. Numbers are byte offsets.
- **[net]**: fetched from messenger.abeto.co into scratch only.
- **[shot]**: measured on public in-game screenshots (GIGAZINE).
- **[sim]**: our own re-run of the shader logic in node, scratch only.
- **[inf]**: our inference.

**What the user saw.** The ragged, flat "blocks" in the sky are real. The sky is one flat teal. On it lie flat,
paler cloud shapes cut by a hard threshold from a soft noise texture. The shared outline pass then draws a thin,
distance-faded ink line around every shape. There is no gradient sky and no sun disc. There is no time of day.

## 1. What it is technically

**In-game sky: class `sky` @1666498** [JS]. It is created in `presentScene` (@1742906).
- **Geometry:** `SphereGeometry(55, 32, 32)` (about 2k triangles), `BackSide`, `rotation.x = 1`.
  - It sits at the scene origin, which is the planet's centre. It does not follow the camera.
  - The planet's radius is about 28 m, so the sky is about 27 m overhead and about 47 m away at the horizon.
  - The camera's `far` is 175 (@1647833), so the sky is a real surface, not a far-plane backdrop.
- **Material:** an opaque `ShaderMaterial` (`hotReload:"sky"`, @1666838).
  - Uniforms: `uColor1 #75bdc3`, `uColor2 #9fe2e0`, `uColor3 #b9ebea`, and
    `tCloudNoise = clouds_noise_512.ktx2` (sRGB, repeat), plus the global UBO (`resolution`, `time`).
  - It sets no `depthWrite`, `renderOrder` or fog options. So it draws in the normal opaque pass, tests and
    writes real depth, and gets none of the world's `addFog`.
- **What it writes to the outline buffers (MRT):**
  - Colour alpha is the surface ID: `id = mix(0.01, 1.0, blend)`, so sky = 0.01 and cloud = 1.0.
  - `gInfo = (real depth, normal (0,0), outlineContribution 1.0)`.
- **Ink:** the `outlines` pass (@1602011, `customUniforms.planet`) takes 5 taps of ID, depth and normal.
  - Any ID jump above 2e-4 counts as an edge, so every cloud contour is inked in `#363a3c`.
  - The ink fades with view depth (`uOutlineFade (5, 80)`): about 70% overhead, about 40% at the horizon. That is
    why cloud lines look grey-teal and thinner than lines on the world. [inf, matches shot]
  - The world's silhouette against the sky is inked too.
  - A 3D LUT grade (`lut.ktx2`, 32³ RGBA16F) then applies to the whole frame, the sky included.
- **Per frame:** nothing; the uniforms are never set again.
  - `update()` (@1668897) would turn the sky 10% with the player (`PARALLAX_AMOUNT = 0.9`), but nothing calls
    it: it is not in `beforeRenderCbs`, and there are no `sky.` references.
  - So the sky is fixed to the world. Its clouds parallax strongly as you walk, like a near ceiling. [JS + inf]
- **Intro/title sky** (the planet from space, `social.jpg`; scene list @1595908) is a separate set:
  - `sky$1` (@1261508): flat `#75bdc3`, r = 600.
  - Mesh clouds: `intro/clouds.drc` with `cloudMaterial` (@1254855), `#F8F8F8` with an HSV-darkened shadow. The
    vertices are displaced at `floor(time*6)`, a 6 fps "boil".
  - `atmosphere` (@1278731): noise × fresnel, hard discard, additive `#568f66`.
  - `galaxies` (@1296092): noise-eaten cards with a hard `step(0.25)`, spinning in 2 fps steps.
  - `particles` (@1291757): 16 hand-drawn 16-px speck sprites (dots, rings, hooks, a dash), cut at alpha 0.5.

## 2. Look recipe (fragment shader @1667420–1668795) [JS]

1. **Cloud value:** `n = tex(uv·(1,2) + t) × tex(uv·(1,2))`, red channel.
   - Two samples of one soft fractal noise are multiplied. The texture has a single channel, R 24–249. [net]
   - One 512-px tile spans 360° around and 90° from pole to pole.
2. **Poles:** `n *= smoothstep(0.1, 0.2, 1 − |v − 0.5|·2)` hides the UV pinch.
3. **Two levels, not a gradient:** `blend = step(0.27, n)`. There is no smoothing, no dithering and no other
   banding.
   - A soft fractal cut hard gives a ragged contour, like a coastline or torn paper.
   - Small islands above the cut become isolated specks: the "small blocks".
4. **Colour:**
   - The sky body is the flat `uColor1`.
   - Clouds are flat `mix(uColor3, uColor2, screenUv.y)`: a faint screen-space tint, paler at the bottom of the
     screen.
   - On screen after the LUT: sky about `#68c8b8`, clouds about `#98e8d0`–`#a0e8d0`, line a soft dark teal.
     [shot]
5. **No other features:**
   - No sun disc, no moon, no stars, no horizon glow in-game.
   - The key light (`followCSM`, white, intensity 3) sits at a fixed offset `Spherical(100, 0.2π, −0.25π)` from
     the character's own facing (@1303900), so a disc could never agree with the shadows.
   - The world fog (`#93a2bf` → `#9ea7b8`, @1214273) never touches the sky.
6. **Coverage:** about 38% of the sphere at load, about 30% after a few minutes. [sim]
   - Seen from third person the shapes are huge, because the sky is close.
   - They read as big pale "continents" with darker teal gaps. [shot: GIGAZINE 00, 14, 15]

## 3. Time of day

- **None.** No `Date`, no `getHours`, nothing for night, sunset or dawn; the sky and light uniforms are
  constants. [JS]
- The devs say the 16×16 palette lets them "change the lighting or the mood of the whole world at once". The
  shipped build has one `atlas.png` and one LUT. [web]
- **The only motion:** `t = time × 0.0005`, where `time` is seconds since page start (@677549, UBO @912091).
  - Only one sample drifts, so the shapes change slowly instead of sliding. A full period takes about 33 min.
  - Every session opens on the same sky. [inf]
- The intro animates in stepped time instead (6 fps boil, 2 fps galaxies and specks): a stop-motion feel.

## 4. Cost

- **Draw calls:** 1, about 2k triangles.
- **Per pixel:** 2 bilinear fetches of one texture, plus a few `mix` and `step` operations. No shader noise and no
  octaves.
- **The ink line is free:** it comes from the world's outline pass (5 taps of `tInfo` + 5 of `tColor`).
- **Texture:** `clouds_noise_512.ktx2`, 512², ETC1S/BasisLZ, 10 mips, **74,409 B** [net].
  - About 175–350 KB on the GPU, depending on the transcode target. [inf]
  - It is shared with the water, smoke and cable shaders, so the sky costs about nothing extra.
- **Intro textures:** `clouds_noise_64` 2,305 B; `galaxy` 128², 4,678 B; `particle_sprites` 256×16, 1,608 B.
  [net]
- **No sky-specific mobile or LOD switch.** Global only: `adaptiveDPR` (it also halves the shadow map) and an
  outline width scaled by `min(1, height/1300)`.

## 5. Language our sky could take (ideas, not code)

Our sky is `Sky` in `web/src/daylight.js`:
- a camera-centred BackSide dome, r = 260 at 32×16, on the far plane, `depthWrite: false`, `renderOrder −1`;
- a smooth `pow(h, 0.55)` zenith-to-horizon gradient and a three-lobe sun glow;
- hashed round stars and a lit-phase moon, coloured by the hour `KEYS`.

It has no clouds, and nothing in it has a shape. Messenger's grammar, carried into ink wash:
- **A flat ground and a few flat washes.** The sky is paper or silk in one tone per hour (from `KEYS`). Clouds or
  mist are one or two flat washes with hard edges, cut by a threshold from a soft noise. No smooth gradient: at
  most a faint screen-space tint inside the washes.
- **Ragged contours carry the poetry.** A hard cut gives torn-paper edges and stray specks. Dithering or soft
  edges would turn it back into a photo sky.
- **The sky draws its own ink line.**
  - Messenger gets its line from the ID buffer. Our `post.js` finds edges only from depth and normals, and the sky
    gives neither (it is skipped by the normal pass, `world.js:223`).
  - So the contour has to be painted in the sky shader itself: a thin dark band where the noise crosses the cut,
    fading with height like Messenger's.
- **Shapes breathe, they don't slide.** Two samples, one drifting slowly over minutes. We could tie the drift to
  wall-clock time, so viewers at the same hour share one sky. [inf]
- **Stepped motion and a slight parallax.**
  - Moving in a few fps steps suits brush art.
  - Our dome sits on the camera, with no parallax at all. A small one, like Messenger's unused 10% `update()`,
    would make the sky read as a painted layer.
- **The hour lives in the colours, not in effects.**
  - Messenger needs only three colours. Per hour we could key a paper colour, a wash colour and a line colour:
    pale blue-grey by day, warm at dusk, dark ink blots or moonlit grey at night.
  - Keep our sun direction for the light. Draw the moon and stars as flat outlined shapes and hand-drawn specks
    (like the intro's speck sheet), not glows and hashed dots.
- **Budget:** one draw and two fetches of our *own* tileable noise, about 0.1–0.3 MB on the GPU. That fits the
  any-device target.

## 6. Open uncertainties

- `sky.update()` looks dead, but a hot-reload or dev-GUI call can't be ruled out; only a live capture would
  settle it.
- `lut.ktx2` was not decoded. The screen colours are measured from compressed screenshots, not computed.
- Draw order against the terrain (sorted by object origin, here the planet's centre), and so the overdraw, was not
  checked.
- The ETC1S transcode target varies by device, so the GPU memory figure is a range. The intro's `clouds.drc` was
  not fetched.
- No developer talk or article on the sky was found. The Awwwards case study covers outlines, the palette and LODs
  only. Lucendo's Awwwards conference talk was not seen.
- The [sim] coverage assumes sRGB decoding of R, as the loader's "srgb-repeat" mode implies.

## Sources

- Bundle: `reference/messenger_study/js/App3D-DwM1eiaC.js` (offsets above); `world_notes.md` and
  `dialogue_sound_notes.md`.
- Scratch-only fetches: `https://messenger.abeto.co/assets/images/` + `clouds_noise_512.ktx2`,
  `clouds_noise_64.ktx2`, `galaxy.ktx2`, `particle_sprites.ktx2`, `lut.ktx2`, `social.jpg` (title view).
- Screenshots: https://gigazine.net/gsc_news/en/20250929-messenger-browser-game/ (images 00, 14 and 15 show the
  sky).
- https://www.awwwards.com/messenger.html (the devs' case study); https://conference.awwwards.com/talks/vicente-lucendo
- Ours: `web/src/daylight.js` (`Sky`, `KEYS`), `web/src/post.js`, `web/src/world.js:92,223`.
