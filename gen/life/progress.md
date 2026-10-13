# Life pass (details pass, agent "life"): progress

Brief: `gen/details/brief_life.md`. Design: `gen/life/design.md` (three distances). Standard: `gen/ui/STYLE.md` §5, §12.

## 2026-10-13

- Read the brief, design.md, vignettes_S4_S6.md, STYLE.md, ui brief/progress/r2_lore, talk.js, components.js,
  index.js, journal.js, ui_data.mjs, font_subset.py + roles.json, the three talk.json, people.js (persons, do-cycles),
  the perf tools (probe.mjs, ui_cost.mjs, bench_page.mjs), regress.sh.
- **Who you play** is `s.avatar` (world.js, default `official`), only in the lil-gui "You" folder so far.
- New tool `tools/talk_cast.mjs <S|all>` → `gen/life/cast/<S>.md`: every group with members, every lone figure, with
  the map's words, X/D and what it plays (character, do-cycle clips). The writers' sheet.
- **Before** (old code, no chatter): `gen/life/life_cost.mjs before_1` (phone 390×844 dpr 3 touch, 4× CPU,
  `?tier=low&adapt=0`, 3 windows × 4 s per view) → `gen/life/perf/before_1.json`:

  | view | fps | page CPU ms/frame | UI script ms/frame | style+layout ms/frame |
  |---|---|---|---|---|
  | storyteller | 78.4 (spread 34.8) | 11.92 (spread 5.5) | 0.109 (spread 0.03) | 0.001 |
  | crown | 47.2 (spread 10.7) | 20.18 (spread 4.8) | 0.139 (spread 0.04) | 0.001 |

  The machine is shared (another Chrome slot was busy): page CPU swings ±25 %; the UI's own time is the stable number.

### Engine (all in `web/src/ui/`, no engine file touched)

- `bubbles.js` (new): one pool of at most two anchored bubbles shared by the near talk (owner `talk`) and the street
  (owner `chat`); the near talk wins (takes a chat slot, chat never takes its slot); per frame only the projection and
  a transform per open bubble; two are pushed apart, or the older stacked above, or on a phone only the newer shown;
  each bubble's screen box is kept for the overlap check. Shared helpers: `headOf`, `headOfRole`, `personsOf`,
  `castOf`, `readSecs`, `withEnglish`.
- `chatter.js` (new): the earshot tier. Groups within 26 m wake (staggered; a third pick up mid-exchange), play
  exchanges of turns (the next speaker starts as the last line ends, the same speaker after a breath), quiet gaps
  between (×1.8 at night); exchanges and alternatives never repeat the last; `linked` exchanges keep replies matched;
  a sleeper only thinks; `when` ties a line to clips. Bubbles only within 10 m and on screen, nearest first (a nearer
  speaker takes the farthest chat bubble's slot), at most one new chat bubble per 0.8 s, silent while a near talk,
  the journal or the settings are open. Barks: rare words of lone figures within 8 m; `close` barks call to you once
  as you come within 3.6 m. Scan every 0.25 s; nothing per frame.
- `talk.js` (rewritten on bubbles.js): who you play (`kind()` from `talk.json` kinds by `s.avatar`) picks a beat's
  `as` line and filters `only`/`not` beats; the second and later talks with a host play its `again` sets; a scene's
  or set's `step` is heard on start.
- `index.js`: Bubbles + Talk + Chatter; talk.json fetched after places.json; `heard(step)` → `prefs.discovered`
  `h:<step>` and a small ink note (聞 seal, the line's title, 記入圖志) at the bottom centre for a few seconds; the
  talk font subsets asked for at idle (6 s after talk.json); test hooks `chatter(on)`, `chatterState`, `chatterStats`,
  `bubbles()` (boxes), `kind()`, `heard(step)`.
- `journal.js` (renderTalk only): the 街談巷議 block on the 見聞 leaf: each plot line with a heard step, only the
  heard steps in order, a 「……」 gap where something is unheard (no counts, no list of what's left).
- Settings (`settings_screen.js`, `settings_words.js`): 扮作 (who you are, 視角 page: 官人 士子 僧人 婦人 孩童 軍士
  腳夫 遊人) and 街談 (street chatter on/off, 介面 page); `prefs.chatter`.
- **Chinese plus English** (the user, via the lead, 2026-10-13): every shown string in talk.json has an `_en` sibling;
  bubbles show it (italic Latin serif, the speaker's role first) only when `prefs.lang` is `zh_en` (3d-director-da owns
  the pref and its settings row); the journal's plot lines likewise. `gen/life/en/add_en.py` adds glosses from a
  zh→en table (used for the pilot).

### Data and checks

- `sections/world/talk.json` (new): `kinds` (34 avatars → 8 kinds) and 8 **plot lines**, 30 steps over 7 sections:
  城門爭稅 tax (S5, S5, S4, S4b), 漕糧入城 grain (S2, S2, S3, S5, S6), 節下的酒 wine (S3, S5, S6, S6, S7: ends at
  趙太丞家's 治酒所傷 sign, 名画记 48), 炭驢進城 charcoal (S1, S3, S4: 名画记 1 + 21), 郊外驚馬 horse (S1, S1, S2),
  大船過橋 boat (S3, S3, S4b), 清明上墳 qingming (S1, S2, S4b, S6: 名画记 6, 13, 27), 書屏遭廢 screen (S5, S3, S6:
  余辉 2015).
- `tools/talk_data.mjs` (new, called by `tools/ui_data.mjs`): checks and bundles scenes, chatter, barks, threads,
  kinds; strips sources from the bundle. FAILs: speaker not a placed painted figure; no src; line > 16 characters;
  simplified characters; digits; a sleeper saying (not thinking); `when` clips its figure never plays; unknown kinds;
  2–6 beats for every kind; a step unknown or told nowhere; a missing English gloss; and every bubble glyph covered by
  a QM Text subset (fonts.css). A section not yet written in the life pass (no `chatter`) only gets notes.
- Fonts: the talk's lines and names moved to lazy `talk` subsets (text-talk, display-talk), read from the built
  bundle (`web/public/assets/ui/talk.json`): order is `ui_data.mjs build` → `font_subset.py` → `ui_data.mjs check`.
  The eager fonts fell from 196 to 178 KB.
- **Pilot S4 outer_road**: 5 scenes (V4.2 extended; V4.1 懶兵候主, V4.5 筐前問價, V4.3 牛車遇騎, V4.4 抬轎進城), 9 chatter
  groups (25 exchanges), 13 barks, steps tax.3 (the fortune-teller's client) and charcoal.3 (the drover).
- Page check `gen/life/life_check.mjs` (views, bubbles sampled every 250 ms: most open, overlaps, lines, steps heard;
  then every near talk played as official, scholar, child, twice). pilot1 (desktop): PASS; at most 2 open, no overlap;
  at the stalls 6 bubbles in 20 s; tax.3 heard at the fortune-teller; every S4 talk changes with who you play and its
  again set differs.

### The tier contract (lead, 2026-10-13: `gen/details/tier_contract.md`)

- `web/src/tiers.js` `detail.talk` (only those three lines touched; 3d-director-04 told): `chatterOpen` 1/2/2, `marks`
  0/4/6, `scanHz` 3/4/4, `wakeM` 20/26/26, `showM` 9/10/10, `barkM` 7/8/8, `gapScale` 1.35/1/1, `perMin` 5/8/9.
  `chatter.js` `DEFAULTS` has the same shape. `applyTier(cfg)` re-scales live (chatterOpen × detailScale, never below
  one; gaps ÷ detailScale; extra chat bubbles dropped farthest first). Registered from `ui/index.js` with
  `detail.js register('talk', …)`; no world.js line. `stats()`: draws 0, triangles 0, instances = bubbles + marks,
  cpuMs = talk + chatter + bubbles + marks per frame (running mean), scheduled groups, tier.
- **Calm budget** (from the simulator below): a token bucket of `perMin` new exchanges a minute on screen (burst 3);
  the next lines of an exchange already on screen don't spend one, so a dialogue that has begun goes on. At most one
  new chat bubble a second. A speaker never repeats the line it was last seen saying (memory kept per group across
  walking away and back); with one chat bubble (low tier) a reply takes its own group's older line.
- **Intent marks** (`marks.js`, built after all: the tier budget already had them): a paper disc with an ink
  pictogram (16: coin, scale, bow, paper, zzz, alarm, cup, sack, book, boat, voice, flower, fan, wheel, rope, bowl)
  over the speaker of a group whose exchange plays, from beyond `showM` to `wakeM`, on screen, not behind a wall (one
  BVH ray per candidate per scan), nearest first, at most `marks`. Data: chatter `mark`.
- `gen/life/sim_chatter.mjs`: the real `chatter.js` in node with stand-in people and the bubble rules, over simulated
  minutes: bubbles per minute, most chat bubbles open, repeats, steps heard. S4, 10 min: at the stalls (8 groups in
  earshot) 9.5 / 15.8 / 17.7 new bubbles a minute on low / mid / high (20.4 on mid before the budget), at the
  fortune-teller 7.5 (mid); never more chat bubbles than `chatterOpen`; tax.3 heard. Residual repeats only in linked
  replies.

### All eight sections (one writer agent per section, brief `gen/life/brief_section.md`, cast sheets `gen/life/cast/`)

| section | scenes (again sets) | chatter groups (exchanges, marks) | barks (close) | lines* | plot-line steps |
|---|---|---|---|---|---|
| S1 countryside | 5 (8 again) | 7 (26 exchanges, 5 marks) | 3 (0 close) | 205 | charcoal.1, horse.1, horse.2, qingming.1 |
| S2 canal | 10 (15 again) | 29 (90 exchanges, 17 marks) | 13 (6 close) | 557 | grain.1, grain.2, horse.3, qingming.2 |
| S3 rainbow_bridge | 12 (17 again) | 35 (94 exchanges, 20 marks) | 23 (4 close) | 688 | grain.3, wine.1, charcoal.2, boat.1, boat.2, screen.2 |
| S4b outer_road_2 | 6 (10 again) | 15 (48 exchanges, 12 marks) | 9 (3 close) | 342 | tax.4, boat.3, qingming.3 |
| S4 outer_road (pilot) | 5 (4 again) | 9 (25 exchanges, 7 marks) | 13 (2 close) | 203 | tax.3, charcoal.3 |
| S5 gate | 10 (17 again) | 16 (48 exchanges, 11 marks) | 9 (2 close) | 386 | tax.1, tax.2, grain.4, wine.2, screen.1 |
| S6 inner_city | 12 (24 again) | 34 (101 exchanges, 18 marks) | 16 (5 close) | 654 | grain.5, wine.3, wine.4, qingming.4, screen.3 |
| S7 city_end | 4 (8 again) | 3 (15 exchanges, 3 marks) | 3 (1 close) | 163 | wine.5 |
| **all** | **64 (103)** | **148 (447, 93)** | **89 (23)** | **3198** | **30 steps, 8 plot lines** |

\* lines = Chinese lines with their alternatives and who-you-play variants, each with an English gloss.

- Marks: `gen/life/marks.json` (chatter id → pictogram) applied by `gen/life/add_marks.py`.
- `ui_data.mjs check`: **PASS** (all eight sections, all 30 steps told, every glyph in a subset).
- **The bundle split per section** (431.7 KB raw / 131.7 KB gzip in one file was too much to fetch and parse at load
  on a phone): `assets/ui/talk.json` is now the core (8.3 KB: kinds, plot lines, an index), and
  `assets/ui/talk/<section>.json` (22–97 KB raw) is fetched as that section streams in (`index.js talkSync`, once a
  second over the loaded sections); the journal fetches the rest when it opens. The kit page reads `talk/gate.json`.
- Fonts: the talk's glyphs are 891 in `text-talk.woff2` (297 KB) and 173 in `display-talk.woff2` (68 KB), both lazy,
  asked for at idle 6 s after the first talk file. Eager fonts stay 178.8 KB (budget 250). `ui_data.mjs build` writes
  even when glyphs are missing (a note), since the fonts are cut from its output; `check` fails on them.
- Simulator, 10 min at mid tier (no occlusion or screen test, so an upper bound): new bubbles a minute at
  city_end:doctor 15.2, storyteller 13.0, crossroads 14.0, zhengdian 12.6, gate street 13.4, gate bridge 13.1, S4
  stalls 15.8, post 13.2, S4b crowd 12.6, tea house 7.8, crown 13.7, tavern gate 13.4, grain wharf 9.9, trackers 10.2,
  S1 stall 7.9, sedan party 4.1: busy in town, calm in the country. Steps heard where they belong.

### Page checks, all sections (`gen/life/life_check.mjs`; `gen/life/check/all_desk.json`, `all_phone.json`)

- **all_desk** (1920×1080, `?tier=high`, 30 views over all eight sections, 18 s each, then all 64 near talks):
  **PASS**. 1,919 samples; two bubbles on screen in 180 of them, **0 overlaps**, never more than two open; 90 chat
  bubbles shown; scan mean 0.04–0.24 ms per scan (4 a second); detail stats `talk.cpuMs` 0.002–0.02 ms/frame.
  Steps heard while standing at the views: wine.5, wine.4, qingming.4, tax.1, tax.4, screen.2, grain.3, grain.1,
  horse.3, charcoal.1. Near talks: **64/64** played (3–6 lines on the first visit), **64/64 change with who you
  play** (official, scholar, child), **62/64** play a different set on the second talk (the two without `again` sets'
  difference are S4's V4.3 and V4.4, by design one set). A reach probe stands you 1.4 m from each host on whatever
  surface is there (goto + ground ray): 64/64 within 3.2 m and 1.6 m of height. It does not prove a walking route:
  the writers flagged S2's boat hosts (V2.4, V2.6, V2.10) and S3's V3.5 (half behind a lattice) and V3.8 (behind a
  wall) for a look.
- **all_phone** (390×844 dpr 3 touch, `?tier=low`, English on, 15 views, 20 s each): **PASS**; at most **one** chat
  bubble (the tier's `chatterOpen`), 0 overlaps, 0–4 lines shown per 20 s (the light tier's calm budget).
- Fixed from the shots: a four-character role tag wrapped into two columns (the tag never wraps now); look shots wait
  for the glyphs to step in.

### Opt-in behind `?talk=1` (the lead, before 3d-director-04's deploy)

- Until the lead signs it off, everything new is behind `?talk=1` (`ui/index.js` `life`, `settings_screen.js`
  `LIFE`). Without it: the six press-E scenes of the ink UI round (V5.1, V5.5, V5.11, V6.5, V6.2, V4.2), each with its
  first beats only and `as`/`only`/`again`/`step` stripped at load, so its lines are byte-for-byte the old ones (checked
  against the bundle); no chatter, barks, marks, plot lines (threads emptied at load: no 街談巷議 block, no heard note),
  no 扮作 / 街談 rows. da's 語言 row and the English glosses stay. The talk files still load per section (the six
  scenes live in three of them). `gen/life/off_check.mjs` proves both paths in the page (`__test.details().talk`:
  scenes, chatter, barks; the settings rows). The life tools (`life_check`, `life_cost`) default to `talk=1`.
- Fixed before the flip: the contact pass's clip variants (`push~<figure>`, `sit~soles`) broke two `when` checks; the
  check and the chatter read a variant as its base clip; one stale `when` (the gate clerk no longer writes) is gone.
- A tooling slip: my chained waits used `pgrep -f` on their own command line and never fired; replaced by
  `gen/life/run_final.sh` (switch check, cost A/B, regression, look shots in sequence).

### Final runs (`gen/life/run_final.sh`)

- **The switch** (`gen/life/off_check.mjs` → `gen/life/check/off_check.json`): **PASS**. Without `?talk=1`:
  `__test.details().talk` = { life false, chatter 0, barks 0, scenes 6, instances 0, scheduled 0 }, the 視角 page
  has view / camDistance / fov and the 介面 page lang … journal (no 扮作, no 街談). With `?talk=1`: 64 scenes, 148
  chatter groups, 89 barks, chatter on, both rows there. No page errors either way.
- **Cost on the phone proxy** (`life_cost.mjs after_1` → `gen/life/perf/after_1.json`: 390×844 dpr 3 touch, 4× CPU,
  `?tier=low&adapt=0&talk=1`, chatter off/on interleaved on one page, 3 pairs × 4 s per view; another session's phone
  bench was running in parallel, so the page's own numbers are noisy):

  | view | page CPU ms/frame off → on (spread) | fps off → on | UI script ms/frame off → on | style+layout ms/frame off → on |
  |---|---|---|---|---|
  | storyteller | 21.94 → 21.01 (±4.7) | 42.5 → 43.4 | 0.284 → 0.586 | 0 → 0.139 |
  | crown | 29.97 → 28.22 (±7.5) | 31.9 → 33.5 | 0.312 → 0.464 | 0 → 0.125 |

  The frame is within noise (the "on" windows were not slower). The UI's own script time rises by 0.15–0.30 ms a frame
  at 4× (about 1 % of the frame; at desktop speed the detail stats read 0.01–0.03 ms): mostly the open bubble (its
  placing, and the one DOM build and size read when a line starts), not the scheduler (scans 0.04–0.2 ms each at 1×,
  3 a second on low). Style and layout add 0.13 ms while a bubble's glyphs step in (CSS animation). Before the life
  pass (`before_1`, the old code, a quieter machine): UI 0.109 / 0.139 ms at the two views.
- **Regression** `regress.sh life1` (default URL: the life layer off, as deployed): world **210/211** (the one miss is
  the S2 north-bank E→W walk, the known flaky one of ui2), boats **12/12**, rides **5/5**, people FAIL only on the two
  known road stands (X 7 / X -8), contacts REPORT (the contact pass's own report). Rerun of the world walks: below.
- **Look shots** (for the lead): `gen/life/shots/look_desk_en/` (desktop, high tier, English on: storyteller,
  crossroads, street, fortune, crown, grain_wharf, doctor, the journal's 見聞 leaf with a plot line) and
  `gen/life/shots/look_phone/` (phone, low tier: storyteller, crossroads, crown); earlier `gen/life/shots/all_desk/`
  (25 views, two bubbles each, Chinese only). Both checks PASS: never more than two bubbles (one on the phone), no
  overlaps.
- **World walks rerun** (`regress.sh life1b world`): **211/211 PASS** (the S2 miss of life1 was the known flake).
- **people.json moves under the talk** (the contact pass edits the cycles while this pass runs): six `when` lines
  lost their clip (beggar boys now hold out a hand with `hand_over`, not `reach`; a pack handler `browse`s; a sack
  porter `bend_goods`). They now follow the new clips; and a `when` whose clip is gone is a **note** ("never said
  now"), not a FAIL: the chatter skips such a line, so it can never contradict the body, and the check names it to
  revisit. `ui_data.mjs check` PASS after the rebuild (bundle, fonts).

## Questions for the user (collected from the eight writers and the lead's pilot)

1. **Switch it on?** Everything is behind `?talk=1`; the live default keeps the six old scenes. Look first, then say.
2. **How busy?** In town about 13 new bubbles a minute at most where you stand (mid/high), one bubble at a time and
   about five a minute on the light tier; quieter in the country. More, fewer, or as is?
3. **Who you play** (settings 扮作, eight kinds): keep the eight, and keep 官人 as the default?
4. **Real names from the sources** (not invented): 霍四究 (a storyteller named in 東京夢華錄, S6), 蘇學士 (Su Shi, from
   余辉 2015's banned writings, S3/S6), 孫羊店 named in S7. Acceptable?
5. **Readings the writers chose** (each said in the data): the bolting horse as the tomb party's white 官马 (S1, 余辉);
   S2's grain voiced as 余辉's private grain with no official guarding it; S2's bucket man as an offering at the
   boat's side, not slops; S3's big boat as 余辉's passenger boat towed too close; the 串車's load as the banned
   screen (名画记 reads coins); S5's kneeling man praying to the road god (not a beggar); S6's meat as 余辉's mutton
   offal (the map has pork); S6's 解 sign as 名画记's exam office; S7's doctor already examining the child (余辉: an
   old woman comforts the mothers while they wait).
6. **Season:** lines speak of 清明; S3's 新酒 banner is the autumn reading (one diner says so). Keep both?
7. **Grown-up hints:** S6's 栀子灯 line (hidden from child players) and S1's pheasants shot in the hunting ban: keep?
8. **The map could add** the woman at the palm cart's curtain (S4b, 名画记 27's heart), the fat butcher owner (S6,
   名画记 40), the groom inside the fence and the woman at the boat window (S3, 名画记 24, 19): only then can they speak.
9. **Small calls:** the veiled rider (S5) left man-or-woman open; the watchman says he'll beat the dusk drum (our
   extension); the old rider's servant calls him 員外; S4b's crowd as a pedlar showing wares; S2's south-bank group as a
   farewell; S7's two lines that wink at the scroll's cut edge (「前頭霧濛濛的」).

## The user's answers (2026-10-13, after the details pass)

"I checked the questions and we can just say yes and default to all them": every question above is answered yes, as
the writers proposed.
1. On by default: `?talk=0` is now the way back to the six old scenes (ui/index.js `life`, ui/settings_screen.js
   `LIFE`; `gen/life/off_check.mjs` checks `?talk=0` against the default).
2. Busyness as is (about 13 bubbles a minute in town on mid/high, about 5 on the light tier).
3. The eight kinds stay; 官人 stays the default.
4. The real names (霍四究, 蘇學士, 孫羊店) stay.
5. Every reading in 5 stays as written.
6. Both season lines stay.
7. Both grown-up hints stay.
8. Yes to the four figures (S4b palm-cart curtain woman, S6 fat butcher owner, S3 groom inside the fence and woman at
   the boat window). Not done yet: each needs mapping from the strokes, a character and a people.json entry before
   it can speak (a follow-up round; skill `scroll-section`, then `characters`).
9. The small calls stay as written.

## Question 8 follow-up (2026-10-13, brief `gen/life/brief_q8_figures.md`, record `gen/life/q8_figures.md`)

No new figures were added. Two of the four were already on the map under another reading; they were re-read there
and now speak:
- S6: the fat owner is `seated_man_highseat_4070` (V6.6, c6.traystall);
- S3: the groom is `behind_lampbox_17090`, re-read as seated (V3.5's roles swapped, bark b3.groom).

The other two stay out:
- S4b: nothing is painted at the moving cart's rear door;
- S3: the window woman can't be told from the mapped male passengers.
