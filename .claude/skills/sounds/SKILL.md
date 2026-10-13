---
name: sounds
description: Make the qingming world's sound effects - a spec of units (prompt, length, loop, where it plays) -> ElevenLabs generation -> automatic checks -> single hits and seamless loops -> small Opus files -> a listening page. Use when adding or redoing sounds for a section, an animal, a trade, the player or the HUD, or when asked what the world sounds like or how big its audio is.
---

# Sound workflow (qingming/)

The design is `qingming/gen/life/design.md`; the user's decisions are in memory (`feedback-qingming-sound-and-voice`).
Each step is one atomic script, cached per unit, so a changed prompt redoes only its own unit.

## Rules
- **Loyal sources:** a point sound belongs to something painted (a figure, an animal, a cart, a boat, a trade, water, a
  tree, the gate drum). Beds (wind, birds, insects, far murmur) are allowed as low backgrounds, like the painted
  panels. Period-correct only (`gen/life/sound_research.md` §4): no 唤头, 醒木, 唢呐, gong-and-梆子 "小心火烛" rounds.
- **Small:** one-shots short and mono; multi-hit takes are cut into single hits that code varies (pitch, gain,
  order); beds 10–15 s loops. Opus/WebM mono, 24 kb/s one-shots, 32 kb/s loops. Sounds are grouped by section so they
  stream with it.
- **No voices from ElevenLabs:** the user rejected its Chinese speech. Lines wait for the provider the user will name.
- **Prompts** (ElevenLabs tips + our rules): source + material + action + space; beds end "No music, no speech, no
  engines."; one-shots "close, dry"; avoid "Chinese"/"ancient" in beds (it invites erhu and gongs).

## Steps
1. **Spec** `qingming/sounds/<set>.json`: `units.<id>` = `{kind: 'sfx', group, use, prompt, seconds, loop?, slice?, pick?}`.
   `group` (player, animal, cart, trade, time, water, boat, bed, ui) and `use` (where and when it plays, which painted
   thing) are what the runtime will read. Sets so far: `samples` (the first test, incl. rejected voices), `core`
   (S4–S6, the player, the HUD), `round2` (S7, S4 part 2, S3, S2, S1).
2. **Generate** `node tools/eleven.mjs sounds/<set>.json sfx [--only a,b] [--takes n] [--force]`
   -> `gen/sounds/<set>/<id>_<take>.mp3`. Key: first line of `~/.elevenlabs_key` (free tier: non-commercial, credit
   elevenlabs.io). Cost ≈ 10 credits per second of sound; the balance prints at the end (it lags a few minutes).
3. **Check** `node tools/sound_check.mjs sounds/<set>.json [--no-stt]` -> `check.json`, `check.md`: loudness, peaks,
   silence share, loop seams; speech-to-text flags words or music inside beds (it costs credits: use `--no-stt` when
   no beds changed).
4. **Cut and ship** `node tools/sound_cut.mjs sounds/<set>.json [cut|ship|all] [--only ...]`: trims one-shots, cuts
   `slice: n` takes into n hits, crossfades loop seams, then loudness-matches (-20 LUFS) and encodes
   -> `gen/sounds/<set>/ship/*.webm`, sizes in `ship.json`. The take used is the unit's `pick` (default 0).
5. **Listen** `node tools/sound_page.mjs sounds/<set>.json` -> `gen/sounds/<set>/audition.html` (open from Windows via
   `\\wsl.localhost\Ubuntu\home\ran\3d_director\qingming\gen\sounds\<set>\audition.html`). The user judges here.
6. **Stock** (CC0 only, for real animals, bells, water): `gen/sounds/stock/manifest.json` records source, author and
   licence per file; never ship a file without a CC0 licence line there.

7. **Into the world** `node tools/sound_web.mjs ship`: every set's shipped files -> `web/public/assets/sounds/` plus
   `sounds.json` (files, loops, and the rules from `qingming/sounds/rules.json`); fails when a rule names a sound no set
   ships, and lists sounds no rule plays yet.
8. **Check in the page** `tools/chrome_slot.sh node tools/sound_web.mjs check` (the shared check server on :5190; never
   a Chrome or dev server of your own): every section's spawn has beds, no file fails, loops and shots stay in budget,
   the night watch fires at the gate, a 7 s walk plays footsteps -> `sections/world/sound_check.json`, PASS/FAIL.

## The runtime (`qingming/web/src/sound.js`, hooked in `web/src/world.js` inside a try: sound never stops the page)
- **What plays where is data**, `qingming/sounds/rules.json`: section beds (day/night, crossfaded by your distance from
  each painted area), animals by model (near reactions, calls, walking loops; on a deck above 0.9 m the hooves go
  timber), figures by the clip they play or by map ID (the barber, the itinerant monk, the tax inspector), boats by
  state (moored creaks, under way, setting off, coming back, the mast lowered), landmarks by map entity (the moat,
  the temple and its bell, the stream, the Rainbow Bridge, the scaffolds, banners, eateries), trees (sparrows, brushing),
  the hours (dusk drum and the night watches from the gate tower's drum, the 五更 dawn round, shutters, roosters, gusts),
  the player (footsteps by the floor collider's name, run, bumps, boarding a boat) and the HUD.
- **Distance, never an edge** (the user, 2026-10-12: "it's not like you step out of one area and it just vanishes…
  I don't want, at a single second, there to be just nothing"): every source's `range` is its radius; the panner's
  inverse law with refDistance = radius/4 (-12 dB at the radius, -24 dB at 4x); a source leaves only under -36 dB or
  softly towards the 80 m reach; a playing loop keeps its place unless another is 1.4x louder; slow fades.
- **Beds never go silent** (`rules.bedMix`): sections weighted 1/(1+(out/20 m)^2) from where you stand (loaded or not),
  the nearest at least 0.7; crowd beds follow the painted people round you (kernel 14 m, full at 16), nature beds fill
  in where it thins; old beds play on until the new ones are in; the beds and footsteps are fetched before the first
  click. `tools/chrome_slot.sh node tools/sound_gaps.mjs [url] --mbps 4` measures gaps on a throttled network
  (`sections/world/sound_gaps.json`; 2026-10-12: 0 gaps, bed level never under 0.73).
- **Volume**: with the painting open (Space), a bar beside the bell (ink stroke, bronze weight, no numbers), kept per
  viewer; the master level is volume squared.
- **Budgets**: 8/16 point loops, 6/10 shots, 4 beds, 40/90 MB decoded (phone/desktop); files load on first use and are
  dropped least-recently-used. Costs about 0.04 ms a frame.
- **Covered** (a collider within 9 m above you: the gate passage, the tower, the bridge arch): beds muffled, a short
  reverb opens; in the gate section the passage bed plays.
- Sound starts on the first click/touch/key; M or the bell button (bottom right) toggles it, remembered per viewer;
  `?sound=0` leaves it out. The help line credits "Sound effects: ElevenLabs" (free-tier terms).
- Adding a sound: a unit in a set (steps 1-6), then a rule in `rules.json`, then steps 7-8.
