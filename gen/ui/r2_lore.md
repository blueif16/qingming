# Ink UI round 2: the lore agent's record

Brief: `gen/ui/brief_r2.md` (lore: long descriptions, toasts that stay and come back, the 圖志 journal, the HUD marks,
more depth). The standing rules of `gen/ui/brief.md` hold. Shots: `gen/ui/shots/r2_lore/`. The standard's new section:
`gen/ui/STYLE.md` §15.

## What is in

1. **Long texts for all 30 landmarks and the 7 regions** (`sections/*/places.json`, new fields `long`, `quote`,
   `quoteSrc`, `cite`, `longSrc`, `crop`, `cropBox`). Modern 繁體 prose with a Song flavour: what is painted there, what
   scholars read in it, where they disagree, a period line where one fits. Landmarks 124–173 characters, regions
   148–170. The first pass and its per-claim notes: `gen/ui/lore/lore_r2_merge.py` (re-runnable; the texts now live in
   `places.json`).
2. **The toast** (`web/src/ui/places.js`, `places.css`): the seal; the name in display brush; the short line; a fold
   hint (R 詳 on a desktop, ∨ 詳 on touch); under the fold the long text, the quote with its source, 據…, and a 圖志
   button. Folded it stays 9 s (was 5.2); unfolded 16–45 s (about 6 characters a second); it holds while the pointer
   rests on it; a long read gives way to a waiting landmark after 14 s. R, a click or a tap folds and unfolds it;
   `prefs.expandDescriptions` (the settings agent's toggle) opens every toast by itself.
3. **J opens the 圖志 at the latest place** (`prefs.lastPlace`), with that entry marked in cinnabar. Touch: a 志 seal
   in a brush ring beside the 說明 seal; also the toast's 圖志 button and the settings screen's 圖志 row (`ui.journal`).
4. **The 圖志 journal** (`web/src/ui/journal.js`, `journal.css`, `journal_words.js`; a lazy chunk): an album leaf over a
   mist. On top the whole scroll (`assets/scroll/strip.webp`), veiled like silk and inked in round each landmark you
   have reached (no counters); the leaves as seals, west to east as the strip lies; a region's leaf has its vertical
   name and seal, its text, then its landmarks west to east, each with the painting's crop, name, line, long text,
   quote and sources; a place not reached is a faint empty leaf (未至). Keyboard (J/Esc close, ← → A D turn, ↑ ↓ PgUp
   PgDn scroll), mouse (strip, seals, the ring), touch. The player stands still and the mouse is freed while it is
   open; Space (the scroll HUD), E (talk) and the toast's R are held off.
5. **The crops** (`tools/place_crops.mjs` → `web/public/assets/ui/places/<id>.webp`): 30 webp, 480 × 320, q46,
   19.4 KB each (582 KB in all, fetched only as a leaf shows them). Framed on the stroke boxes of the map IDs in
   `crop` (`tools/scan_box.mjs`, shared with `ui_data.mjs`), six by eye (`cropBox`) after the contact sheet
   (`gen/ui/shots/r2_lore/crops_sheet.jpg`). Cut from the scan the tile pyramid is made from
   (`reference/scroll/qingming_commons_38414x1800.jpg`), which saves one re-encode over the q70 tiles.
6. **HUD marks** (`places.js` `hudMarks`, hooked as `hud.decorate`): a small cinnabar seal (a white cut border) over
   each landmark reached, named on hover or tap (its name and line), and a cinnabar tick on the strip.
7. **Discovery** (`prefs.discovered`, `prefs.lastPlace`): landmark IDs, `r:<region id>`, `t:<talk scene id>`; kept
   even with the place notes off.
8. **More depth, built (cheap and loyal):**
   - **題跋**, the colophons as a leaf (`gen/ui/lore/colophons.json`): 張著 (the only biography of 張擇端), two of
     張公藥's quatrains, 張世積, and the lines of 李祁, 李東陽 and 邵寶 that 余輝 quotes, written top to bottom, each with a
     one-sentence gloss. It sits at the strip's left end, where the colophons are mounted.
   - **見聞**, the talk you have heard (`talk.json`): each scene's title, region and lines, faint leaves for the rest.

## Decisions and sources

- **Sources fetched and kept** (study only, `gen/ui/lore/sources/`): the Palace Museum viewer's 49 annotations
  (`minghuaji_annoList_imageId7.json`, the annoList API); 《東京夢華錄》 chapters from zh.wikisource; 余輝's colophon
  study appendix (故宮博物院院刊 2015/5, the museum PDF); 余輝〈十大看點〉 (人民網 2015), 〈最後三問〉 (澎湃 2021),
  〈鬧市繁華顯不平〉 (澎湃 2023); 《澠水燕談錄》 卷八 on the 飛橋. Every quote in the data is copied from these files.
- **Disputes and the choice made** (each is said in one clause in the text):
  - the gate: 東角子門 (the museum) over 東水門 (徐邦達, 張安治, after 張公藥's 「水門東去接隋渠」) and 余輝's 「實情而非實景」;
  - the 解 sign: the museum's exam-formalities office over 余輝's fortune-teller (問命) and a Hong Kong pawnshop;
  - the 軍巡鋪屋: 余輝's fire post turned wine depot over the museum's neutral reading and Hansen's archery shop;
  - the 孫羊店 meat: 余輝's mutton offal (□斤六十足, 足 = no 省陌) beside our map's side of pork;
  - the season: Qingming (張著's 「清明後一日」, as 余輝 reads it) over 孔憲易's autumn (both said in 郊野 and 新酒);
  - the tower figure: 余輝's watchman and Hansen's sightseer, both said.
- **Left out because unsure:** what 「太丞」 means as a title (only 余輝's "a court physician"); 十千 as 「美酒斗十千」
  (no source in hand); counts and dates (no numbers on screen); 張安治's quotes that `sections.md` could not re-verify.
- **No numerals in the prose**, outside quotes and names (十字街, 十千, 五行): `ui_data.mjs` fails on 三…萬. 一 and 兩 pass.
  That forced some rewording (欄杆 → 木欄: the guard list flags 杆; 百貨 → 貨物).
- **Order:** the brief asks for west to east; the journal's leaves and entries follow the strip left to right (the
  colophons at the left end, 見聞 at the right). The painting itself is read right to left: a question for the user.
- **The fold key is R** (no other agent uses it; E, T, O, H, J, V, M, Space are taken).
- **places.js honours `placeNotes` and `plaques`** (the settings agent's prefs): no banners or toasts, or no plaques,
  and the work is skipped, not only hidden. Discovery still counts. The settings agent can drop its `qm-no-notes` CSS.

## Checks

- `node tools/ui_data.mjs check` **PASS**: 8 sections, 7 regions, 30 landmarks, 37 long texts, 7 colophons, 6 scenes,
  26 beats; 586 glyphs at first load, 622 more in the lore. New checks: long text present for every landmark and region,
  length ranges, `cite` and `longSrc` present, `quote` ⇒ `quoteSrc`, no digits, no numerals outside quotes and names,
  simplified guard, every landmark has strokes on the scan.
- **Behaviour** (`gen/ui/shots/lore_check.mjs`, `gen/ui/shots/r2_lore/lore_check.json`): **19/19 PASS**: nothing of
  the lore at first load; toast 9 s folded; R and a click fold and unfold (30 s open); the pointer holds it;
  `expandDescriptions` opens it; J at the latest place with the entry marked; ← → turn west and east; Esc closes; the
  player walks again; the HUD names the marks; no console errors from the UI.
- **Shots** (looked at; `gen/ui/shots/r2_lore/`, plan `gen/ui/shots/plan_r2_lore.json`), desktop 1920 × 1080 and phone
  390 × 844 touch, day 10:00 and night 21:30: toast folded and unfolded, the journal on 十字街, 城門, 虹橋, 題跋, 見聞,
  the HUD marks, night toast and night journal. Fixed from looking: the leaf tabs used the seal mask, which keeps its
  square aspect and cut the top and bottom glyphs of a tall seal (now a plain red-edged seal; the settings screen's
  two-glyph tabs may have the same cut: worth a look); a "null" under a region text; the HUD mark looked like a
  first-aid cross (now a seal's cut border); a queued test toast lost its "open".
- **Console:** no errors from the UI. The world logs `section city_end failed to load TypeError … reading 't0'` from
  `world.js` `endOp` (the streaming code another session is editing): not the UI's; flagged for the lead.
- **Regression** (`regress.sh r2_lore`, 23:17, `gen/expand/round2/page_qa/r2_lore/summary.txt`): **world 211/211,
  boats 12/12, rides 5/5**; people FAIL on the two known "nobody went round the player" stands only. Not worse than
  ui1/ui2 (world 210 and 209 there).
- **Cost** (`ui_cost.mjs --open`: phone 390 × 844 dpr 3, CPU 4× slower, at the tax office; busy = two tagged bubbles
  and the toast **unfolded**; `gen/ui/shots/cost_phone_4x_open.json`): UI script 0.08 → 0.57 ms a frame, style and
  layout 0 → 0.30 ms. The machine was shared (perf and time checks in the other slots): the page's own frame was
  26.6 ms against round 1's 19.7, and round 1's busy numbers (0.34 / 0.16 ms, folded toast) scale by about the same.
  An open toast is static DOM: nothing per frame; the journal stops nothing and adds nothing per frame while shut, and
  while open the world behind it stands still (the player is frozen; the page keeps drawing as under the settings).

## KB

- **First load, added:** about **5 KB**: `places.js` +1.85 KB and `index.js` +0.6 KB (min+gzip), `places.css` 1.0 KB,
  `words.js` +0.1 KB, `places.json` +0.3 KB (gzip; the landmarks' scan points), and three glyphs in the eager fonts
  (詳 據 in text, 志 in display, about 1.4 KB). `text-core.woff2` is unchanged (17.2 KB).
- **On the first unfolded toast:** `lore.json` 11.8 KB gzip (27.4 KB raw) and `text-lore.woff2` **206.9 KB**
  (615 glyphs; the system 楷 shows the text while it loads), plus `display-lore.woff2` 22.0 KB when the 圖志 button
  draws.
- **On the first journal open:** the chunk 6.6 KB gzip (JS 4.4, CSS 2.2), `strip.webp` 31 KB (shared with the scroll
  HUD), `display-lore.woff2` 22 KB, and the crops of the leaf in view, about 19 KB each (2–7 per leaf).
- **Fonts in all** (`gen/ui/fonts/subset_report.md`): 483.9 KB; without the lazy subsets 199.4 KB (budget 250); core
  17.2 KB (budget 60).

## Shared files edited (all surgical; listed for the lead)

| file | edit |
|---|---|
| `web/src/ui/index.js` | the `journal` stub (lazy import, `open/close/toggle/isOpen/state`) and `lore()`; the touch 志 button; `o.hud.blocked` also while the journal is open; J opens it, other keys held off while it is open; `Places` gets `lore, touch, blocked, journal`; `talk.start` wrapped to note 見聞; `o.hud.decorate`; `ui.journal`; test hooks `toast(id, open)`, `unfold`, `discover`, `journal.{open,close,state,turn}` |
| `web/src/ui/prefs.js` | `discovered`, `lastPlace` with comments |
| `web/src/ui/words.js` | `W.lore` (詳, 據, 圖志, 志, aria) |
| `web/src/scroll_hud.js` | two lines: `this.decorate?.('view', ctx, X, Y, this)` before "you", `this.decorate?.('strip', ctx, k, kv, h)` after the built range, each in a try |
| `gen/ui/fonts/roles.json` | text: `!journal_words.js`, `!journal.js`, `lazy.lore` (places.json long/quote/quoteSrc/cite, colophons.json, the journal files); display: `lazy.lore`, `志` in extra |
| `gen/ui/STYLE.md` | the toast row, two new rows (journal, HUD marks), §15 |
| `gen/ui/shots/ui_cost.mjs` | `--open` (the busy window's toast unfolded; writes `cost_*_open.json`) |

Mine (new or owned): `places.js`, `places.css`, `journal.js`, `journal.css`, `journal_words.js`, `tools/ui_data.mjs`,
`tools/scan_box.mjs`, `tools/place_crops.mjs`, `web/public/assets/ui/places/*`, `web/public/assets/ui/lore.json`,
`sections/*/places.json` (text fields), `gen/ui/lore/**`, `gen/ui/shots/lore_check.mjs`, `gen/ui/shots/plan_r2_lore*.json`.

## Further ideas (not built)

1. **The 夢華錄 line of the hour** (for the time agent's instrument): one line per 時辰 from 《東京夢華錄》, e.g. 五更
   「諸寺院行者打鐵牌子或木魚循門報曉」, dawn 「從城外守門入城貨賣，至天明不絕」, evening the 正店's lamps. Cheap (text), loyal
   (period source), but it sits inside `#dial`.
2. **畫中小景**: the museum's other annotated vignettes (饮子, 萬石船, 驼队, 便面, 行脚僧, 喝杯小酒 …) as minor journal
   entries without toasts, once each has a map ID in `places.json`.
3. **The season leaf**: 清明 or autumn, the evidence on both sides with crops (炭驢, 扇子, 新酒, 西瓜).
4. **Plaques that remember**: a cinnabar dot on a plaque once its place is in the journal.
5. **A page-turn sound** for the journal (the `bubble_tap` stands in now).
6. **Per-region lore fonts** (a toast would fetch about 100 KB instead of 207 KB, at the cost of more files).

## Questions for the user

1. The journal lists west to east, as the strip lies (the brief's order). The painting is read right to left (east to
   west). Keep, or turn it to the reading order?
2. The first unfolded toast fetches a 207 KB font for the long texts (lazily; the text shows at once in the system
   楷). Fine, or split it per region (about half per first read)?
3. The scholarly choices above (the gate as 東角子門, the 解 sign as an exam office, the wine depot as a fire post):
   confirm or change.
4. Undiscovered places show no name (未至). Show their names faintly instead?
5. The 題跋 leaf quotes 張著, 張公藥, 張世積, 李祁, 李東陽, 邵寶 with our one-line glosses. Keep it?

## Log

- 22:30 read the briefs, round 1, the map, the readings; fetched the sources (above).
- 22:45 the texts (37), the merge; `ui_data.mjs` with the lore checks and `lore.json`; the crops and the contact sheet.
- 22:55 fonts: the lazy `lore` groups (the settings agent had added `lazy` to `font_subset.py` minutes before; used as is).
- 23:00 `places.js` (fold, timing, R, discovery, marks), `journal.js`, the hooks; probes, fixes, the shots; `lore_check.mjs`.
- 23:17 regression; text corrections after a second read (the gate's 垛口 said without contradicting our wall-less gate;
  十千腳店 at the bridgehead, not "south"; one unsourced sentence on the wheelwright cut); `untoast` hook so the cost
  A/B's idle window has no toast; the journal re-reads places/talk data that arrive after its chunk; cost and
  `lore_check` rerun (19/19 PASS).
- Not touched: `kit.js` / `ui.html` still show round 1's toast (`components.landmarkToast`); the kit can take
  `places.js`'s toast when its owner next works on it.
