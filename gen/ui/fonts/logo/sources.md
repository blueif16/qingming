# 清明上河圖 logo: Huizong's 瘦金 sources

Research and crops by the logo research agent, 2026-10-12. Every crop is a raw rectangle cut from
the scan: no cleaning, thresholding or resampling. Pixel boxes are `[x0, y0, x1, y1)` in the full-size
scan named for that row. "Glyph" is the tight ink box. "Crop" is the glyph plus a margin, saved
as `crops/<char>_<source>.png`. "Context" includes the neighbouring characters in the column and is
saved as `crops/<char>_<source>_context.png`.

## 1. Best source: Shanghai Museum's new photo of the 楷書千字文卷 (21836 x 2000)

- Object: 趙佶 (宋徽宗) 楷書千字文卷, 崇寧三年 (1104), paper, Shanghai Museum. The museum's
  數字文物庫 lists it as "赵佶 真书千字文卷", code CI00144626.
- Image (21836 x 2000 JPEG, 1.9 MB, uploaded 2025-04):
  https://www.shanghaimuseum.net/mu/upload/202504/1682c0bd-2b24-42dd-b651-cf3d09c942c9.jpg
  Local copy: `scans/shmuseum_lib1_CI00144626_21836x2000.jpg`.
  A 6431 x 640 version is at `.../upload/202504/17bb957b-110b-406e-a4c6-8b991f992a5c.jpg`
  (`scans/shmuseum_lib1_CI00144626_6431x640.jpg`).
- How to find it: the museum's JSON API is
  `POST https://www.shanghaimuseum.net/mu/frontend/pg/collection/search-antique` with the body
  `{"params":{"langCode":"CATALOG_CHINESE","searchText":"千字文"},"page":1,"limit":20}`. The result
  includes `code: CI00144626` and `picPath`. The detail page
  `https://www.shanghaimuseum.net/mu/frontend/pg/article/id/CI00144626` opens this full image in its
  gallery.
- The older article page (CI00000521) and its iframe (`frontend/pg/article/aid/CI00000521`) serve
  `asset1/20150414/4019fa4c-59a0-4a37-b903-abb5fd99dec7.jpg`. That file is 5554 x 532 and
  byte-identical to the Commons file in section 2, so Commons has nothing larger than the museum's
  old image.
- This is a different, newer photograph: brighter, neutral paper, about 3.9x the linear resolution of
  the Commons scan. The JPEG compression is heavy (about 0.35 bits per pixel). At 3x zoom some
  blocking shows, but the strokes are clean at 1:1.
- **Licence: open question for the user.** The brushwork (1104) is public domain everywhere. The
  photo is a faithful 2D reproduction, which is not copyrightable under US law (Bridgeman v. Corel)
  or under Wikimedia's PD-Art policy. That is the same basis on which Commons hosts the museum's
  older photo. However, the museum's terms
  (https://www.shanghaimuseum.net/mu/frontend/pg/infomation/download-claim) claim copyright in all
  site 图文. They forbid commercial use without written permission, require the credit
  "上海博物馆网站", and forbid modifying the material. Under PRC law, whether a reproduction photo
  is protected is unsettled. Safest use: treat the photo as a tracing reference and ship only our
  own redrawn or vectorised strokes, or ask the museum. The Commons scan (section 2) is the
  conservative PD-Art fallback.

Layout: 100 columns of 10 characters, read right to left, after a 千字文 title column at the right
end (x ≈ 21600). Column 1 (天地元黃宇宙洪荒日月) is centred near x ≈ 21430. The pitch is about 188 px
per column and about 185 to 190 px per row cell, but columns drift by tens of px, so the boxes
below were found by eye, not computed. Song taboo substitutions in this scroll: 玄→元 (天地元黃)
and 貞→清 (女慕清絜, avoiding 仁宗's name 禎). The second one gives a second 清.

| char | crop file | text position (col/row) | neighbours checked | glyph box | glyph w x h | crop box | context box |
|---|---|---|---|---|---|---|---|
| 清 | `crops/qing_shmuseum.png` | 夙興溫清似蘭… col 27 / row 4 | 溫 above, 似 below | [16596, 632, 16735, 805] | 139 x 173 | [16556, 592, 16775, 845] | [16506, 422, 16825, 1015] |
| 清 (alt) | `crops/qing-alt_shmuseum.png` | 女慕清絜… col 17 / row 3 | 慕 above, 絜 below | [18424, 436, 18571, 616] | 147 x 180 | [18384, 396, 18611, 656] | [18334, 226, 18661, 826] |
| 明 | `crops/ming_shmuseum.png` | 承明既集… col 48 / row 2 | 承 above, 既 below | [12674, 254, 12797, 410] | 123 x 156 | [12634, 214, 12837, 450] | [12584, 44, 12887, 620] |
| 上 | `crops/shang_shmuseum.png` | …尊卑上和 col 33 / row 9 | 尊卑 above, 和 below | [15474, 1643, 15640, 1750] | 166 x 107 | [15434, 1603, 15680, 1790] | [15384, 1243, 15730, 1960] |
| 河 | `crops/he_shmuseum.png` | 菜重芥薑海鹹河淡… col 7 / row 7 | 海鹹 above, 淡 below | [20265, 1229, 20421, 1383] | 156 x 154 | [20225, 1189, 20461, 1423] | [20175, 829, 20511, 1593] |
| 圖 | `crops/tu_shmuseum.png` | 飛驚圖寫禽獸… col 44 / row 3 | 驚 above, 寫 below | [13442, 435, 13554, 593] | 112 x 158 | [13402, 395, 13594, 633] | [13352, 225, 13644, 803] |

Notes per character:

- 清: both instances are complete and clean. The 溫清 one (`qing_shmuseum`) is the phrase named
  in the brief; `qing-alt` (女慕清絜) is slightly larger with a more upright 月. The text has 凊
  (cold) in 溫凊, but Huizong writes it with three-dot 氵, so both are 清.
- 上: short and wide (107 px tall against about 155 px for the others). This is Huizong's real
  proportion; keep it when setting the logo. The scroll paper has a small light stain just below it.
- 河: **the only weak character.** The scroll's ink is abraded here. The top bar of 可, the 口 and
  the long right hook are pale, and part of 口's left side is nearly gone. It is still complete and
  legible, but it needs careful stroke reconstruction or a local contrast stretch. The Commons photo
  shows the same wear because it is the object's condition. No other public-domain 瘦金 河 by
  Huizong was found (see section 3).
- 明, 圖: clean and complete. 圖 is the full form with 啚 inside 囗.

## 2. Conservative public-domain scan: Wikimedia Commons (5554 x 532)

- https://commons.wikimedia.org/wiki/File:赵佶_楷书千字文卷.jpg (Public domain, PD-Art; credit
  points to the Shanghai Museum article CI00000521). Local copy:
  `scans/commons_zhaoji_qianziwen_juan.jpg`.
- Same object and same positions, but a different, older and redder photo. Characters are about 40
  px tall, so these crops are only useful as a check or as a licence-clean base.

| char | crop file | glyph box | glyph w x h | crop box | context box |
|---|---|---|---|---|---|
| 清 (溫清) | `crops/qing_commons.png` | [4095, 163, 4133, 197] | 38 x 34 (faint tails reach about y 205) | [4083, 151, 4145, 209] | [4070, 93, 4158, 267] |
| 清 (女慕清絜) | `crops/qing-alt_commons.png` | [4608, 113, 4643, 155] | 35 x 42 | [4596, 101, 4655, 167] | [4583, 43, 4668, 225] |
| 明 | `crops/ming_commons.png` | [3025, 66, 3058, 107] | 33 x 41 | [3013, 54, 3070, 119] | [3000, 0, 3083, 177] |
| 上 | `crops/shang_commons.png` | [3786, 428, 3831, 456] | 45 x 28 | [3774, 416, 3843, 468] | [3761, 308, 3856, 526] |
| 河 | `crops/he_commons.png` | [5114, 323, 5144, 356] | 30 x 33 (pale 氵 lies just left of the box) | [5102, 311, 5156, 368] | [5089, 203, 5169, 426] |
| 圖 | `crops/tu_commons.png` | [3234, 113, 3265, 154] | 31 x 41 | [3222, 101, 3277, 166] | [3209, 43, 3290, 224] |

Also on Commons: `File:Songhuizong10.jpg` (720 x 981, PD). It is a larger detail of the same scroll
(諸姑伯叔 … 都邑) and contains none of the five characters (`scans/commons_songhuizong10.jpg`).

## 3. Fallback sources (other Huizong 瘦金 works)

Biggest clean instance per character, over everything examined:

| char | biggest clean instance | other options |
|---|---|---|
| 清 | 千字文, Shanghai Museum photo (147 x 180 / 139 x 173) | 瑞鶴圖 清曉 (114 x 120, cropped); 祥龍石圖 水潤清輝 (not cropped) |
| 明 | 千字文, Shanghai Museum photo (123 x 156) | no other Huizong 瘦金 明 found in PD scans |
| 上 | 千字文, Shanghai Museum photo (166 x 107) | 瑞鶴圖 壬辰上元 (75 x 56, semi-cursive, cropped) |
| 河 | 千字文, Shanghai Museum photo (156 x 154, **faded**) | none found |
| 圖 | 千字文, Shanghai Museum photo (112 x 158) | title 圖 of 雪江歸棹圖 (70 x 101, faint; `crops/tu_xuejiang.png`); 聽琴圖 title (not cropped) |

- **瑞鶴圖** (1112, Liaoning Provincial Museum). Commons `File:Songhuizong5.jpg`, 9079 x 1846,
  Public domain: https://commons.wikimedia.org/wiki/File:Songhuizong5.jpg. Local copy:
  `scans/commons_songhuizong5_ruihetu.jpg`. The inscription is semi-cursive 瘦金 on silk.
  - 清 (清曉觚稜…): glyph [4643, 38, 4757, 158], 114 x 120. Crop [4608, 3, 4792, 193] →
    `crops/qing_ruihetu.png`; context `crops/qing_ruihetu_context.png`.
  - 上 (政和壬辰上元…): glyph [5831, 698, 5906, 754], 75 x 56. Crop [5796, 663, 5941, 789] →
    `crops/shang_ruihetu.png`; context `crops/shang_ruihetu_context.png`.
- **祥龍石圖** (Palace Museum, Beijing). The inscription contains 清 (水潤清輝). Commons
  `File:赵佶祥龙石图卷.png`, 35069 x 5676, 262 MB, PD, from minghuaji.dpm.org.cn. Not downloaded.
  `File:Songhuizong6.jpg` (1654 x 688) is too small.
- **雪江歸棹圖** (Palace Museum, Beijing). It has Huizong's own 瘦金 title 雪江歸棹圖 at the head
  of the scroll, with a 雙龍 seal. 汪砢玉《珊瑚網》卷27 says "瘦金題首雪江歸棹圖，上用雙龍小方璽"
  (https://zh.wikisource.org/wiki/珊瑚網_(四庫全書本)/卷27). This is
  the closest surviving model of what the lost 清明上河圖 title looked like. Commons
  `File:赵佶雪江归棹图卷.png`, 59055 x 3422, 396 MB, PD, from
  https://minghuaji.dpm.org.cn/paint/detail?id=x9qkf09pfyinm2pz5fxr1linq0rqnzos.
  The PNG was downloaded to scratch only; it is too big to keep.
  - The title is not on a separate slip. It is written small and faint, in thin 瘦金, on the dark
    silk at the top right of the painting. The whole title spans about x 49470–49610,
    y 200–745: five characters, each about 90–100 px tall, at about 120 px pitch. A faded red square
    seal, about 2 cm, sits under the title; it is probably the 雙龍小方璽 the 珊瑚網 describes, but
    its legend was not read.
  - Reference crops: `crops/title_xuejiang.png` [49400, 150, 49720, 870] (whole title with the
    seal) and `crops/tu_xuejiang.png` [49500, 600, 49640, 765] (圖; glyph about
    [49531, 639, 49601, 740], 70 x 101).
  - The ink is too faint for tracing; use it for layout and scale. A Huizong title is small, sits
    in one vertical column at the top right, and has the seal under it.
  - 董其昌's colophon on this scroll, in the same 珊瑚網 entry, suspects 徽廟借名: the picture may
    have been painted by others under Huizong's name. Who wrote the title was not checked.
- **聽琴圖** (Palace Museum, Beijing). Huizong's 瘦金 title 聽琴圖 is at the top. Commons
  `File:赵佶听琴图轴.png`, 6281 x 16695, 214 MB, PD (minghuaji). Not downloaded.
- **文會圖** (National Palace Museum, Taipei). Huizong's poem includes 畫圖猶喜見文雄 (圖); 蔡京's
  answering poem (明時…) is in 蔡京's hand, not Huizong's. Commons
  `File:文会图轴.宋代.宋徽宗赵佶.绢本设色.台北故宫博物院藏.jpg`, 12075 x 18343, 69 MB, PD. Not downloaded.
  The NPM's own open-data images are another route
  (https://digitalarchive.npm.gov.tw/, Taiwan Open Government Data licence).
- Checked and **not useful**:
  - 穠芳詩帖 (NPM; Commons `Huizong-Calligraphy1.jpg` 7028 x 550, `NPM-中書000001 宋徽宗詩帖 卷.pdf`):
    none of the five characters.
  - Palace Museum 趙佶等法書六種卷 (Commons `File:赵佶等法书六种卷.png`, 17117 x 2160): Huizong's
    筍石 and 棣棠花 poems; none of the five.
  - 五色鸚鵡圖 (MFA Boston): the Google Art Project file (6001 x 4357) shows only the painting and
    signature, not the inscription.
  - Commons `印章 肖形印（雙龍）.jpg`: a generic double-dragon seal from the Shanghai Library seal
    database, not Huizong's.

## 4. The historical claim: Huizong's 瘦金 title and 雙龍 seal on the scroll

**Verified, with one nuance.** Two colophons on the Palace Museum (Beijing) scroll record that the
scroll once began with Huizong's title. Neither colophon spells out the five characters.

1. **楊準, colophon dated 至正壬辰 (1352)**, earliest witness:
   > 卷前有徽廟標題，後有亡金諸老詩若干首
   
   Source: 卞永譽《書畫彙考》卷43, entry 張翰林清明上河圖卷〈徽宗標題〉, full text at
   https://zh.wikisource.org/wiki/書畫彚考_(四庫全書本)/卷43 . The same text is in
   《趙氏鐵網珊瑚》卷11: https://zh.wikisource.org/wiki/趙氏鐵網珊瑚_(四庫全書本)/卷11 .
2. **李東陽, second colophon dated 正德乙亥 (1515)**:
   > 卷首有祐陵瘦筋五字簽及雙龍小印，而畫譜不載。金大定間燕山張著有跋，據《向氏書畫記》，謂與《西湖爭標圖》俱選入神品。
   
   He uses this to argue that the picture was painted 宣政以前豐亨豫大之世 (before 1111). 祐陵 is
   Huizong's tomb name, used for the emperor. 瘦筋 is the original name of 瘦金 ("slender sinew"). 畫譜
   is the 《宣和畫譜》. Source: 余輝〈張擇端《清明上河圖》卷新探〉,《故宮博物院院刊》2012年第5期
   (總163期), p. 113, which quotes and illustrates the colophon (圖一):
   https://www.dpm.org.cn/Uploads/File/2018/06/05/u5b167df5352f9.pdf . The secondary transcription
   at https://wapbaike.baidu.com/tashuo/browse/content?id=242a1308a67bfdde401c45e0 gives the same
   wording.
3. **李東陽, first colophon/poem dated 弘治辛亥 (1491)**, 〈題清明上河圖〉:
   > 圖成進入緝熙殿，御筆題籤標卷面
   
   Source: 李東陽《懷麓堂集》卷9:
   https://zh.wikisource.org/wiki/懷麓堂集_(四庫全書本)/卷009 .

**Nuance and doubts:**

- **The five characters are an inference.** Li says only 瘦筋五字簽, "a five-character title slip in
  瘦筋". 余輝 (2012, note 2) writes 笔者推定徽宗的"五字签"应是"清明上河图"五字: the reading
  清明上河圖 is the author's inference. It is very plausible, since 張著 (1186) already names the
  picture 清明上河圖, but it is not a quotation.
- **The title and seal are lost.** The slip was still there in 1352 and in 1515, but the scroll
  today has no Huizong title slip or 雙龍 seal at its head. Popular articles say the slip was
  removed at a late-Ming remounting. That claim is unsourced and was not verified here.
- **The 1491 poem is literary, not evidence.** 緝熙殿 was built by the Southern Song emperor 理宗
  (《武林舊事》卷4: 緝熙〈理宗建〉), more than a century after Huizong. Rely on the 1515 prose
  colophon instead.
- **Ownership and dating are debated.** Li himself notes that the 《宣和畫譜》 does not list the
  picture (畫譜不載). Some scholars therefore question Huizong's ownership or date the painting
  differently: 曹星原 (2011) dates it to 神宗's reign, and 董其昌's 《容臺集》 calls versions
  of the picture Southern Song recollections.
- **Other copies carried doubtful "Huizong" titles.** 錢謙益's 〈記《清明上河圖》卷〉 (1622,
  《初學集》卷85) describes another copy with a 清明上河圖 title that 嶽璿 attributed to 宋道君,
  and judges it 殊未可信:
  https://zh.wikisource.org/wiki/記《清明上河圖》卷 . That copy is not the Palace Museum scroll,
  but it shows that a "Huizong title" was something forgers added.
- Wikipedia (zh) cites 李日華's 《味水軒日記》 for a 瘦金 title, a 雙龍 seal and a Huizong poem
  with the line 水在上河春 (https://zh.wikipedia.org/wiki/清明上河圖). That passage was not checked
  here; it may describe one of the many Ming versions rather than the Palace Museum scroll.

Framing for the product: building the logo from Huizong's brushwork restores the title that two
colophon writers (1352, 1515) saw at the head of the scroll. The exact characters are inferred, and
each character comes from Huizong's 1104 千字文, not from the lost slip itself.
