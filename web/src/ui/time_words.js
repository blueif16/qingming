// The hour in words, as the scroll's people said it (gen/ui/r2_time.md). No digits anywhere.
//  - the twelve double hours (十二時辰), 子 from 23:00 to 01:00; each split into 初 (its first hour) and 正 (its
//    second); each of those into four 刻: 初刻, 一刻, 二刻, 三刻 (the Song counted a hundred 刻 a day, 14.4 minutes each;
//    we read four to a half 時辰 as the later 96-刻 count and common speech do: under a minute apart per 刻);
//  - after dark the five watches (五更) of five 點 each, drummed from 戌初 (19:00) to the end of 寅 (05:00). By day the
//    court announced the hour with seven ivory tablets (時牌), 卯 to 酉, carved and filled with gold; at night with the
//    drum and the bell (Songshi, the treatise on the calendar, chapter 70; quoted in gen/ui/r2_time.md). Comments stay
//    in English where they can: every CJK character in web/src/ui/*.js lands in the text font.
// The brush (display) glyphs drawn large here are listed in gen/ui/fonts/roles.json display.extra; the text font
// picks this file up by itself (tools/font_subset.py).
export const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
export const KE = ['初刻', '一刻', '二刻', '三刻'];
export const WATCHES = ['一更', '二更', '三更', '四更', '五更'];
export const POINTS = ['一點', '二點', '三點', '四點', '五點'];

// the pace of time (s.timeFlow, game minutes per real second); 今 is the viewer's own clock (s.localTime), not a pace
export const PACES = { 靜: 0, 緩: 1, 常: 4, 疾: 15 };
export const PACE_ORDER = ['靜', '緩', '常', '疾'];
export const paceOf = (flow, local) => {
  if (local) return '今';
  let best = '靜';
  for (const k of PACE_ORDER) if (Math.abs(PACES[k] - flow) <= Math.abs(PACES[best] - flow)) best = k;
  return flow > 0 && best === '靜' ? '緩' : best;
};

export const TW = {
  hour: '時', local: '今', back: '歸今', day: '晝', night: '夜',
  paceName: { 今: '依你的時辰', 靜: '時辰停駐', 緩: '時辰緩行', 常: '時辰常行', 疾: '時辰疾行' },
  // title / aria text: 繁體 with a small English gloss (STYLE.md §8)
  aria: '時辰 · the hour: drag the painted sky to set it',
  hint: ['← → 調時辰 · ↑ ↓ 快慢 · Home 歸今', 'arrows: the hour and its pace · Home: your own time'],
  glossLocal: 'your own time', glossSet: 'a set hour',
};

// the hour (0-24, wraps) in words
export function hourWords(hour) {
  const h = ((hour % 24) + 24) % 24;
  const index = Math.floor(((h + 1) % 24) / 2);
  const branch = BRANCHES[index];
  const half = Math.floor(h) % 2 === 1 ? '初' : '正';
  const ke = KE[Math.min(3, Math.floor((h % 1) * 4))];
  const into = (h - 19 + 24) % 24; // hours since the first watch began
  const night = h >= 19 || h < 5;
  const watch = night ? WATCHES[Math.min(4, Math.floor(into / 2))] : null;
  const point = night ? POINTS[Math.min(4, Math.floor((into % 2) / 0.4))] : null;
  return { index, branch, name: branch + TW.hour, half, ke, sub: half + ke, full: branch + half + ke, watch, point };
}
