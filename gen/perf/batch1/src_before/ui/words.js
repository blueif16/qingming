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
  helpAria: 'Controls (?)',
  helpLead: { desktop: ['點一下畫面，便可行走。', 'click the street to walk'], touch: ['雙手拇指，一走一看。', 'two thumbs: walk and look'] },
  // [keys, 繁體, English gloss]
  helpDesktop: [
    [['W', 'A', 'S', 'D'], '行走', 'walk'],
    [['Shift'], '疾行', 'run'],
    [['滑鼠'], '環顧', 'look'],
    [['滾輪'], '遠近', 'zoom'],
    [['V'], '視角', 'first / third person'],
    [['E'], '搭話', 'talk'],
    [['Space'], '展卷', 'the painting'],
    [['M'], '聲音', 'sound'],
    [['Esc'], '放開滑鼠', 'release the mouse'],
    [['?'], '說明', 'this help'],
  ],
  helpTouch: [
    [['左手'], '拖動行走', 'left thumb: walk'],
    [['右手'], '拖動環顧', 'right thumb: look'],
    [['icon:scroll'], '展卷', 'the painting'],
    [['icon:seal'], '搭話', 'talk'],
    [['icon:bell'], '聲音', 'sound'],
  ],
  credit: 'Sound effects: ElevenLabs',
  hud: {
    hintDesktop: ['空白鍵或 Esc 回到街上 · H 調校面板', 'Space or Esc · back to the street · H · the settings panel'],
    hintTouch: ['點方框，看是誰', 'tap a box to see who it is'],
    credit: '故宮博物院藏 · 圖 Wikimedia Commons',
  },
};
