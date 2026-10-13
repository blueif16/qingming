# Sound for the walkable 清明上河图: research (2026-10-12)

Scope: ambience by region and point sounds from people, animals and trades in `web/` (three.js r186.1 + Vite,
desktop and phones, about 21 MB today, sections streamed). Nothing has been generated or downloaded yet.
Tags: **[V]** means checked against the cited source on 2026-10-12. **[I]** means our inference or proposal.
`[n]` refers to Sources at the end.

## 1. ElevenLabs

**Sound Effects API [V]**
- `POST https://api.elevenlabs.io/v1/sound-generation` [1][2]: `model_id` `eleven_text_to_sound_v2` (only value,
  default); `duration_seconds` 0.5–30 s, null = model chooses (overview page: 0.1–30); `prompt_influence` 0–1, default
  0.3 (higher = more literal, less varied); `loop` (v2 only): "seamless … no perceptible start/end". The web app caps
  prompts at 450 characters [3].
- `output_format` (query) [1][2][3]:
  - `mp3_22050_32` … `mp3_44100_192` (192 needs Creator+); `pcm_8000` … `pcm_48000` (44.1 kHz PCM needs Pro);
    `opus_48000_32/64/96/128/192`; `ulaw`/`alaw`.
  - Web-app downloads: MP3 44.1 kHz, or WAV 48 kHz for non-looping effects only.
- **Cost.** Web app: 40 credits/s when the duration is set [2]; the pricing page says "≈200 credits per generation"
  [4]. API: billed in USD, SFX $0.12/min, billed per generation [5]. [I] 150 clips × 15 s ≈ $4.50, not a constraint.
- **Rate limit.** Over the limit you get 429 `too_many_concurrent_requests`. Concurrent requests: Free 2, Starter 3,
  Creator 5, Pro 10, Scale/Business 15 [6]. SFX isn't listed separately, so assume the same.
- **Licence [V].**
  - Paid plans are commercial. Free is non-commercial and needs "elevenlabs.io" credit. Paid-plan output stays usable
    after cancelling [7].
  - ElevenCreative Terms, Exhibit 4 (updated 2026-10-09, covers the "dashboard, APIs") [8]: output may go into
    "games, applications, and other productions" only "combined with other material". It may not be distributed
    standalone, "as isolated audio files or samples", or in an effects library.
  - Output is not exclusive [9].
  - [I] Serve files only as app assets (no downloads, no sound browser) and pack one-shots into per-section sprites.
- **Prompt tips [V] [2][10][11].** One clear sound per prompt ("Heavy wooden door creaking open"); sequences with
  "then"; audio terms (ambience, one-shot, loop, stem, drone, impact, whoosh); "high-quality, professionally recorded
  … foley"; build complex scenes from separate parts. Secondary [11]: source + material + action + space; set the
  duration for beds, not for hits; influence about 0.3 unless takes drift.
- [I] Our rules: end every bed prompt with "no music, no speech" ("ancient Chinese" invites erhu and gong clichés);
  generate one-shots dry (our reverb zones add space); 4 takes per prompt, picked by ear; prompts as files, per-unit
  cache.

**Crowd and voices**
- [V] The SFX demo does crowds ("packed stadium crowd … whistles and chanting") [12].
- [I] Untested: "open-air market crowd murmur, indistinct, no intelligible words, no music".
- [V] Speech: `eleven_v3` (70+ languages) and `eleven_v4` (90+) include Mandarin (`cmn`) [13][14][15].
  - v3 tags: `[shouts]`, `[whispers]`, `[laughs]`, `[overlapping]`.
  - Text to Dialogue: `POST /v1/text-to-dialogue`, ≤ 10 voices, about 2,000 characters per request.
- [V] Voice Design: `POST /v1/text-to-voice/design` (`eleven_multilingual_ttv_v2` or `eleven_ttv_v3`) [16].
  It returns previews with a `generated_voice_id` (saved through `/v1/text-to-voice`); `loudness` 0 ≈ −24 LUFS.
- [I] Hawkers: 6–8 designed voices; short `[shouts]` naming wares from 东京梦华录 (饶骨头, 香糖果子, 炊饼).
  - Keep them sparse, distant and low-passed.
  - Modern Mandarin isn't 12th-century Kaifeng speech, and clear words pull focus. Non-verbal haggling, laughs and
    coughs are safer.

**Music [V]**
- `POST /v1/music`: `model_id` `music_v1`/`v2`/`v2_5`, `prompt`, `music_length_ms` 3,000–600,000,
  `force_instrumental`; Opus/MP3/PCM; $0.15/min [17][5].
- Music Terms (2026-10-09) [18]:
  - Free–Business allow "all online and offline commercial use … except film, TV, radio, and Studio Games".
  - A Studio Game is an interactive experience "made available to the public" and monetized; Indie Games
    (< $500k revenue) are excluded.
  - Free–Pro are "For Individual Use Only"; Free needs "Eleven Music" credit.
  - [I] A free, ad-free world is not a Studio Game. Re-check if it is ever monetized.
- [I] Optional: a quiet 2–3 min guqin/xiao/dizi piece at dusk, off by default. No suona (§4).

## 2. Stock SFX

| Source | Licence [V] | Attribution | Bulk / API [V] | Fit [I] |
|---|---|---|---|---|
| Freesound | Per sound: CC0, CC BY 4.0, CC BY-NC 4.0, legacy Sampling+ (≈ BY-NC) [19] | CC0: none. BY: a credits page (title, author, URL, licence) [19] | API v2: token for search and previews (MP3 ≈128k, OGG ≈192k); originals need OAuth2; 60/min, 2,000/day [20][21]. Free API use is non-commercial [22] | Best real field recordings; filter `license:"Creative Commons 0"`; uneven quality; download originals by hand |
| Sonniss GDC | EULA v2.0 (2026-08-27): royalty-free, commercial, no credit; no standalone redistribution, no AI training [23][24] | None | ZIPs (2026: 7.47 GB; archive > 200 GB) | Pro quality (wood, water, wind, animals, walla); Western-leaning |
| Pixabay | Free, no credit, no standalone distribution [25] | None | API: images and video only [26] | Uneven quality and provenance |
| BBC SFX | Non-commercial personal, research or education only; others need permission; commercial via Pro Sound Effects [27] | BBC | No | **Avoid** |
| Zapsplat | Games and websites OK. Basic: credit zapsplat.com, MP3, 4 per hour. Gold: no credit, WAV [28][29] | Basic | No public API [I] | Fallback |
| OpenGameArt / Kenney | Mixed per asset / CC0 [30][31] | Varies / none | ZIP | Low fit (UI, game-like) |
| xeno-canto | BY-NC-SA, BY-NC-ND or BY-SA [32] | Always | Discourages bulk | Right bird species, mostly NC: avoid |

**Can we find each sound?** [V] Freesound counts are website searches with the CC0 filter, 2026-10-12 [33].
Verdicts are [I].
| Sound | Freesound CC0 hits | Verdict |
|---|---|---|
| Temple bell | "temple bell" 88: a 1532 bronze Japanese bell (51 s), Byōdō-in, Daitokuji (116 s). "chinese temple bell" 0 | Japanese bonshō, the closest real East Asian beam-struck bell |
| Big drum (暮鼓, 更鼓) | "taiko" 72, "big drum hit" 91 | Taiko hits, sequenced in code |
| Clapper (梆子, 柝) | "wood block clapper" 0; "bangzi" 2 | ElevenLabs |
| Rattle drum (拨浪鼓) | One "Chinese Bolanggu" upload (2026-07, licence not checked) | ElevenLabs, or record a real toy |
| Camel bells; cart creak; shoulder-pole creak | 1 (irrelevant); 1; "bamboo creak" 7 (wind) | ElevenLabs |
| Donkey; ox | 92 (incl. felix.blume's market donkeys); "cow moo" 177 | Stock (ox pitched down) |
| River lapping, oars | 26; 6 | Stock + ElevenLabs |
| Chinese market crowd | "china market" 28 (Xi'an barkers, Beijing) | Modern noise (megaphones, motorbikes): clean slices only, else ElevenLabs |
| Birds | "dawn chorus" 125 (Europe, Australia: wrong species); "china birds" 18 | China-recorded slices, else ElevenLabs |
| Night insects | "crickets night" 1,040 | Stock (see the season note in §4) |

## 3. Web audio architecture

- **Graph [I].** One `AudioContext` (iOS shares one; a 2026 blog reports a cap of about 4 [34]). Master gain (mute)
  → `DynamicsCompressorNode` limiter → destination. Buses: beds, points, events, music, one reverb send.
- **three.js vs our own pool.**
  - [V] r186.1 source: `PositionalAudio` is an Object3D with one `PannerNode` forced to `HRTF` and one source at a
    time; it ramps the panner position every frame while playing. `AudioListener` does the same for the listener.
  - [I] Keep `AudioListener`, but don't make a `PositionalAudio` per figure (373 figures = 373 HRTF panners).
  - [I] Pool instead: emitters are data (map ID, position, sound set, schedule). N voice slots each play a new
    `AudioBufferSourceNode` (cheap, fire-and-forget [35]) → `GainNode` → `equalpower` panner.
- **Costs [V] [36].**
  - HRTF is "very expensive" (up to four convolvers while moving); equal-power is "rather cheap". For mobile, use
    "a very short reverb and an equal-power panner".
  - `ConvolverNode` is "very expensive" with long impulses; a fixed `GainNode` is "essentially free".
  - A secondary guide (2026) [37]: phones strain at 20–30 sources (low-end 10–15), desktop 50–60; HRTF only for 4–8
    on mobile; 2–4 instances per type. Measure with `spotify/web-audio-bench` [38].
- **Stealing [I].** Every 100 ms, score emitters in range (40 m people/animals, 150 m bell/drum) by predicted gain ×
  priority.
  - Start a voice only if it beats the quietest playing one; fade the stolen one over 50 ms.
  - Cap per type (donkey 2, cart 2, hawker 3). Per play: ±3 % pitch, time jitter, 3–5 variants [39].
- **Autoplay [V].** A context made before a gesture starts "suspended"; call `resume()` after the gesture [40].
  [I] Resume on the first `pointerdown`/`keydown`.
- **iOS silent switch [V].** Web Audio follows the ringer switch under the `auto`/`ambient` session type.
  `navigator.audioSession.type = 'playback'` (Safari 16.4+, iOS 17) plays through it but stops other apps' audio
  [41][42][43]. [I] Set it only when the user turns sound on.
- **Formats [V].**
  - WebKit has supported WebM/Opus in Web Audio since 2021, with codec-delay trimming fixed [44][45].
  - Construct's author (2024): "As of Safari 17.4 … WebM Opus is now finally supported consistently across iOS and
    macOS" [46]. Ogg Opus works since Safari 18.4 [47][48].
  - [I] Ship **Opus in WebM** only; stay silent if decoding fails (iOS < 17.4).
  - [I] An AAC fallback isn't worth it: its loops gap by about 20 ms when only the edit-list start is honoured [49].
- **Gapless loops [V] [49][50].** MP3 pads 576 + 756 samples (37.6 ms gap if the Info frame is ignored); Opus
  pre-skip (312) is handled. Decoded `AudioBuffer` loops are sample-exact.
  [I] Store each loop's exact sample count in the manifest and set `loopStart`/`loopEnd` from it.
- **Bitrates.** [V] Xiph: speech 10–24 kb/s mono, podcasts 24–32, music streaming 64–96 stereo; 128 VBR ≈ transparent
  [51]. [I] Ours, in KB/min:
  - beds 48 kb/s stereo (360); one-shots 32 mono (240); distant voices 24 mono (180); music 64 stereo (480);
  - MP3 128 for comparison: 960.
- **Memory [V+I].** `decodeAudioData` gives float32 at the context rate [36]: 30 s stereo at 48 kHz = 11.5 MB.
  Decode only the current and next section.
- **Crossfades [I] [39][52].** Equal-power (cos/sin) gains keyed to the player's map `u` at section seams (about
  30 m), and day/dusk/night beds keyed to the world hour from `daylight.js`.
- **Reverb zone [I] [36].** One shared convolver on a send, generated impulse ≤ 0.6 s (noise × exponential decay).
  In the gate passage, raise the send for footsteps and points and low-pass the beds.
- **Loudness.** [V] Sony ASWG-R001: home −24 LKFS ±2, portable −18 ±2, TP ≤ −1 dBTP, LRA ≤ 20 LU [53][54]; EBU R128
  −23 LUFS [55]. [I] Mix to about −20 LUFS at a busy spot, TP −1; two-pass ffmpeg `loudnorm` (installed with
  libopus): beds −26 LUFS, one-shots per category.
- **Hidden tab, mute [I].** On `visibilitychange`, suspend or resume the context and scheduler. One mute toggle,
  state in `localStorage` inside try/catch; the icon follows the HUD rule (period object, no text), e.g. a small bell.
- **Reading:** web.dev "Developing game audio with the Web Audio API" [39]; Smus, *Web Audio API* [52]; Adenot's
  performance notes [36]; MDN `AudioBufferSourceNode` [35][50].

## 4. Period soundscape: Northern Song Kaifeng

**Attested**
- **Hawkers [V].** Each ware had its own sung cry.
  - 高承《事物纪原》(c. 1080): 「京师凡卖一物，必有声韵，其吟哦俱不同，故市人采其声调，间以词章，以为戏乐也……又谓之吟叫」[56].
  - 东京梦华录 卷三, along the 御街 at dawn: 「吟叫百端」[57]. 梦粱录: Hangzhou 「效京师叫声」[58].
- **Dawn [V] [57].**
  - 「每日交五更，诸寺院行者打铁牌子或木鱼循门报晓……诸趋朝入市之人，闻此而起」: acolytes went door to door with iron
    plates or wooden fish.
  - Pigs and sheep came to market 「动即百数」; flour came on 太平车 or donkeys 「至天明不绝」.
- **Carts [V] [57].** In 般载杂卖, the 太平车 is pulled by 20+ mules or donkeys, or 5–7 oxen, and carries an iron bell:
  「中间悬一铁铃，行即有声，使远来者车相避」. A real period sound. There are also the one-ox 平头车 and the donkey-towed
  串车.
- **Night [V] [57].** 「夜市直至三更尽，才五更又复开张。如耍闹去处，通晓不绝」. Tea sellers were out at the third watch.
  Every ~300 paces a 军巡铺 kept 5 soldiers 「夜间巡警」, and there were 望火楼.
- **Drums [V].**
  - 春明退朝录 (1070): street drums 「以警昏晓」, then 「二纪以来，不闻街鼓之声」[59], so the curfew drum was silent by ~1046.
  - The painting's gate tower does hold a drum (余辉: 「城上暮鼓」) [60].
  - Song 谯楼 kept 更鼓 time with clepsydra keepers and drummers (淳熙三山志, 1128, via [61], secondary).
  - [I] The dusk drum = 定更, then each 更, not a curfew.
- **Peddler's drum.** The pellet drum (鼗) is ancient; a peddler's drum appears in 李嵩《货郎图》 (Southern Song) [62].
  [I] Use it only if the map holds a peddler.
- [I] **Clapper:** the wooden 柝 is ancient (易·系辞「重门击柝」, quoted from memory). Use it sparsely on patrols.
- [I] **Boatmen:** the haul call 「邪许」 (淮南子, quoted from memory) is ancient.
- [I] **Camel bells:** plausible on the painted caravan, whose driver is non-Han (荣新江 via 余辉 [60]).
- [I] **Temple bells:** a morning bell and evening drum fits monastic practice. 大相国寺's surviving bell is Qing, and
  "相国霜钟" is a later label (not verified).

**Anachronisms to avoid**
- **唤头 (barber's fork):** Qing and Beijing, tied to the queue edict [63]. The painted barber gets water, razor and
  talk.
- **醒木:** Ming–Qing (桃花扇) [64]. Storyteller and fortune teller: voice only.
- **梆子 + 锣 rounds crying 「天干物燥，小心火烛」:** a Ming–Qing image [65].
- **惊闺:** first cited from 周密 (late Southern Song or Yuan), then 金瓶梅 [63]. Borderline: leave out.
- [I] **唢呐:** usually dated Jin/Yuan, documented in Ming. Leave out.
- **From field recordings:** modern Mandarin words, megaphones, bicycle bells, motors.
- [I] **Season:** Qingming means April: frogs at the moat and river and sparse insects, not a summer cricket chorus.
- [I] **Birds:** East Asian species (tree sparrow, magpie, swallow, light-vented bulbul, spotted dove), not a
  European dawn chorus.

## Recommendation

**Principle [I].** Sound follows the map as the models do.
- Every point sound belongs to a mapped ID (figure, animal, cart, gate, temple).
- Beds voice only what is painted nearby, with crowd density from map counts.
- No invented hawkers or traffic.

| Sound | Source | How |
|---|---|---|
| Region beds (day + night, 30 s loops) | ElevenLabs `loop:true`, influence 0.4 | Inner city: market walla. Gate: passage traffic. Outer road: fields, willow wind. River (later): flow |
| Donkey, ox, horse, mule, pig, dog | Freesound CC0 | 3–5 variants each |
| Camel + neck bells | ElevenLabs | Bells loop while it walks |
| Birds, frogs, insects | Freesound CC0 (China-recorded); else ElevenLabs | By world hour |
| Carts (axle creak, 太平车 iron bell, hooves) | ElevenLabs | Loop while moving; bell rate tied to speed |
| Pole creak, footsteps (earth, planks, stone) | ElevenLabs foley | Synced to the walk cycle |
| Trades (butcher, barber, other mapped trades) | ElevenLabs | Mapped figures only |
| Temple bell; gate drum | Freesound CC0 bronze bell (tec_studio 1532); taiko hits | Dawn and dusk; 定更 and each 更 from the world clock |
| Dawn 报晓 (iron plate, wooden fish), 柝 | ElevenLabs | 五更 rounds; night patrols |
| Hawkers, haggling, laughs, storyteller, fortune teller | `eleven_v3` + 6–8 designed voices; non-verbal SFX | Distant, sparse |
| Boats (later): lapping, oars, hull, haul call | Freesound CC0 + ElevenLabs | From the painted crew |
| Music (optional) | Eleven Music, instrumental | Off by default |

**Formats [I].**
- Masters: ElevenLabs as `pcm_48000` (if the plan allows; else WAV from the web app or `mp3_44100_192`); stock as the
  original files. Keep them with a manifest (ID, source URL or prompt, licence, take, LUFS) under `gen/life/`.
- Shipped: Opus/WebM at 48 kHz: beds 48 kb/s stereo; one-shots 32 kb/s mono in one sprite per section plus a shared
  sprite (animals, foley); distant voices 24 kb/s mono.

**Size budget [I]** (decoded = float32 at 48 kHz)
| Item | Count × length | Download | Decoded when live |
|---|---|---|---|
| Region beds (3 sections + river), day + night | 8 × 30 s stereo @48k | 1.44 MB | ≤ 2 live = 23 MB |
| Shared layers (willow wind, distant walla) | 2 × 30 s stereo | 0.36 MB | 23 MB; mobile 1 live |
| Shared sprite: animals, foley | ≈ 60 × 2 s mono @32k | 0.48 MB | 11.5 MB |
| Section sprites: trades, voices, events | 3 × ≈ 25 × 2.5 s mono | 0.6 MB | ≈ 6 MB each, 2 live |
| **Core total** | | **≈ 2.9 MB (+14 % on 21 MB)** | **≈ 45 MB desktop, ≈ 35 MB mobile** |
| Music (optional, lazy, skipped with Save-Data) | 3 min @64k stereo | 1.4 MB | Streamed via `<audio>` |

**Voice budget [I]** (simultaneous; confirm on real phones with web-audio-bench)
| Voices | Mobile | Desktop |
|---|---|---|
| Beds and layers (no panner) | 3 | 4 |
| Positional points (`equalpower`) | 12 | 24 |
| Events (bell, drum) | 2 | 2 |
| Reverb send (one convolver, ≤ 0.6 s) | 1 | 1 |
| Per-type cap | 2 | 3 |

**Next [I].**
1. Build a one-section test (the gate): one bed, 10 points, the drum, the reverb zone, the mute toggle and iOS
   unlock. Bench it on an iPhone and a mid Android.
2. Then write prompt files and a manifest, and scale.

## Sources

- **ElevenLabs** (elevenlabs.io unless noted):
  - [1] docs/api-reference/text-to-sound-effects/convert; [2] docs/overview/capabilities/sound-effects;
    [3] docs/eleven-creative/playground/sound-effects; [4] /pricing; [5] /pricing/api.
  - [6] help.elevenlabs.io 19571824571921 (429), 14312733311761 (concurrency); [7] help 13313564601361 (publishing);
    [8] /creative-terms (Exhibit 4); [9] /terms-of-use; [10] help 25735604945041 (prompting).
  - [11] fuser.studio/articles/elevenlabs-sound-effects-guide (secondary); [12] join.elevenlabs.io/sound-effects;
    [13] docs/overview/models; [14] help 35869142561297 and /blog/eleven-v3-audio-tags-…
  - [15] docs/api-reference/text-to-dialogue/convert; [16] docs/api-reference/text-to-voice/design;
    [17] docs/api-reference/music/compose; [18] /music-terms.
- **Stock:**
  - Freesound: [19] freesound.org/help/faq; [20] docs/api/resources_apiv2.html; [21] docs/api/overview.html;
    [22] docs/api/terms_of_use.html.
  - [23] sonniss.com/gdc-bundle-license (+ /previous-versions); [24] gdc.sonniss.com, sonniss.com/gameaudiogdc.
  - [25] pixabay.com/service/license-summary; [26] pixabay.com/api/docs; [27] sound-effects.bbcrewind.co.uk/licensing,
    /faqs.
  - [28] zapsplat.com/license-type/standard-license; [29] zapsplat.com/faq; [30] opengameart.org/content/cc0-sound-effects;
    [31] kenney.nl/assets/category:Audio; [32] xeno-canto terms (archived termsofuse.php, /about/terms).
  - [33] `freesound.org/search/?q=<term>&f=license:"Creative Commons 0"`; picks: sounds 668647, 232333, 131348,
    246406, 705300, 452411, 474564, 864050.
- **Web audio:**
  - [34] bugnet.io/blog/fix-web-audio-multiple-context-error-safari-ios (secondary); [35] MDN AudioBufferSourceNode;
    [36] padenot.github.io/web-audio-perf.
  - [37] abratabia.com/web-game-audio (audio-performance, spatial-audio-games, mobile-audio-issues; secondary);
    [38] github.com/spotify/web-audio-bench; [39] web.dev/articles/webaudio-games; [40] developer.chrome.com/blog/autoplay.
  - [41] bugs.webkit.org 237322; [42] 251532; [43] MDN Audio_Session_API; [44] trac.webkit.org/changeset/280416;
    [45] bugs.webkit.org 228140; [46] 183852 (A. Gullen, 2024-03-11).
  - [47] webkit.org/blog/16574 (Safari 18.4); [48] caniuse.com/opus;
    [49] lukaswojcik.com/…/gapless-playback-encoder-delay-padding-mp3-aac-opus-flac-measured.
  - [50] MDN AudioBufferSourceNode/loop; [51] wiki.xiph.org/Opus_Recommended_Settings; [52] webaudioapi.com/book.
  - [53] rtw.com worldwide-loudness-delivery-standards; [54] randycoppinger.com/2013/10/18/loudness-in-interactive-sound-at-sony;
    [55] tech.ebu.ch/publications/r128.
  - three.js r186.1: `web/node_modules/three/src/audio/PositionalAudio.js`, `AudioListener.js`.
- **Period:**
  - [56] 事物纪原 卷09 (zh.wikisource 四庫全書本); [57] 东京梦华录 卷03 (zh.wikisource; shidianguji.com/book/HY0001);
    [58] lyzz.visitbeijing.com.cn/news/detail?id=24288 (梦粱录).
  - [59] 春明退朝录 (shidianguji.com/book/CXHLB061); [60] 余辉: paper.people.com.cn 2014-02-14, cnap.org.cn 2022-04,
    nbd.com.cn 2019-12-05; [61] wendabaike.com/wiki/135063.html (secondary).
  - [62] baike.baidu.com/en/item/Pellet drum/1528405; [63] xinwen.bjd.com.cn s68807b27d5def9efdb2f514e, shm.com.cn 烟台日报
    2023-01-11, kuwen.com/news/9395.htm.
  - [64] zh.wikipedia.org/zh-cn/醒木, totjbv.com/ciyu/679254_552be1.html; [65] zh.wikipedia.org/wiki/打更,
    thepaper.cn/newsDetail_forward_8909910.
