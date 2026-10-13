# Brief: one section's talk (the life pass, a section writer)

You write **one section's `sections/<folder>/talk.json`**: who among its painted people speaks, and what. The lead
(the "life" agent) built the engine, the checks and the pilot; your job is the words. Work in `/home/ran/3d_director/qingming`.

## Read first

1. **The pilot, your model:** `sections/outer_road/talk.json` (S4). Copy its shape, its tone, its density.
2. **The format and the checks:** the header of `tools/talk_data.mjs`.
3. **Your cast sheet:** `gen/life/cast/<S>.md` (every painted group with its members, every lone figure, what each
   plays: character and clips). Only figures marked as playing something can speak (not "not placed").
4. **Your map text:** `map/text/<S>.md` (the "Groups" and "Everything" parts) for what the painting shows.
5. **The readings** (all local, study only): `gen/ui/lore/sources/` (名画记's 49 annotations in
   `minghuaji_annoList_imageId7.json`; 余辉 2015 十大看点, 2021 三问, 2023 闹市; 《東京夢華錄》 excerpts; the colophons),
   `reference/scroll/sections.md`, and for S5/S6 `gen/life/vignettes_S4_S6.md` (34 vignettes with readings and draft
   lines). Your section's `sections/<folder>/places.json` long texts say what scholars read in its landmarks.
6. **The plot lines:** `sections/world/talk.json` `threads`: the steps whose `section` is yours. Each needs a
   chatter exchange (or a scene's `again` set, or a bark) in your file carrying `"step": "<id>"`, whose lines convey
   the step's note (its `hint` says which painted group).
7. Standing rules: `gen/details/brief_life.md` ("The user's standing rules for words").

## What to write

- **scenes** (press E at a host; 2–6 beats for every kind of player): at the section's main figures and vignettes.
  Each has 1–2 `again` sets (the second and third time you talk to the host: more depth, new facts from the reading).
  The first beat addresses the player and has `as` variants by who you play: `guan` official (the default avatar,
  so nearly every first beat needs a `guan` line), and where it is fun or telling `shi` scholar, `seng` monk, `fu`
  woman, `tong` child, `jun` soldier, `li` labourer (`min` = anyone else uses the plain line). A beggar asks an
  official for a coin; a carter bows to him and shouts at a child; a hawker calls a woman 娘子 and a monk 師父.
  `only` / `not` (kinds) keep or drop a beat for some players; use them sparingly.
- **chatter** (the group talks among itself when you are near): for most painted groups with two or more placed
  figures. 2–5 exchanges per group, 1–4 beats each, and 2–3 alternatives per line (`say: ["…", "…"]`) so a loop
  doesn't feel canned. Replies must fit any alternative of the line before, or mark the exchange `"linked": true`
  (then alternative i answers alternative i). Witnesses (a figure above or behind) react with `think` and
  `"optional": true`. `gap: [a, b]` = seconds of quiet between exchanges (default [10, 26]; quieter groups longer).
- **barks** (a lone figure's word now and then): for lone figures with a clear action: a hawker's cry, a porter's
  grunt-line, a sleeper's thought. Rare: `every` at least [45, 100]. `"close": true` = a call to the player as they
  come near (shops, hawkers, beggars); give those `as` variants too.

Rough sizes (scale to the painting; quality first): S1 countryside 4–6 scenes; S2 canal 8–10; S3 rainbow_bridge
10–12; S4b outer_road_2 5–7; S5 gate 8–10; S6 inner_city 10–12; S7 city_end 3–4. Chatter for most groups; barks for
roughly a third of the lone figures that do something.

## Rules (the checks fail on most of them)

- **Loyal to the painting.** Only painted figures placed in `people.json` speak (the cast sheet). A line explains what
  that painted body is doing, and fits its clips: a figure whose whole cycle is asleep (`sleep_*`, `doze_*`,
  `kneel_sleep`) only `think`s; a line that only fits one clip of its cycle gets `"when": ["<clip>"]`.
  No invented personal names: roles in period words, at most 4 characters (稅吏, 腳夫, 賣卦先生, 船家, 縴夫, 待詔).
  Kinship and who-is-who that the painting doesn't settle are "our proposal" in `src`.
- **Every line cites its reading** in `src` (名画记 n, 余辉 2015/2021/2023, 東京夢華錄 卷n, 邵琦, Hansen, "map",
  "vignettes V5.x", or "our proposal"). Where scholars disagree, pick one and say which in the scene's `reading`.
- **Language:** short Song-flavoured vernacular in 繁體 (Taiwan forms: 裏, 著, 麼, 甚麼, 罷), not modern slang, not
  classical prose. **At most 16 characters per line** (punctuation not counted). No Arabic digits anywhere; Chinese
  numerals inside speech are speech (「三枝十文」). The checker's simplified-character guard also flags a few valid
  traditional characters (困, 杆 …): rephrase or use the other form (桅桿).
- **English for everything shown** (the user: Chinese plus English): every `say`/`think` gets `say_en`/`think_en`
  (a parallel array for alternatives), every role `name` a `name_en`, every scene and chatter `title` a `title_en`,
  every `as` an `as_en` with the same kinds. A short plain gloss faithful to the line, at most 72 characters, no
  digits, no invented names (see the pilot).
- Ids: scenes keep their vignette ids (`V5.x`, `V6.x`; new ones `V<S>.<n>` or `S3.a`…), chatter `c<S>.<name>`, barks
  `b<S>.<name>`; unique across the whole world (prefix with your section: c1., c2., c3., c4b., c5., c6., c7.).
- **S5 gate and S6 inner_city already have scenes** (V5.1, V5.5, V5.11; V6.5, V6.2): keep their ids and lines (add
  `_en`, `as`, `again`). V5.1's first `beats` must keep its roles inspector, official, owner, gaper, watchman and
  its beat order (the kit page reads beats[1] and beats[3]).

## Workflow

1. Write `sections/<folder>/talk.json` (the pilot's shape; `about` says what the file is).
2. `node tools/ui_data.mjs check` and fix every FAIL that names your section or your steps. Ignore the font-glyph
   FAIL ("glyphs in no QM Text subset") and other sections' FAILs: the lead rebuilds the fonts and the bundle once
   all sections are in. **Do not run `ui_data.mjs build`, `font_subset.py` or any page check** (shared outputs and
   the machine's Chrome slots are the lead's).
3. Touch no other file.
4. Your final report: counts (scenes, again sets, chatter groups, exchanges, barks, lines), the steps you carried and
   where, the readings you chose where scholars disagree, anything in the painting you wanted to voice but couldn't
   (no placed figure, a clip that contradicts), and questions for the user.
