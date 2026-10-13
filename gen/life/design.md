# Life layer: plot lines and sound (design draft, 2026-10-12)

A proposal for the user, not yet agreed. Research behind it:
- `reference/messenger_study/dialogue_sound_notes.md`: how Messenger does bubbles, talk and sound (from its JS and the web).
- `gen/life/sound_research.md`: ElevenLabs SFX, stock libraries, web audio on phones, the Song soundscape.
- `gen/life/vignettes_S4_S6.md`: every painted scene in S4–S6, with readings, draft lines and sound sources (34 entries).

## The idea in one line

The painting already has its plot lines: scholars read little scenes in it, such as the tax quarrel, the beggar boys and
the soldiers kept waiting. We voice those scenes and nothing else. Every line explains what a painted body is doing, and
every point sound comes from a painted thing. That is the loyalty rule (`map/BUILDING.md`) applied to words and sound.

## Plot lines

**Three distances**, from Messenger's arrow, "…" and click, adapted to a crowd 12× denser:
1. **Far (≤ 25 m): intent marks.** Some figures show a small painted pictogram over the head at their scene's peak beat,
   for example a square-holed coin, a frame scale, a razor, a bow, a manifest, "!?" or Zzz. It tells you who is
   up to something, read from across the street. At most about 6 show at once, the nearest first.
2. **Earshot (≤ 10 m): the scene plays.** The figures in a scene exchange their beats on a loop whether or not you are
   there. The quarrel peaks about every 40 s, and the witnesses react (the watchman on the tower turns to look down).
   Bubbles are drawn only near the player, and at most 2 are open at once. Messenger has no chatter between its
   characters, but the scroll is about the crowd, so we add it, sparingly ("calm by subtraction").
3. **Close (≤ 2.5 m, facing): they speak to you.** You don't click. As in Messenger, a figure who notices you turns its
   head and says its line to you. Its line depends on **who you are playing** (the "You" panel). The beggar boys ask
   you for a cash coin; if you play the official, the carters bow. A few main figures per scene (the inspector, the
   storyteller, the fortune teller) have a short tap/E conversation of 2–6 beats instead.
- **Thoughts** go in a cloud-shaped bubble: the watchman's 「底下吵甚么？」, the customer under the razor, the dozing
  soldiers.
- **Look:** painted paper with an ink outline drawn by our ink pass, brush lettering that steps in over 3–4 frames, and a
  springy pop. Bubbles are anchored to the head bone. The font is subset to the glyphs actually used (a full CJK font is
  MBs; a subset is tens of KB).
- **Writing:** short Song-flavoured vernacular (not modern slang, not classical prose), 1–3 lines per figure. Each line
  cites the reading it comes from. Where scholars disagree we pick one reading and record the choice and the
  alternative, as `build_choices.json` does for positions.
- **Possible addition (period instrument, no numbers):** your own small hand scroll fills in with ink for each scene
  you have overheard. That gives a sense of discovery without a quest log or counters.

## Sound

**Principle (to agree):** a point sound only from a mapped thing, such as a figure, an animal, a cart, the drum, water or a
tree. **Beds** (wind, birds, insects, the far murmur of a crowd) are the sound version of the mist and painted panels:
allowed, kept low, and scaled to the map's counts. No invented hawkers or traffic.

**Layers**
- **Region beds** follow the map's road stations: inner street, gate passage (one short reverb), outside the gate, the moat
  bridge (hollow deck, faint lapping), the outer road (willow wind, fields), and later the river. Day and night variants
  follow the local clock.
- **Point emitters** by map ID:
  - animals: donkeys, oxen, camels, horses, the crow in the S4 willow;
  - carts: the axle creak, and the iron bell that 《东京梦华录》 records on the big 太平车;
  - trades: the barber's razor, the butcher's cleaver, the bowstring, the itinerant monk's clappers;
  - figures painted with open mouths, the storyteller, and the hawkers' sung cries (吟叫, attested).
- **Clip-timed sounds:** the cleaver lands on the chop frame, pole creaks follow the porter's walk, and the player's
  footsteps change by surface (earth, stone, timber deck, brick vault).
- **Time:** the gate tower's painted drum beats at dusk (城上暮鼓, attested). Beating the night watches on it would be
  our addition: to decide.
- **Left out as anachronisms:** the barber's 唤头 (Qing), the storyteller's 醒木 (Ming–Qing), 梆子-and-gong
  "小心火烛" rounds, 唢呐.

**Engine** (Messenger's trick): loops run all the time and code only moves volumes.
- No three.js `PositionalAudio` per figure: it uses the costly HRTF panner, and there are 373 figures.
- Instead, a small pool of cheap equal-power voices: 12 on phones, 24 on desktop, the quietest dropped when it is full.
- Sound starts on the first tap. A mute toggle is drawn as a period object (a wind chime or bell, not a speaker icon).
  Sound pauses when the tab is hidden.

**Sources and budget:**
- ElevenLabs SFX v2 (seamless `loop`) for beds, foley, carts, camel and cart bells, and trades.
- Freesound CC0 for animals, birds, insects, the temple bell and the drum.
- ElevenLabs v3 Mandarin with 6–8 designed voices, only if we voice lines (see the decision on voices below).
- About 2.9 MB of Opus/WebM for the three sections (+14%), streamed per section like the rest. About $5 of
  ElevenLabs credit.
- Their terms forbid offering the sounds as a standalone library, so we pack them into one sprite per section.

## How it is built (same shape as the other pipelines)

- `sections/<name>/talk.json`: the scenes. Each has roles mapped to map IDs, the reading and its source, beats (actor,
  line or icon, clip, seconds), witnesses and sounds.
- `sections/<name>/sound.json`: zones and emitters by map ID.
- Separate files so they never collide with `people.json` while round 2 builds.
- `web/src/talk.js`, `web/src/sound.js`: hooked into `people.js` (each figure already has its map ID and clip cycle).
- `sounds/<name>.json` + `prompts/sfx_<name>.txt` → `tools/sfx.mjs gen|pick|loop|norm|sprite|ship`, cached per unit
  like `tree_cards.mjs`. Every file is listed with its source, licence, take and loudness (−20 LUFS). `sounds.html`
  plays each sound for auditioning, as `chars.html` does for characters.
- Checks: a talk check (every speaking figure exists in the map, every line has a reading) and a voice-count and memory
  bench on a real phone.

## Pilot (small step, then the standard)

The gate only:
- the tax quarrel with the watchman reacting (loop + near);
- the beggar boys, with the player as a target (asker and givers);
- the barber (near + thought);
- 4 zone beds with the passage reverb;
- the dusk drum, donkeys and camels;
- player footsteps.

When the user signs it off, the scene patterns (13 types in the vignettes file) and both pipelines become the standard,
and S4/S6 and round 2's sections each add `talk.json` and `sound.json` through the playbook.

## Open for the user

1. Bubble language: Chinese only, Chinese with an English line under it, or a toggle.
2. Voices: murmur loops in Messenger's style (cheap) or real Mandarin lines. Either way, real voices for the attested cries.
3. The sound principle above, and the night-watch drum.
4. Abeto's newer game: not found online; its name is needed to study it.
5. Where the ElevenLabs key lives (an environment variable name or a file).

## First ElevenLabs test (2026-10-12)

Set `sounds/samples.json` → `gen/sounds/samples/` (`audition.html`, `check.md`), made by `tools/eleven.mjs`, checked
by `tools/sound_check.mjs`. About 4,000 of the free key's 10,000 credits.
- **Key is free tier:** non-commercial with credit; library voices and voice design are paid-only over the API, so lines
  were read by premade English-native voices.
- **Lines (speech-to-text against the script):** common words come through (storyteller, soldier, beggar, barber ≈ exact);
  rare words lose their tones: 匹帛税重 → 皮薄树重, 纳 → 拿, 引子 → 影子 (v4); v3 said 炊饼 as 脆饼. Accent and
  naturalness are for the user's ear.
- **Backgrounds:** no words in any of the 15; one has a music sting (night_0), one turned to rain (night_2); the moat
  bridge takes are 80-90% silence; two loops click at the join (night_0, outer_road_0). Raw levels span −52 to −14
  LUFS, so a loudness step is needed in any case.
- **One-shots:** the bowstring is faint in all three takes; several peaks touch 0 dBTP (need a limiter).

## Sound sets made (2026-10-12, after the user approved ElevenLabs effects)

User's calls: effects good, ElevenLabs voices bad (another provider later); bubbles in Chinese with real voices; the
night-watch drum yes; as much interaction detail as possible; keep audio small (it streams per place with the rest).
Skill `sounds` governs the scripts (`tools/eleven.mjs`, `sound_check.mjs`, `sound_cut.mjs`, `sound_page.mjs`).
- `sounds/core.json`: S4–S6, the player and the HUD, 66 units (13 approved takes from `samples` + 53 new)
  → 104 shipped files, **1.18 MB** (`gen/sounds/core/audition.html`).
  - player: footsteps on earth, stone, timber, brick, grass, plus a run, cut into single steps; brushing people; willow strands;
  - animals: snorts, lows, grunts and barks, plus walking loops for donkey, horse and camel;
  - carts: wheelbarrow, carts on the bridge deck, sedan chairs;
  - trades: coins, the brush, the frame scale, bowls and wine, frying, banners, shutters, the storyteller's crowd;
  - hours: a single drum hit and the watch clapper for the night watches, the temple bell, the 五更 iron-plate round,
    roosters;
  - beds for the evening street, the moat, and the temple yard;
  - HUD: a scroll unrolling, bubble taps.
- `sounds/round2.json`: S7, S4b, S3, S2, S1 from `gen/life/sound_needs_round2.md`, 40 units → 63 files, **0.71 MB**
  (`gen/sounds/round2/audition.html`): river, wharf, bridge crowd, countryside and spring-night beds; boats (hull
  creak and slap, ropes, sweep oar, the mast lowered under the arch); the runaway horse; the wheelwright; deck, mud
  and splash steps. Held until mapped: hoe_soil, paper_goods_rustle, oar_stroke, whip_crack. Dropped: bed_mist_edge.
- The whole scroll's sounds so far: **1.9 MB**, of which a place loads only its section's share plus the shared
  player/animal sounds. Opus mono, 24 kb/s one-shots, 32 kb/s loops, all at -20 LUFS (the runtime mixes by group).
- Checks caught: an English sentence inside the first bridge-crowd bed (redone), a music sting and a rain bed in the
  first night takes, near-silent beds, clicking loop seams (all crossfaded in `sound_cut.mjs`).
- The ElevenLabs free credits are used up.

## In the game (2026-10-12, after round 2 joined all 8 sections)

The user asked whether the sounds can go in now that the whole map, pieces and characters are done; they went in.
- `web/src/sound.js` (engine), hooks in `web/src/world.js` (built inside a try after the first section shows; update
  in `tick`; footsteps read the floor collider's name, now kept in `sec.floorVerts`; bumps from `pushOut`; HUD duck),
  `web/public/assets/sounds/` (168 files, 1.9 MB, loaded on first use), rules in `sounds/rules.json`.
- Check `tools/sound_web.mjs check`: PASS in all 8 sections. Beds everywhere, no failed file, in budget; the watch drum
  fires at the gate; a walk plays footsteps. Engine 0.04 ms/frame. `sections/world/sound_check.json`.
- Not played yet (no painted source or trigger found): basket_set_down, cart_on_timber (painted carts stand still),
  crickets_close (April: kept to the night beds), jar_knock, step_mud, step_splash, straw_reed_brush.
- Not done: the speech bubbles (talk.js, waiting on the voice provider for spoken lines); listening on a real phone.

## Sound v2: no silence, volume (2026-10-12)

The user heard moments of pure silence and asked for sound that decays with distance instead of vanishing, every
source with a radius, and an overall level that follows how busy a place is; and a volume bar on Space.
- Causes found: hard range culls (loops at their range, shots at 36 m, beds 18 m outside a painted area); beds faded
  out while their replacements were still loading; with no loaded section (a jump into one still loading) the beds
  wanted nothing and all faded.
- Fixes in `web/src/sound.js` and `sounds/rules.json` (bedMix): the radius/inverse-law model with a soft 80 m reach,
  crowd-following beds with a floor, prefetch, hold, beds from position (the `sections:` hook lists every section),
  guarded passes. Volume bar beside the bell while the HUD is open.
- Checks: `sound_web check` PASS (incl. the volume bar), `sound_gaps` at 4 Mb/s 0 gaps (min bed level 0.73),
  regression 210/211 (the miss is flaky: passes on rerun with and without sound), boats 12/12, rides 5/5.

## Built: the life pass (details pass, 2026-10-13; record `gen/life/progress.md`)

The three distances are in the world, with text only (voices still wait for a provider). Lasting rules:
- **Far:** intent marks (`web/src/ui/marks.js`): an ink pictogram on a paper disc over the speaker of a group whose
  exchange is playing, seen from beyond earshot; as many as the device tier allows (none on low), nearest first, not
  behind walls.
- **Earshot:** every painted group with two or more placed figures may have `chatter` in its section's `talk.json`:
  exchanges of 1–4 turns with 2–3 alternatives a line, never repeated back to back, turn-taking timing, quiet gaps
  (longer at night and on the light tier). Lone figures get rare `barks`; a `close` bark calls to you as you come near.
  A line fits its body: sleepers only think; `when` ties a line to a clip. Bubbles only near you, at most two with the
  near talk, the near talk wins.
- **Close:** press-E scenes at the main figures; the first line depends on who you play (8 kinds, settings 扮作); talking
  to the same host again plays its next `again` set (more of the reading).
- **Plot lines** (`sections/world/talk.json` threads): a few stories that run across the scroll (the tax row at the
  gate, the grain from the boats to the 正店, the holiday wine, the charcoal donkeys, the bolting horse, the big boat
  at the bridge, Qingming at the graves, the banned screen); each step is a painted group's exchange, scene or bark;
  overhearing it inks it into the 圖志's 見聞 leaf (only heard steps, no counts) with a small 聞 note.
- **Loyalty:** only placed painted figures speak, about what their bodies do; roles in period words; every line
  cites its reading or says "our proposal"; Chinese plus an English gloss for every line.
