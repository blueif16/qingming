# type agent log (ink UI round, 2026-10-12)

Owner: type agent. Brief: `gen/ui/brief.md`. Writes only `gen/ui/fonts/**`, `tools/font_subset.*`,
`web/public/assets/ui/fonts/**`, `web/public/assets/ui/logo*`, `web/public/assets/ui/seal*`.

## Reference study (江南百景图, study-only; downsized copies in `ref_small/`)

- Place titles (虹橋, 汴河漕運) are set vertically in a calm 楷書 with brush entry and exit, not a wild 行書;
  the small red seal sits under the title as a 白文 (white-on-red) square with one character.
- The poem block (芳原綠野恣行時 …, 程顥) is a regular 楷書 in vertical columns, right to left, signature column
  smaller, seal at the foot.
- In-world labels (茶棚, 石橋, 村塾, 楊柳歸來) are vertical paper slips with a thin dark frame, 楷書.
- Lesson: one calm brush 楷 does most of the work; the strong brush is kept for the title. Red is used sparingly
  (seals only).

## Log
- 21:00 Downloaded candidates into `src/` with licences: LXGW WenKai TC v1.522, Zhuque Fangsong v0.212, LXGW Neo
  ZhiSong v1.067, I.Ming 8.10, Iansui v1.020, Google's Zhi Mang Xing / Long Cang / Liu Jian Mao Cao / Ma Shan Zheng /
  Yuji Syuku / Boku / Mai, LXGW Seal alpha.10.8, Huiwen Mincho (improved fork), Bakudai 1.49, Pengli WenKai v1.033,
  Cactus Classical Serif 1.005.
- 21:05 Logo-source research handed to a helper agent (`logo/sources.md`): the Commons scan of Huizong's 千字文 is
  5554×532, so characters are only about 45 px tall.
- 21:10 Coverage (`coverage.md`): Google's Chinese brush faces are simplified-only (62 of 197 missing); Yuji lacks
  汴 腳 說 稅; every other candidate is complete (Pengli lacks Taiwan-form 掛沒稅說麼 by design).
- 21:12 Licence checks: 京華老宋体 has no licence text anywhere, so it is rejected. 匯文明朝體's own name table
  says "Public Domain" and its fork is CC0, but the author's post returns 403. 衡山毛筆 base terms were read from
  opentype.jp (commercial use without restriction); Bakudai is OFL. TW-Kai (全字庫正楷體) is now dual
  OFL / 政府資料開放授權, but the 58 MB download from data.cns11643.gov.tw kept failing (not needed: WenKai TC covers
  that calm-楷 role). 崇羲篆體: no licence found.
- 21:20 Seal sources: LXGW Seal has 上清明 but no 河京汴. 開元小篆 (Kaiyuan, OFL) glyph SVGs are traced from the 陳昌治本
  說文 and cover 上 河 清 明 東 宋 (圖 is still empty).
- 21:27 `tools/font_subset.py` written (uv inline deps: fonttools + brotli). First run: 178.7 KB total, core 17.2 KB.
  The JSON key filter keeps `src`/`about`/`reading` notes (simplified Chinese) out of the subsets.
- 21:30 Size comparison at today's strings (490 text chars): WenKai TC Reg 117 KB, Med 120, Zhuque 145, Cactus 75,
  I.Ming 75, Iansui 119; display at 149 chars: Bakudai Reg 51, Med 62, Huiwen 80, WenKai Med 41, Cactus 26.
- 21:35 CHOICE.md (fonts part) and README.md written for the ui agent.
- 21:37 Specimen (`specimen.html`, `specimen_shot.mjs`): served to the slot Chrome from a fake origin by request
  interception, so the page can load its fonts and SVGs without a dev server. First look: WenKai TC Medium is legible
  at 13 px at DPR 1. Bakudai draws at about 0.76 em, so it reads small and loose; `size_adjust` was added to the tool
  (118%), with letter-spacing −0.12em. It is scratchy under 24 px, so sub-lines go in the text face.
- 21:40 Seals: `seal/build_seal.py` builds them from 開元小篆 outlines. Fixed a number-format bug (integer coordinates
  lost their trailing zeros). Speckle and density tuned to read as a stamped seal.
- 21:42 The lead added jn4–jn6. The official 江南百景圖 logo is 行草 at mixed sizes (江南 large; 百景 small beside 南;
  圖 below; a tiny seal), and jn5 scatters 閑章 in several shapes. So we added `seal_oval.svg` (朱文 oval 「清朙」) and
  made `logo_v` the stacked composition.
- 21:44 The logo helper found the Shanghai Museum's 2025 photo (21836×2000; site terms restrict reuse) and verified the
  colophons (楊準 1352, 李東陽 1515; the five characters are 余輝's inference). See `logo/sources.md`.
- 21:50 `logo/build_logo.py`: context crop → flat-field (max channel, so the red ruling drops out) → upsample (8× for
  Commons, 2× for the museum photo) → threshold → keep only blobs that reach the glyph box → potracer. potracer
  inverts bool bitmaps, so it gets `~ink`. The Commons trace needs t ≈ 0.77; stricter thresholds break the strokes.
  上: rejoined its dashed bottom stroke and redrew the hairline to its end knot (otherwise it reads as 「上、」).
  河: rejoined its worn 亅 inside a band (a global closing filled 口). The shipped logo is from Commons; the
  museum-photo version stays in `logo/` as the question for the user.
- 21:52 Each role's licence text now ships beside its font (`assets/ui/fonts/<role>.LICENSE.txt`). TW-Kai download
  abandoned (it arrived truncated twice).
- 21:55 Display subset drops the `always` punctuation (Bakudai's `vert` maps only Ａ), so banner punctuation falls
  through to QM Text and gets its vertical forms. Display is now 49.3 KB; the total 179.3 KB.
- 21:57 SVG ids made unique (qm-seal-*, qm-logo-seal-cut) so seals and logos can be inlined on one page. Added
  `logo_*_light.svg` (paper ink) for dark grounds. Specimen re-shot.
- Done. Open questions are in CHOICE.md.
