# Type choice: fonts, logo, seal (ink UI round)

Type agent, 2026-10-12. Done: fonts chosen and subset, logo, seals, specimen (`specimen.html`, screenshot
`specimen.png` at DPR 1 and `specimen_phone.png`). How to subset: `README.md`. Coverage of every candidate against the traditional test set: `coverage.md`. Log: `notes.md`.

## Use it (for the ui agent)

```html
<link rel="stylesheet" href="/assets/ui/fonts/fonts.css">
```

| role | family | CSS stack (also in `fonts.json`) | use |
|---|---|---|---|
| display | `QM Display` | `"QM Display", "QM Text", "BiauKai", "DFKai-SB", "Kaiti TC", "STKaiti", "KaiTi", serif` | section banners, place names, toast titles, place seals |
| text | `QM Text` | `"QM Text", "BiauKai", "DFKai-SB", "Kaiti TC", "STKaiti", "KaiTi", "Noto Serif TC", serif` | bubbles, name tags, help, scroll HUD, settings |
| seal | `QM Seal` | `"QM Seal", "QM Display", serif` | seal-script accents only (about 165 characters exist; see below) |

- After adding strings, run `uv run tools/font_subset.py`. A character missing from the subset is drawn by the next
  font in the stack, so a missed run looks wrong but never breaks.
- **Display (Bakudai)** draws its glyphs at about 0.76 em, against 0.90 for WenKai, with loose side bearings.
  `fonts.css` already sets `size-adjust: 118%`, so a given font-size looks as big as the text face. Add
  `letter-spacing: -0.12em` (horizontal and vertical) to close the gaps. Use it at 24 px and up only: below that the
  brush turns scratchy, so put sub-lines (「正店 · 酒樓」) in `QM Text`. For vertical banners like 江南百景圖's 「虹橋」,
  use `writing-mode: vertical-rl; text-orientation: upright;`. Bakudai has no vertical punctuation forms, so the
  display subset holds no punctuation at all: any 「」，。 in a banner falls through to `QM Text`, whose `vert`
  feature turns them correctly in vertical text.
- **Text (WenKai TC Medium)**: bubbles at 15–16 px on phones (13 px is the floor, for name tags), `line-height: 1.5`.
  The Medium weight was picked for phones: Regular gets thin at 13 px on a low-DPI screen.
- **Place seals** (the `seal` key in `places.json`): draw the character in `QM Display` inside a cinnabar square,
  white on red, like the 虹 seal under 虹橋 in 江南百景圖. The seal-script face covers too few characters for place
  names. The brand seal is an SVG (`assets/ui/seal*.svg`).
- **Loading screen**: `text-core.woff2` (17 KB) holds the loading words plus Latin and punctuation (edit `core` in
  `roles.json` to change them). The logo is an SVG, so the loading screen needs no display font.

## Sizes at today's strings

From `subset_report.md` (2026-10-12 21:47: 3 talk.json, 8 places.json, `web/src/ui/*.js`):

| file | characters | KB |
|---|---|---|
| display.woff2 | 130 | 49.3 |
| text-core.woff2 | 138 | 17.2 |
| text.woff2 | 368 | 110.0 |
| seal.woff2 | 5 | 2.8 |
| **total** | | **179.3** (budget 250); loading screen 17.2 (budget 60) |

Cost per added character: display about 0.35 KB, text about 0.24 KB. Once all the sections' talk is written (perhaps
1,500 distinct characters), text grows to about 350 KB. The cheaper text alternate (Cactus, about 0.15 KB per
character) would then be worth it, or the text file could be split into frequency slices. Both are noted below.

## (a) Display: 莫大毛筆字體 Bakudai (Regular), the brush of 青柳衡山

- **Why:** it is the only free face found with real brush strokes (a calligrapher's 行楷: weighted entries, flying
  hooks, dry tails) **and** full traditional coverage (0 of 197 test characters missing). 汴, 腳, 趙 and 詔 are all
  there; 內, 稅, 腳 and 說 were added later by the Bakudai project and still look in keeping.
- **Licence:** SIL OFL 1.1 (`src/bakudai/OFL.txt`; Reserved Font Name "Bakudai", so our subset is renamed
  "QM Display"). The base font, 衡山毛筆フォント, is offered by its author with these terms
  (`src/bakudai/KOUZAN_BASE_TERMS.txt`): free, commercial use without restriction, free for logos, publications and
  CDs. **Caveat:** those terms say nothing explicit about modifying or redistributing the font. Bakudai relicensed it
  under OFL on that basis. This is the one licence that is not airtight (see the questions).
- **Alternates:**
  1. 霞鶩文楷 TC Medium (LXGW WenKai TC, OFL 1.1): a calm 楷, which is in fact what 江南百景圖 uses for 虹橋 and
     汴河漕運. Licence-clean, 41 KB for the same 149 characters. **This is the fallback if the Bakudai caveat is not
     acceptable**: change one line in `roles.json`.
  2. 匯文明朝體 (Huiwen Mincho): old letterpress Song type with ink spread, a "printed book" banner. The font's own
     copyright field says "Public Domain", and the symbol-fixed fork (bosswnx/huiwenmincho-improved) is CC0. The
     author's release post (zhihu p/344103391) could not be read (HTTP 403), so this is not airtight either. 80 KB.
- **Rejected:** Yuji Syuku / Boku / Mai (OFL; beautiful brush, but they lack 汴 腳 說 稅 卡 吵 哪 晷 沉 趟, so
  汴河 and 十千腳店 break). Zhi Mang Xing, Long Cang, Liu Jian Mao Cao and Ma Shan Zheng (OFL; simplified only, 62 of
  197 missing). 京華老宋体 (no licence text found anywhere). 霞鶩臻楷 (GB forms, AI-generated outlines).

## (b) Text: 霞鶩文楷 TC Medium (LXGW WenKai TC)

- **Why:** a readable 楷 with a brush pulse, in Taiwan standard traditional forms. It holds up at 13–16 px on a phone
  and speaks the same 楷 language as 江南百景圖's poem and labels. 0 missing.
- **Licence:** SIL OFL 1.1 (`src/lxgw_wenkai_tc/OFL.txt`). v1.522 from github.com/lxgw/LxgwWenkaiTC.
- **Alternates:**
  1. 仙人掌明體 Cactus Classical Serif (OFL 1.1, Google Fonts): a Song-print face in inherited (傳承) glyph forms,
     the most "古籍" of the print faces, and the smallest (75 KB vs 120 KB at today's strings). Pick it if the text
     should read as a printed book rather than a brush, or when talk grows past about 1,000 characters.
  2. 朱雀仿宋 Zhuque Fangsong (OFL 1.1, v0.212): 仿宋 descends from 宋刻本 type, so it is the historically closest
     "Song print". Elegant at 18 px and up, but thin at 13 px. Its punctuation sits in the mainland position, and it
     is the largest (145 KB).
- **Also checked:** 一點明體 I.Ming (IPA licence, 傳承字形 Ming; 75 KB; fine), 芫荽 Iansui (OFL; softer, pencil-like),
  霞鶩新致宋 (IPA; mainland-leaning forms), 彭蠡文楷 Pengli (OFL; 古籍 forms, so it lacks 掛 沒 稅 說 麼 as written in
  our Taiwan-form strings).

## (c) Seal script: 霞鶩篆書 LXGW Seal

- **What:** an OFL 小篆 font based on 說文 forms, with a written permission to keep its name in web subsets
  (`src/lxgw_seal/OFL.txt`). It is still early (alpha.10.8): about 165 seal characters, including 上 清 明 宋 東 王 國
  華 and the stems and branches, but **not** 河 京 汴 橋. Use it for small seal-script ornaments only.
- **Alternates:** 開元小篆 Kaiyuan Small Seal (OFL; 10,927 of 11,328 Unicode 18 Seal characters traced from the
  public-domain 陳昌治本 說文解字 woodblock; not released as a font yet; glyphs under review). We use its glyph outlines
  for the brand seal (`src/kaiyuan_seal/`). 崇羲篆體 (中研院 小學堂) was rejected: no licence text found.

## (d) 瘦金體

No properly licensed free 瘦金 font was found (the 瘦金 faces from 方正, 漢儀 and 字魂 are commercial, and nothing
open exists on GitHub or Google Fonts). The 瘦金 lives only in the logo, in Huizong's own hand.

## Logo: 清明上河圖 in Huizong's own 瘦金

**The idea, verified.** The scroll once opened with Emperor Huizong's own title slip in 瘦金 and his small 雙龍 seal.
The slip is lost today. Two colophons on the Palace Museum scroll record it:
- 楊準 (1352): 「卷前有徽廟標題」 (《書畫彙考》卷43);
- 李東陽 (1515): 「卷首有祐陵瘦筋五字簽及雙龍小印，而畫譜不載」 (quoted and illustrated in 余輝, 《故宮博物院院刊》
  2012 no. 5, p. 113).

Caveat: the colophons say only "a five-character 瘦金 slip". That the five characters were 清明上河圖 is 余輝's
inference, though a very plausible one, since 張著 already called the picture 清明上河圖 in 1186. Our logo puts back
that title, in Huizong's hand. Each character comes from his 楷書千字文卷 (1104, Shanghai Museum), not from the lost
slip: 清 from 溫清, 明 from 承明, 上 from 上和下睦, 河 from 海鹹河淡, 圖 from 圖寫禽獸. All five are found and checked
against their neighbours in the column. Full sources, pixel boxes and the doubts are in `logo/sources.md`.

**The files** (`uv run gen/ui/fonts/logo/build_logo.py`; ink `#1f1b18`, with `seal_small.svg` nested):

| file | layout | size |
|---|---|---|
| `web/public/assets/ui/logo_h.svg` | one row, each character at Huizong's own relative size (上 is short and wide in his hand), seal at the end | 23 KB (about 9 KB gzipped) |
| `web/public/assets/ui/logo_v.svg` | stacked like the 江南百景圖 logo (jn4, jn5): 清 and 明 large, 上 and 河 smaller beside 明, 圖 below, a tiny seal by 圖 | 23 KB |
| `web/public/assets/ui/logo_col.svg` | one vertical column with the seal under it, the way Huizong titled a scroll (his surviving 瘦金 title on 雪江歸棹圖 sits just like this) | 23 KB |

**Source scan (shipped version):** Wikimedia Commons, `File:赵佶 楷书千字文卷.jpg`, 5554 × 532, public domain
(PD-Art), https://commons.wikimedia.org/wiki/File:赵佶_楷书千字文卷.jpg. Its characters are only about 40 px tall, so
each one is upsampled 8×, flat-fielded (the red ruling lines drop out), thresholded, cleaned of its neighbours'
strokes and traced with potrace (potracer). The brush is kept: the 瘦金 knots at turns and stroke ends, the hooks,
and 上's short wide shape. At this resolution the strokes come out a little heavier than Huizong's hairlines. That
reads as a "bold 瘦金" and holds up better at phone sizes. Two repairs are recorded in the builder: 上's bottom
stroke had faded into dashes, and its hairline to the end knot has been redrawn (the sharp photo shows it is there);
河's right-hand 亅 was rejoined where the ink had worn off the scroll. Nothing else was redrawn.

**A sharper version exists but is not shipped.** The Shanghai Museum's 2025 photo of the same scroll (21836 × 2000,
characters about 160 px tall; found through its JSON API) gives thinner and truer 瘦金 lines. They are built as
`gen/ui/fonts/logo/logo_{h,v,col}_shmuseum.svg` (37 KB), and the specimen shows both versions. The brushwork is
public domain, and a faithful photo of it is public domain under US law and Commons' PD-Art rule. However, the
museum's site terms (`frontend/pg/infomation/download-claim`) claim copyright over its images and forbid commercial
use and modification without written permission. The Commons scan is the conservative choice; switching is one
flag (`--source shmuseum`) if the user accepts the museum terms or gets permission (see the questions).

**For the pages:** use `logo_v.svg` or `logo_col.svg` where 江南百景圖 puts its stacked logo (a corner of a key-art
screen, the loading screen), and `logo_h.svg` in bars and headers. On dark grounds, inline the SVG and set the `<g>`
fill, or use the `*_light.svg` twins (paper-coloured ink `#efe4cc`, the seal still red).

## Seals

Built by `uv run gen/ui/fonts/seal/build_seal.py` from 開元小篆 outlines (`src/kaiyuan_seal/`, OFL 1.1, traced from
the public-domain 陳昌治本 說文解字; Unicode 18 Seal codepoints U+3D008 上, U+3EF60 河, U+3F041 清, U+3E38E 朙). Cinnabar
`#b5321e`, the colour the scroll HUD already uses.

| file | what | size | use at |
|---|---|---|---|
| `web/public/assets/ui/seal.svg` | **「上河」**, square 白文 (characters cut white into the red, read right to left), worn edge and chipped corners, ink speckle and uneven density as SVG filters (feTurbulence, feDisplacementMap) | 4.9 KB | 48 px and up: beside the logo, on banners |
| `web/public/assets/ui/seal_small.svg` | the same seal, plain (no filters), fatter cuts | 1.3 KB | 16–40 px UI accents |
| `web/public/assets/ui/seal_oval.svg` | **「清朙」** (說文's 正篆 of 明), oval 朱文 閑章: red characters and ring on bare paper, like the oval 閑章 in 江南百景圖 (jn5) | 5.2 KB | a second, scattered seal (loading screen, help panel corners) |
| `gen/ui/fonts/seal/alt_qingming.svg` | 「清朙」 as a square 白文, if the user prefers 清明 as the main seal | 6.1 KB | not shipped |

All seals scale cleanly, and the white parts of the 白文 seals are cut out (transparent), so they work on paper, on
the mount brown or over the world. The filters cost a little GPU work only when the SVG is rasterised; use
`seal_small.svg` for anything repeated or animated.

**Why 「上河」.** (1) It is the scroll's own key word, 上河, the river the painting follows up to the city, and our
world is that walk. (2) It is not a person's name: it does not pretend to be 張擇端's seal or Huizong's (the scroll has
no seal of the painter). (3) Both characters have sound 說文 forms (上 is the 篆文 form; 河 is 水 + 可), so nothing is
invented. 「汴京」 was considered, but 汴 is not in 說文 (the Han form is 汳), and a seal-script 汴 would have to be
made up. 「東京」 is the Song name for Kaifeng and true to the period, but a modern reader takes it for Tokyo. 「清明」
appears on the oval 閑章 instead.

## Questions for the user

1. **Display face licence.** Bakudai's base font (青柳衡山) allows commercial use "without restriction" but does not
   explicitly allow modification or redistribution, which web subsetting is. Accept it, or use the licence-clean
   fallback 霞鶩文楷 TC (a calmer 楷, as in 江南百景圖)?
2. **Seal text.** 「上河」 is proposed for the main seal and 「清明」 for the oval 閑章 (see the seal section). Would you
   rather have 「東京」 (the Song name for Kaifeng) or your studio's name?
3. **Sharper logo.** Use the Shanghai Museum's 2025 photo for a truer, finer 瘦金 logo
   (`logo/logo_*_shmuseum.svg`)? The calligraphy is public domain, but the museum's site terms forbid commercial use
   and modification of its images without written permission. Default: the public-domain Commons scan.
4. **The yellow paper.** 江南百景圖's chrome is cream paper, and our UI slips use paper `#efe4cc`. That is fine for UI
   chrome under the "true colours" rule, but the logo and seal are drawn for paper. If the loading screen should
   instead float over the live (true-colour) world, they need a paper slip or a light halo behind them.

## Notes on the licences

- Every shipped font file is a renamed subset ("QM …"), as OFL Reserved Font Names and the IPA licence require. Each
  keeps its copyright and licence fields, and each role ships its licence text beside it in
  `assets/ui/fonts/<role>.LICENSE.txt`.
- LXGW fonts (WenKai TC and Seal) carry an explicit extra permission to keep the name in web subsets. We rename
  them anyway.
- Logo: the five characters are Huizong's (public domain); the Commons scan is PD-Art; our traced vectors are new
  work. Seal: 開元小篆 outlines (OFL 1.1). Using a font's outlines in a logo or artwork is ordinary use under the OFL
  (the artwork is not the Font Software). The repo carries `src/kaiyuan_seal/OFL.txt` anyway.
