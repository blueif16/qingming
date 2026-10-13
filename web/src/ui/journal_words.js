// The fixed words of the journal (journal.js, gen/ui/r2_lore.md). Kept apart from words.js on purpose: their glyphs go
// to the lazily fetched "lore" font subset (gen/ui/fonts/roles.json), so the first load does not grow. English only in
// aria and title text.
export const JW = {
  title: '圖志',
  aria: 'Journal of places (J)',
  close: 'Close (J or Esc)',
  notYet: '未至',
  regionNotYet: '此地尚未走到。',
  cite: '據',
  where: '最近到過',
  talkTab: '見聞',
  talkTitle: '路上見聞',
  talkLead: '在街上聽到的話，記在這裏。',
  talkNone: '還沒有聽人說過話。走近畫中人，聽他們說些甚麼，或按 E、輕觸談字搭話。',
  // the plot lines overheard on the street (the life pass)
  threadsTitle: '街談巷議',
  threadSeal: '聞',
  colTab: '題跋',
  strip: 'The scroll: tap a region',
  hintDesktop: ['← → 翻頁 · J 或 Esc 合上', 'arrows: turn the leaf · J or Esc: close'],
  hintTouch: ['點畫卷或上方的名字翻頁', 'tap the scroll or a name to turn the leaf'],
};
