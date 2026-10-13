# The lore round (ink UI round 2, gen/ui/r2_lore.md): the long descriptions of the 7 regions and 30 landmarks,
# merged into sections/*/places.json. Run once from qingming/ (python3 -I gen/ui/lore/lore_r2_merge.py); re-runnable
# (fields are overwritten, nothing else in the files changes). After that the texts live in places.json and are edited
# there; this file is the record of the first pass and its sources.
#
# Fields added (tools/ui_data.mjs checks them):
#   long      the long description (繁體, modern prose with a Song flavour; landmark 80-220, region 150-320 characters)
#   quote     optional: a short period or scholarly line, quoted exactly from the source text in gen/ui/lore/sources/
#   quoteSrc  where the quote comes from (player-facing)
#   cite      the sources in a few words, shown under the text in the journal (player-facing)
#   longSrc   developer notes: one source per claim (never shown; the font subsetter ignores it)
#   crop      map IDs whose stroke boxes frame the painting's crop for the journal (tools/place_crops.mjs);
#   cropBox   [u0, v0, u1, v1] scan px, used as is where the strokes frame it badly (chosen by eye on the contact sheet)
# Readings: MHJ n = 故宮名畫記 annotation n (gen/ui/lore/sources/minghuaji_annoList_imageId7.json); DJ = 東京夢華錄
# (sources/dongjing_menghua_lu_excerpts.txt); YH15 = 余輝 十大看點 (sources/yuhui_2015_shida_kandian.txt); YH21 = 余輝
# 最後三問 (sources/yuhui_2021_sanwen_thepaper.txt); YH23 = 余輝 鬧市繁華顯不平 (sources/yuhui_2023_naoshi_thepaper.txt);
# COL = 余輝 跋文考釋 appendix (sources/colophons_yuhui2015_appendix.txt); MS = 澠水燕談錄 卷八; SEC = reference/scroll/
# sections.md; map = map/world/<S>.json.
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

REGIONS = {
 'countryside': dict(
  long='畫卷由右向左展開，開卷是汴京東南的遠郊：河渠縱橫，老樹還沒抽芽，薄霧輕籠，正是早春。兩個腳夫趕著馱炭的驢隊走向小橋，農家的穀場靜悄悄的；隋堤上一排老柳，掃墓的人家抬著插滿楊柳的轎子回城。畫的是不是清明，學者有過爭論：孔憲易據炭驢、扇子和「新酒」旗，以為是秋景；金人張著的跋文落款「清明後一日」，余輝以為這已婉轉點明了時節。這裏從清明之說。',
  quote='凡新墳皆用此日拜掃。都城人出郊。', quoteSrc='《東京夢華錄》卷七〈清明節〉',
  cite='故宮名畫記・孔憲易・余輝〈跋文考釋〉',
  longSrc=['MHJ 1: 汴京城外东南远郊, 河渠纵横, 老树新芽未吐, 薄雾轻笼, 早春; 两个脚夫赶着几匹毛驴，驮着木炭向小桥走来',
           'map S1.grp.charcoal_train: two drivers, five donkeys', 'MHJ 2 寂静的谷场; MHJ 3 隋堤; MHJ 6 杨柳杂花装簇轿顶 (扫墓回城)',
           'SEC §1.3: 孔宪易 autumn, not Qingming (charcoal donkeys, fans, straw hats, 新酒 flags, watermelons)',
           'COL p.60 (余辉): 张著跋文年款为"清明后一日"，婉转地确定此图所绘的时节是清明节',
           'quote: DJ 卷七 清明节']),
 'canal': dict(
  long='過了城鄉交界，汴河流進畫面。這條運河自洛口引黃河水，東流入淮，東南的糧米貨物都由它運進京城。宋太宗說過，京城「養兵數十萬，居人百萬家」，全仰這一渠水。岸邊泊著吃水很深的糧船，腳夫扛著糧袋上岸，船主坐在貨包上歇息；沿河一條街多是飯館茶肆，臨河的雅座開窗對著水面。高處一座望火樓卻空無一人，余輝讀作繁華底下的隱憂。',
  quote='運東南之糧，凡東南方物，自此入京城，公私仰給焉。', quoteSrc='《東京夢華錄》卷一〈河道〉',
  cite='《東京夢華錄》・故宮名畫記・余輝〈十大看點〉',
  longSrc=['DJ 卷一 河道: 汴河自西京洛口分水入京城，东去至泗州，入淮', 'MHJ 7: 汴河之水来自于黄河; 宋太宗 "东京养兵数十万，居人百万家，天下转漕仰给，在此一渠水"',
           'MHJ 8 万石船 (two heavy-laden boats moored); MHJ 9 仓前成市 (porters unloading sacks, the owner sits on the bales)',
           'MHJ 10, 14: the riverside street, mostly eateries; 沿河雅座 windows open to the river',
           'YH15 看点二 虚设的望火楼: 楼上无一人守望']),
 'rainbow_bridge': dict(
  long='長卷行到中段，便是全畫最驚險的一幕。一條大船正要穿過虹橋，桅桿還沒放倒，船工有的撐篙抵住橋身，有的大聲呼喊；橋上的人探身拋下繩索，看熱鬧的擠滿了橋欄。橋面上，一頂轎子和一位騎馬的官人迎面相逢，隨從各不相讓。余輝說這是全卷矛盾的高潮；曹星原更把這場搶險讀作全畫的主旨「同舟共濟」。橋頭，十千腳店的彩樓歡門高高搭起。',
  quote='畫橋虹臥浚儀渠，兩岸風煙天下無。', quoteSrc='金元之際 張世積跋',
  cite='故宮名畫記・余輝〈十大看點〉・曹星原・韓森',
  longSrc=['Hansen 1996 (SEC §1.6): the bridge "appears just at its halfway point"', 'MHJ 19, 20: the boat at the bridge, crew lowering the mast, poling against the bridge, shouting; ropes thrown from the bridge; crowds',
           'YH15 看点三: 坐轿的文官与骑马的武官互不相让，轿夫与马弁各仗其势; 形成了《清》卷的矛盾高潮',
           'SEC §1.6: Tsao Hsingyuan 《同舟共济》 reads the boat crisis as the core message', 'map S3.grp.shiqian_jiaodian_16800, S3.str.cailou_huanmen_16880',
           'quote: COL 张世积跋 画桥虹卧浚仪渠。两岸风烟天下无。']),
 'outer_road': dict(
  long='離了河岸，大路往西直通城門。余輝把這一段叫作「城門口外真悠閒」：車鋪裏匠人在修車輪，兩輛棕蓋大車一停一走，小鋪裏有人閒坐吃茶，算命先生的攤子支在官衙旁邊；遞鋪門前的兵卒或坐或臥，院裏一匹白馬也躺著歇息。再往西，寺院山門緊閉，牛拉的大蓋車疾行而來，正和一位騎馬的人在街角相逢，悠閒裏也夾著幾分緊張。',
  quote='從城外守門入城貨賣，至天明不絕。', quoteSrc='《東京夢華錄》卷三〈天曉諸人入市〉',
  cite='余輝《清明上河圖深度游》・故宮名畫記',
  longSrc=['SEC §1.2: 余辉 深度游 (4) 城门口外真悠闲', 'MHJ 26 大车修理店; MHJ 27 大棕盖车 一停一走; YH14 小铺闲坐; MHJ 28 算命先生 by the official hall',
           'MHJ 29 递铺 (或坐或卧, 疲乏); YH15 看点五 白马躺卧', 'MHJ 30 清净的寺庙 (山门紧闭); MHJ 31 牛拉大盖车 (两辆牛车快速地行进…有人骑马与牛车迎面奔来，情景甚为紧张)',
           'quote: DJ 卷三 天晓诸人入市']),
 'gate': dict(
  long='過了護城河上的平橋，便是全卷最高大的建築：城樓。這是哪一座城門，說法不一：故宮從東角子門之說；徐邦達、張安治據金人張公藥的跋詩「水門東去接隋渠」讀作東水門；余輝則說門額上只寫一個「門」字，畫的是「實情而非實景」。這裏用故宮之說。余輝又指出，這座城門沒有甕城，也不見垛口；一隊駱駝正從門洞走出城去，牽頭的像是胡人，進門頭一家便是稅務。',
  quote='城門前後、城樓上下竟然沒有一兵一卒把守。', quoteSrc='余輝〈清明上河圖十大看點〉',
  cite='故宮・徐邦達・張安治・余輝〈十大看點〉〈最後三問〉',
  longSrc=['MHJ 33: 整幅画卷中，城门楼是一座最大的建筑物', 'SEC §3 Which gate: 东角子门 (the museum); 东水门 (徐邦达, 张安治, after the Jin colophon 水门东去接隋渠); composite (余辉)',
           'COL: 张公药跋 水门东去接隋渠', 'YH21: 牌匾…就写了一个"门"字; YH15 看点十 (end) and 实情而非实景 (YH15 text)',
           'YH15 看点七: 城门不是瓮城…连射箭的城垛也没有; 胡人模样的驭手; YH15 看点八: 城门内头一家是税务所',
           'quote: YH15 看点七']),
 'inner_city': dict(
  long='進了城門，便是畫中最熱鬧的市街。余輝說這一段從城門內經十字路口，一直到水井為止，畫家「以孫記正店為中心」。正店門前彩樓高搭，兩頂媒婆的轎子正要在門口落下；肉鋪前圍了一圈人聽說書；十字路口，騾子拉的大車急轉過街角。香藥鋪、客店、醫鋪、綢緞鋪一家挨著一家，士子、僧人、挑夫、閒人擠在同一條街上。余輝為這一段取的題目是「鬧市繁華顯不平」。',
  quote='太平日久，人物繁阜。', quoteSrc='孟元老《東京夢華錄》序',
  cite='余輝《清明上河圖深度游》・故宮名畫記・《東京夢華錄》',
  longSrc=['YH23: 第六段：闹市从城门内开始经十字路口到水井处…画家以"孙记正店"为中心', 'YH23: two sedans of matchmakers (媒婆) stopping at the 正店',
           'MHJ 39 闹市说书; SEC S6: two four-mule wagons swinging round the corner (map: mules)', 'MHJ 40 (肉铺, 医院, 绸缎铺), 41 香药铺, 42 久住王员外家; map S6 monks',
           'YH23 title 闹市繁华显不平', 'quote: DJ 序 (sources/dongjing_menghua_lu_excerpts.txt)']),
 'city_end': dict(
  long='長卷到此收束。余輝說，畫家在結尾留下「三問」：趙太丞家門前問病，「解」字招牌下問命，官宦人家門口問道。街上一位戴寬簷帽的官人騎馬出行；提著食盒的外鄉人順著守門人的手指望去，兩旁街樹相合，畫卷卻戛然而止。徐邦達疑心「後面是割去了不少的」，鄭振鐸以為原畫應一直畫到金明池。畫後接著的，是金、元、明歷代文人的題跋。',
  quote='翰林張擇端，字正道，東武人也。幼讀書，遊學於京師。', quoteSrc='金 張著跋',
  cite='余輝〈最後三問〉・故宮名畫記・徐邦達・鄭振鐸',
  longSrc=['YH21: 问病、问命、问道 (赵太丞家, the 解 sign, the official gatehouse)', 'map S7.fig.official_rider_1610 (broad hat, riding east)',
           'MHJ 49: 手提着食盒…看门人很热心给他指路…两侧街树相合，朦胧一片，画卷却在这里戛然而止', 'SEC §1.3: 徐邦达 1958 "我疑心后面是割去了不少的"; 郑振铎 thought it should run on to 金明池',
           'COL: the colophons of the Jin, Yuan and Ming after the painting', 'quote: COL 张著跋']),
}

LM = {
 # ---- S1 countryside
 'S1.str.small_bridge_36365': dict(
  long='開卷第一景：一座低矮的木板橋，細木柱撐著，橋面鋪著草土，沒有護欄，橋下泊著一隻空船。兩個腳夫趕著馱炭的驢子走向小橋，前頭的腳夫一手扶著領頭驢背上的炭筐。故宮名畫記說，這些炭要運進城裏，供酒店灶下燒火；孔憲易卻拿這隊炭驢作證，說畫的是秋冬而不是清明。',
  cite='故宮名畫記・孔憲易・畫中所見',
  longSrc=['map S1.str.small_bridge_36365: long low plank bridge on thin posts, deck covered with brushwood or turf, no railing; a small empty boat under it',
           'MHJ 1: 两个脚夫赶着几匹毛驴，驮着木炭向小桥走来', 'map S1.fig.charcoal_driver_36797: right arm to the top of the leading donkey\'s load',
           'MHJ 21: 驴队往城里运送的木炭，正是满足这些酒店所需', 'SEC §1.3: 孔宪易 autumn argument rests on the charcoal donkeys (among others)'],
  crop=['S1.str.small_bridge_36365', 'S1.grp.charcoal_train']),
 'S1.grd.threshing_floor_35225': dict(
  long='過了小橋，路邊幾間農舍，門前搭著涼棚、擺著椅凳，像是供行人歇腳的小店；時候尚早，還沒有客人。屋旁一片平整的空地便是穀場，早春時節空空蕩蕩，只立著一副木架和一根叉竿；一株截了頂的老柳，新枝像扇子般張開。故宮名畫記稱這一景為「寂靜的穀場」，余輝的小題作「曬場農舍」。',
  cite='故宮名畫記・余輝・畫中所見',
  longSrc=['MHJ 2: 路边歇脚店，门前搭着凉棚，摆放着椅凳。时候尚早，还没有客人到来', 'map S1.grd.threshing_floor_35225: empty in early spring, a bench or roller frame and a forked pole',
           'map S1.tree.willow_pollard_35128: pollarded willow, fan of long shoots', 'SEC §1.2: 余辉 2014 vignette 晒场农舍'],
  crop=['S1.grd.threshing_floor_35225', 'S1.tree.willow_pollard_35128']),
 'S1.grd.bank_31660': dict(
  long='汴河開鑿於隋煬帝時，沿河的堤岸便叫隋堤，堤上遍植楊柳，「隋堤煙柳」後來列為「汴京八景」之一。畫中的柳樹樹幹蒼老扭曲，枝頭卻是新抽的嫩條。故宮名畫記解釋：堤柳長到一定粗細，就砍去樹梢，砍下的枝條紮成捆，釘在兩岸防洪護堤，年年如此，才長成這副頭大身粗的模樣。',
  cite='故宮名畫記・畫中所見',
  longSrc=['MHJ 3: 人工河开通于隋炀帝时期…隋堤…盛植杨柳…"汴京八景"之一; 树干古老苍劲，枝头新发; 砍去树梢，扎成捆，钉在汴河两岸，用来防洪抗险',
           'map S1.grd.bank_31660: raised bank of the great pollarded willows'],
  crop=['S1.grd.bank_31660']),
 'S1.veh.sedan_willow_30805': dict(
  long='一隊人馬從郊外掃墓回城：轎頂插滿楊柳，柳條一直垂到轎身，轎夫一前一後抬著；挑夫擔著箱籠，騎馬的男主人隨在隊後。轎子關著，看不見裏面的人，故宮名畫記說坐的是女主人。這正是《東京夢華錄》寫的清明風俗：城裏人出郊拜掃，回城時把楊柳雜花裝簇在轎頂上。畫面從這裏由靜轉動，人馬漸漸多了起來。',
  quote='轎子即以楊柳雜花裝簇頂上，四垂遮映。', quoteSrc='《東京夢華錄》卷七〈清明節〉',
  cite='故宮名畫記・《東京夢華錄》・畫中所見',
  longSrc=['MHJ 6: 扫墓回城…女主人的轿子以杨柳杂花装饰轿顶…男主人骑马走在队伍的后面…画面也由静到动',
           'map S1.veh.sedan_willow_30805 (closed box, willow sprays, two bearers), S1.fig.porter_boxes_30908, S1.fig.porter_pole_31083',
           'DJ 卷七 清明节 (wikisource reads 装族; 装簇 per MHJ 6 title and the usual text)'],
  crop=['S1.grp.tomb_sweeping_party']),
 # ---- S2 canal
 'S2.bld.yanhe_yazuo_hall_25690': dict(
  long='從河邊停泊的船隻看，這裏是個大碼頭。臨河一座長廳架在岸上，一排大窗全敞著，窗裏擺著長桌和交腳的坐具，西頭窗下坐著一位客人，身旁還有個小些的人影。故宮名畫記說，客人在這裏一邊飲酒，一邊看河上風景；乘船來的客人，興許也會拉著船主上岸喝兩杯。長廳東頭同一道屋頂下，是一座門扇緊閉的倉房。',
  cite='故宮名畫記・畫中所見',
  longSrc=['MHJ 14: 从停泊的船只数量上看，这里是一个大码头…有窗户敞开正对着河面，客人一边喝酒，一边欣赏风景。乘船的客人，兴许会拉着船主，去岸上喝两杯',
           'map S2.bld.yanhe_yazuo_hall_25690 (open windows, long tables, crossed-leg seats, seated man and a smaller figure)', 'map S2.bld.warehouse_26070 under the same roof'],
  crop=['S2.bld.yanhe_yazuo_hall_25690']),
 'S2.bld.wang_paper_horse_shop_27100': dict(
  long='丁字路口有一家專賣紙紮冥器的鋪子，門前立著高高的招牌，學者讀作「王家紙馬」；鋪前一座木架，紙錢紙馬一直疊到屋簷。故宮名畫記說，宋人不像唐人那樣厚葬，多用紙做的錢和冥器代替實物，這風俗一直流傳到今天。招牌前，一位戴著高帽兜的人騎驢停下，正朝鋪子張望。',
  quote='紙馬鋪皆於當街用紙袞疊成樓閣之狀。', quoteSrc='《東京夢華錄》卷七〈清明節〉',
  cite='故宮名畫記・《東京夢華錄》・畫中所見',
  longSrc=['MHJ 13: 丁字路口有一家专门卖冥器的纸马铺…宋人…主张薄葬，多以纸做的钱和冥器代替实物冥器，这种风俗影响至今',
           'map S2.prop.signboard_wang_paper_horse_26896 (illegible on our scan; 王家纸马 per MHJ 13, Hansen plate 8)', 'map S2.prop.paper_goods_stack_27070 (to the eave)',
           'map S2.fig.rider_26832 (hooded rider on a donkey facing the signboard)', 'quote: DJ 卷七 清明节'],
  cropBox=[26700, 0, 27480, 520], crop=['S2.bld.wang_paper_horse_shop_27100', 'S2.prop.signboard_wang_paper_horse_26896']),
 'S2.bld.fire_tower_28440': dict(
  long='磚砌的高臺上一座小亭，一道木梯從西邊攀上臺頂。照《東京夢華錄》，京城的望火樓樓上該有人瞭望，樓下駐著兵士，備著水桶、麻搭、梯子，一見火起便奔報撲救。畫中這座卻空無一人，余輝說臺上原本的高柱被截去大半，改成了供人歇息的涼亭，樓下兩排營房也做了飯鋪。他把這裏讀作「虛設的望火樓」。',
  quote='於高處磚砌望火樓，樓上有人卓望。', quoteSrc='《東京夢華錄》卷三〈防火〉',
  cite='《東京夢華錄》・余輝〈十大看點〉〈最後三問〉・畫中所見',
  longSrc=['map S2.str.fire_tower_platform_28450 (brick platform, wooden stair from the west, nobody on it); S2.bld.fire_tower_28440 (nobody in it)',
           'DJ 卷三 防火: 下有官屋数间，屯驻军兵…救火家事，谓如大小桶、洒子、麻搭、斧锯、梯子…每遇有遗火去处，则有马军奔报',
           'YH21: 砖台上原本立了四个高高的柱子…眼下四根木柱被截去大半，支撑的却是凉亭…其下的两排营房变成了饭铺', 'YH15 看点二 虚设的望火楼'],
  crop=['S2.bld.fire_tower_28440', 'S2.str.fire_tower_platform_28450']),
 'S2.bld.wanglou_shed_28660': dict(
  long='望火樓下一長排草頂棚屋，柱子底下擺滿桌凳，坐著吃喝的客人。余輝以為，這本是望火樓下兵營式的平房，如今改成了飯館。這一帶正是城鄉交界，碼頭對著一條沿河小街，店鋪多賣小吃。故宮名畫記寫街口一景：兩個過路客人卸下驢背上的行李歇腳，店主坐在涼棚下休息，大家的目光都被鄰家小孩的哭聲引了過去。',
  cite='余輝〈十大看點〉・故宮名畫記・畫中所見',
  longSrc=['map S2.bld.wanglou_shed_28660: long open eating shed under thatch, tables, benches, seated customers', 'YH15 看点二: 望火楼下两排兵营式的平房已被改作饭馆',
           'MHJ 10 城乡交界处: 沿河街…主要店铺是餐馆，以小吃为多…两个过路的客人正在歇脚，行李也从驴身上卸下来…店主坐在凉棚底下歇息…被邻居家小孩的哭声所吸引'],
  crop=['S2.bld.wanglou_shed_28660']),
 # ---- S3 bridge
 'S3.str.rainbow_bridge': dict(
  long='這座橋沒有一根橋柱，用大木一根根交錯穿插，架成一道拱，橫跨汴河。汴河水勢暴漲暴落，有柱的橋年年被沖壞；無柱的木拱不受激流衝擊，經久不壞。據《澠水燕談錄》，這種「飛橋」最早是青州一名牢城廢卒想出來的，後來汴河上都照樣建造，俗稱虹橋。明清的仿本把它畫成了石拱橋，故宮說這段原畫對研究宋代橋樑異常珍貴。',
  quote='其橋無柱，皆以巨木虛架，飾以丹雘，宛如飛虹。', quoteSrc='《東京夢華錄》卷一〈河道〉',
  cite='《東京夢華錄》・《澠水燕談錄》・故宮名畫記',
  longSrc=['map S3.str.rainbow_bridge: single-span arched timber bridge with no piers, woven-beam arch (编木拱)', 'MHJ 18: 汴河的水暴涨暴落，几乎年年都会毁坏桥梁…没有桥柱，不直接受到激流冲击，所以坚固耐用…明清…仿本…画成了石拱桥; 异常珍贵',
           'MS 卷八: 会得牢城废卒，有智思…架为飞桥，无柱…至今沿汴皆飞桥…俗曰虹桥', 'quote: DJ 卷一 河道'],
  crop=['S3.str.rainbow_bridge']),
 'S3.bld.tavern_gate_16870': dict(
  long='橋頭的酒店，門前燈箱正面寫「腳店」，側面寫「十千」，合起來便是「十千腳店」。按《東京夢華錄》，京城正店之外的酒家都叫腳店，多向正店打酒來賣。這家腳店門樓頂上也搭起高聳的彩樓歡門，樓上坐著飲酒的客人，門外拴著一匹備了鞍的馬。門前一輛串車正在裝貨，故宮名畫記說貨物像一串串銅錢；余輝卻說車上蓋的是一面遭廢的草書屏風。',
  quote='其正酒店戶，見腳店三兩次打酒，便敢借與三五百兩銀器。', quoteSrc='《東京夢華錄》卷五〈民俗〉',
  cite='《東京夢華錄》・故宮名畫記・余輝〈十大看點〉・畫中所見',
  longSrc=['map S3.prop.lamp_box_jiaodian_17035: front face 腳店, east side face 十千', 'DJ 卷二 酒楼: 在京正店七十二户…其余皆谓之脚店; DJ 卷五 民俗 (脚店…打酒 from the 正店)',
           'map S3.str.cailou_huanmen_16880 on the gate roof; S3.grp.shiqian_jiaodian_16800 drinkers upstairs; S3.ani.horse_17222 saddled horse without rider',
           'MHJ 24 串车: 两人正从店内往车上装载货物…看上去像一串串铜钱', 'YH15 看点六: 车夫们将被废黜的旧党书写的大字屏风当作苫布…装上串车 (two such carts; SEC §3: the other stands at 十千脚店)'],
  cropBox=[16650, 1200, 17550, 1800], crop=['S3.bld.tavern_gate_16870', 'S3.str.cailou_huanmen_16880']),
 'S3.prop.xinjiu_flagpole_17630': dict(
  long='腳店前立著一根高桿，桿頂有隻鳥形的風標，橫桿上垂下一面長旗，寫著「新酒」。故宮名畫記說，宋代酒稅收入極高，官府對酒實行專賣；「新酒」特指中秋前後開賣的酒，開賣時還要舉行隆重的迎酒儀式。也正因如此，孔憲易拿這面旗作證，說畫的是秋天。汴河岸邊另有一面「小酒」旗，可見當時飲酒風氣之盛。',
  quote='中秋節前，諸店皆賣新酒，重新結絡門面彩樓花頭。', quoteSrc='《東京夢華錄》卷八〈中秋〉',
  cite='故宮名畫記・《東京夢華錄》・孔憲易',
  longSrc=['map S3.prop.xinjiu_flagpole_17630: tall pole, bird-shaped wind vane, bar to the 彩楼 scaffold, banner 新酒', 'MHJ 23: 宋朝酒税收入很高…官方对酒进行专卖…"新酒"特指在中秋节前后开始售卖的酒…隆重的迎酒仪式…"小酒"和"新酒"…可见当时饮酒的风气之盛',
           'SEC §1.3: 孔宪易 cites the 新酒 flags', 'MHJ 12 喝杯小酒 (S2, u 27320)', 'quote: DJ 卷八 中秋'],
  cropBox=[17120, 700, 17840, 1180], crop=['S3.prop.xinjiu_flagpole_17630']),
 # ---- S4 outer road
 'S4.bld.temple_gate_hall_9960': dict(
  long='路北一座寺院，山門緊閉，門扇上一排排門釘，兩側木欄後坐著天王塑像。一位穿袈裟的僧人正從旁邊的小門走進寺裏。故宮名畫記說，山門簷下有斗拱，似乎還掛著匾額，可見這座寺院等級不低；余輝則留意到，匾上的寺名只用幾點帶過，和城門一樣，畫家有意不寫明是哪一處。汴京有名的寺院，有大相國寺、開寶寺、太平興國寺。',
  quote='每日交五更，諸寺院行者打鐵牌子或木魚循門報曉。', quoteSrc='《東京夢華錄》卷三〈天曉諸人入市〉',
  cite='故宮名畫記・余輝〈最後三問〉・畫中所見',
  longSrc=['map S4.bld.temple_gate_hall_9960 (shut double door with rows of studs, statues behind lattice); S4.prop.guardian_statue_*; S4.fig.monk_side_door_10208',
           'MHJ 30: 山门紧闭…天王塑像…僧人正从旁门走入寺内…有斗拱，好像还有匾额，说明这座寺院等级较高…大相国寺、开宝寺、太平兴国寺',
           'YH21: 寺庙不写庙名…上面也是就点了几点', 'quote: DJ 卷三 天晓诸人入市'],
  crop=['S4.bld.temple_gate_hall_9960', 'S4.bld.temple_side_door_10210']),
 'S4.bld.post_gatehouse_11730': dict(
  long='一座院落，紅漆大門釘著門釘，門扇上貼著告示，土牆上插著竹簽。門外一群兵卒或坐或臥，有的抱膝打盹，有的趴在文書箱上睡著了，槍矛、旗子靠在牆邊；院裏一匹白馬也躺著。故宮以為這是傳遞公文的遞鋪，設在城門外，城門夜裏關了，官差也有處歇宿。余輝讀作「懶兵候主」：一早就該動身，差官卻遲遲不出來。韓森則說它像兵營、衙門，甚至是監獄。',
  cite='故宮名畫記・余輝〈十大看點〉・韓森・畫中所見',
  longSrc=['MHJ 29: 红门上有乳钉，张贴着布告，土围墙上扦着竹钎…或坐或卧…枪矛、旗帜…倚靠在围墙上…递铺…设置在城门外，以防夜间城门关闭后，便于官差歇息',
           'map S4.grp.courier_post_soldiers (hugging knees, asleep on a document box); S4.ani.white_horse_lying_11840', 'YH14 懒兵候主; YH15 看点五: 应在清早出行…快到晌午，差官还迟迟不出',
           'SEC §3: Hansen: barracks, yamen, "probably a jail"'],
  crop=['S4.bld.post_gatehouse_11730', 'S4.grp.courier_post_soldiers']),
 'S4.fig.fortune_teller_12232': dict(
  long='路邊一座蓆棚下，算命先生戴著黑帽坐在長桌後，一位白衣客人坐在桌頭，探身聽他推算；棚下掛著招牌「看命」「神課」，還有一塊學者讀作「決疑」。故宮名畫記說，宋人篤信陰陽五行、推步占卜，照王安石的說法，京城以此為生的人極多；有術士誇口「士大夫的命運，在我可否之間」，難怪這位先生把攤子支在官衙旁邊。',
  quote='其賣藥賣卦，皆具冠帶。', quoteSrc='《東京夢華錄》卷五〈民俗〉',
  cite='故宮名畫記・《東京夢華錄》・畫中所見',
  longSrc=['map S4.fig.fortune_teller_12232 (black cap, behind the long table), S4.fig.client_seated_12185 (white robe), signs S4.prop.sign_kanming_12266 看命, sign_shenke_12335 神課, sign_left_12207 決□ (决疑 per SEC S4)',
           'MHJ 28: 宋代流行阴阳五行、推步占卜…据王安石的说法，其从业人数可能有上万人…"士大夫的命运，在我可否之间"…把摊儿支在了官衙建筑的旁边',
           'quote: DJ 卷五 民俗'],
  crop=['S4.grp.fortune_teller_stall']),
 # ---- S4b outer road east
 'S4b.veh.palm_cart_13070': dict(
  long='路口一停一走兩輛大車，車頂鋪著厚厚的棕毛，像一座蓬鬆的草屋。這是給家眷坐的車子，《東京夢華錄》叫它「宅眷坐車子」。故宮名畫記看見走著的那輛車後門裏，一位婦人低頭撩起簾子往外望；車前一牛駕轅、一牛拉套，後面跟著提食物的僕從，騎馬戴帽的大概就是男主人，一行人也許剛從郊外掃墓回來。',
  quote='又有宅眷坐車子，與平頭車大抵相似，但棕作蓋。', quoteSrc='《東京夢華錄》卷三〈般載雜賣〉',
  cite='故宮名畫記・《東京夢華錄》・畫中所見',
  longSrc=['map S4b.veh.palm_cart_13070 (parked, unhitched), S4b.veh.palm_cart_13455 (shaft ox and lead ox)', 'MHJ 27: 一停一走两辆大棕盖车…专供家眷坐的车子…一个妇女低着头撩起门帘正往外看…一头牛驾辕，一头牛拉套…两个仆从携带着食品…应该是这家男主人…也许是从郊外扫墓回来的',
           'quote: DJ 卷三 般载杂卖'],
  crop=['S4b.veh.palm_cart_13070', 'S4b.veh.palm_cart_13455']),
 'S4b.bld.wheelwright_shed_13840': dict(
  long='小飯鋪北邊是一家修大車的鋪子，棚下堆著方木、長桿，大概是做車轅、車軸的料。一個匠人彎著腰，伏在一隻平放在地上的大車輪上幹活；故宮名畫記說他雙手握著榔頭，正在修整車輪。城門口外，牛車、棕蓋車往來不絕。余輝為這一景取名「車鋪勞作」。',
  quote='東京般載車，大者曰『太平』。', quoteSrc='《東京夢華錄》卷三〈般載雜賣〉',
  cite='故宮名畫記・余輝・畫中所見',
  longSrc=['MHJ 26: 一个小饭铺的北边，是一家大车修理店，门口堆积了许多木料，一个工人双手持着榔头，正在修整车轮', 'map S4b.fig.wheelwright_bending_13620, S4b.prop.loose_wheel_13665, S4b.prop.timber_pile_13745 (cart shafts, axles, felloe blanks?)',
           'map S4/S4b carts (ox carts, the 串车 at the gate)', 'SEC §1.2: YH14 车铺劳作', 'quote: DJ 卷三 般载杂卖'],
  crop=['S4b.bld.wheelwright_shed_13840', 'S4b.prop.loose_wheel_13665']),
 'S4b.bld.tea_house_14531': dict(
  long='路北一座敞開的廳堂，前頭搭著蓆棚，棚下擺著長桌條凳。一位戴寬簷黑帽的客人探身向前，和對面一個翹著腿的白衣胖漢說話；另一位戴黑帽的，兩肘支在桌上歇著。屋上不見招牌，是不是茶鋪，還說不準；余輝為這一景取名「小鋪閒坐」。城門口外這一段，處處是這樣不慌不忙的人。',
  quote='更有提茶瓶之人，每日鄰里互相支茶，相問動靜。', quoteSrc='《東京夢華錄》卷五〈民俗〉',
  cite='余輝・《東京夢華錄》・畫中所見',
  longSrc=['map S4b.bld.tea_house_14531 (mat canopy, long tables and benches, no signboard; identification uncertain)', 'map S4b.fig.customer_hat_14462, customer_white_14560 (knee drawn up), customer_cap_14785 (forearms on the table)',
           'SEC §1.2: YH14 小铺闲坐; 余辉 (4) 城门口外真悠闲', 'quote: DJ 卷五 民俗'],
  crop=['S4b.bld.tea_house_14531']),
 # ---- S5 gate
 'S5.bld.tax_office': dict(
  long='進了城門，街北緊貼城牆的頭一家，是一座敞開的廳屋，西間掛著一桿大秤，中間官員坐在長案後正要落筆。故宮名畫記說「有的研究者認為這是稅務所」：案上的紙卷或是「引子」，即商貨的通行憑證，沒有引子，稅就收得格外重。門外貨包堆著，貨主指著貨物和稅吏爭論，連城樓上的人也探頭張望。余輝更讀出一層意思：城門內頭一家本該是城防機關，如今卻改成了收稅的地方。',
  cite='故宮名畫記・余輝〈十大看點〉〈最後三問〉・畫中所見',
  longSrc=['map S5.bld.tax_office: open hall, frame scale in the west bay, official at a long desk', 'MHJ 35: 在街北紧贴城墙的第一家…有的研究者认为这是税务所…"引子"…若没有这个"引子"，交税时税率就特别重…货主…手指货物与他说话…连城楼上值班的人也探出头来张望',
           'YH21: 按理说城门内的第一个建筑应该是城防机关…进城的第一家却是场务，也就是税务所'],
  crop=['S5.bld.tax_office']),
 'S5.bld.wine_depot': dict(
  long='孫羊正店東邊一間臨街的屋子，地上排著打了鐵箍的大木桶，正是《東京夢華錄》說的「梢桶」，正店用它裝酒。桶上擱著水桶，一根滅火的麻搭橫在上面。余輝認出這本是防火的軍巡鋪屋，該存水的地方卻放滿了酒桶；屋裏的弓手有的拉弓試弦，有的綁護腕、繫護腰，準備押運禁軍的酒。故宮只說屋裏的人像在準備出發，韓森則以為這是賣弓箭的鋪子。這裏從余輝之說。',
  quote='每坊巷三百步許，有軍巡鋪屋一所。', quoteSrc='《東京夢華錄》卷三〈防火〉',
  cite='余輝〈十大看點〉〈最後三問〉・《東京夢華錄》・故宮名畫記・韓森',
  longSrc=['map S5.bld.wine_depot, S5.prop.casks_5665, casks_west_5525 (hooped casks, buckets on top, the 麻搭 across)', 'DJ 卷三 般载杂卖: 酒正店多以此载酒梢桶矣。梢桶如长水桶',
           'YH21: 军巡铺…这些桶本来储存的是消防用水…变成了军酒转运站…麻搭', 'YH15 看点九: 拉满弓试弦…系护腰…缠护腕; 奉命前来"正店"武力押送军酒',
           'MHJ 37: 仿佛是在进行出发前的准备工作', 'SEC §3: Hansen/Columbia: a bow-and-barrel or archery shop', 'quote: DJ 卷三 防火'],
  crop=['S5.bld.wine_depot', 'S5.prop.casks_5665']),
 'S5.str.gate_tower': dict(
  long='這是全卷最大的建築：廡殿頂，重重斗拱把屋簷挑得老遠，故宮說它有「大鵬展翅」的氣勢。樓內看得見一副鼓架，架著一面大鼓，余輝為這一景取名「城上暮鼓」。門額上只寫一個「門」字，城名用幾點帶過，余輝以為畫家有意不點明。樓門口獨立一人，余輝說是更夫，正低頭看稅務所前的爭吵；韓森卻說他是遊人，因為他望著城裏，不像守衛那樣望著城外。',
  cite='故宮名畫記・余輝・韓森',
  longSrc=['MHJ 33: 最大的建筑物…庑殿顶，多重硕大的斗拱将屋檐外挑，使整个屋顶有大鹏展翅的动感…楼内明显可见一个鼓架，上面装置了一个大鼓', 'SEC §1.2: YH14 城上暮鼓',
           'YH21: 牌匾上面就写了一个"门"字，"门"的前面就点了几点，这说明画家有意要回避画具体的城门', 'YH15 看点八: 惊动了城楼上的更夫向下张望',
           'SEC §3: Hansen: "a tourist, he gazes at the people inside the wall, not outside, where a guard would look"'],
  crop=['S5.str.gate_tower']),
 'S5.str.moat_bridge': dict(
  long='護城河上一座平平的木橋，兩側有木欄，欄邊擠滿了看水的人，有的倚欄看春水游魚，有的背過身來閒談。兩個小乞兒伸著手向遊人討錢，故宮名畫記寫得仔細：有人裝作沒聽見，有人怕掃了雅興，給一文錢打發他們走。戴頭巾的讀書人和穿短衣的苦力在同一道橋欄邊並肩，韓森說這座橋是各色人等的一幅群像。',
  cite='故宮名畫記・邵琦・韓森・畫中所見',
  longSrc=['map S5.str.moat_bridge: flat timber bridge, plank railings, sightseers lean on both railings', 'SEC §3: 邵琦 有不少人在桥栏杆边观鱼; YH15 看点三: 清明节人们喜欢到河上观赏春水和游鱼',
           'MHJ 32: 两个乞儿…其中两个人任凭…只装作没听见。另外两个也许怕乞儿破坏他们看风景的雅兴，伸出手给了他一文钱', 'SEC §3: Literati in kerchiefs and labourers…; Hansen "a tableau of different social groups"'],
  crop=['S5.str.moat_bridge']),
 # ---- S6 inner city
 'S6.bld.sunyang_zhengdian': dict(
  long='這是畫中最氣派的酒樓。臨街搭起高大的彩樓歡門，綴滿花枝；門前燈箱寫著「正店」「香醪」，另一隻只認得一個「孫」字。樓上窗裏坐滿了飲酒的客人。余輝說，「正店」是官府授權釀酒的酒店，其餘的小酒家叫「腳店」，多向正店打酒來賣。門口還立著葫蘆形的紅燈，故宮名畫記說叫「梔子燈」，到了宋代成了酒店有妓女陪酒的標記。',
  quote='在京正店七十二戶，此外不能遍數，其餘皆謂之腳店。', quoteSrc='《東京夢華錄》卷二〈酒樓〉',
  cite='故宮名畫記・余輝〈十大看點〉・《東京夢華錄》・畫中所見',
  longSrc=['MHJ 36: 彩楼欢门上缀满了绣球、花枝…三个地灯上写着"香醪"、"正店"，另一个可以看见一个"孙"字…店内顾客盈门', 'map S6.prop.lampbox_zhengdian_4515, lampbox_xiang_5160 (香□), lampbox_sun_4665 (孫□)',
           'YH15 看点九: 画中的"正店"是政府授权酿造美酒的酒店; DJ 卷二 酒楼 (脚店); DJ 卷五 民俗 (脚店打酒)', 'map S6.prop.gardenia_lamp_* (reddish gourd-shaped lamps); MHJ 38: 栀子灯…到了宋朝变成酒店有妓女卖欢的标志',
           'quote: DJ 卷二 酒楼'],
  cropBox=[4380, 250, 5580, 1050], crop=['S6.bld.sunyang_zhengdian', 'S6.str.cailou_huanmen_4430']),
 'S6.bld.butcher_shop_sun': dict(
  long='街角的肉鋪掛著一面白布長幌，寫著「孫羊店」。余輝讀作孫記正店開的羊肉分號：簷下掛著羊肺、羊腸、羊肝、羊肚，價牌上寫著「□斤六十足」。這個「足」字，是說店家要足數的錢，不收打了折扣的「省陌」。也有人把案上掛的讀作一扇豬肉。故宮名畫記又說，門口板凳上坐著個胖老闆，讓人想起《水滸傳》裏的「鎮關西」鄭屠。',
  quote='都市錢陌，官用七十七，街市通用七十五，魚肉菜七十二陌。', quoteSrc='《東京夢華錄》卷三〈都市錢陌〉',
  cite='余輝《清明上河圖深度游》・故宮名畫記・《東京夢華錄》',
  longSrc=['map S6.bld.butcher_shop_sun: the long white flag 孫羊店', 'YH23: 孙记正店外高悬着"孙羊店"的幌子…该店的分部——羊肉铺…羊肺，还有羊肠、羊肝、羊肚…价格牌："□斤六十足"，这个"足"字，表明了店家不收"省陌"的钱贯',
           'map (S6 tile reading): a side of pork (disputed; vignettes V6.6)', 'MHJ 40: 另一人则坐在门首板凳上，身体肥胖，应是老板…"镇关西郑屠夫"', 'quote: DJ 卷三 都市钱陌 (short strings: the 省陌 the 足 refuses)'],
  crop=['S6.bld.butcher_shop_sun']),
 'S6.fig.storyteller_3822': dict(
  long='肉鋪門前，一圈人圍著一位大鬍子說書人。他面朝外，聽眾大多背對著我們，聽得入神。余輝說這是全卷唯一一處公開的表演，圍聽的有僧人、道士、讀書人，也有婦人孩子。故宮名畫記說，城市興起了廣大的市民，北宋的娛樂業跟著興盛，雜劇、唱曲、傀儡戲、講史、小說樣樣都有，還出了不少名角。',
  quote='霍四究，說《三分》。尹常賣，《五代史》。', quoteSrc='《東京夢華錄》卷五〈京瓦伎藝〉',
  cite='余輝《清明上河圖深度游》・故宮名畫記・《東京夢華錄》・畫中所見',
  longSrc=['map S6.fig.storyteller_3822 (bearded, facing out), S6.grp.storyteller_ring (most listeners turn their backs to us)', 'YH23 (vignettes V6.5): the scroll\'s only public show; monks, Taoists, scholars, women and children among the listeners',
           'MHJ 39: 出现了广泛的市民阶层…北宋的娱乐业非常兴盛，有杂剧、唱曲、杂耍、傀儡戏、舞蹈、讲史、小说等等，而且有许多名角', 'quote: DJ 卷五 京瓦伎艺'],
  crop=['S6.grp.storyteller_ring']),
 'S6.bld.inn_wang_yuanwai': dict(
  long='街南一座兩層的客店，路邊招牌頂上兩個小字「久住」並排，下面寫著「王員外家」。故宮名畫記說，「久住」有老字號、靠得住的意思，是招徠客人的話。樓上窗裏，一位客人伏案讀書，牆上掛著字幅，桌上擺著文房用具，余輝稱這一景為「士子苦讀」。每逢科舉之年，京城住滿了進京赴考的士人；客店不但住人，也存放貨物，不少買賣就在店裏說合。',
  cite='故宮名畫記・余輝・畫中所見',
  longSrc=['map S6.prop.sign_inn_wang_3272: 久住 (two small characters side by side) over 王員外家', 'map S6.bld.inn_wang_yuanwai: two storeys, south side of the street; a scholar reading at a desk upstairs',
           'MHJ 42: "久住"含有"老店"、"老字号"之意…墙上还挂着书法艺术品，桌子上陈设着文房用具…旅店不仅用来招待客人住宿，还可堆积商品，很多买卖也在这里说和', 'MHJ 44: 每逢科举考试，汴京城里就住满了各地进京赶考的人', 'SEC: 余辉 士子苦读'],
  cropBox=[3180, 1200, 4080, 1800], crop=['S6.bld.inn_wang_yuanwai', 'S6.prop.sign_inn_wang_3272']),
 'S6.bld.incense_shop_liu': dict(
  long='十字路口斜對角是一家香鋪，門前招牌寫著「劉家上色沉檀揀香」：上等的沉香、檀香，都是揀選過的好貨。招牌最末一字被行人的帽子擋住，學者讀作「香」。故宮名畫記說，香料在宋朝的進口貨裏佔了不小的份量，海外貿易甚至被稱為「香料貿易」；香料成了茶、鹽、礬之外，替官府賺取巨利的大宗貨物，買賣也受官府管制。',
  cite='故宮名畫記・畫中所見',
  longSrc=['map S6.bld.incense_shop_liu: signboard 劉家上色沉檀揀□ (last character hidden behind a hat; 香 by scholarship)', 'map S6.prop.signboard_liu_incense_3147',
           'MHJ 41: 街道的对角是家香铺…香料在宋朝的进口货物中，占了相当的比例。所以宋朝的海外贸易又称为"香料贸易"…成了茶、盐、矾之外，为政府获得巨额利润的大宗商品。它的销售也受官府的控制'],
  crop=['S6.bld.incense_shop_liu', 'S6.prop.signboard_liu_incense_3147']),
 'S6.fig.jie_old_man_2138': dict(
  long='十字街西南角，一塊招牌斜倚簷下，上面掛著一個「解」字，竹棚裏一群穿儒生衣冠的年輕人，圍著一位老者或坐或立。這個「解」字怎麼讀，說法不一：故宮以為科舉與「解」字關係密切，這是替舉子辦理應考手續的地方，年輕人是來打聽考試消息的；余輝讀作算命鋪，舉子們在考前求問前程，並把這裏列為結尾「三問」中的問命；香港的教材則說它是當鋪。這裏取故宮之說。',
  cite='故宮名畫記・余輝〈最後三問〉・畫中所見',
  longSrc=['map S6.prop.jie_signboard_2085 (tall signboard leaning against the eave, plaque 解); S6.grp.jie_ring (young men in a ring round a seated man; a hooded old man)',
           'MHJ 45: 十字街的西南角…"解"字招牌…有专家认为这是一家为举人办理各种应考手续的机构…一身儒生的打扮，或坐或立…正在打探考试信息', 'YH21 问命: 画了一个算命铺，外面挂了一个"解"字招牌', 'SEC S7: Hong Kong teaching material calls it a pawnshop'],
  crop=['S6.grp.jie_ring', 'S6.prop.jie_signboard_2085']),
 'S6.str.square_well_2000': dict(
  long='十字街西頭的水井邊，幾個人正在打水：一個站在井架上拉著井繩，一個彎腰把水桶提上來，一個把滿桶扛上肩頭。井口用木樑架成「田」字，故宮名畫記說這樣可以幾個人同時打水，又說這口井並不深；余輝則說這是富人街坊的官井，井口架上橫樑，是怕人失足落井。這麼大的京城，吃水用水本是一件大事。',
  cite='故宮名畫記・余輝《清明上河圖深度游》・畫中所見',
  longSrc=['map S6.grp.square_well_drawers: one draws on the rope, one lifts a bucket out, one heaves a full bucket onto his shoulder; S6.str.square_well_2000 田-shaped cover',
           'MHJ 47: 中间有梁将井口一分为四，可供四人同时打水…这口井不太深…汴京这么大的一个城市…饮水和用水确实是一个大问题', 'vignettes V6.11 (YH23): an official well in a rich quarter, framed so nobody falls in'],
  crop=['S6.grp.square_well_drawers']),
 # ---- S7 the end
 'S7.bld.zhao_taicheng': dict(
  long='水井旁又是一家醫鋪，簷下幾塊菱形牌子寫著「趙太丞家」，故宮稱它「國醫趙太丞家」；余輝說趙太丞是侍奉過宮廷的太醫。鋪裏一位穿深色長袍的醫者伸手察看孩子，婦人抱著孩子來求醫。門前立著幾塊高大的招牌，故宮能讀全的一塊寫著「治酒所傷真方集香丸」，柱上一牌還認得出「五勞七傷」。前頭正店、腳店顧客盈門，喝傷了的人想必不少。余輝把這裏讀作結尾「三問」的問病。',
  cite='故宮名畫記・余輝〈最後三問〉・畫中所見',
  longSrc=['map S7.bld.zhao_taicheng: four lozenge-shaped tablets 趙·太·丞·家; a board on the west column 五勞七傷□□□', 'MHJ 48 国医赵太丞家: 门面里有柜台…"治酒所伤真方集香丸"…豪华的"正店"和"脚店"顾客盈门，可见当时喝酒成风，受酒伤的人也一定不少',
           'map S7.fig.doctor_dark_robe_1615, S7.fig.seated_woman_child_1535', 'YH21 问病: 这个"赵太丞"，可是一位侍奉宋廷的太医…专治"五劳七伤"'],
  crop=['S7.bld.zhao_taicheng', 'S7.prop.board_zhao_east_1775', 'S7.prop.board_zhao_west_a_1392']),
 'S7.bld.gatehouse_1240': dict(
  long='趙太丞家隔壁是一座深宅大院，門屋簷下有斗拱，門前有上馬石，看得出是官宦人家。一個外鄉人提著食盒、背著大包袱，在門前停步問路，門口的人伸手往西一指。故宮名畫記寫道：順著他指的方向望去，只見兩旁街樹相合，朦朧一片，畫卷卻在這裏戛然而止。余輝把這一幕讀作結尾「三問」的問道：畫家也在問，這個國家該往哪裏走。',
  cite='故宮名畫記・余輝〈最後三問〉・畫中所見',
  longSrc=['MHJ 49: 门屋檐下的斗拱和门前的上马石，都显示出这是一户官宦人家…手提着食盒，肩上背着一个大包袱…看门人很热心给他指路…两侧街树相合，朦胧一片，画卷却在这里戛然而止',
           'map S7.fig.visitor_food_box_1308, S7.fig.pointing_man_1370 (points west)', 'YH21 问道: 画家也表达了他希望能够有一条救治国家的道路'],
  cropBox=[830, 430, 1640, 970], crop=['S7.bld.gatehouse_1240', 'S7.fig.visitor_food_box_1308']),
}

ABOUT = ("Place names the player is told (ink UI round, gen/ui/STYLE.md 'Place notifications'). region: the large banner shown when you walk into this section's region (sections sharing a region id show it once). landmarks: a vertical name plaque stands over the map entity id as you approach (江南百景圖's plaques), and a toast with the line from the painting's reading when you come within r metres of its footprint (or its point); top: the plaque's height when the map has none. Every name and line in 繁體, from the painting and its readings; src says where. "
         "Lore (round 2, gen/ui/r2_lore.md): long is the longer description under the toast's fold and in the 圖志 journal; quote and quoteSrc an exact line from a period or scholarly source; cite the sources as the player reads them; longSrc one note per claim (never shown); crop the map IDs that frame the painting's crop (tools/place_crops.mjs). "
         "Bundled for the page by tools/ui_data.mjs into web/public/assets/ui/places.json (short) and lore.json (long, fetched when needed).")

KEYS = ['long', 'quote', 'quoteSrc', 'cite', 'longSrc', 'crop', 'cropBox']
used = set()
for folder in sorted(os.listdir(os.path.join(ROOT, 'sections'))):
    p = os.path.join(ROOT, 'sections', folder, 'places.json')
    if not os.path.exists(p):
        continue
    d = json.load(open(p, encoding='utf-8'))
    d['about'] = ABOUT
    if folder in REGIONS:
        r = d['region']
        for k in KEYS:
            r.pop(k, None)
        r.update({k: v for k, v in REGIONS[folder].items()})
    for m in d.get('landmarks', []):
        if m['id'] in LM:
            used.add(m['id'])
            for k in KEYS:
                m.pop(k, None)
            m.update(LM[m['id']])
    open(p, 'w', encoding='utf-8').write(json.dumps(d, indent=1, ensure_ascii=False) + '\n')
    print('wrote', p)
missing = set(LM) - used
print('unused lore ids:', missing or 'none')
