# Eyes: measured, then replaced (details pass, agent "eyes", 2026-10-13)

Brief: `gen/details/brief_eyes.md`. Where it stands: the end of this file.

## The measurement: `tools/eye_check.mjs`

For each shipped character (`web/public/assets/chars/<name>.glb`, webp 512) and its full-resolution source texture
(the rigged GLB's, what `build_character.mjs` starts from):

1. **Face plane.** The body (no `prop_`/`tack_` parts) in its rest pose (every vertex through `W_Head . IBM_Head`, so
   the quantized shipped GLB and the source give the same metres) is rendered orthographically along the head's
   forward axis at 0.25 mm a pixel: origin the Head joint, forward towards the `headfront` marker (levelled), up the
   world's up. The Head bone's own axes are not used: on scholar and sightseer they point forward. Surfaces more than
   25 mm in front of the nose-mouth region are left out (hat brims). Every pixel keeps its texel (uv), triangle,
   depth and n.fwd.
2. **Skin tone:** the median colour of the warm, mid-light, front-facing texels of the face's middle, then again over
   those near it.
3. **The eyes:** ink blobs (texels >= 38% darker than the skin) paired left/right: level (dy <= 7 mm), mirrored about
   the Head joint's line (midpoint within 20 mm: porter's and townsman's faces sit 12-15 mm off it), centres 35-110 mm
   apart, inner ends >= 12 mm apart (a moustache's halves nearly touch), areas within 3.5x, each blob >= 12 mm2,
   facing the front (mean n.fwd >= 0.6: not an ear), with skin between them and under them (>= half the texels
   skin-like: a hat band or a topknot pair fails). A pair with another such pair 6-35 mm under it is the brow pair; of
   the highest pair left and those level with it (within 8 mm) the biggest is the eyes (the irises, not the lid
   strokes beside them), then the better mirrored. If no pair is found the threshold rises to 50%, then 62% (an eye
   merged into a fringe at 38%).
4. **Each eye:**
   - its parts: the paired blob and the blobs beside it at the same threshold (an iris and lid strokes split by a gap
     of skin or sclera): within 4 mm across, centre within 8 mm, never more than 3 mm higher (the brow), < 150 mm2;
   - iris: the parts' columns at least half as tall as the tallest;
   - lid outline: the core grown through texels >= 12% darker than the skin or sclera-like (luminance >= 0.97 of the
     skin's, saturation <= 0.75 of it), in a band from 3 mm under the core to 1.5 mm over it, never into another blob
     nor within 1.5 mm of a big dark blob (>= 150 mm2: hair, a fringe); an eye that only shows up at 50-62% inside a
     big 38% blob ("merged", the fringe-touching dots of hat_traveller) only counts ink-dark texels;
   - width, height, aspect of the outline; **reach** = how far the outline runs past the iris, both sides summed;
     sclera = sclera texels in the outline's inscribed ellipse / the ellipse; eye/face width; left/right agreement.
5. **The verdict** (both eyes averaged): PASS when reach >= 6.8 mm and width >= 17.2 mm. "~" marks values inside the
   calibration gap (between the dots' highest and the passing faces' lowest).

Also per character: `eye_band` = the texels the shipped texture gives a 100 x 30 mm band round the eyes, the UV
islands they fall in, and per eye the **sliver** share: the part of the eye's surroundings on islands smaller than
6 texels at 512 (there the shrunk texture holds no drawing at all).

### Calibration (shipped textures, the brief's sets)

Passing faces: groom, archer, woman, youth, bearer, storyteller. Dots: boatman, butcher, monk, official.

| metric (mean of both eyes) | lowest passing face | highest dot | threshold (geometric mean) | margin (lowest pass / highest dot) |
|---|---|---|---|---|
| **lid reach past the iris** | storyteller 10.4 mm | monk 4.4 mm | **6.8 mm** | **x2.36** |
| **outline width** | storyteller 20.3 mm | butcher 14.5 mm | **17.2 mm** | **x1.40** |
| aspect | storyteller 1.37 | monk 1.14 | (1.25) | x1.20 |
| sclera fraction | archer 0.00 | monk 0.05 | does not separate | - |

The brief's first guess (width >= 22 mm and aspect >= 1.8) does not hold at the shipped 512: it fails 5 of the 6
passing faces (the storyteller's eye is an iris with a lid tail, 20 mm wide, aspect 1.4; the archer's an iris with
thin lid lines, no sclera). The lid's reach past the iris separates best, then the width; both are required.

Source vs shipped: at the source resolution the verdicts agree except grain_porter (source PASS~: its faint lid lines
blur away at 512) and scholar (source PASS, its eyes are destroyed at 512, below).

## Before (shipped GLBs, 2026-10-13 morning)

Files: `before/eyes.json`, `before/faces.jpg` (eye outlines green, iris red, brows blue; measured lid texels tinted
red, sclera cyan), `before/table.md`, `before/glb/` (every shipped character GLB and characters.json as they were),
`before/shots/` (GPU close-ups of the failing ones).

20 FAIL: boatman, butcher, camel_driver, carter, child, child_red (inherits child's texture), child_robed,
fortune_teller, grain_porter, hat_traveller, hat_traveller_dark (inherits), idler, inspector, monk, official,
official_rider, porter, robed_man, scholar, sightseer. Inside the margin: child_red, grain_porter, scholar FAIL~;
storyteller, townsman PASS~ (townsman's left eye reach 5.5, right 10.0: big round irises with sclera and short lids).
Not on the brief's visual list but failing by the numbers: porter, grain_porter, robed_man, scholar,
hat_traveller(+_dark). (The final tool was rerun on `before/glb/`; while it was refined, no character of the before
state crossed between PASS and FAIL.)

## The fix: `tools/eye_fix.mjs`, run by `build_character.mjs --eyes`

`characters/<name>.json` `"eyes": {"from": "<donor>", "why": ...}` (optional `eye`, `scale`, `bold`, `dy`).
`character.mjs build` passes it on; a variant (`body_from`) takes its base's, before its own recolour.

1. Target and donor are rendered and measured on the face plane as above (donor from its source texture).
2. The donor's eye (the wider one) is cut out with 3 mm round its outline, never into its brow; its ink is made
   0.5 mm bolder (each texel takes the darkest colour within that radius where it is ink-dark) so a lid line of one
   or two texels still reads at 512.
3. Scale: the ratio of the eyes' separations (dot centres / donor iris centres). The skin's own edge was measured too
   but hair, caps and ears cut it anywhere from 0.38 to 0.85 of the separation across the cast, so the separation is
   the face-width measure used. The donor iris goes on the dot's centre, the corners level with the target's eye
   line, mirrored for the other eye.
4. The old eye goes first: every texel >= 6% darker than the skin inside the old outline grown by 2.5 mm (under the
   brow) plus 0.75 mm, filled from the skin round it (Laplace membrane). On that clean skin the donor's eye: its
   skin-like texels carry only their shading (target skin x donor texel / donor skin), its ink, iris and sclera keep
   their colour, weighted by distance from the donor's skin; the patch fades out over 2.5 mm.
5. Written back through the texel map: every texel of every front-facing triangle seen in the window (inside first,
   then a 1.5-texel margin, so seams get every chart they belong to) whose 3D point is the visible surface there
   (within 1.5 mm of the face render's depth) gets the change at its face-plane point added.

Donors: **bearer** (an adult man; almond outline, white both sides of the iris, ink upper lid; source reach 20 mm,
width 27 mm, sclera 0.23) for all 14 men, **youth** (a boy's big iris under an arched lid) for child and child_robed
(child_red inherits). The soldier was tried for the officials and the young scholar: its lid lines are thin and the
result failed at 512 (official reach 6.5, inspector 2.8), so the bearer took them too.

Tested before any build (`node tools/eye_fix.mjs <name> '<spec>' --out <dir>`: applies in memory, measures the source
and a 512 webp shrink): all 16 PASS at both, every one beyond the calibration's lowest passing face except idler
(width 20.0, just under 20.3).

## Characters not fixed in the first round (fixed in round 2, below)

- **scholar**: its source eyes pass (reach 14.4, width 21.3, sclera 0.11), the shipped 512 destroys them. The eye
  band gets 302 texels of the 512 map (others 1100-7700) in 30 islands, median 3 texels; 39% / 63% of the eyes'
  surroundings lie on islands under 6 texels. No texture drawing survives that. Needs new UVs or a bigger texture.
- **hat_traveller, hat_traveller_dark**: the dots touch the fringe (they only separate from it at 62% darkness), and
  11% of the left eye's surroundings is UV slivers (a cluster of 2-10-texel triangles at the eye's upper inner corner,
  scattered over the atlas). With the bearer's eye the right eye reads well at 512 and the left one stays broken by
  the slivers in every placement tried (dy 0, -3, -4, -5, scale 0.85), and the measurement cannot keep the new lid
  line apart from the fringe's lower edge (outline 47 mm). Not shipped: it can't be verified by the numbers, and the
  left eye can't be drawn into those slivers at 512.
- Also seen: hat_traveller_dark's hat recolour (`radial_min` 0.056) catches the nose tip, a black blotch under the
  nose (visible in `before/faces.jpg`). Not an eye matter; left for the lead.

## Rebuild check (what else a rebuild changes)

`node tools/character.mjs <names> build --dry-out <dir>` (new: builds into a folder, leaves web/ and characters.json
alone) without eyes, then `node tools/glb_diff.mjs` (new: nodes, meshes, decoded accessors, skins, clips, materials,
textures, image pixels) against the shipped GLBs:
- identical: boatman, butcher, camel_driver, carter, grain_porter, idler, porter, official, official_rider, inspector,
  robed_man, fortune_teller, child, child_robed, child_red;
- sightseer: only the prop palette image (1528 -> 1524 bytes; the round-2 palette with the new cells; the fan's
  geometry and UVs identical): texture pixels only, so rebuilt;
- **monk**: prop_back_frame's mesh differs (1671 -> 1681 vertices: gen/props/back_frame.glb was rebuilt after the
  monk's last build, 2026-10-12 12:12). So the monk is not rebuilt: its new body image is put into the shipped GLB
  byte for byte (`tools/glb_swap_image.mjs`), props and palette untouched. Its next full build will also bring the
  newer back frame.

With eyes, every dry build differs from the shipped GLB only in the body image (monk also in its back frame, hence
the splice). Outside the eyes the 512 texels move by 3.4/255 on average (0.04% by more than 32): with the eyes the
texture enters the 512 shrink as PNG (lanczos from full resolution) instead of JPEG (shrunk in the DCT on load), as
the recolour variants' already did.

## Built (2026-10-13)

Under `flock /tmp/qingming_charbuild.lock`: `node tools/character.mjs boatman,butcher,camel_driver,carter,grain_porter,
idler,porter,official,official_rider,inspector,sightseer,robed_man,fortune_teller,child,child_robed,child_red build`
(status first: every clip ok, nothing paid), the monk built with `--dry-out` and its body image put into the shipped
GLB (`tools/glb_swap_image.mjs`), then `node tools/ktx2.mjs encode` and `check`.

- `glb_diff` against `before/glb/` (per character in `after/diff_<name>.txt`): all 17 "same apart from image pixels":
  nodes, meshes, decoded accessors, skins, the 17 characters' clips (names, channels, keys), materials and texture
  slots identical; only the body image changed (the sightseer's prop palette too: the round-2 palette, see above).
  `characters.json` byte-identical. The other 17 GLBs untouched (byte-identical).
- KTX2 (`after/ktx2.txt`): 17 encoded, 17 old copies dropped; check: 127 encoded, 0 to encode, 0 orphaned, PASS.
- Reproducible: the measuring code was refined after the builds (the eye's parts, the biggest level pair), so all 17
  were built again into a folder with the final code and diffed against the shipped files: 16 identical, robed_man's
  body image differed (its left dot measured from more parts). robed_man was rebuilt with the final code, KTX2 encoded
  again (1 encoded, 1 dropped; check PASS, `after/ktx2_robed_man.txt`), re-diffed (image pixels only). A rebuild of
  any of the 17 now gives the shipped file (the monk through the splice).
- `eye_check` again (`eyes.json`, `faces.jpg`, `table.md`, `after/run.txt`): every fixed character PASS, all beyond
  the calibration's lowest passing face (reach >= 14.5, width >= 22.3); every character not rebuilt measures exactly
  as before. The source column measures the source with the fix applied, as the build makes it.

## Before / after (shipped GLBs, both eyes averaged; PASS needs reach >= 6.8 and width >= 17.2)

| character | before | reach / width mm | after | reach / width mm | aspect | sclera | donor |
|---|---|---|---|---|---|---|---|
| archer | PASS | 13.8 / 22.6 | not rebuilt, same | | 1.66 | 0 | |
| bearer | PASS | 14.6 / 21.3 | not rebuilt, same | | 2.17 | 0.02 | |
| boatman | FAIL | 4.3 / 13.5 | **PASS** | 18.6 / 25.6 | 2.42 | 0.08 | bearer |
| butcher | FAIL | 3.8 / 14.5 | **PASS** | 25 / 34.5 | 2.58 | 0.19 | bearer |
| camel_driver | FAIL | 4.1 / 10.4 | **PASS** | 15.8 / 22.4 | 2.01 | 0.04 | bearer |
| carter | FAIL | 3.9 / 13.6 | **PASS** | 16.8 / 25 | 2.25 | 0.13 | bearer |
| child | FAIL | 3.9 / 15.6 | **PASS** | 14.6 / 29 | 1.51 | 0.05 | youth |
| child_red | FAIL~ | 4.5 / 16.4 | **PASS** | 14.5 / 28.8 | 1.5 | 0.05 | youth (child's texture) |
| child_robed | FAIL | 3.9 / 16 | **PASS** | 15 / 28.8 | 1.52 | 0.02 | youth |
| dark_hat | PASS | 11.4 / 21.5 | not rebuilt, same | | 1.93 | 0 | |
| elder | PASS | 14.9 / 23.6 | not rebuilt, same | | 1.99 | 0.04 | |
| farmer | PASS | 13.6 / 21.8 | not rebuilt, same | | 2.17 | 0.02 | |
| fortune_teller | FAIL | 5.8 / 14.3 | **PASS** | 22 / 30.1 | 2.44 | 0.16 | bearer |
| grain_porter | FAIL~ | 10.1 / 17 | **PASS** | 19.8 / 26.6 | 2.77 | 0.2 | bearer |
| groom | PASS | 19.3 / 30.8 | not rebuilt, same | | 1.75 | 0.22 | |
| hat_traveller | FAIL | 3.3 / 12.4 | **PASS** | 15.3 / 22 | 2.15 | 0.04 | bearer x0.75, -12 mm |
| hat_traveller_dark | FAIL | 3.5 / 12.6 | **PASS** | 15.5 / 22.1 | 2.13 | 0.06 | bearer (hat_traveller's texture) |
| idler | FAIL | 3.6 / 12.4 | **PASS** | 18.1 / 26.3 | 2.26 | 0.12 | bearer |
| inspector | FAIL | 2.6 / 9.1 | **PASS** | 16 / 23.3 | 2.29 | 0.03 | bearer |
| monk | FAIL | 4.4 / 11.1 | **PASS** | 23.1 / 30.9 | 2.74 | 0.19 | bearer |
| official | FAIL | 3 / 11.5 | **PASS** | 22 / 30 | 2.65 | 0.12 | bearer |
| official_rider | FAIL | 3.6 / 12.1 | **PASS** | 17.1 / 25.3 | 2.47 | 0.16 | bearer |
| porter | FAIL | 3.3 / 11.6 | **PASS** | 19.1 / 26.4 | 2.17 | 0.16 | bearer |
| robed_man | FAIL | 5.9 / 12.6 | **PASS** | 15.5 / 22.3 | 2.25 | 0.09 | bearer |
| scholar | FAIL~ | 10.1 / 14.9 | **PASS** | 16.8 / 24.4 | 2.29 | 0.04 | bearer + own face island |
| sightseer | FAIL | 3.5 / 13 | **PASS** | 18.9 / 27.4 | 2.22 | 0 | bearer |
| soldier | PASS | 12.4 / 21.5 | not rebuilt, same | | 1.75 | 0.17 | |
| storyteller | PASS~ | 10.4 / 20.3 | not rebuilt, same | | 1.37 | 0 | |
| straw_hat | PASS | 13 / 21.9 | not rebuilt, same | | 2.31 | 0 | |
| townsman | PASS~ | 7.8 / 18.6 | not rebuilt, same | | 1.42 | 0.03 | |
| tracker | PASS | 15 / 25.8 | not rebuilt, same | | 2.13 | 0 | |
| woman | PASS | 17 / 29.5 | not rebuilt, same | | 1.56 | 0.1 | |
| woman_pale | PASS | 17.5 / 30 | not rebuilt, same | | 1.57 | 0.1 | |
| youth | PASS | 13.5 / 24.3 | not rebuilt, same | | 1.5 | 0.02 | |

Per eye, left/right, with iris sizes, sclera, eye band texels and sliver shares: `before/table.md`, `table.md`.

## For others

- **children agent:** the child, child_robed and child_red textures changed (youth's eyes). A carried-child prop that
  takes the child's body texture should take it from the new `web/public/assets/chars/child*.glb` or the new
  `gen/characters/child/child_raw.glb` (full resolution, with the eyes), not from a copy made before 01:37
  2026-10-13. The idler's `eyes` field is in `characters/idler.json`, so any later idler build keeps the eyes.
- **performance session:** the 17 GLBs differ from yesterday's only in the body image bytes; layer the crowd LOD and
  per-clip files on these.
- **any later build** of these characters re-applies the fix from `characters/<name>.json` "eyes" (deterministic:
  the same inputs give the same texture); a variant takes its base's. The monk's next full build will also bring the
  newer back frame and prop palette.

## The GPU look

`tools/chrome_slot.sh node tools/eye_check.mjs <names> --shots <dir>` (chars.html on the check server 5190, idle at
1 s, props off, `focus(name, 0, 0.95, eye height - 0.05)`), before the builds into `before/shots/` and after into
`after/shots/`; `node tools/eye_check.mjs <names> --before-after before/shots,after/shots,before_after.jpg --at
"official_rider:745,140"` crops each pair round the pixels that turned from dot to skin or sclera (the rider's face
sits higher in its shot, so it is placed by hand). Idle bows the head, so the faces are seen from a little above.
Every pair shows dots before and lidded eyes after.

## Other agents' rebuilds

At 02:00 another agent rebuilt bearer, fortune_teller and idler (new clips; idler's GLB now differs from `before/glb`
in its clip list too). The fix came with them from the `eyes` fields: eye_check gives the same numbers as above
(fortune_teller 21.8/22.3 reach, idler 18.0/18.3), KTX2 check PASS. Later the child (02:43) and hat_traveller (02:27)
were rebuilt by it too, with the eyes.

## Round 2 (lead follow-up, 2026-10-13): scholar, hat_traveller, hat_traveller_dark, the nose

### scholar: the face gets texture space of its own (`"reuv"`)
`tools/eye_fix.mjs` `reuvEyes`, run first when the `eyes` spec has `reuv`, then the eye is drawn as before.
- **How it works.**
  - It picks every triangle of the face's front seen in the face render, by centroid: 0.95 eye separations either side
    of the midline, from 1.25 below the eye line to 0.65 above it, at most 40 mm across, turned at most 84° away.
  - It adds every triangle the drawn eye or the cleaned dot touches.
  - Those triangles are mapped by their face-plane position onto one island in free texels of the body texture. The
    island is packed by its own outline, a quarter turn allowed, with 3 texels of the 512 map kept clear round it.
  - The island first gets the texels the face shows now (baked from the face render, its margin filled outward).
  - Vertices the island shares with the triangles round it are copied: same position, normal, tangent, skin, new UV.
- **Data:** `characters/scholar.json` `"eyes": {"from": "bearer", "scale": 1.12, "reuv": {"move": "all", "face": "all",
  "face_top": 0.65, "max_mm": 2.5}}`.
- **Result:** 470 triangles → one island of 66 x 71 texels at (35, 341) of the 512 map, **1.95 mm a texel** (the
  other faces get 1.7-1.9); 111 vertices copied (4,236 triangles before and after).
- **Why one face island, not one island per eye at 1.2 mm.** The scholar's whole face is UV slivers, not only the
  eyes. Both versions were built and measured:

| version | mm a texel | eyes (reach / width) | colour step across the island border: after / before / source | error against the source inside / outside |
|---|---|---|---|---|
| one island per eye (touching the drawing) | 1.21 | PASS 15.8 / 18.8, 22.5 / 25.8 | **13.3** / 8.9 / 7.3 | 4.6 / 10.7 (before 14.2 / 11.1) |
| face slivers only, one island | 1.33 | PASS 15.3 / 15.5, 22.3 / 22.5 | 12.1 / 14.9 / 7.4 | 6.2 / 11.7 |
| **whole face front, one island (shipped)** | **1.95** | **PASS 16.8 / 16.8, 24.3 / 24.5** (eye x1.12) | **17.3 / 15.6 / 17.0** | 9.1 / 11.3 (before 11.3 / 11.4) |

  - In the per-eye islands the inside became right (error 14.2 → 4.6), but the border cut through smeared slivers:
    a step of 13.3, against 8.9 before at the same pixels. That is a new seam.
  - With the whole face front the border runs along the face's edge (hairline, ears, jaw). There the source's own
    step is 17.0, and the shipped step is 17.3, so no seam is added.
  - The nose, moustache and mouth are clean at 512 too (`before_after_round2_faces.jpg`).
  - A finer face island doesn't fit the free texels: at 1.5 mm it needs about 85 x 83 texels.
- **Checks:**
  - eye_check PASS;
  - eye band 302 → 1,379 texels; islands 30 → 6; sliver share 0.39 / 0.63 → 0 / 0.
  - `glb_diff` against the old GLB: "4236 → 4236 triangles, 3766 identical, 470 with only their uv changed, none
    added or lost"; nodes, skins and the 20 clips identical; images: the body texture's pixels.
  - Seam: `node tools/eye_check.mjs scholar --seam web/public/assets/chars/scholar.glb,gen/details/eyes/before/glb/scholar.glb,35:341:66:71`.

### hat_traveller (+ hat_traveller_dark): eyes under the fringe's slivers, no re-UV
- **Measured.** The right eye's surroundings are all on whole islands (≥ 150 texels of the 512 map). The left eye's
  are 42% on 33 sliver triangles (islands of 6-30 texels), along the fringe's lower edge. The dots sit right against
  that edge.
- **No free space for an island.** The atlas is 69.1% used and has no free rectangle of 30 x 18 texels with a 3-texel
  margin. Packed by outline:
  - the eye areas (70 x 77 mm each) don't fit at up to 2.5 mm a texel;
  - the left eye's slivers alone fit only at 2.4 mm a texel with a 2-texel margin, and stay broken at 512.
  Carving was tried: halving any of the big islands (a robe panel, a shoe) would blur it by 4-13/255 on average at
  512, and no single shrink freed a rectangle big enough.
- **What was done instead.** The bearer's eye, x0.75 of the separation scale, sits 12 mm under the painted dots, on
  the cheeks' whole islands, clear of the fringe. The dots themselves are cleaned away as before.
  - Data: `"eyes": {"from": "bearer", "dy": -12, "scale": 0.75}`.
  - At that placement the outline no longer runs into the fringe. Before, it ran along the fringe's edge and measured
    47 mm wide; now it is 22 mm, about the drawn eye's own size.
- **Checks:**
  - eye_check PASS: reach 15.5 / 15.0, width 22.3 / 21.8 (dark: 15.5 / 15.5, 22.3 / 22.0); left/right agree;
  - `glb_diff`: image pixels only (hat_traveller against its 02:27 build; against the old GLB the clip list differs
    too, by `ride_fan~steady`, the contacts agent's clip);
  - hat_traveller_dark: its body image was put into the shipped GLB (`glb_swap_image.mjs`). A full rebuild would also
    add that agent's `ride_fan~steady` to the variant, so it keeps its clips.
- The wide hat hides the face from chars.html's cameras, even from eye height at 2 m (`after/shots_level/`), so the
  look is the face-plane render in `before_after_round2_faces.jpg`.

### hat_traveller_dark's nose (recolour mask)
- **Cause.** The hat recolour's `radial_min` 0.056 also caught 46 face triangles: the nose tip and the cheeks in front
  of it reach 0.056-0.066 of the height from the head's axis. Their 9,037 texels turned black.
- **Why a new option.** None of `y` / `crown` / `radial_min` can drop them without losing hat texels. Raising
  `radial_min` to 0.067 loses 94 hat triangles; raising `y` to 0.875 loses 164. No hat triangle lies wholly inside
  radial 0.075 below 0.88 of the height, so `build_character.mjs` now has a mask option
  `"spare": {"radial_max": r, "below": y}`: faces with every vertex nearer the axis than r and the lowest under y are
  left alone.
- **Data:** `characters/hat_traveller_dark.json` `"spare": {"radial_max": 0.07, "below": 0.88}`, with a
  `recolour_why`.
- **Proof** (`node tools/eye_check.mjs hat_traveller --recolour-face <base>,<recoloured>`, full resolution):

| rule | recoloured texels on face triangles | on the rest of the body (the hat) | in gutters |
|---|---|---|---|
| old | 9,037 | 328,126 | 14,446 |
| new | **0** | **328,126** (the same texels: 0 differ between the two rules) | 14,175 |
| shipped build (with the eyes) | **0** | **328,126** | 14,175 |

### Built (round 2)
Under the lock:
- `character.mjs scholar,hat_traveller build`;
- hat_traveller_dark dry-built and its image spliced;
- `ktx2.mjs encode` (4 encoded, 3 dropped) and `check`: **128 encoded, 0 to encode, 0 orphaned, PASS**
  (`after/ktx2_round2.txt`).

eye_check over all 34: **34 PASS** (storyteller and townsman PASS~ as before, untouched). Every character not rebuilt
measures exactly as before. A dry rebuild with the final code reproduces boatman, robed_man, scholar and
hat_traveller byte for byte in content. child_red differs only by a clip another agent added to the child.

Images:
- `before_after_round2_faces.jpg`: the shipped textures on the face plane, before and after, for all three;
- `before_after_round2.jpg`: the scholar on the GPU.

### Prompts that ask for dot eyes (not edited; for the user)
All 29 character prompts say "dark dot eyes" (`prompts/char_turnaround.txt`, the shared sheet prompt, says nothing
about eyes):
`char_archer, char_bearer, char_boatman, char_butcher, char_camel_driver, char_carter, char_child, char_child_robed,
char_dark_hat, char_elder, char_farmer, char_fortune_teller, char_grain_porter, char_groom, char_hat_traveller,
char_idler, char_inspector, char_monk, char_official, char_official_rider, char_robed_man, char_scholar,
char_sightseer, char_soldier, char_storyteller, char_straw_hat, char_tracker, char_woman, char_youth`
(prompts/char_<name>.txt). porter and townsman (gen/v1) have no prompt file.

## Where it stands

All 34 characters PASS. 20 fixed:
- 17 by a donor eye;
- scholar with its own face island;
- hat_traveller and hat_traveller_dark with lowered eyes.

hat_traveller_dark's nose is clean, KTX2 check PASS, nothing deployed.
