#!/usr/bin/env node
// The ink UI's data (gen/ui/STYLE.md): every section's places.json (region banner, landmark toasts, and since round 2
// the lore: long descriptions, quotes, sources) and talk.json (near conversations), checked and bundled for the page.
//   node tools/ui_data.mjs check    the checks only (exit 1 on any FAIL)
//   node tools/ui_data.mjs build    checks, then writes web/public/assets/ui/places.json (what the page loads at once:
//                                   names, short lines, positions), lore.json (fetched only when a toast unfolds or the
//                                   圖志 journal opens: long texts, quotes, sources, crops, the colophon leaf), talk.json,
//                                   and the glyph lists web/src/ui/strings.txt (first load) and gen/ui/lore/strings_lore.txt
// Checks: every landmark is a map entity or figure of its section's layout.json and has strokes on the scan; every talk
// role is a painted figure placed by people.json; every beat has a speaker, a line and its reading (src); lines stay
// short; nothing is in simplified characters; no Arabic digits in anything the player reads. Lore (gen/ui/r2_lore.md):
// every landmark and every region has a long text (landmark 90-220, region 140-320 characters), a cite and one source
// note per claim (longSrc); a quote has its quoteSrc; outside quotes and names the long texts use no 繁體 numerals.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanBoxes } from './scan_box.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEC = path.join(ROOT, 'sections');
const OUT = path.join(ROOT, 'web/public/assets/ui');
const mode = process.argv[2] || 'check';
const read = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);
const fails = [], notes = [];
const fail = (m) => fails.push(m);

// characters that exist only in simplified Chinese (a guard list of the common ones; 繁體 everywhere)
const SIMPLIFIED = '这们个来说为时会对过还没么样头见长东车门马鱼书话该让钱听问间关买卖贵钟铺图圆园楼桥岁乐师从众优伤体价侠侦债倾偿储儿兑党兰关兴养兽冻净减凤凭刘则刚创删别剧剑办务动劳势勋区医华协单卖卢卫却厅历压厌县参双发变叙叶号叹吓吗听启吴呜员呛响哑哗唤啸团园围困国图圣场坏块坚坛坝坞坟坠垄垒垦壮声处备复够头夹夺奋奖妇妈妆姗娄娇娱婴孙学宁宝实宠审宪宫宽宾对寻导寿将尔尘尝层属岁岂岗岚岛峡币帅师帐带帮库应庙庞废开异弃张弥弯弹强归当录彦彻径徕忆忧怀态怜总恋恒恳恶恼悦惊惧惩惫惭惯愤愿戏战户扑执扩扫扬扰抚抛抢护报担拟拢拣拥拦拨择挂挚挛挡挤挥损捡换据掳掷揽搀搁搂携摄摆摇摊撑撵擞攒敌敛数斋斩断无旧时旷昼显晋晒晓晕暂术机杀杂权杆条来杨极构枣枪柜标栈栋栏树样桥档梦检楼横欢欧歼殴毁毕毙气汇汉汤沟没沪泞泪泼泽洁洒浅浆浇浊测济浏浑浓涂涛涝涧涨润涩渊渐渔渗温湾湿溃溅滚满滤滥滨滩滞潇潜澜灭灯灵灾灿炉点炼烁烂烛烟烦烧烫热焕爱爷牵牺犹狈独狭狮狱猎猪猫献玛环现玺珐琐瑶电画畅疗疮疯痒痪痫瘫皑皱盏盐监盖盘眦着睁矫码砖础硕确碍礼祷祸离秃种积称秽稳穷窃窍窑窜窝竖竞笔笼筑筛筝签简箩篮篱类粮紧纠红纤约级纪纫纬纯纱纲纳纵纷纸纹纺线练组细织终绊绍绎经绑结绕绘给络绝绞统绢绣继绩绪续绰绳维绵绷绸综绽绿缀缆缓编缘缚缝缠缤缩缴网罗罚罢羡翘耸耻聂聋职联聪肃肠肤肿胀胁胆胜胧脉脏脐脑脓脚脱脸腊腻腾舆舰舱艰艳艺节芜苇苍苏苹茎茧荐荡荣药莱莲获莹营萝萤萧蓝蔼蕴虏虑虚虫虽虾蚀蚁蚂蛮蜡蝇蝉衅补衬袄袜袭装裤览觉触誉计订认讥讨让训议讯记讲讳讶许论讼设访诀证评识诈诉诊词译试诗诚话诞询该详诫语误诱说请诸诺读课谁调谅谈谊谋谎谐谓谜谢谣谦谨谱贝贞负贡财责贤败账货质贩贪贫贬购贮贯贱贴贷贸费贺贼贾资赋赌赏赐赔赖赚赛赞赠赵赶趋跃践踊踪蹿躏轨轩转轮软轰轴轻载较辅辆辈辉辑输辖边辽达迁过迈运还这进远违连迟适选逊递逻遗邓邮邻郑酱酿释针钓钙钝钞钢钥钦钧钩钱钳钻铁铃铅铜铭银铸链销锁锄锅锈锋锐错锡锣锤锦键锯镇镜长闪闭问闯闲间闷闸闹闺闻阀阁阅队阳阴阵阶际陆陈陕险随隐隶难雇雾霁静页顶项顺须顽顾顿颁颂预领颇颈频颓颖颗题颜额颠风飘飞饥饭饮饰饱饲饶饺饼馆馋驭驰驱驳驴驶驻驼驾骂骄骆验骑骗骚骤髅鬓鱼鲁鲜鸟鸡鸣鸭鸽鹅鹤鹰麦黄齐齿龄龙龟';
const SIMPLE = new Set([...SIMPLIFIED]);
const shown = new Set(); // every glyph the player can read at first load
const loreShown = new Set(); // the glyphs only the lore shows (unfolded toasts, the journal): the lazily fetched subset
const look = (where, s, max, into = shown) => {
  if (typeof s !== 'string' || !s.trim()) { fail(`${where}: empty`); return; }
  const bad = [...s].filter((c) => SIMPLE.has(c));
  if (bad.length) fail(`${where}: simplified characters ${[...new Set(bad)].join('')} in 「${s}」`);
  if (/[0-9]/.test(s)) fail(`${where}: Arabic digits in 「${s}」 (no numbers on screen)`);
  const n = [...s.replace(/[，。、？！：；「」『』（）—…\s]/g, '')].length;
  if (max && n > max) fail(`${where}: 「${s}」 is ${n} characters (at most ${max})`);
  for (const c of s) into.add(c);
};
// lore prose: a length range (every visible character but spaces), and 繁體 numerals only inside a quote or a name
const NAMES_WITH_NUMERALS = ['十字', '五行', '十千'];
const lookLong = (where, s, [min, max], { numerals = false } = {}) => {
  look(where, s, 0, loreShown);
  if (typeof s !== 'string') return;
  const n = [...s.replace(/\s/g, '')].length;
  if (n < min || n > max) fail(`${where}: ${n} characters (want ${min}-${max})`);
  if (!numerals) {
    let bare = s.replace(/「[^」]*」|『[^』]*』|《[^》]*》|〈[^〉]*〉/g, '');
    for (const w of NAMES_WITH_NUMERALS) bare = bare.split(w).join('');
    const num = bare.match(/[三四五六七八九十百千萬億]/g);
    if (num) fail(`${where}: numerals ${[...new Set(num)].join('')} outside a quote or a name (no numbers on screen)`);
  }
};
const lookSrc = (where, list) => {
  if (!Array.isArray(list) || !list.length || list.some((x) => typeof x !== 'string' || !x.trim())) fail(`${where}: longSrc must list one source note per claim`);
};

const sections = fs.readdirSync(SEC).filter((d) => fs.existsSync(path.join(SEC, d, 'layout.json')));
const scanIndex = read(path.join(ROOT, 'web/public/assets/scroll/sections.json'));
const areaOf = new Map((scanIndex?.sections || []).map((s) => [s.folder, s.area]));
const box = scanBoxes(ROOT);
const places = { about: 'Built by tools/ui_data.mjs from sections/*/places.json; do not edit. u, v: the landmark on the scan (scroll HUD marks).', regions: {}, landmarks: [] };
const lore = { about: 'Built by tools/ui_data.mjs from sections/*/places.json and gen/ui/lore/colophons.json; do not edit. Fetched by the page only when a toast unfolds or the 圖志 journal opens.', regions: {}, landmarks: {}, colophons: null };
const talk = { about: 'Built by tools/ui_data.mjs from sections/*/talk.json; do not edit.', scenes: [] };
const regionNames = new Map();
const loreOf = (o) => ({ long: o.long, ...(o.quote ? { quote: o.quote, quoteSrc: o.quoteSrc } : {}), cite: o.cite });

for (const name of sections) {
  const L = read(path.join(SEC, name, 'layout.json'));
  const P = read(path.join(SEC, name, 'people.json')) || {};
  const pl = read(path.join(SEC, name, 'places.json'));
  const tk = read(path.join(SEC, name, 'talk.json'));
  const figs = new Map((L.figures || []).map((f) => [f.id, f]));
  // a map ID or a figure slug -> { X, D, H, poly }
  const where = (id) => {
    const e = L.entities?.[id];
    if (e?.pos) {
      // where its plaque hangs: over its highest measured point (eaves, a tower's top) plus the roof above it, else a
      // height for its kind (places.json "top" overrides)
      const hs = Object.values(e.heights || {}), H = e.H || 0;
      const top = hs.length ? Math.max(...hs) + 2.5 : H + ({ building: 6, structure: 4, vehicle: 3.6, prop: 4, grd: 2.5 }[e.kind] ?? 4);
      return { X: e.pos[0], D: e.pos[1], H, top, poly: e.footprint || null };
    }
    const slug = id.split('.').slice(2).join('.');
    const f = figs.get(slug) || figs.get(id);
    if (f) { const [nx, nd] = P.figures?.[f.id]?.nudge || [0, 0]; return { X: f.X + nx, D: f.D + nd, H: f.H || 0, top: (f.H || 0) + 3.4, poly: null }; }
    return null;
  };
  if (!pl) notes.push(`${name}: no places.json`);
  else {
    const r = pl.region;
    if (!r?.id) fail(`${name}/places.json: no region id`);
    else {
      look(`${name} region name`, r.name, 6); look(`${name} region sub`, r.sub, 8); look(`${name} region seal`, r.seal, 1);
      if (!r.src) fail(`${name} region: no src`);
      const prev = regionNames.get(r.id);
      if (prev && prev !== r.name) fail(`region ${r.id}: two names (${prev}, ${r.name})`);
      regionNames.set(r.id, r.name);
      places.regions[name] = { id: r.id, name: r.name, sub: r.sub, seal: r.seal };
      // the region's lore: written once per region id (in any of its sections)
      const lr = (lore.regions[r.id] ??= { name: r.name, sub: r.sub, seal: r.seal, folders: [], area: null });
      lr.folders.push(name);
      const a = areaOf.get(name);
      if (a) lr.area = lr.area ? [Math.min(lr.area[0], a[0]), Math.max(lr.area[1], a[1])] : [...a];
      else notes.push(`${name}: no scan area in assets/scroll/sections.json (tools/scroll_index.mjs)`);
      if (r.long) {
        if (lr.long && lr.long !== r.long) fail(`region ${r.id}: two different long texts (${lr.folders.join(', ')})`);
        lookLong(`${name} region long`, r.long, [140, 320]);
        if (r.quote) { look(`${name} region quote`, r.quote, 44, loreShown); look(`${name} region quoteSrc`, r.quoteSrc, 24, loreShown); }
        look(`${name} region cite`, r.cite, 40, loreShown);
        lookSrc(`${name} region`, r.longSrc);
        Object.assign(lr, loreOf(r));
      }
    }
    for (const m of pl.landmarks || []) {
      const at = where(m.id);
      if (!at) { fail(`${name} landmark ${m.id}: not in layout.json`); continue; }
      look(`${name} ${m.id} name`, m.name, 7); look(`${name} ${m.id} line`, m.line, 16); look(`${name} ${m.id} seal`, m.seal, 1);
      if (!m.src) fail(`${name} landmark ${m.id}: no src`);
      // on the scan: its foot (or base centre), else the bottom middle of its strokes
      const b = box([m.id]);
      if (!b) fail(`${name} landmark ${m.id}: no strokes on the scan (map/strokes)`);
      const [u, v] = b?.foot || (b ? [(b.u0 + b.u1) / 2, b.v1] : [0, 0]);
      places.landmarks.push({ id: m.id, section: name, name: m.name, line: m.line, seal: m.seal, r: m.r || 6, X: +at.X.toFixed(2), D: +at.D.toFixed(2), H: at.H, top: +(m.top ?? at.top).toFixed(2), poly: at.poly, u: Math.round(u), v: Math.round(v) });
      // lore
      lookLong(`${name} ${m.id} long`, m.long, [90, 220]);
      if (m.quote) { look(`${name} ${m.id} quote`, m.quote, 44, loreShown); look(`${name} ${m.id} quoteSrc`, m.quoteSrc, 24, loreShown); }
      look(`${name} ${m.id} cite`, m.cite, 40, loreShown);
      lookSrc(`${name} ${m.id}`, m.longSrc);
      const img = `assets/ui/places/${m.id}.webp`;
      if (!fs.existsSync(path.join(ROOT, 'web/public', img))) notes.push(`${m.id}: no crop yet (node tools/place_crops.mjs)`);
      lore.landmarks[m.id] = { ...loreOf(m), img: fs.existsSync(path.join(ROOT, 'web/public', img)) ? img : null };
    }
  }
  if (tk) {
    for (const sc of tk.scenes || []) {
      const tag = `${name} talk ${sc.id}`;
      if (!sc.reading) fail(`${tag}: no reading`);
      if (!sc.roles?.[sc.host]) fail(`${tag}: host ${sc.host} is not a role`);
      look(`${tag} title`, sc.title, 8);
      const roles = {};
      for (const [k, r] of Object.entries(sc.roles || {})) {
        const f = figs.get(r.fig);
        const spec = P.figures?.[r.fig];
        const walker = (P.walkers || []).some((w) => w.id === r.fig);
        if (!f) fail(`${tag} role ${k}: ${r.fig} is not a painted figure of ${name}`);
        else if (!spec && !walker) fail(`${tag} role ${k}: ${r.fig} is not placed by people.json`);
        if (r.name) look(`${tag} role ${k} name`, r.name, 4);
        if (!r.src) fail(`${tag} role ${k}: no src`);
        roles[k] = { fig: r.fig, name: r.name || '', carriedBy: spec?.carried_by || null };
      }
      const beats = [];
      for (const [i, b] of (sc.beats || []).entries()) {
        const text = b.say ?? b.think;
        if (!roles[b.who]) fail(`${tag} beat ${i + 1}: speaker ${b.who} is not a role`);
        look(`${tag} beat ${i + 1}`, text, 16);
        if (!b.src) fail(`${tag} beat ${i + 1}: no src (every line cites its reading)`);
        beats.push({ who: b.who, text, think: b.think != null, optional: !!b.optional });
      }
      if (beats.length < 2 || beats.length > 6) fail(`${tag}: ${beats.length} beats (2-6)`);
      const host = roles[sc.host] && where(roles[sc.host].fig);
      talk.scenes.push({ id: sc.id, section: name, title: sc.title, host: sc.host, roles, beats, X: host?.X, D: host?.D });
    }
  }
}
for (const [id, r] of Object.entries(lore.regions)) if (!r.long) fail(`region ${id} (${r.folders.join(', ')}): no long text in any of its places.json`);

// the journal's 題跋 leaf: the colophons after the painting (gen/ui/lore/colophons.json)
const col = read(path.join(ROOT, 'gen/ui/lore/colophons.json'));
if (!col) notes.push('gen/ui/lore/colophons.json missing: no 題跋 leaf');
else {
  look('colophons title', col.title, 6, loreShown);
  lookLong('colophons lead', col.lead, [20, 120]);
  if (!col.leadSrc) fail('colophons lead: no leadSrc');
  lore.colophons = { title: col.title, lead: col.lead, items: [] };
  for (const [i, it] of (col.items || []).entries()) {
    look(`colophon ${i + 1} who`, it.who, 8, loreShown);
    look(`colophon ${i + 1} text`, it.text, 60, loreShown); // a quote: numerals are the poet's
    lookLong(`colophon ${i + 1} gloss`, it.gloss, [10, 90]);
    if (!it.src) fail(`colophon ${i + 1}: no src`);
    lore.colophons.items.push({ who: it.who, text: it.text, gloss: it.gloss });
  }
}

// the UI's own fixed words (help, prompts, loading, HUD chrome, settings, time): web/src/ui/words.js and *_words.js
for (const f of fs.readdirSync(path.join(ROOT, 'web/src/ui')).filter((f) => /(^|_)words\.js$/.test(f))) {
  const words = fs.readFileSync(path.join(ROOT, 'web/src/ui', f), 'utf8');
  for (const c of words.replace(/\/\/.*$/gm, '')) if (/[　-鿿＀-￯]/.test(c)) shown.add(c);
}
for (const c of '清明上河圖') shown.add(c);
for (const c of shown) loreShown.delete(c);

for (const n of notes) console.log(`note  ${n}`);
const nLong = Object.keys(lore.landmarks).length + Object.values(lore.regions).filter((r) => r.long).length;
console.log(`places: ${Object.keys(places.regions).length} sections, ${new Set(Object.values(places.regions).map((r) => r.id)).size} regions, ${places.landmarks.length} landmarks; lore: ${nLong} long texts, ${lore.colophons?.items.length ?? 0} colophons; talk: ${talk.scenes.length} scenes, ${talk.scenes.reduce((a, s) => a + s.beats.length, 0)} beats; ${shown.size} glyphs at first load, ${loreShown.size} more in the lore`);
for (const f of fails) console.log(`FAIL  ${f}`);
if (fails.length) process.exit(1);
console.log('PASS');
if (mode === 'build') {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'places.json'), JSON.stringify(places));
  fs.writeFileSync(path.join(OUT, 'lore.json'), JSON.stringify(lore));
  fs.writeFileSync(path.join(OUT, 'talk.json'), JSON.stringify(talk));
  const list = (set) => [...set].filter((c) => c.trim()).sort().join('') + '\n';
  fs.writeFileSync(path.join(ROOT, 'web/src/ui/strings.txt'), list(shown));
  fs.mkdirSync(path.join(ROOT, 'gen/ui/lore'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'gen/ui/lore/strings_lore.txt'), list(loreShown));
  const kb = (f) => `${(fs.statSync(path.join(OUT, f)).size / 1024).toFixed(1)} KB`;
  console.log(`-> web/public/assets/ui/places.json (${kb('places.json')}), lore.json (${kb('lore.json')}), talk.json (${kb('talk.json')}), web/src/ui/strings.txt, gen/ui/lore/strings_lore.txt`);
}
