# Messenger's conversations, bubbles and sound (study, 2026-10-12)

This folder is study-only. Never copy code, strings or audio from it into project assets or builds. Lines are
quoted here only to study their tone and length.

**Marks:**
- **[JS]**: seen in the shipped bundle `js/App3D-DwM1eiaC.js`.
- **[net]**: measured on messenger.abeto.co.
- **[web]**: stated by a web source (see Sources).
- **[inf]**: our inference.

Messenger (Abeto: Vicente Lucendo and Michael Sungaila, music by Kevin Colombin; released 25 Sep 2025) is a
free 15–30 minute three.js game. You deliver parcels on a small planet with about 20 NPCs and up to 10 other
players.

The devs' own aims [web, Awwwards]:
- NPCs should feel like "regular people" but stay memorable;
- the world should be "calm but also a little bit… weird";
- "just enough to make the world feel alive without feeling cluttered";
- the story came last, with the hand-holding cut way back.

## Conversations and bubbles in Messenger

### Two talk modes per NPC [JS]

Every NPC is the same class. The quest system flips it between two modes.

- **Ambient bubble mode (the default).**
  - Walking within `talkDistance` is the whole trigger: 2.5 m by default, 2.2 m for two NPCs. No click, no
    button. The NPC stops, turns to face you (slerp 0.04 per frame) and speaks in a bubble over its head. The
    camera is untouched, and you keep control.
  - Lines advance on their own while you stay in range. Leaving range cuts the line off and pops the bubble away;
    the next approach replays from line 1. [web] An HN player "got stuck in the corner behind Steve… kept
    triggering his dialog".
- **Dialogue-box mode (only while a quest step waits on this NPC).**
  - The NPC must be **clicked/tapped** while in range.
  - The controls lock, and over 1.3 s the camera eases into a two-shot:
    - radius 2.5 m, phi 0.45π, aimed at the NPC's head;
    - offset 0.4 rad so both faces are in frame;
    - the player is slid (shape-cast) to 0.7–1.25 m from the NPC.
    - A "zoom-in" sound plays; "zoom-off" plays when the camera is released.
  - The lines appear in a screen dialogue box.
  - **Space/E**: the first press completes the reveal, the next one advances. **Esc** closes. An arrow button
    does the same on mouse and touch.
- **The world remembers.** After a step, the NPC goes back to bubble mode, and its idle line becomes the last
  line of that step (`setTexts(texts, texts.length-1)`). A helped character now says something new when you
  pass.

### Look [JS unless marked]

- **Bubble.**
  - A billboard quad parented to the NPC, so it follows the head. It sits at the bounding-sphere top + 0.2 m,
    plus a per-NPC offset.
  - Its shape is an SDF rounded rectangle with tight corners and a small triangular pointer. It is plain white.
  - It writes into the same outline G-buffer as the world, so the ink-outline pass draws its border. A noise term
    breaks that line into a sketchy one.
  - The world size is fixed: text 0.12 m tall, wrapping at 1.25 m. It is not DOM, and it doesn't need distance
    scaling because it only exists within 2.5 m.
- **Text.**
  - GPU vector glyphs (Slug method: curve and band textures), always UPPERCASE.
  - A hand-lettered font with alternate glyphs ("UglyDave-Alternates"), so repeated letters vary. Ink colour
    `#1f1f1f`.
- **Pop-in.** The bubble scales 0 → 1 with `elastic.out` over 0.65 s, and the text starts at +0.35 s.
- **Pop-out.** The text fades in 0.075 s, then the bubble shrinks to 0 in 0.2 s (`sine.in`).
  - Positional pop blips play: "bubble-starts" and "bubble-ends".
- **Dialogue box:** also WebGL, in an orthographic UI scene. A bottom-centre off-white card (at most 820 px)
  with a slate drop shadow, a name tag in the NPC's colour and an arrow button. On open its vertices jitter in
  4 stepped frames, a hand-drawn "boil".
- **Intent marker over the head (`topIcon`).**
  - Only quest NPCs (11 of 20) carry it, visible within 20 m.
  - Far away it is a small arrow (0.12 m). Inside talk range it swaps, with an elastic pop and a blip, to a large
    speech balloon (0.28 m).
  - [web] HN players read the balloon as "a dialog balloon with '...'" that you click.
  - It takes the NPC's colour, pulses on hover and hides while the NPC talks.
  - So there are three readable states: *someone here wants you* → *you're close enough* → *click*.

### Reveal, voice, mouth [JS]

- **Bubble reading time:** 15 characters/s. Each line stays `max(1, chars/15)` s after a 0.75 s open, then a
  0.4 s gap ("Tulips can take a while to bloom.", 33 characters, is up for about 2.2 s).
- **Bubble reveal:** only 30% of the reading time. Each glyph slides up in 3–4 **stepped frames** (stop-motion,
  not smooth), staggered along the line; on hiding, glyphs shrink in 1–2 steps.
- **Dialogue-box reveal:** 35 characters/s, and the player advances.
- **Voice, with no per-letter blips.** Each NPC has one of 8 **looping gibberish clips** (4–7 s): `male1-3`,
  `female1-3`, `wtf` for the alien, `quest` for the player's own monologue. The clip is a `PositionalAudio` on
  the NPC that starts at a **random offset** each time, fades in over 0.2 s and fades out when the reveal ends.
  So the voice lasts exactly as long as letters are appearing, and 7 clips voice 17 speaking NPCs. [web] An HN
  player said the "speech sound effects… reminded me of Stray".
- **Mouth and body:** while talking, the sprite mouth picks a random one of 3 open shapes 8 times a second
  (closed otherwise). The body cross-fades idle → `talk` (during the line) → `idleTalk` (between lines): 1 s
  into or out of talk, 0.5 s otherwise.

### Line selection, tone and length [JS]

- **The lines are fixed per NPC, not random.**
  - Each NPC has a short list, played in order.
  - A quest step swaps the list in.
  - There are no random pools, no barks and no time-of-day lines.
- **Quests.**
  - 5 delivery chains of 2–3 steps, linking the 11 icon-carrying NPCs into a small web of who-knows-whom.
  - Progress is kept in `localStorage`.
  - A step pops a card ("TAKE THE MYSTERY LETTER TO DAVE AT SMELLY FALLS"), and a 3D parcel flies into your
    hands.
- **Ambient lines** are mostly one line each, an **overheard monologue about what the pose is doing**.
  Quoted for study:
  - "Shipments in... shipments out..." (factory worker)
  - "Maybe I should just call in sick..." (cave man)
  - "We'll need to build here... here... and also here..." (scientist)
  - "Come on... open up..." (diver at the lock boxes)
  - "Tulips can take a while to bloom." (flower lady)
  - "Sorry, I'm on my lunch break." (walking man)
  - "Do you hear that sound? Silence..." / "I mean, there's the wind chimes too, but it's mostly silence..."
    (temple)
- **Quest beats** are 2–8 short lines that end on a punchline:
  - "Wow, another prize?" / "Just in time, too. I'm down to my last pair of underwear."
  - Dave reading his old letter to himself ends "Well..." / "...two out of three ain't bad."
- **Length.**
  - Ambient lines are 20–60 characters. Quest lines are rarely over 120.
  - Ellipses do the comic timing.
  - [web] Gigazine: the English is simple, junior-high level.
- **Names** are roles ("Flower Lady", "Cave Man", "Old Woman") or one-off names ("Tengo", "Dave the Musician").
- **The player's voice.** The intro is the player's own three lines in the box, tagged "MESSENGER":
  - "Looks like I slept in... I better start today's deliveries."

### NPC-to-NPC chatter, thought bubbles [JS]

- None. A bubble opens only when the player is in range of that NPC. No NPC talks to another, and there are no
  timed or random barks.
- Apart from the quest arrow and balloon, there are no emoji or thought icons on NPCs.
- The life comes from NPCs turning to face you, moving mouths, idle poses desynced by a random mixer offset, and
  two NPCs walking spline loops.

### Players: emotes, no chat [JS + web]

- **Multiplayer:** a WebSocket relay (protobuf, rooms). [web] Rooms are capped at 10 players because more "felt
  too crowded and broke the sense of calm".
- **No text chat.** [web] "we ditched traditional text chat entirely. Instead, we built a 3D emoji system" for
  "Follow me!" or "Thanks!". Players became guides for each other.
- **Emotes:** 10 small 3D models (keys 1–0 or a panel) pop out over the sender's head, spin, rise and scale out
  over 2 s, batched into one draw. Others' emotes show only within 20 m, at most one per 0.35 s. Sound plays only
  within 3 m: a random "starts" blip, then about 1.1–1.4 s later a random "ends" blip.

## Sound in Messenger

**[web] Intent:**
- The sound should "double down on that calm/strange duality". The team spent "weeks collecting references of
  instruments", and the main track was composed alongside the game.
- "Every area has its own soundscape": the city has "distant neighbors and market noise", the beach "waves
  hitting the sand", the factory "the hum of heavy machinery".
- A guitar-playing NPC: "as you walk toward him, the sound gets louder and moves in 3D space, helping you find
  him naturally through your ears". Gigazine says the instrument looks like a sanshin.

### Inventory [JS + net]

- **Format.** 53 files under `/assets/audio/<group>/<name>.ogg`, all Ogg **Opus** at 48 kHz.
  - Everything is mono except the high-quality music.
  - Safari gets an `.mp3` twin of each file, because the loader swaps the extension when Opus is unsupported.
- **Desktop total.** About **3.7 MB**, 63% of it music.
- **Durations.** Measured by decoding the files.

| group | files | ogg size | notes |
|---|---|---|---|
| music | bgmusic-highq (stereo) / bgmusic-mobile (mono) / musician | 2.31 MB / 1.14 MB / 98 KB | bg loop 2:42 at about 114 / 56 kbps; musician 15 s |
| ambience beds | base, forest, city, factory, beach, waterfalls, temple | 85–96 KB each, 609 KB in total | each a 15.35 s mono loop, about 44 kbps |
| footsteps | footsteps4, footsteps-water | 41 + 39 KB | 6.9 s and 5.9 s loops |
| voices | male1-3, female1-3, wtf, quest | 27–43 KB each, 300 KB in total | 4–7 s gibberish loops |
| character | jump-start/land, clothes, bubble-starts/ends, emoji-starts1-3/ends1-3 | 1.5–3 KB each | one-shots |
| UI, camera, intro | click/hover/buttons, openbox x4, paper1/paper4 loops (7 s, 11 s), title, customize, quest-complete, zoom-in/off, whoosh, letters, rune1-4 | 1–64 KB | |

**On iPhone** (`lowMemoryDevice`), **only** the mobile music and the quest-complete sting load. There is no
ambience, no footsteps and no voices there.

### Systems [JS]

- **Library:** three.js `AudioListener`, `Audio` and `PositionalAudio` (no Howler). Each sound is a named entry
  with its own gain, driven by events (`webgl_play_audio`, `webgl_set_audio_volume`, `webgl_play_positional`).
  The listener is the camera, its pose ramped every frame.
- **Unlock and mute:** the context starts suspended and muted. The first click, touch-end or key resumes it, and
  the master fades in over **3 s**. A mute button sits among the side icons. Hiding the tab fades the master out
  over 1.5 s and back in over 2 s; iOS resumes 500 ms late.
- **Loops always play; only gains move.** Beds, footsteps, the musician and even the UI paper rustle are loops
  started once at gain 0, so there is no start latency or click. Voices are the exception: restarted at a random
  offset each line.
- **Ambience by area.** A non-positional base bed plays everywhere at 0.5. Six area beds (also non-positional)
  are each tied to a **sphere**: centre, radius (city 27.5 m, forest 15.4 m, temple 10 m) and a 2–10 m margin.
  Each frame the first sphere containing the player gets `fit(distance, r → r − margin) × 0.5`, and every other
  area bed goes to 0. So one area colour at a time crossfades across the margin over a constant base.
- **Footsteps.**
  - One continuous loop. Its gain = (walk + run animation weight) × on-ground, lerped, × 0.2.
  - Below the shore radius (`|p| < 22`), it crossfades into the water-footsteps loop.
  - The loops are **synced to the render clock**: the playhead is reset if it drifts more than 0.1 s.
    [inf: the loop is cut to the walk-cycle length, so steps land on the feet with no per-step events.]
  - Jump and land are one-shots fired by physics events.
- **Positional emitters.**
  - Voices: inverse distance, ref 2 m, rolloff 1, gain 0.5.
  - Pops: ref 2 m, rolloff 0.3, gain 0.1.
  - **Dave the musician:** a diegetic loop, linear from 2.5 m to 12 m, gain 0.1. It **stops while he talks** and
    resumes after.
- **UI.**
  - Clicks, hovers and box sounds are quiet (0.05–0.2), with `minTimeBetweenPlays` to stop spam.
  - Dialogue and quest cards use no one-shot. They raise the gain of a looping paper-rustle bed for exactly the
    length of the box animation, then let it fall.
  - Camera moves get zoom-in, zoom-off and whoosh. An accessory change plays "clothes". The quest-complete
    sting plays 0.9 s after a quest's last step.
- **Mix (gains).**
  - music 0.1 constant, base bed 0.5, area bed up to 0.5, footsteps 0.2, voices 0.5 (positional), player voice
    0.075, pops 0.1.
  - The music is never ducked, and there is no dialogue sidechain. The world beds carry the loudness, and the
    lo-fi track sits underneath.

## Abeto's newer game

**Not found [web, checked 2026-10-12].** Messenger is still Abeto's latest released game, so there is nothing
to compare yet. If the user has a name, a targeted search will settle it.
- Checked: Wikipedia, Awwwards (Jan 2026), CommArts, HN, X mirrors of Abeto and Lucendo ("the occasional
  game"), vlucendo.com (Messenger is the latest project), web and Exa searches. abeto.co has no project list.
- Since Messenger: Lucendo's Three.js Conf Paris talk "From 3D to Feeling" (10 Sep 2026; no recording found),
  which [web, muz.li] put composition and sound before code. Messenger went viral again in June 2026.
- Unconfirmed lead: Pudgy World (Igloo Inc., browser, March 2026) has a similar stack, and Abeto retweeted its
  launch, but no source credits Abeto. The X accounts @playabetoco and @MessengerAbeto push a crypto token and
  look unofficial.

## What makes it feel alive (our read)

1. **Proximity is the conversation.** Walking near someone makes them stop, turn, look at you and say one line,
   with zero UI. The click and the camera move are kept for the few who have something to hand you. Most of
   the world talks for free.
2. **The line explains the pose.** Each bubble is the person muttering about what their body is visibly doing
   ("Shipments in... shipments out..."). Pose, line and place reinforce each other, so a single line is enough.
3. **Intent is shown in three states, not a quest log:** an arrow at 20 m, a "..." balloon in range, then the
   click. You read who wants you from across the square.
4. **Voice from a few loops.** 7 positional gibberish loops, each started at a random offset and gated exactly
   to the letter reveal, plus a random mouth sprite at 8 Hz. Twenty voices from about 300 KB, and nobody
   notices the reuse.
5. **UI drawn in the world's hand.** Bubbles are ink-outlined by the same pass as buildings. Glyphs and box
   edges move in 3–4 stepped frames, with elastic pops. The UI reads as part of the painting, not an overlay.
6. **Sound is gain automation over always-running loops:** a constant base bed, one area bed crossfaded by
   sphere margins, a footstep loop gated by animation weight and locked to the clock, a paper rustle gated to
   the box animation. Cheap, seamless, no clicks.
7. **A diegetic source as a beacon.** The musician's loop pulls you toward him and politely stops when he
   speaks.
8. **Calm by subtraction:** low constant music, no NPC chatter or barks, no text chat, a 10-player cap, emotes
   seen within 20 m and heard within 3 m. Each thing is rare, so each thing is noticed.
9. **Writing that is short, specific and a little sad or funny.** A punchline lands on the last beat, and the
   world changes the NPC's idle line after you help.
10. **Budget honesty.** 3.7 MB of audio on desktop. 15 s mono beds at about 44 kbps are enough. On iPhone,
    they cut everything but the music rather than stutter.

**For us (qingming):**
- Crowds are about 12× Messenger's per area, so we can't open a bubble for everyone in range. Pick the nearest
  1–2 figures facing the player.
- One line per painted figure, written from its routine in `people.json` (what its body is doing), revealed in
  stepped frames.
- Region beds come from the scroll map's areas: river, bridge, gate, market, fields. Use sphere or polygon
  margins over a constant base, gain-only switching, and a reduced set on phones.

## Sources

**Web:**
- https://www.awwwards.com/messenger.html: the devs' case study (NPCs, soundscapes, the guitar NPC, the
  10-player cap, no chat, 3D emoji).
- https://news.ycombinator.com/item?id=45396441: comments 45397498 and 45407047 on the arrow and "..." balloon.
- https://gigazine.net/gsc_news/en/20250929-messenger-browser-game/,
  https://en.wikipedia.org/wiki/Messenger_(video_game), https://www.commarts.com/webpicks/messenger
- Press: polygon.com, rockpapershotgun.com, aftermath.site, boingboing.net (Sep–Oct 2025).
- https://muz.li/blog/threejs-conf-paris-2026/, abeto.co, vlucendo.com, and the Pudgy World launch post on
  pudgypenguins.com (the unconfirmed lead).

**JS (local study copy, `js/App3D-DwM1eiaC.js`):** The shell's `grep` is ugrep, which rejects long `.{0,N}`
windows. So the counts came from `grep -o -i <word> | wc -l`, and context was read with a small Python slicer
(`re.finditer` ± N characters).
- Patterns: `bubble`, `dialog`, `talk`, `textsBubbles`, `npc_bubble_*`, `npc_dialog_*`, `voice:"`,
  `new npc(this,{id:"`, `questData`, `introTexts`, `\.ogg`, `addAudio`, `addPositionalAudio`, `ambianceSpheres`,
  `footsteps`, `contextReady`, `lowMemoryDevice`, `opus`, `emoji`, `_emitNetworkEvent`, `_createSocket`,
  `uIsTalking`, `lockCameraObject`, `playBoxAudio`, `topIcon`.
- Absent: `Howl`, `typewriter`, `blip`, `babble`, `speech`, `conversation`, a raw `PannerNode` (three.js wraps
  it), and any `.mp3/.wav/.m4a` literal (mp3 is only the runtime fallback).

**Network:** Sizes come from GET to /dev/null of `https://messenger.abeto.co/assets/audio/<path>.ogg|.mp3`.
Codec data comes from `ffprobe` and durations from an `ffmpeg -f null` decode. No audio was saved.
