# Stock sounds (CC0): notes, 2026-10-12

There are 59 files in `files/` (27 MB), covering all 25 needs. Each file is listed in `manifest.json`.

- **Freesound:** 54 files, each checked on its sound page as "Creative Commons 0". The files are the public HQ MP3
  previews (about 130–200 kbps). For final masters, log in to Freesound (free account, same CC0 terms) and download the
  original WAV/FLAC.
- **BigSoundBank:** 5 files. Each sound page says "CC0 (public domain)", and the page FAQ says the sound is released
  under CC0. The licences page also offers WTFPL or a public-domain dedication. WAV and FLAC are on the same pages.
- **Not used:** Sonniss (EULA), Pixabay (own licence, not CC0), xeno-canto (NC/SA licences), and Wikimedia Commons
  (animal sounds there are mostly CC BY-SA).

None of these files have been listened to. Choices rest on the uploader's notes, linear spectrograms, and RMS and
low-frequency (<100 Hz) levels. Before shipping, audition each file in `audition.html` or similar. Levels range from
-14 to -52 dBFS RMS, so normalise them in the pipeline.

## Not found in CC0

- **Bactrian camel:** none, on either Freesound or BigSoundBank. The two camel files do not name the species; one is a
  vintage film-optical recording. Wikimedia Commons "Cri du chameau" is a Bactrian camel, but under CC BY-SA 3.0
  (attribution and share-alike); ask the user before using it. Otherwise use ElevenLabs, or layer and pitch the stock
  groans down.
- **Large-billed / jungle crow (the common crow of China and Japan):** none. I used carrion crow, which also lives in
  East Asia, and hooded crow.
- **East Asian small birds:** the best fit is a tree-sparrow flock (`sparrows__fs451301`; tree sparrow is East Asia's
  town sparrow; location not given). The China recordings I found are spoiled by rain, city noise or voices: Xi'an
  456857/441259, Shanghai 347014, Beijing 146736. I found no clean CC0 light-vented bulbul, spotted dove, oriental
  magpie or swallow. Eurasian magpie 555096 (naturenotesuk, 44 s) is a possible extra.
- **Horse stamping in place on earth:** none. I used walking steps on a dirt road and on grass; cut single stamps from
  them. The craigsmith "Horse Pawing" takes (479678, 479713) are on wood and sound vintage. ElevenLabs could fill this.
- **Chinese temple bell:** no CC0 recording of a Chinese bell. I used a 1532 Japanese bronze bell (struck once, in San
  Francisco) and a bonshō recorded in Japan. Byōdō-in 232333 (Hawaii) is good but runs 90 s with several strikes.
  Korean Bell 474949 is a small bell.
- **Taiko one-shots:** the CC0 taiko files are music loops or synthetic. I used a real Chinese dagu (Taipei one-shots)
  and a field recording of a giant drum in a Suzhou garden, which fit better.
- **Wooden fish:** only one real mokugyo knock, `wooden_fish__fs607215`. Vary it with small pitch shifts. The second
  file is carbon-fibre temple blocks.
- **Iron cart bell (太平车 铁铃) and camel bells:** neither is in CC0. I used a small brass bell, small cowbells and a
  clapper goat/cow bell.
- **Broad, slow river (canal-size):** nothing clean under 60 s. felix.blume's Amazon river takes (673961 and nearby)
  are about 115 s. I rejected 151747 (wind rumble) and 871472 (engine on the hull). I used a slow small river and lake
  lapping at a dock.
- **Water on a wooden hull:** only the punt on the Cam (iPhone). Alternatives: 637645 (lake waves on a fishing-boat
  hull, 58 s, "human activity") and 177681 (boat hull with Thai night crickets).
- **Stern sculling oar (橹):** none. CC0 gondola files are city ambiences. I used paddles and a rowing boat with
  creaking rowlocks. Use ElevenLabs for the 橹's swish and creak.
- **Rope creak on a moored boat:** the best real one is Rmutt "Mooring Rope" 145721 (ferry line on a cleat, San
  Francisco Bay). I left it out because it is 69 s, over the 60 s limit; fetch it if the length is fine. Another
  option is the Malaga harbour ship rope 511099 (62.6 s). Kept: a braided rope under load, and a swing rope on a
  contact mic.
- **Donkey snort:** only one CC0 sound is tagged as a donkey snort (1.5 s, phone recording). The second file is donkey
  breathing.
- **Asian frogs and crickets:** found (Yunnan, Li River/Guilin, Japanese rice fields, Thailand). Longer extras: Korea
  frogs 829170 (65 s, iPhone, steady chorus) and a close Beijing cricket 139950 (63 s, faint city background).

## Rejected candidates

| ID | Sound | Why |
|---|---|---|
| 335871 | Crows at dawn | Calls too faint |
| 709306 | Camel at Giza | Heavy low end, tourist site |
| 693564 | Dromedaries | Low-end heavy |
| 724216 | Chickens | Distant traffic, per the uploader |
| 197103 | Chickens | Constant low-frequency line |
| 640199 | Horse plowing | A man calls to the horse |
| 347036 | Whinny | Recorded at a local event |
| 456857 | Xi'an birds | Rain and voices |
| 513561 | Cow moo #7 | Wind rumble |

## Suggestions

- **Season:** Qingming is April. Use the single field cricket (`crickets__bsb1020`) sparsely and favour the frogs. The
  Yunnan cricket take contains summer cicada bursts.
- **Ox:** pitch the cow moos down 1–3 semitones to suggest an ox.
- **Drum:** add a large outdoor reverb to the dagu one-shots for the gate-tower drum.
- **ElevenLabs** is still needed for: Bactrian camel, horse stamp, iron cart bell, camel bells, 橹 sculling, and the
  wooden 柝 clapper.
- **Other possible finds:** sazanami12 on Freesound also has "Temple Blocks (5pcs) - Chinese Sticks" (863783, tagged
  Bangzi) if a clapper-like wood sound is wanted. A captive 蝈蝈 katydid, 181680 (58 s), is also there.
