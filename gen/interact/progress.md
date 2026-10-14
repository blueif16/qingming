# Interactions round (2026-10-13; lead session 3d-director-07)

The user asked for three things (their words, condensed): the gate tower's drum you can knock on and hear, with the
town reacting (the birds living in the trees fly up, the leaves rustle); a couple of soft glowing spots at the best
scenic places, visible even by day, that trigger a rotating view when you walk onto them; and a little interaction
with the surroundings: on the bridges, do the same pose as the people leaning there looking down at the water (a few
such group poses, not many).

## What landed (page side: this session)

- `web/src/interact.js` (+ `interact.css`), data `web/public/assets/interact.json`. Hooks: world.js (import, `interact`
  and `ambient` kept, `interact.update(dt)` after film.apply in tick, `interact.drive()` at the top of updateAvatar,
  `__test.interact`), player.js (`eyes()`: the first-person camera is placed even while frozen), birdseye.js
  (`vista()`: the same crane and circle round a chosen point, armed only once the walk that brought you is let go),
  ambient.js (`startle()` and the GPU "burst" path 5: out of a crown with a hard wheel, away, dwindling; home again
  after 24-48 s, the same path backwards into the crown), wind.js (`WIND.shake`, `qmShakeAt`) and trees3d.js (the
  leaves shiver with it).
- **擊鼓** (gate, S5.prop.tower_drum_6898, mesh g_drum__nocol): E in the hall facing the drum -> a short walk to its
  nearer skin (east or west; the drum's axis runs along X), camera inside the hall (its walls are not colliders, so the
  camera has fixed spots); every E is a stroke: drum_strike (new), the skin swells, two ink rings, a camera jolt. The
  first stroke of a while also: a cut outside (south-east, above the trees at the wall's foot) for 4.2 s to see the
  birds go (38-40 birds: sparrows and crows from the 9 nearest crowns, pigeons off the tower roof; the ground sparrows
  flush), flock_burst (new) at the nearest crown, bird_takeoff at the next two, wind_gust's rustle; the watchman
  (tower_watchman) calls out by the hour (day / dusk / night lines, 繁體 with _en). Walk to leave.
- **觀景** four spots: 隋堤煙柳 (countryside great_willows), 汴河 (canal towed_boat), 虹橋 (rainbow_bridge crown), 城樓
  (gate, the wall-top terrace east of the tower stair, off the way up to the drum). Glow: one instanced draw (orb +
  cinnabar brush ring on the ground + a faint shaft seen from afar), no texture, writes the empty normal (no ink).
  Stepping on one: 鳥瞰-style crane and slow circle at the place's own angle/distance/lens for ~20 s, letterbox bars,
  the name in brush (region banner look), "移步即返"; the landmark is marked found. A spot wakes again 3.5 m away.
- **同姿** three spots: the moat bridge's two rails (lean_chin~moat_rail, standing lines and free ranges from the
  painted watchers), the Rainbow Bridge crown rail (slots from the clip round), the storyteller's ring (crane, outer
  edge 3.35-4.6 m; inside 3.2 m facing him E is his talk). E -> short walk on, the clip, the camera over the water
  looking back at the row (the painter's side), mirrored away from tree crowns; E (起身), Esc or a walk stands you up.
  The near talk always wins E (capture-phase listener checks talk.host / talk.conv first).
- Sounds: set `sounds/interact.json` (drum_strike take 0, flock_burst take 1; picks read from envelopes and band
  levels), `tools/sound_web.mjs` SETS += 'interact'. Fonts: roles.json sources += interact.json (display: names, subs,
  seals; text: prompts; lazy talk: the watchman's lines); main subsets 183.5 -> 188.9 KB.

## Clip round (background agent, brief `brief_clips.md`, records `clips_progress.md`)

lean_chin / lean_chin~moat_rail / lean_over + crown IK slots / crane / strike_drum (t2m prime take + drumstick prop)
for the 8 playable characters; output `slots.json`, checks `clips_check.json`. When it lands: copy the crown slots
and the drum's strike (clip, length, hit_s, stand X per side) into interact.json (`join[crown_rail].slots`,
`drum.strike`, `drum.stands`), and the moat rails' lines/free ranges if they differ.

## Checks done (page probes: `gen/interact/tools/probe.mjs` in a Chrome slot, screenshots in the session scratchpad)

- drum: prompt shows facing it within 2.6 m; strike -> 38-40 birds out, 3 sparrow groups flushed, watchman bubble;
  the cut outside shows crows and pigeons over the tower.
- vistas: tower, crown, willows, river each fire on arrival, frame + title show (the frame sits outside .qm-ui, which
  鳥瞰 fades), a walk brings you down (player unfrozen, spot re-arms after 3.5 m). The crown's circle centre must be
  above the deck (a centre under it trapped the camera under the planks): pivots are the spot itself unless `around`.
- poses: moat near/far rails with the sightseer: lean_chin~moat_rail in the row, camera over the water.

- Regression (tag `interact`, 21:18, before the clip round's builds): world 211/211, boats 12/12, rides 5/5, people as
  the baseline (only the two stale gate road spots, X 7 D 3.9 and X -8 D 4.1; sizes 0). Viewpoints don't fire on a
  teleport (a scene view, the tools' goto): only walking onto one.

- 21:4x: another session deployed qingming mid-round, so the interactions are off by default (`DEFAULT_ON = false` in
  interact.js; `?interact=1` turns them on). The default page checked clean with it off.

- Clip round landed (88/88 PASS in `clips_check.json`; cast_clips_check and eye_check pass; existing animations
  byte-identical): merged by `gen/interact/tools/to_interact.py` into interact.json (moat rails per character, root
  held at H -0.01; crown slots player_crown_a/b, 4.75 and 5.6 m down the ramps since the crown's rail is full; the
  child's own clips and spots; the drum's strike_drum, hit 1.13-1.14 s, per-character stand spots, the drumstick shown
  only while it plays). Checked in the page as the official: the stick meets the skin; leaning on the moat rail and at
  crown slot a (the child holds the rail top); craning at the storyteller.
- The storyteller's spot is now three slots at the crowd's outer edge (his listeners stand north-east and east of him,
  not in a ring; a ring point south of him stood alone): ring_se, ring_e, ring_s, 3.3-3.9 m from him, 3-6 listeners
  within 1.6 m, 0.8 m+ clear of everyone and 3 m+ of the walkers' paths.
- Regression with `?interact=1` (tags interact_on, interact_on2): boats 12/12, rides 5/5, people as the baseline; world
  209/211 then 211/211 on the repeat (the two S2 bank walks failing once were crowd timing: the same walks pass with
  interact on and off in isolation).
- Two deploys by the flicker session (3d-director-03) went out with the interactions off (DEFAULT_ON = false); the live
  ?interact=1 is an earlier state than the files now.

## Next

1. The user looks (local: http://127.0.0.1:5190/world.html?interact=1; the check server serves the files as they are).
2. On sign-off: `DEFAULT_ON = true` in web/src/interact.js, then a deploy through the lead session.
3. Open (theirs): the monk now wears the newer back frame (gen/props/back_frame.glb) since his rebuild picked it up.

- 22:40 deploy (this session, the user: "just deploy whatever we got"): the current files went live with
  DEFAULT_ON = false (flipping it was held for the user's explicit OK), so the live `?interact=1` now matches the files.
  deploy_web.sh check PASS; live check `world.html?interact=1`: PASS, 8 sections, 34 boats, no errors. Not committed.
- 22:55 signed off by the user ("just try it out and deploy it"): DEFAULT_ON = true, deployed. Regression on the
  default page (tag interact_default): people as the baseline (the two gate road spots); world 208/211 under load 25,
  the 3 failed walks (S4 fence's end, S4b back ashore, S2 north bank E->W) all PASS on a rerun with interact on and off.
  Live bundle checked: off only with ?interact=0.

## Round 2 (2026-10-13 ~23:10): viewpoints by E, the 印譜

The user: should the viewpoints be an interaction rather than an automatic trigger (a spot fired once and seemed dead
after), and recorded in a 成就系統? Agreed and built:
- 觀景 is now E on the spot (`觀景` prompt within 1.2 m, the spot's seal), as often as you like; nothing fires
  underfoot (crossing the Rainbow Bridge's crown no longer takes the camera; the teleport/re-arm logic is gone). The
  spot showing its view dims; the rest glow with their shaft.
- Stamps: the first drum stroke, a pose joined, a view ended (鳥瞰 hides the ink UI, so its note waits for the walk
  back) -> `ui.stamp` -> prefs.discovered `x:drum`, `x:vista:<id>`, `x:join:<id>` and the 聞-style ink slip
  (`<name> 鈐入圖志`). The 圖志 has a last leaf 印譜: the eight in data order, stamped (a big seal on paper, the name,
  `deed_line`, the region) or a faint blank 未至; no count (STYLE.md §9). Data: `deed`, `deed_line` (+ `_en`) on the
  drum, each vista and each join in interact.json. Fonts: roles.json display += `#deed`, text += `#vista_prompt`,
  text lazy lore += `#deed_line`; main subsets 189.2 -> 191.0 KB.
- Probe (gen/interact/tools/probe.mjs): on the 城樓 spot no view without E; E -> view; walk -> slip "城樓 鈐入圖志",
  x:vista:tower saved; E again -> the view again; journal 印譜: 1 stamped, 7 blank (then 3/5 with drum + moat rail).

## Round 3 (2026-10-14 ~00:10): the drum in three beats, the seal note, the passes

The user: the drum's cut outside came before you could see yourself strike; see yourself first, then the town's
answer; and the 印譜 should get a simple notification. Also: the 城樓 viewpoint terrace could be entered but not left,
and the Rainbow Bridge's left end is too tight to pass ("push some assets away a bit").
- Drum (interact.json drum.react; code unchanged): on you through the hit (`after` 0.25 -> 1.2 s: the stick on the skin,
  the swell, the ink ring, the jolt), then a cut outside to a low, close camera east of the tower (at [-8, -5, 13],
  look [-16, 3, 13.5]: the hall fills the frame, the birds wheel over the ridge; the far SE camera showed specks) for
  `hold` 3.2 s with the watchman's call, then back into the hall. Picked from three framings (screenshots in the
  session scratchpad); the camera log is a steady 0.8 m push.
- Seal note (ui/index.js stamp/note, life.css): shown even with the place notes off (a reward, not a place note), 6 s;
  the seal lands with a new sound `seal_press` (sounds/interact.json, take 0 cut into its two thuds, 3.4 KB; ~20
  credits); the note is a button with a J keycap: J or a tap opens the 圖志 at that seal (journal.leafFor x:<key> ->
  印譜, the entry highlighted). Probe: 擊鼓 note -> J -> leaf deeds, here x:drum.
- Passes: two helper agents, records gen/interact/passes/ (tower.md, bridge.md; the tower grid before:
  grid_tower_before.txt).
