// Every fixed word the UI shows (gen/ui/STYLE.md "Language"): 繁體 first; English only as the small gloss in the
// controls help, and in title/aria text. tools/ui_data.mjs reads this file for the font subset (web/src/ui/strings.txt).
export const W = {
  title: '清明上河圖',
  loading: '展卷',
  loadingAria: '載入中',
  talk: '搭話', // the prompt beside the E keycap
  talkSeal: '談', // the seal you tap on a touch screen
  talkAria: 'Talk (E)',
  helpTitle: '說明',
  helpSeal: '說明',
  helpAria: 'Controls (H)',
  // the direct HUD (hud.js): the view tiles and the › that opens the settings screen
  view: { aria: '視角 · view (V)', first: ['第一人稱', 'first person'], third: ['第三人稱', 'third person'] },
  more: { title: '設定 · settings (O)', aria: 'Settings (O)' },
  // the landmark toast's fold and its way to the journal (places.js; lore agent). The journal's own words: journal_words.js
  // a plot line's step overheard (the life pass): the note's seal and its line under the line's title
  heard: { seal: '聞', line: '記入圖志', lineEn: 'into the journal' },
  // the painting ahead still coming in (index.js: a section near you not loaded yet; its seam holds you till it is)
  ahead: { line: '前路漸展', en: 'the way ahead is unrolling' },
  lore: { more: '詳', moreAria: 'Tap or R: more about this place', cite: '據', journal: '圖志', journalAria: 'Journal of places (J)', journalSeal: '志' },
  helpLead: { desktop: ['點一下畫面，便可行走。', 'click the street to walk'], touch: ['雙手拇指，一走一看。', 'two thumbs: walk and look'] },
  // [keys, 繁體, English gloss]
  helpDesktop: [
    [['W', 'A', 'S', 'D'], '行走', 'walk'],
    [['Shift'], '疾行', 'run'],
    [['滑鼠'], '環顧', 'look'],
    [['滾輪'], '遠近', 'zoom'],
    [['V'], '視角', 'first / third person'],
    [['E'], '搭話', 'talk'],
    [['T'], '時辰', 'the time'],
    [['Space'], '展卷', 'the painting'],
    [['J'], '圖志', 'journal of places'],
    [['O'], '設定', 'settings'],
    [['H'], '說明', 'this help'],
    [['M'], '聲音', 'sound on / off'],
    [['Esc'], '放開滑鼠', 'release the mouse'],
  ],
  helpTouch: [
    [['左手'], '拖動行走', 'left thumb: walk'],
    [['右手'], '拖動環顧', 'right thumb: look'],
    [['icon:view'], '視角', 'first / third person'],
    [['icon:scroll'], '展卷', 'the painting'],
    [['icon:seal'], '搭話', 'talk'],
    [['icon:more'], '設定', 'settings and sound'],
  ],
  credit: 'Sound effects: ElevenLabs',
  hud: {
    hintDesktop: ['空白鍵或 Esc 回到街上', 'Space or Esc · back to the street'],
    hintTune: ['空白鍵或 Esc 回到街上 · H 調校面板', 'Space or Esc · back to the street · H · the tuning panel'], // ?tune=1
    hintTouch: ['點方框，看是誰', 'tap a box to see who it is'],
    credit: '故宮博物院藏 · 圖 Wikimedia Commons',
  },
};
