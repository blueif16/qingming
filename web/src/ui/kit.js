// The UI kit page (web/ui.html, gen/ui/STYLE.md "Kit"): every component of the ink UI on a still of the world, at
// desktop and phone sizes, by day and by night. It builds them with the same modules the world uses (components.js,
// ink.js, ui.css, loading.js, sundial.js, sound.js's bell, scroll_hud.js), and the title screen is lifted from
// world.html itself, so the kit and the game can't drift apart.
//   ui.html                         the gallery (each frame an iframe at the device's real size, scaled down)
//   ui.html?frame&scene=walk&device=phone&tod=night    one frame (scenes: title, walk, talk, help, hud)
// The stills and the heads' screen positions come from gen/ui/shots/kit_stills.mjs (web/src/ui/kit/, dev only).
import './ui.css';
import * as THREE from 'three';
import { applyInk } from './ink.js';
import { h, regionBanner, landmarkToast, plaque, speech, prompt, helpPanel } from './components.js';
import { Loading } from './loading.js';
import { TimeScroll } from './time.js';
import { PACES } from './time_words.js';
import { lightAt, localHour } from '../daylight.js';
import { Sound } from '../sound.js';
import { ScrollHud, ICON } from '../scroll_hud.js';
import stills from './kit/stills.json';

const q = new URLSearchParams(location.search);
const SCENES = {
  title: 'the loading / title screen (world.html #loading, progress stroke part-drawn)',
  walk: 'arriving in a region: the sundial in its ring, the region banner in its mist, a landmark plaque, the help folded to its seal, the bell',
  toast: 'arriving at a landmark: its toast (top right), its plaque, the interaction prompt',
  talk: 'talking: name tags, a speech bubble, a thought bubble, the interaction prompt',
  help: 'the controls help open',
  hud: 'the scroll HUD (Space) with the restyled chrome and the volume bar',
  time: 'the time instrument (晝夜卷 and its 時牌, top left) beside the three options not chosen; drag any of them (gen/ui/r2_time.md)',
};
const DEV = { desktop: [1920, 1080, 0.36], phone: [390, 844, 0.62] };

if (!q.has('frame')) gallery();
else frame().then(() => setTimeout(() => { window.__kitReady = true; }, 1200));

function gallery() {
  document.body.className = 'gallery';
  document.body.append(
    h('h1', '', { text: '清明上河圖 · 介面樣張' }),
    h('p', '', { text: 'The ink UI kit (gen/ui/STYLE.md). Every frame is this page at the device\'s real size, built by the modules the world uses. Day 10:00 and night 21:30; desktop 1920 × 1080 and phone 390 × 844 (touch layout).' }),
  );
  for (const [scene, cap] of Object.entries(SCENES)) {
    const row = h('section', 'row', {}, [h('h2', '', { text: `${scene}: ${cap}` })]);
    for (const device of ['desktop', 'phone']) for (const tod of ['day', 'night']) {
      const [w, hh, k] = DEV[device];
      const f = h('iframe', '', { src: `ui.html?frame&scene=${scene}&device=${device}&tod=${tod}`, width: w, height: hh, loading: 'lazy', title: `${scene} ${device} ${tod}` });
      f.style.transform = `scale(${k})`;
      const box = h('div', 'box');
      box.style.width = `${Math.round(w * k)}px`;
      box.style.height = `${Math.round(hh * k)}px`;
      box.append(f);
      row.append(h('figure', '', {}, [box, h('figcaption', '', { text: `${device} · ${tod}` })]));
    }
    document.body.append(row);
  }
}

async function frame() {
  const scene = q.get('scene') || 'walk', device = q.get('device') || 'desktop', tod = q.get('tod') || 'day';
  const touch = device === 'phone', night = tod === 'night', hour = night ? 21.5 : 10;
  const html = document.documentElement;
  document.body.className = 'frame';
  if (touch) html.classList.add('qm-touch');
  if (night) html.dataset.night = '';
  applyInk(html, night ? { paper: '#e8d9b8', bubble: '#efe2c4', ink: '#2a2420' } : { paper: '#efe4cc', bubble: '#f7efdc', ink: '#2a2420' });
  const still = stills[`${device}_${tod}`];
  const [places, talk] = await Promise.all(['assets/ui/places.json', 'assets/ui/talk.json'].map((u) => fetch(u).then((r) => r.json())));

  if (scene === 'title') return title();
  if (still && scene !== 'hud') document.body.append(h('img', 'still', { src: new URL(`./kit/${still.file}`, import.meta.url).href, alt: '' }));
  const root = h('div', 'qm-ui', { id: 'qm-ui' });
  const anchors = h('div', 'qm-anchors'), banner = h('div', 'qm-banner-layer'), toasts = h('div', 'qm-toasts');
  root.append(anchors, banner, toasts);
  document.body.append(root);
  const helpHost = h('div', '', { id: 'help' });
  document.body.append(helpHost);
  const dialHost = h('div', '', { id: 'dial' });
  document.body.append(dialHost);
  // the time instrument (time.js) on a stand-in for world.js's time object: one hour shared with the time scene's mocks
  const kitDate = new Date('2026-04-05T12:00'), lit = (hh) => lightAt(hh, {}, kitDate);
  const hub = {
    hour, local: false, flow: 0, fns: [],
    set(hh) { this.hour = ((hh % 24) + 24) % 24; this.local = false; this.paint(); },
    paint() { const l = lit(this.hour); for (const fn of this.fns) fn(this.hour, l); },
  };
  const dial = new TimeScroll(dialHost, { date: kitDate, time: {
    setHour: (hh) => hub.set(hh),
    setFlow: (w) => { if (w === '今') { hub.local = true; hub.hour = localHour(); } else { hub.local = false; hub.flow = PACES[w] ?? 0; } hub.paint(); },
    toLocal: () => { hub.local = true; hub.hour = localHour(); hub.paint(); },
  } });
  hub.fns.push((hh, l) => dial.set(hh, l, { local: hub.local, flow: hub.flow }));
  hub.paint();
  if (scene === 'time') {
    const M = await import('../time_mocks.js');
    document.head.append(h('style', '', { text: M.MOCK_CSS }));
    const panel = h('div', 'tmm-panel', {}, [h('h3', '', { text: M.PANEL_TITLE })]);
    for (const [mock, title, cap] of M.FIGS) { const f = h('figure'); hub.fns.push(mock(f, hub)); f.append(h('figcaption', '', {}, [h('b', '', { text: title }), cap])); panel.append(f); }
    document.body.append(panel);
    hub.paint();
  }
  const bell = new Sound({});
  bell.controls();
  const help = helpPanel(helpHost, { touch, open: scene === 'help' });
  // placed as the world places them: clamped inside the screen, its top below the sundial and toasts (talk.js place())
  const anchorAt = (el, x, y) => {
    const a = h('div', 'qm-anchor');
    a.append(el);
    anchors.append(a);
    const w = el.offsetWidth || 120;
    x = Math.min(innerWidth - w / 2 - 8, Math.max(w / 2 + 34, x));
    y = Math.min(innerHeight - 30, Math.max((touch ? 150 : 112) + (el.offsetHeight || 0), y));
    a.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  if (touch) { const b = h('button', 'sh-open', { title: 'The scroll', html: ICON.scroll }); document.body.append(b); }

  const H = still?.heads;
  if (scene === 'walk') {
    banner.append(regionBanner(places.regions.gate));
    if (H) anchorAt(plaque(places.landmarks.find((m) => m.id === 'S5.bld.tax_office')), H.official.x + 40, H.official.y + (touch ? 40 : -150));
  }
  if (scene === 'toast') {
    toasts.append(landmarkToast(places.landmarks.find((m) => m.id === 'S5.bld.tax_office')));
    if (H) {
      anchorAt(plaque(places.landmarks.find((m) => m.id === 'S5.bld.tax_office')), H.official.x + 40, H.official.y + (touch ? 40 : -150));
      anchorAt(prompt({ touch }), H.inspector.x, H.inspector.y);
    }
  }
  if (scene === 'talk' && still) {
    const sc = talk.scenes.find((s) => s.id === 'V5.1');
    const say = speech({ text: sc.beats[1].text, name: sc.roles.inspector.name, reveal: false });
    anchorAt(say.el, H.inspector.x, H.inspector.y);
    const think = speech({ text: sc.beats[3].text, think: true, name: sc.roles.gaper.name, reveal: false });
    // a phone has no room for two bubbles in a row (the world then shows only the newer): the thought goes lower here
    if (touch) anchorAt(think.el, H.owner.x - 40, H.owner.y + 150); else anchorAt(think.el, H.gaper.x, H.gaper.y);
  }
  if (scene === 'hud') {
    const pos = new THREE.Vector3(-36.4, 0, -7.3);
    const hud = new ScrollHud({ sections: new Map(), player: { pos, yaw: (84 * Math.PI) / 180 - Math.PI / 2, frozen: false }, gui: null, canvas: null });
    hud.titleFor = (S, meta) => { const r = places.regions[meta?.folder]; return r ? (innerWidth < 640 ? r.name : `${r.name} · ${r.sub}`) : null; };
    const hint = hud.root.querySelector('.sh-hint'), credit = hud.root.querySelector('.sh-credit');
    const { W } = await import('./words.js');
    const [zh, en] = touch ? W.hud.hintTouch : W.hud.hintDesktop;
    hint.replaceChildren(zh, h('span', 'qm-gloss', { text: en }));
    credit.textContent = W.hud.credit;
    bell.box.classList.add('open');
    await hud.show();
    await new Promise((r) => { const t0 = performance.now(); const k = setInterval(() => { const s = hud.stats(); if ((s.tiles > 0 && s.pending === 0) || performance.now() - t0 > 15000) { clearInterval(k); r(); } }, 200); });
  }
  await document.fonts?.ready;
}

// the title screen exactly as world.html has it: its inline style and its #loading, driven by loading.js
async function title() {
  const src = await fetch('world.html').then((r) => r.text());
  const doc = new DOMParser().parseFromString(src, 'text/html');
  const style = doc.querySelector('head style');
  if (style) document.head.append(style);
  const el = doc.getElementById('loading');
  document.body.append(document.importNode(el, true));
  const ld = new Loading(document.getElementById('loading'));
  ld.set(0.55);
  await document.fonts?.ready;
}
