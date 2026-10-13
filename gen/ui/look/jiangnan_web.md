# 江南百景图: sky, time, weather, art direction (web research, 2026-10-12)

The images and the full source list are in `reference/jiangnan/web/` (`sources.md`). Hex values were sampled from those images.
Caution: many Chinese "攻略" sites are SEO or AI text. Claims marked (weak) come only from those sites.

## 1. Day and night
- **No day/night cycle in the main cities.** Player guides since 2020 agree that the game has no night and that circulating night shots are photo edits (https://www.18touch.com/ask/3173.html, https://a.9game.cn/jnbjt/9459586.html). The second guide gives the reason: every 2D sprite would need repainting. No official statement either way was found.
- **The game knows the real clock.** 狄青's talent 夜袭 works at night (18touch). The 2026 New Year event says "民宅灯火将被点亮" and runs fireworks "每晚八点至八点半" (https://www.gaoshouyou.com/zhuanqu/933801.html). Lantern-festival 孔明灯 drift over the city at set release times (https://m.codesocang.com/asoft/140677.html). Whether the map itself darkens at those hours was **not found**.
- **Night maps exist as special places.** 鸡鸣山 (2021) is "抬手便可触及夜空" and "漫漫夏夜的笼罩下" (https://wap.gamersky.com/news/Content-1409880.html). The in-game capture in the official infographic shows a dark sky and ink mountains beyond a cream paper ground. 棕影岛 (2024) officially has "昼夜交替": emerald waves by day, and at night "深蓝静谧的海与岛上的篝火交织" (https://www.tgbus.com/news/223011).
- **Night in official art** (`night_*` files):
  - The 鸡鸣山 sky is a near-black that is neutral or warm (#2d2c2d), not blue. Dry-brush horizontal streaks show the paper through.
  - Stars are sparse soft gold dots of mixed size, never white points. One bright star drops a long vertical gold streak on a deep-blue lake (#3e4f72).
  - The 4th-anniversary art "入画江南月下游" paints the sky in horizontal gouache bands of indigo (#28314a), slate and plum (#443035), with gold specks, and tears the lower edge into white paper.
  - **In every night image the ground stays light:** cream paper or snow (鸡鸣山 ground #dadbcd; 3.0.1 wallpaper; 3.1.0 snow under lanterns). Darkness lives in the sky band. Light comes from lanterns as warm orange halos with no cast shadows.
- **Moon:** no moon disc appears in any official image found. The "月下游" title implies a moon but shows none. **Not found.**
- **Dawn and dusk:** no in-game dawn or dusk was found. A 黄山 exploration sunrise/sunset easter egg is claimed only by an SEO site (https://www.sonyhs.com/hszx06/65873.html) (weak). Official wallpapers do show the key look, though:
  - 3.3.0 has blush-pink horizontal washes (#f8d2c3) on cream paper (#f9f4e2) with a small flat orange-vermilion sun disc (~#ee965c), no halo, pink reflected on the water, and mountains dissolving into the paper.
  - 4.4.2 has a pale grey-cream sky (#e1e2d0) with a tiny brick-red disc (~#bd6944) above mist-cut mountain bands.
  - The user's jn1 pink sky belongs to the same family.

## 2. Seasons, weather, clouds and mist
- **Rain** is a random weather event and rare: one player saw it first after more than a year of play (https://www.taptap.cn/moment/833827254927623970). The 2021 official "飞雨落花中" contest acknowledges it (https://www.taptap.cn/moment/148139057858217675). Player lore says a dragon may fly over during rain, announced by wind sounds (https://www.pkvs.net/ask/221379.html).
  - What it looks like (`rain_ningbo_*`): thin pale streaks slanted slightly off vertical, small ring ripples on the water (#688497), a faint cool grey wash, and ground that stays pale. Nothing turns dark or wet-glossy.
- **Snow** comes only in the winter event. From about Dec 29, "下雨天气将有概率转为下雪天气", snow settles on houses and trees, and some buildings get a toggleable 雪景 skin (official: https://www.taptap.cn/moment/752591494237390420; 2023 text https://www.xiaomape.com/news/110675.html). 白雪镇 (2024) is "终年银装素裹" (https://www-ali.gamer.dog/news/html/2024-2/815033.html).
  - What it looks like (`snow_*` store shots): the ground goes white-paper (#dad8c5), water stays slate blue, and roofs and tree crowns get white caps.
- **Other seasons** come as themed towns and decor, not as a global cycle: 存秋镇 is an autumn town (6.1.0, 2026-10, https://www.taptap.cn/app/179371), and 节气 events give seasonal buildings. A global spring/summer/autumn cycle was **not found**. Blossom, autumn trees and willows sit side by side in the same screenshot.
- **Fog of war:** exploration maps are covered in 迷雾/白雾 that clears when tasks or 锁雾碑 are done (https://news.qq.com/rain/a/20210205A0BUY400).
- **Map edges:** cities end in painted blue-grey ink mountains with cream cloud swirls (`snow_map_edge_*`). The mountains are separate background sprites (Cocos talk below).
- **Drifting clouds that carry the place title (jn2/jn3 top-left):** **not confirmed as an in-game feature.** Those screenshots carry a B站 uploader watermark ("反向弯曲"), and no source describes clouds sweeping over the city map with titles. The game's screenshot tool does offer 印章 seals (http://www.7723img.cn:8000/strategy/98073.html).
- **Title and loading screens:**
  - The 3.0.1 changelog says "在加载界面使用新的标题背景图" (https://m.codesocang.com/asoft/140677.html), so the title art changes with versions.
  - The actual loading images were **not found**; the version wallpapers are the nearest official art.
  - The opening PV is in 螺钿 (mother-of-pearl lacquer) style (https://www.taptap.cn/moment/15218126903837752).

## 3. Art direction
- **Official wording:** "美术风格传承吴派山水画，清隽秀逸"; all buildings "出自明朝古画" (https://play.google.com/store/apps/details?id=com.cis.jiangnan.googleplay&hl=zh). The player is 文徵明; scenes come from 仇英《清明上河图》 and 徐扬《姑苏繁华图》 (https://paper.people.com.cn/hwbwap/html/2020-08/25/content_2004988.htm). Player research also traces buildings to 张择端本, 清院本, 《独乐园图》 and 南都繁会图 (https://news.qq.com/rain/a/20200727A0WDOT00).
- **Lead artist 千九** (https://www.thepaper.cn/newsDetail_forward_11155385):
  - It is *not* really 水墨; it was designed for phone screens.
  - The modern masters studied were 吴冠中、张大千、潘天寿、戴敦邦、林风眠.
  - Saturation was raised above 国画.
  - Old paintings are eye-level and the game is a 45° top-down view, so motifs are pulled out of paintings into one map cell.
- **How the style was found:** an ink-only concept was judged too monochrome, a colour version followed 吴冠中, and the final style merges the two (CEO: https://mp.weixin.qq.com/s/9QcyOitSZPHC7wWupw54Zw).
- **Style rules:** "重色描线，低饱和颜色，非虚构的细节设计" (https://www.boxuu.com/articles/c/10900.html).
- **Named painters:** 沈周 and 文徵明 appear as characters. No developer statement cites 沈周's or 文徵明's brushwork as a style source; the stated references are the long scrolls and 吴冠中.
- **Production:** 2D and hand-painted. The concept was painted whole, then houses were cut out into the engine (CEO). Each building is painted from one face and mirrored, and characters never show their backs (boxuu). The CEO says the team is "还在做2D" (https://www.gameres.com/875348.html).
- **UI:**
  - The logo is calligraphy with a red seal.
  - There are no back/close buttons, the XP bar is hidden in a brush stroke, and progress shows on painted placards (https://blog.csdn.net/wubaohu1314/article/details/120585913).
  - Story art imitates Suzhou woodblock prints, with colour misregistration (人民日报海外版).
  - Font names: **not found.**

## 4. How ground, mist and clouds are rendered
- **Source:** 椰岛's Cocos talk (https://jishu.proginn.com/doc/7755647697da108a1).
- **Ground:** 3 TiledMap layers of diamond tiles; roads are tiles. 13 render layers in all; flag poles and flag cloth sit on separate layers. Background mountains are separate sprites.
- **Ink-to-colour fade:** sprites scrolling into view fade "从水墨色变为彩色". All buildings and people share one material and get a per-vertex time parameter. Players see it as outline → black-and-white ink → full colour, "like a scroll unrolling" (CSDN analysis above).
- **UI blur:** opening a UI renders the scene to a small RenderTexture, Kawase-blurs it and scales it back up.
- **Not found:** any write-up on a paper-texture overlay, a cloud or mist shader, cloud shadows, or the rain and snow particles.

## What this means for a first-person ink sky that follows the hour
- **Day:** leave the sky mostly bare paper (留白, #dbe1de–#f9f4e2). Use pale blue-grey mountain bands cut by mist (#c6d5da) and ink birds at most.
- **Dawn or dusk:** lay horizontal blush washes (#f8d2c3) low on the dome. Add a small flat vermilion disc with no bloom (#ee965c as in v330, or the deeper #bd6944 of v442 for a hazier look; neither wallpaper says whether it is dawn or dusk). Mirror the pink and a vertical sun streak in the water.
- **Night:**
  - Sky: a warm or neutral near-black (#2d2c2d) or indigo-plum gouache bands (#28314a / #443035), with dry-brush streaks that let the paper grain through.
  - Stars: sparse soft gold dots, one with a long reflection on the river.
  - Moon: none was found in the reference; if used, make it a flat disc in the same manner as the sun.
  - Ground: do not drown it; it stays readable and paper-light. Lanterns carry warm orange halos.
- **Edges and weather:** a torn paper edge or cream cloud swirls can close the horizon, as the store screenshots and the 4th-anniversary art do. Rain is thin slanted streaks, ring ripples and a slight cool wash; snow repaints the ground white while water stays slate.
