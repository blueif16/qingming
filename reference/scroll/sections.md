# How the scroll has been divided, mapped onto our scan

Research note, 2026-10-10. It covers 张择端《清明上河图》 (the Palace Museum version only; the Ming and Qing
copies are different paintings and are ignored here).

**Scan coordinates.** All x values refer to `qingming_commons_38414x1800.jpg`. The painted silk runs from scan
x ≈ 815 (the left end, the city end; the mounting silk and seals lie left of it) to x ≈ 37610 (the right end,
where the countryside begins). That is about 36,800 px for 528.7 cm, or roughly 70 px per cm of silk. The scroll
is read from right to left, so "the start" means high x. Landmark positions given as ranges were read by eye
from full-resolution crops of the scan. Single values (e.g. "≈ 25700") are Palace Museum viewer pins converted
with a fitted formula (see 1.4); where both exist, they agree to within about 200 px.

## 1. Existing segmentation schemes

### 1.1 The classic three-part split

This is the division in the Palace Museum's own catalogue text, Baidu Baike and the school textbook.

- **故宫 collection page** (catalogue text by 杨新): "全画可分为三段". The parts are:
  - 首段写市郊景色;
  - 中段以"上土桥"为中心，另画汴河及两岸风光 (it calls the bridge 虹桥 by its common name and 上土桥 as its proper name);
  - 后段描写的是市区街道.

  It names the gate tower 东角子门, "位于汴京内城东南", and gives "500余人物". The 名画记 viewer page carries the
  same text.
- **百度百科**: "全图大致分为汴京郊外春光、汴河场景、城内街市三部分".
- **Textbook essay 《梦回繁华》** (毛宁; 统编 grade-8 Chinese) walks the same three parts:
  - "开卷处描绘的是汴京近郊的风光";
  - "画面中段是汴河两岸的繁华情景";
  - "后段描写汴梁市区的街道。在高大雄伟的城楼两侧…".
- 人民网/中国城市报 (2015) calls the last part "城门内外的景象". That is the label used in this project's brief.
- Chinese Wikipedia has no clear three-part division. Its layout section is translated from English and mixes
  in content from the Qing copies, so don't rely on it.

The 郊野/汴河 boundary is undisputed. It falls where the first moored boats and riverside eateries appear,
at about **x ≈ 28700–29000**. The museum viewer even pins a note called 城乡交界处 at x ≈ 28900.

The 汴河/城市 boundary is where sources disagree, because the long stretch of road between the bridge and the
gate can go either way:

- The museum text and the textbook keep the bridgehead tavern (十千脚店, x ≈ 16800–17300) in the middle part.
  They centre the last part on the gate tower ("后段…在高大雄伟的城楼两侧").
- 徐邦达 (1958; known only through secondary quotation) starts the last part at the bridgehead tavern: "从酒楼和桥起，大街直通城内…形成第二个高潮".
- Baidu Baike files everything between the canal wharves and the gate under 街市 (the city part).
- Valerie Hansen (1996) puts the line at the gate itself: "The first shows the outskirts of the city, the second the canal and the shops
  outside the wall, and the third the interior of the city. The bridge bisects the middle third."

Depending on the source, the 中段 ends anywhere from the bridgehead (x ≈ 17300) to the gate (x ≈ 7600). For
reference, the river itself leaves the top of the picture at x ≈ 14500–15000.

### 1.2 余辉 (Palace Museum): four successive divisions

余辉 has written more about the scroll scene by scene than anyone else, and his divisions are the finest
spatially defined ones in print.

1. **2012 Palace Museum lecture**: "可以分为城郊、虹桥上下、城墙内外三大部分".
2. **2014, 人民日报海外版 "镇馆之宝" column** (signed 余辉). This is a three-part split with a named vignette list. It moves the
   boundaries compared with the classic split:
   - **进城前后**: the whole countryside *and* the canal up to the bridge. Its vignettes are 送炭驴队, 河开冰解, 晒场农舍,
     柳岸长堤, 踏青回归, 迎寒策蹇, 惊马闯市, 望楼饭铺, 私粮进京, 船侧祭神 and 客船启程.
   - **拱桥上下**: only the bridge. Its vignettes are 摇橹向前, 大船抢险, 上下呼救 and 车轿相争.
   - **城门内外**: everything from the bridgehead tavern to the end. Its vignettes are 欢楼美禄, 客家登船, 小铺闲坐, 车铺劳作,
     豪车云集, 临街神算, 懒兵候主, 桥头观水, 书屏遭废, 杀羊祭道, 城上暮鼓, 土墙杂树, 城下修面, 货到税讫, 禁军运酒,
     正店开张, 街头说书, 列售纸码, 深井汲水, 士子苦读, 考前求解, 街头九流, 太丞医铺 and 门房指路.

   This list is the best published inventory of figure groups in scroll order. Section 3 locates the gate
   vignettes on our scan.
3. **《张择端清明上河图导览》** (北京大学出版社) has six parts: 村柳前后, 运河左右, 拱桥上下, 城门口外,
   城门口以内 and 辞别开封.
4. **《清明上河图深度游》** (辽宁美术出版社, 2021; hardcover 2023). The book "在十二讲里分七个自然段"; lectures 4–11 walk
   the scroll. Its seven 自然段 are:
   - (1) 古柳前后见清明;
   - (2) 运河左右/两岸, split over two lectures, 舱底露隐秘 (the boats) and 街头有商机 (the riverside street);
   - (3) 拱桥上下爆险情;
   - (4) 城门口外真悠闲;
   - (5) 平桥城门太纠结 (平桥 = the flat bridge over the moat);
   - (6) 闹市繁华显不平;
   - (7) 结尾思索多疑问.

   One boundary is stated outright. 第六段 "从城门内开始经十字路口到水井处…以'孙记正店'为中心". So the
   tax office just inside the gate opens segment 6, and the square well near 赵太丞家 closes it.
   Segment 7 is his "三问" ending, framed around three scenes: 问病 at 赵太丞家, 问命 at the 解 sign and 问道 at the official's gatehouse.

余辉's reading is also an interpretation, the "盛世危图" thesis. On this view the painting is a veiled
remonstrance to 徽宗: an unguarded gate, a fire tower with no lookout, lazy soldiers, heavy taxes and drunken
troops. Mainstream older scholarship (郑振铎, 徐邦达, 张安治, 周宝珠) reads the same scenes as plain prosperity.
For staging, the figure activities he identifies hold either way. Only their meaning is disputed.

### 1.3 Other Chinese walk-throughs

- **张安治** (《中国名画鉴赏辞典》) walks the scroll in this order:
  - the spring outskirts (驮炭驴群, the willow-decked sedan and two old women on donkeys);
  - the 汴河 unloading and the five trackers;
  - "第一个——也是最震撼人心的高潮" at the bridge and its tavern;
  - "经过两处十字路口的进城大道", whose "第二个十字路口正在护城河桥头";
  - the gate tower and camels;
  - the city street;
  - an ending that "由尾声而轻轻闭幕".

  He counts more than 550 people, twenty-odd boats and twenty-odd carts and sedans. His two crossroads are a
  useful extra boundary. The first is at the wheelwright and the covered carts (x ≈ 13100–13600); the second is
  at the moat bridge (x ≈ 9300–9500).
- **徐邦达 1958** and **郑振铎 1958** (院刊 essays, quoted secondhand) mainly add the claim that the painting is
  truncated at the city end. 徐邦达: "我疑心后面是割去了不少的". 郑振铎 thought it should run on to 金明池.
  祝勇 (光明网 2021) estimates about a metre is missing.
- **刘涤宇** (同济; 《历代〈清明上河图〉：城市与建筑》 2014, and articles of 2010–2012) does not divide the scroll into
  sections. He analyses it by scene type (街头, 桥头, 城门外) and by landmark (城门, 彩楼欢门, 望火楼, 虹桥). He
  also redraws it as a city plan: a curving street fabric 30–40 m deep along the 汴河, and a grid oriented to the
  wall around the gate. He notes four two-storey buildings: 孙羊正店 and 久住王员外家 inside the gate, and 十千脚店
  plus one building opposite it at the bridge.
- **周宝珠** (1997), **那志良** (1977) and **孔宪易** (1981): no section division could be found. 孔宪易 is known for the
  "autumn, not Qingming" argument, which rests on the charcoal donkeys, fans, straw hats, "新酒" flags and
  watermelons.

### 1.4 Palace Museum 名画记 viewer annotations

The museum's own viewer carries 49 official annotations, numbered 1–49 in scroll order, each with a pin and a
paragraph of text. They come from `POST https://minghuaji.dpm.org.cn/paint/annoList` with `{"imageId":"7"}`.

Pins are given as x-percent of the viewer's 188,355-px image. They convert to our scan with:

**scan x ≈ 1630 + (p − 58.7723) × 889.15**

The fit uses two anchors: 赵太丞家 and the charcoal donkeys. It lands the tax office, the 递铺, the temple and the
bridge within about 200 px of where they are on the scan.

Notable gaps: none of the 49 names 望火楼, 惊马 or 十千脚店.

Converted positions, right to left:

| Pin | Name | Scan x |
|---|---|---|
| 1 | 赶驴入城 | 36550 |
| 2 | 寂静的谷场 | 34100 |
| 3 | 隋堤烟柳 | 32190 |
| 6 | 杨柳杂花装簇轿顶 | 30740 |
| 4 | 骑驴客商 | 30010 |
| 5 | 一片"青铜海" (菜地) | 29900 |
| 10 | 城乡交界处 | 28940 |
| 11 | 河边店铺 | 28090 |
| 9 | 仓前成市 | 27950 |
| 8 | 万石船 | 27460 |
| 12 | 喝杯小酒 | 27320 |
| 13 | 王家纸马铺 | 26850 |
| 7 | 汴水悍激 | 26670 |
| 14 | 沿河雅座 | 25680 |
| 16 | 聊天的伙计 | 24280 |
| 15 | 逆水行舟 | 24160 |
| 17 | 豪华客船 | 22960 |
| 21 | 虹桥边的小酒馆 | 19990 |
| 19 | 大船穿行虹桥 | 19970 |
| 20 | 拥挤的桥面 | 19240 |
| 18 | 虹桥 | 18920 |
| 22 | 饮子 | 18500 |
| 24 | 串车 | 17550 |
| 23 | 新酒 | 17430 |
| 25 | 河边泊船 (纤夫) | 15690 |
| 26 | 大车修理店 | 13620 |
| 27 | 大棕盖车 | 13120 |
| 28 | 算命先生 | 12220 |
| 29 | 递铺 | 11710 |
| 31 | 牛拉大盖车 | 10450 |
| 30 | 清净的寺庙 | 9970 |
| 32 | 少年乞丐 | 9120 |
| 34 | 驼队 | 7410 |
| 33 | 雄伟的城楼 | 7360 |
| 35 | 税务所 | 6160 |
| 37 | 正店门前 | 5590 |
| 38 | 栀子灯 | 5060 |
| 36 | 孙羊家正店 | 4530 |
| 40 | 城里的商铺 | 3920 |
| 39 | 闹市说书 | 3840 |
| 42 | 久住王员外家 | 3310 |
| 43 | 便面 | 3250 |
| 44 | 赶考士人 | 3240 |
| 41 | 香药铺 | 3200 |
| 47 | 方井 | 2110 |
| 46 | 行脚僧 | 2100 |
| 45 | "解"字招牌 | 2070 |
| 48 | 国医赵太丞家 | 1630 |
| 49 | 官宦人家 | 1240 |

### 1.5 Exhibitions

**《清明上河图3.0》** (故宫箭亭广场, May 2018; Hong Kong AsiaWorld-Expo 2019) is organised as experiences rather than as
a segmentation:

- in Beijing: a 36 × 4.8 m interactive scroll, a 孙羊店 immersive theatre, a "春天雨巷" LED corridor and a 虹桥 dome
  ride;
- in Hong Kong: 开放之城, 盛世长卷, 汴河码头 and 宋"潮"游乐园.

The landmarks it singles out are 孙羊店, 虹桥 and the 汴河 wharf. Its guide quotes 814 people, 73 animals, 20-odd carts and sedans,
and 29 boats.

### 1.6 English-language scholarship

- **Valerie Hansen** is the only English-language primary scholar whose texts could be read in full.
  - In "The Mystery of the Qingming Scroll and Its Subject: The Case Against Kaifeng" (JSYS 26, 1996) she uses
    the thirds quoted in 1.1, which close the middle third at the city wall.
  - Her companion booklet, *The Beijing Qingming Scroll and Its Significance for the Study of Chinese History*
    (JSYS supplement, 1996), walks the scroll in **26 sections**. These are not an interpretive division:
    "the Beijing Palace Museum photographed the entire scroll in 26 black-and-white sections". They are still a
    usable plate index:
    - 1: charcoal donkeys at the little bridge
    - 4: pollarded willows, "the high point of the first third"
    - 5: the willow-decked sedan
    - 7: the first shops of the outskirts
    - 8: the Wang paper-goods shop
    - 10–12: the trackers
    - 13–14: the bridge, "the undeniable high point of the scroll, appears just at its halfway point"
    - 15: the 脚店
    - 17–18: the wheelwright, storyteller and fortune-teller
    - 19: the walled compound with dozing guards
    - 20–21: the moat bridge and the temple
    - 22: the gate
    - 23: just inside the gate
    - 24: the 正店 and the Sun lamb shop
    - 25: the crossroads
    - 26: the Zhao pharmacy and the rider in a broad hat, after which the scroll "suddenly ends"

    Her argument is that the city cannot be identified with Kaifeng, or even with a real place.
- **Columbia "Asia for Educators"** has an interactive version with 42 numbered hotspots that reuse Hansen's
  captions. In the gate cluster they are:
  - 16–17: the temple
  - 18: young scholars on the bridge
  - 19: workers pulling a wheelbarrow
  - 20: men relaxing by the city gate
  - 21: a solitary figure on the gate, "perhaps a sightseer"
  - 22: the camel caravan
  - 23: an archery shop
  - 24: an inn
- **Roderick Whitfield's** 1965 Princeton dissertation could not be accessed. Through Hansen we know he objected to
  the usual identification of the bridge. In the scroll "a wide moat lies between the bridge and the city,
  whereas in Kaifeng the moat lay beyond the bridge". He also translated all the colophons. A 2022 lecture report
  quotes him for "over 800" figures.
- **Tsao Hsingyuan** (JSYS 33, 2003) was paywalled. As cited by others, she holds that the city is Kaifeng and
  the scene is a day in the Qingming solar term. Her Chinese book 《同舟共济》 (2011) reads the boat-under-the-bridge
  crisis as the painting's core message ("同舟共济") and dates the work to 神宗's reign.
- **Tian Yubin** (田玉彬), *Along the River During the Qingming Festival: A Day in the Song Dynasty* (Unicorn,
  2024/25), is translated from his Chinese walk-through. Retailers list it as 36 sections, and it counts about
  835 people. On the gate: "soldiers standing guard, there are none. There is only one watchman who is
  responsible for announcing the time."
- **English Wikipedia** splits the scroll into two parts, countryside and city. **Smarthistory** gets the order
  wrong (gate before bridge), so neither is useful for boundaries.
- No source gives per-section counts.

### 1.7 Counts, and where they disagree

No source gives counts per section. The whole-scroll figures conflict:

- **500余人**: the Palace Museum, the textbook, and 白寿彝's 中国通史 (which adds more than 50 animals and twenty-odd carts and boats).
- **550多人, 牲畜五六十匹, 车轿20多, 船20多**: 张安治 and many derived texts.
- **587人**: unattributed; seen in courseware handouts.
- **684人, 95–96 animals, 122 buildings, 29 boats, 15 carts, 8 sedans**: 薛凤旋 (University of Hong Kong); also repeated by 祝勇.
- **810多人, 80余头牲畜, 30多栋房屋, 20多艘船舶, 20多辆车轿**: 余辉 2014.
- **810余人, 90余头牲畜, 28船, 20车, 8轿, 树170多, 屋宇130余**: 余辉, 新讀《清明上河圖》 (HK 商務).
  In 2021 the same author wrote "五十多头牲口", so his animal counts disagree with one another.
- **814人, 28船, 60多畜, 30多房屋, 20车, 8轿, 170多树**: the most-copied web figure. It is also quoted by the 3.0 exhibition, but
  no primary counter has been found for it.
- **815人, 95畜, 24船, 8轿, 6桥**: 汤友常, who counted with one grain of rice per figure (reported by 新华社).
- **1643/1659/1695人**: traced to the Japanese writer 齐藤谦. It probably counts a later copy, so ignore it.
- **English sources**:
  - Hansen: "some 500 people… only about twenty (by my count) are women";
  - Tsao: 500–600;
  - Whitfield: "over 800";
  - Tian Yubin: about 835, counting partly visible figures.

The spread comes from how unclear figures (crowds, people inside buildings and boats) are counted and from damage.
For our purposes, "about 800 figures" is the defensible number. If per-section numbers matter, we should count
them ourselves from the scan.

## 2. Recommended section list for the project

The finest division that scholars support and that is defined in space is 余辉's seven 自然段. The 名画记 pins and
余辉's 2014 vignette list give landmarks inside each segment. The seven sections below follow 余辉, with one
deliberate change: the city-gate section is extended inward to take in the tax office and the military wine
post. 余辉 counts those as the opening of his 闹市 segment, but his own narrative ties them to the gate (撤防的城门 →
沉重的商税), and the camel caravan runs from inside the gate through it. Section boundaries are given as
single x values, with notes where a transition zone straddles them.

Listed in reading order (right to left).

**S1 郊野 · 古柳: the countryside** (余辉 seg. 1; classic 首段). **x ≈ 28700 → 37610.**

- Mist, sparse trees and water at the very start, ≈ 35000–37610.
- A small wooden bridge, ≈ 36100–36500.
- The charcoal donkey train (5 donkeys, 2 drivers; 赶驴入城), ≈ 36300–36850.
- The threshing floor and thatched farmhouses (寂静的谷场), ≈ 33400–35200.
- The great old willows (隋堤烟柳), ≈ 31000–32600.
- The returning tomb-sweeping party, with willow and flowers on the sedan roof, a rider and porters, ≈ 30600–31200.
- Travellers on donkeys bundled against the cold (迎寒策蹇/骑驴客商), ≈ 30000–30600, lower half.
- The runaway horse (惊马闯市), with grooms chasing and an old man calling a child away, ≈ 30000–30900, upper half.
  The horse's front half is lost to damage.
- The village tea and food stalls at the edge of the market, ≈ 28800–29800.

**S2 汴河 · 运河两岸: the canal wharves** (余辉 seg. 2; classic 中段 minus the bridge). **x ≈ 20500 → 28700.**

- The 望火楼, a pavilion on a high brick platform, ≈ 28260–28580 at the top edge. Below it are the two rows of
  barracks-type sheds now serving as eateries (望楼饭铺), ≈ 27700–28800.
- Porters carrying grain sacks ashore while the owner sits on the sacks (私粮进京/仓前成市), ≈ 27950–28350.
- Two deep-laden grain boats moored at the bank (万石船), ≈ 27300–28800.
- 王家纸马铺, ≈ 26850.
- Riverside eateries (沿河雅座), ≈ 25700.
- A boat rowed upstream by eight men, with trackers on the far bank (逆水行舟), ≈ 24200.
- A luxury passenger boat (豪华客船), ≈ 23000.

Splitting S2 in two at about x ≈ 24500 would be our own call, not a source division. 余辉's two lectures on this
stretch split it by theme (boats vs. street), not by place.

**S3 虹桥: the Rainbow Bridge** (余辉 seg. 3). **x ≈ 15500 → 20500.**

- 十千脚店: the tavern building probably spans ≈ 15500–16800 (my reading of the scan), and its scaffolded 彩楼欢门 ≈ 16800–17340, with the "十千脚店" lamp-box at ≈ 17000.
- The "新酒" flag, ≈ 17430.
- A 串车 at the tavern door, ≈ 17550. 余辉 reads its load as a cursive-script screen used as a tarp; the
  museum pin calls it simply 串车.
- The 饮子 drink stall, ≈ 18500.
- The bridge: south foot ≈ 18400–18900, arch ≈ 18850–20050.
- The sedan-versus-horseman standoff on the deck (车轿相争), ≈ 18700–19300.
- The big boat lowering its mast under the arch while people on the bridge throw ropes (大船抢险/上下呼救), ≈ 19500–20500.

Note that 余辉 2014 counts 十千脚店 as the first vignette of 城门内外, not of the bridge.

**S4 城门口外: the outer road** (余辉 seg. 4). **x ≈ 9400 → 15500.**

- Riverside moorings, with the river leaving the top of the frame, ≈ 14400–15700.
- 张安治's first crossroads: the wheelwright repairing a wheel (车铺劳作), ≈ 13550–13750, and two big
  palm-covered family carts (豪车云集/大棕盖车), ≈ 12700–13550.
- A crowd around a seated man under an awning, ≈ 13100–13450. Its identity has not been checked.
- The fortune-teller beside the official compound (临街神算/算命先生; signs 神课·看命·决疑), ≈ 12050–12400.
- The 递铺 courier post (懒兵候主), ≈ 11250–12100. It has a red studded gate with a posted notice and a small bridge in front.
  Nine soldiers sit or lie on document boxes, their spears and banners propped against the wall, and a white
  horse lies in the courtyard.
- Two three-ox covered carts with a rider coming the other way (牛拉大盖车), ≈ 9300–10550.
- A temple with a shut gate and a monk entering by the side door (清净的寺庙), ≈ 9750–10300 at the top.

**S5 城门: the city gate** (余辉 seg. 5 plus the first block of seg. 6). **x ≈ 5600 → 9400.**
See section 3 below.

**S6 城内十字街 · 闹市: the inner city** (余辉 seg. 6; classic 后段). **x ≈ 2000 → 5600.**

- 孙羊正店 (余辉 reads 孙记正店), with its flowered 彩楼欢门 and lamp-boxes 正店 / 孙□ / 香醪, ≈ 4300–5500.
  Two matchmakers' sedans stop at its door, ≈ 4300–4850.
- The 孙羊店 butcher's flag, and the storyteller with 17–18 listeners (闹市说书), ≈ 3600–4200.
- The cloth shops (王家罗明匹帛铺) and the 杨家应症 / "杨大夫经诊" clinic, at the top, ≈ 3400–3950.
- The crossroads itself, with two four-mule wagons swinging round the corner, ≈ 3200–3850.
- 刘家上色沉檀拣香 (the incense shop, 香药铺), ≈ 3130–3200.
- 久住王员外家 (the inn with a scholar studying upstairs, 士子苦读), ≈ 3250–4200 along the lower edge.
- A donkey cart with two wine casks, ≈ 2700–3250.
- The paper-horse stall under umbrellas (列售纸码), ≈ 2250–2600.
- The square well with its 田-shaped cover (深井汲水/方井), ≈ 1900–2300. This is 余辉's end of seg. 6, so the
  boundary sits at about 2000.

**S7 卷尾 · 赵太丞家: the end** (余辉 seg. 7, 结尾三问; 导览 "辞别开封"). **x ≈ 815 → 2000.**

- The 解 sign with a ring of young men around an old fortune-teller (考前求解; 余辉 reads them as examinees), ≈ 1980–2600 along the lower edge.
  The museum pin calls the 解 sign an exam-related office, and Hong Kong teaching material calls it a pawnshop.
- 赵太丞家, the doctor's shop with "治酒所伤真方集香丸", where two women bring children, ≈ 1480–1780.
- The broad-hatted official riding out with his retinue, ≈ 1560–1780.
- The official's gatehouse, where the gatekeeper gives directions to a visitor with a food box (门房指路/官宦人家), ≈ 1000–1350.
- The willows and the cut edge, at 815.

**Comparison with our earlier candidates.** The four candidate clips in `candidates/` map onto this scheme as
follows:

| Candidate | Clip range | Matching section | Section range |
|---|---|---|---|
| A (inner city) | 800–6500 | S6 + S7 | 815–5600 |
| B (gate) | 6000–9700 | S5 | 5600–9400 |
| C (outer road) | 9600–14900 | S4 | 9400–15500 |
| D (bridge head) | 15000–20200 | S3 | 15500–20500 |

## 3. The city-gate section (S5, x ≈ 5600 → 9400)

The section is described here from the inside of the city outward, which is increasing x. In the scroll's
reading order it comes the other way, right to left. The tax office is "在街北紧贴城墙的第一家" (名画记), so
the street side away from the viewer is north.

**Inside the gate (x ≈ 5400–6450).**

- **军巡铺屋 turned military wine depot (禁军运酒), x ≈ 5400–5800**, just right of 孙羊正店.
  - 余辉: this street-front room was a fire post (军巡铺屋). It now holds eight hooped casks (梢桶) where
    firefighting water should be, with two empty buckets on top, a 麻搭 fire-swatter lying across them and three
    more against the wall.
  - Three archers are getting ready to escort the wine. The middle one, wearing wrist guards, draws a bow full to
    test it; the one on the left ties his waist guard; the one on the right wraps his wrist.
  - The museum note is neutral: "正店旁的铺面里有三个人，仿佛是在进行出发前的准备工作…打着几道箍的大木桶".
  - Hansen and Columbia read the same room as a commercial "bow-and-barrel shop" or "archery shop", that is, a
    shop and not soldiers.
- **A second group of taxpayers, x ≈ 5100–5800**, street level. Pack donkeys and mules with loads; their leader
  holds a manifest. 余辉 thinks the load is grain bound for the 正店 next door.
- **The tax office (场务/税务所; 货到税讫), x ≈ 5800–6450.** It is a three-bay open hall against the wall.
  - **余辉's reading.** A city-defence office should stand here, and a tax office has replaced it ("撤防"). A
    large frame scale stands inside. Four carters (in 盘领衫, hems tucked into belts) have brought bales that look
    like textiles.
    - One carter goes inside to declare to the seated official, who is about to write.
    - Outside, the inspector (in a 右衽长衫) points at the bales and names a large figure.
    - A second carter hands him the manifest and a brush.
    - A third gapes ("啊——？这么多！").
    - The noise makes the watchman (更夫) on the gate tower look down.
  - **The museum's reading.** It hedges ("有的研究者认为这是税务所"). It reads the paper on the desk as an 引子
    (a transit permit), and describes the owner pointing at the goods and arguing with the official while
    everyone, including "城楼上值班的人", looks on.
  - **Hansen's reading.** "Merchants stand with their goods in front of an official writing at a table. They may be
    paying a value-added tax on the goods they are bringing into the city."
- **The tail of the camel caravan, x ≈ 5890–6450.** Three laden Bactrian camels and a driver, all facing
  outward, toward the gate.

**The gate itself (x ≈ 6450–7650).**

- **Inner ramp (马道), x ≈ 6450–7200.** Two flights lead up to the tower. It is empty.
- **The tower (城上暮鼓), x ≈ 6500–7650.**
  - The largest building in the scroll: five bays by three, with a hipped 庑殿 roof and heavy bracket sets
    (名画记). One popular text calls the roof 歇山 instead.
  - A big drum on a frame is visible inside (名画记; 余辉 2014 "城上暮鼓"). A lone figure stands in the upper doorway.
    Sources disagree on who he is:
    - a watchman (更夫) looking down at the quarrel: 余辉; the museum's "值班的人"; Tian Yubin's time-keeper;
    - a sightseer: Hansen, "a tourist, he gazes at the people inside the wall, not outside, where a guard would look";
      Columbia, "perhaps a sightseer".
  - 余辉: the gate plaque reads only "门", with the name left as dots, so the gate is deliberately unnamed. He
    rejects the idea that the drum makes it a 鼓楼.
- **Gate passage, x ≈ 7280–7450.** A straight-lintel opening in a brick-faced gate block.
- **The wings (土墙杂树).** Rammed earth with trees growing out of it, slumping, with no crenellations and no
  barbican (瓮城).
- **Nobody guards the gate (撤防的城门).** 余辉: "城门前后、城楼上下竟然没有一兵一卒把守". Hansen reaches the
  same point by a different route: "The city is so secure it has no soldiers to guard it". She also notes the
  "unguarded earthen wall… surprisingly dilapidated, with trees and brush growing at its base".

**The camel caravan.**

- **What the scan shows.** Three camels inside the wall, and a fourth half out of the passage at x ≈ 7360–7560,
  all heading right, which is out of the city. The museum agrees: "正在走出城门，第一只骆驼已经探出了多半个身子快要出城".
- **Who leads it.** 余辉 sees "门洞口露出一个胡人模样的驭手" and credits 荣新江 with identifying the leader as a
  foreigner. The museum suggests traders from the northwest.
- **Which way it is going.** Some popular texts and the textbook-derived reading say the caravan is *entering*
  the city. The painting shows it leaving.
- **Why it is there.** Art-historical readings note that it stitches the composition across the wall
  ("笔断意连").

**Outside, between the gate and the moat (x ≈ 7600–8300).**

- **Barber at the wall foot (城下修面), x ≈ 7650–7810.** 开封清明上河图研究会's 事物考 describes the setup:
  - a temporary square awning on a pole lashed to a low stool, with a knot of hair hung up as the trade sign;
  - the customer, in a 交领长衫, eyes half shut;
  - the barber, a goateed old man, holds his chin in one hand and shaves with a razor in the other, little finger
    raised.
- **Idlers.** A cluster of standing men and idlers by the wall, ≈ 7630–7870. 邵琦 notes "城墙下有人靠着城墙休息".
- **A kneeling man by something on the ground, x ≈ 7850–8000.** Sources disagree on what he is doing:
  - 余辉 2014: "杀羊祭道", a sheep killed as an offering to the road;
  - 余辉 2021: "当街举行祭拜'路神'的仪式";
  - the Baidu-style encyclopedic walk-through: "城门前一携仆的骑马贵人从一跪地行乞的老人前经过", a kneeling beggar.

  Either way, the next group passes right by him.
- **A man in a broad-brimmed hat on a donkey or horse, x ≈ 7900–8150.** Servants walk with him, one carrying
  luggage on a pole. He is heading out of the city. Hansen's caption for this stretch includes "a woman in a veiled
  hat on a donkey". That may be this same rider; I have not checked.
- **The 串车 with the screen (书屏遭废), x ≈ 8200–8550.** A wheelbarrow-type 串车, pulled by a donkey with men at
  the shafts.
  - 余辉: its load is covered by a large cursive-script screen written by a member of the banned Yuanyou faction,
    used as a tarp, and it is being taken out of town for destruction. This is the second of two such carts; the
    other stands at 十千脚店.
  - wenxueart: "城门外是一辆由两人合作、一头驴牵引的串车".
- **Porters with shoulder-pole baskets** crossing toward the bridge, ≈ 8250–8450.

**The moat bridge (平桥; 桥头观水), x ≈ 8250–9300.**

- A flat timber bridge with railings, crowded with people leaning over to look at the water and fish (邵琦: "有不少人在桥栏杆边观鱼").
- Two beggar boys hold out their hands to the sightseers (少年乞丐, ≈ 9120). Two of the sightseers ignore them;
  the other two hand over a coin to be rid of them (名画记).
- A heavy 串车 drawn by a man and a donkey is crossing. Hansen describes "a donkey helping pull a wheelbarrow
  covered by a tarpaulin".
- Literati in kerchiefs and labourers in trousers share the railing. Hansen calls the bridge "a tableau of
  different social groups"; Columbia's caption is "young scholars… looking contemplatively over the bridge".
- 张安治 calls the bridgehead the second crossroads of the outer road. 余辉 titles this stretch "平桥城门太纠结",
  playing on the congestion here.

**Just beyond (shared with S4).** The two three-ox family carts at x ≈ 9300–10550 and the temple at x ≈ 9750–10300. The 递铺 with its
idle soldiers is at x ≈ 11250–12100.

**The "guard post" question.** The scroll has no working guard post at the gate, and that absence is the point
of 余辉's reading. The places that ought to hold soldiers hold something else:

- the post just inside the gate is a tax office;
- the fire post next to 孙羊正店 holds wine and the archers who will escort it;
- the 望火楼 far out at x ≈ 28400 has tables and no lookout;
- the soldiers who do appear are dozing outside the 递铺.

The museum explains why the 递铺 sits outside the wall: it is "设置在城门外，以防夜间城门关闭后，便于官差歇息".

Hansen identifies the same compound differently in three places: as "a military barracks… its guards doze lazily
by its gate", as a yamen with "a few guards ostentatiously taking naps outside", and, in her 2020 video, as
"probably a jail". The building is clear (red studded gate, spiked earthen wall, men slumped outside); its
function is not. If the world needs a guard-post prop, this compound is the authentic one, and it belongs in S4,
not at the gate.

**Which gate it is.** This is disputed. The candidates are:

- 东角子门, an inner-city gate in the southeast: the museum's position, paired with reading the bridge as 上土桥;
- 东水门 (外城): 徐邦达 and 张安治, following the Jin colophon "水门东去接隋渠", with the bridge as the 虹桥
  "东水门外七里";
- 新郑门: listed by 刘涤宇 among the three candidates;
- a deliberate composite ("实情而非实景"): 余辉. 刘涤宇 leans the same way;
- not Kaifeng at all: Hansen.

Whitfield's objection cuts against the 东水门 reading: in the scroll the moat lies between the bridge and the gate,
whereas in Kaifeng it lay beyond the bridge.

For the build, this means there is no real site to match. The painting itself is the only authority.

**Figure counts for the gate section.** None are published. A quick count from our scan is the only way to get one.

## 4. Sources

Palace Museum and its staff:

- 故宫博物院 collection page, 张择端清明上河图卷: https://www.dpm.org.cn/collection/paint/228226.html
- 故宫名画记 viewer (same text, plus the 49 annotations): https://minghuaji.dpm.org.cn/paint/detail?id=592d80e225aac624977fee2e19452c1f. Annotation API: `POST https://minghuaji.dpm.org.cn/paint/annoList`, body `{"imageId":"7"}`.
- 余辉, 2012 Palace Museum lecture "北宋张择端《清明上河图》揭秘": https://www.dpm.org.cn/forum_detail/99722.html
- 余辉, 2014 人民日报海外版 "镇馆之宝" (three parts with the vignette list), reprinted by 新浪收藏: http://collection.sina.com.cn/jczs/20140214/0832142881.shtml. Also on 半月谈: http://www.banyuetan.org/chcontent/wh/shh/2014318/96824_2.shtml
- 余辉, "《清明上河图》十大看点" (from 《隐忧与曲谏》 ch. 7, 北京大学出版社 2015), 人民网/北京青年报 2015-09-10: http://art.people.com.cn/n/2015/0910/c206244-27566921.html
- 余辉, "《清明上河图》最后'三问'", 澎湃 2021: https://m.thepaper.cn/newsDetail_forward_11198561
- 余辉 & 张震, 对谈 and the "第六段：闹市" excerpt from 《清明上河图深度游》, 澎湃 2023-06-17: https://thepaper.cn/newsDetail_forward_23508581
- 《清明上河图深度游》 table of contents (七个自然段): https://www.dushu.com/book/13861591/
- 《张择端清明上河图导览》 table of contents: http://www.xlantai.com/e3085052.html
- 余辉 interview, 每日经济新闻 2019 (荣新江 on the camel driver; "税务所" replacing the city-defence office): https://www.nbd.com.cn/articles/2019-12-05/1391251.html
- 余辉, 张择端《清明上河图》卷跋文考释 (colophons, including 张公药 "水门东去接隋渠"): https://www.dpm.org.cn/Uploads/File/2018/06/04/u5b150c65d4a66.pdf

Other scholars and references:

- 张安治's walk-through (《中国名画鉴赏辞典》), via 上观: https://www.jfdaily.com/sgh/detail?id=1542490. The page body
  loads by script, so the quotes come from an agent's earlier read and I could not re-verify them.
- 刘涤宇, 從《清明上河圖》看北宋東京的城市細部構成 (建筑师 2010), reprint: https://read01.com/34eAGy.html
- 刘涤宇, book table of contents: https://book.douban.com/subject/25976011/
- 刘涤宇 interview, 澎湃 2015: https://www.thepaper.cn/newsDetail_forward_1331066
- 祝勇, 《清明上河图》的矛盾与统一 (光明网 2021; seasons, the truncation, the 684 count): https://news.gmw.cn/2021-10/22/content_35250404.htm
- 开封清明上河图研究会, 《清明上河图》事物考 (barber at the gate): http://www.qmsht.cc/hnmd/wap_doc/20234363.html
- 邵琦, 中华艺术宫 guided talk (idlers at the wall, fish-watchers on the bridge): https://whlyj.sh.gov.cn/yshd/20220415/74e46bc55a514dbcbbaddb38ec56a11e.html
- 《清明上河图》与宋代都城的市民生活 (wenxueart; carts, the 串车 outside the gate): https://www.wenxueart.com/6453.html
- 三个版本《清明上河图》比较评介, 北京政协: http://www.bjzx.gov.cn/zxqk/bjgc/201508/tw/201804/t20180420_11740.html
- 人民网/中国城市报 2015 ("后段为城门内外的景象"): https://paper.people.com.cn/zgcsb/html/2015-10/19/content_1623618.htm

Encyclopedias and textbook:

- 百度百科 清明上河图: https://baike.baidu.com/item/清明上河图/102
- 中文维基 清明上河圖: https://zh.wikipedia.org/zh/清明上河圖
- 毛宁《梦回繁华》 (textbook text): http://www.yinruiwen.net/news/185586.htm

Exhibitions:

- 清明上河图3.0, Beijing 2018: http://finance.cnr.cn/gundong/20180521/t20180521_524241006.shtml
- 清明上河图3.0, Hong Kong 2019: https://www.asiaworld-expo.com/zh-sc/about-us/media-zone/press-release/2019/a-journey-through-springtime-along-the-river-hong/
- Hong Kong exhibition zones: https://bau.com.hk/article/2020-11/27/content_926247876031508480.html

English-language sources:

- Valerie Hansen, *The Beijing Qingming Scroll and Its Significance for the Study of Chinese History* (JSYS supplement, 1996; 26 plate sections): https://songyuan.org/Downloads/Hansen-Beijing%20Qingming%20Scroll.pdf
- Valerie Hansen, "The Mystery of the Qingming Scroll and Its Subject: The Case Against Kaifeng", JSYS 26 (1996): 183–200: https://history.yale.edu/sites/default/files/files/hansen-qingming-scroll(2).pdf
- Valerie Hansen, 2020 video walkthrough: https://www.youtube.com/watch?v=7Rp4nMn-Gms
- Columbia University, Asia for Educators, interactive scroll (42 hotspots): https://afe.easia.columbia.edu/song-scroll/song.html
- Jesus College, Cambridge, report of Roderick Whitfield's 2022 lecture: https://www.jesus.cam.ac.uk/articles/twelfth-century-life-song-capital-zhang-zeduans-spring-festival-river
- Roderick Whitfield, "Chang Tse-tuan's Ch'ing-ming shang-ho t'u" (PhD diss., Princeton 1965): not accessed; cited through Hansen.
- Tsao Hsingyuan, "Unraveling the Mystery of the Handscroll Qingming shanghe tu", JSYS 33 (2003): 155–79: not accessed (JSTOR). Her 2016 Chinese essay: http://www.022meishu.com/Art_review/2016/04-12/28584_0.html
- Tian Yubin, essay in Asian Art Newspaper (for his 2024/25 book): https://asianartnewspaper.com/along-the-river-during-qingming-festival/
- English Wikipedia, "Along the River During the Qingming Festival": https://en.wikipedia.org/wiki/Along_the_River_During_the_Qingming_Festival
