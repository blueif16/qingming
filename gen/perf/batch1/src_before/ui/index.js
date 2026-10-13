// The ink UI on the world page (gen/ui/STYLE.md): loading/title screen, region banners and landmark toasts, near
// conversations with name tags and bubbles, the controls help, and the restyle of the page's existing chrome (sundial
// frame, bell, scroll HUD, tuning panel, stats made debug-only). world.js makes one with createUI() and calls:
//   ui.progress(f)   loading milestones (0..1)        ui.loaded()   the world is in: the paper wipes away
//   ui.frame(dt)     every drawn frame (not while the scroll HUD is open)
//   ui.regionTitle(folder)   the region's 繁體 name, for the scroll HUD's title
//   ui.test          hooks for the checks and the shots (banner, toast, talk, state)
// URL: ?stats=1 shows the debug stats line; ?ui=0 leaves out the notifications and talk (A/B; the restyle stays).
import './ui.css';
import { applyInk } from './ink.js';
import { h, helpPanel, isTouchDevice } from './components.js';
import { Loading } from './loading.js';
import { Places } from './places.js';
import { Talk } from './talk.js';
import { W } from './words.js';

const THEMES = {
  day: { paper: '#efe4cc', bubble: '#f7efdc', ink: '#2a2420' },
  night: { paper: '#e8d9b8', bubble: '#efe2c4', ink: '#2a2420' },
};
const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);

// o: { camera, player, sections() (loaded: name -> sec), current() (your section's folder), night() (0..1),
//      hudOpen(), sfx(name, gain), hud (the ScrollHud, for its chrome), query (URLSearchParams) }
export function createUI(o) {
  const html = document.documentElement, query = o.query || new URLSearchParams(location.search);
  const touch = isTouchDevice();
  const off = query.get('ui') === '0';
  if (query.get('stats') === '1') html.classList.add('qm-debug');
  if (touch) html.classList.add('qm-touch');
  let theme = 'day';
  applyInk(html, THEMES.day);
  const loading = new Loading(document.getElementById('loading'));

  const root = h('div', 'qm-ui', { id: 'qm-ui' });
  const banner = h('div', 'qm-banner-layer'), toasts = h('div', 'qm-toasts'), anchors = h('div', 'qm-anchors');
  root.append(anchors, banner, toasts);
  document.body.append(root);

  // the controls help: open at first, folded into its seal after HELP_S seconds or once you have walked a little
  const helpHost = document.getElementById('help');
  const help = helpHost ? helpPanel(helpHost, { touch, open: true }) : null;
  let helpT = 0, walked = 0, last = null;
  addEventListener('keydown', (e) => {
    if (e.repeat || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
    if (e.key === '?' || (e.code === 'Slash' && e.shiftKey)) help?.toggle();
    if (o.hudOpen()) return;
    if (e.code === 'KeyE') talk?.interact();
    if (e.code === 'Escape') talk?.close();
  });

  // the scroll HUD's chrome in 繁體 (its own words stay in scroll_hud.js; the title comes from regionTitle)
  if (o.hud?.root) {
    const hint = o.hud.root.querySelector('.sh-hint'), credit = o.hud.root.querySelector('.sh-credit');
    const [zh, en] = touch ? W.hud.hintTouch : W.hud.hintDesktop;
    if (hint) hint.replaceChildren(zh, h('span', 'qm-gloss', { text: en }));
    if (credit) credit.textContent = W.hud.credit;
  }

  let places = null, talk = null;
  const ready = Promise.all([json('assets/ui/places.json'), json('assets/ui/talk.json')]).then(([pl, tk]) => {
    if (off) return;
    const where = () => { const p = o.player.pos; return { X: p.x, D: -p.z, H: p.y }; };
    places = new Places({ layer: { banner, toasts, anchors }, data: pl, current: o.current, where, sfx: o.sfx, camera: o.camera, bvh: () => o.player.bvh });
    talk = new Talk({ layer: anchors, data: tk, sections: o.sections, player: o.player, camera: o.camera, sfx: o.sfx, touch });
  });

  let started = false, nightAcc = 0;
  const cost = { ms: 0, n: 0 }; // the UI's own script time per frame (the checks read it: test.cost())
  const ui = {
    root, places: () => places, talk: () => talk, help,
    progress: (f) => loading.progress(f),
    loaded() {
      loading.done();
      // the first banner after the paper has wiped away
      ready.then(() => setTimeout(() => { started = true; }, 900));
    },
    frame(dt) {
      if (!started) return;
      const t0 = performance.now();
      // anything the UI throws turns the UI off, never the page (as sound.js does)
      try {
        if (places) places.update(dt);
        if (talk) talk.update(dt);
      } catch (err) { console.warn('ui stopped:', err); started = false; root.hidden = true; return; }
      cost.ms += performance.now() - t0;
      cost.n++;
      // the help folds away
      if (help?.open && helpT >= 0) {
        helpT += dt;
        const p = o.player.pos;
        if (last) walked += Math.hypot(p.x - last.x, p.z - last.z);
        last = { x: p.x, z: p.z };
        if (helpT > 18 || walked > 6) { help.set(false); helpT = -1; }
      }
      // lamp-lit paper after dark
      nightAcc += dt;
      if (nightAcc > 2) {
        nightAcc = 0;
        const t = (o.night?.() ?? 0) > 0.5 ? 'night' : 'day';
        if (t !== theme) { theme = t; applyInk(html, THEMES[t]); if (t === 'night') html.dataset.night = ''; else delete html.dataset.night; }
      }
    },
    regionTitle(folder) { const r = places?.regionOf(folder); return r ? (innerWidth < 640 ? r.name : `${r.name} · ${r.sub}`) : null; },
    test: {
      ready: () => ready.then(() => !!places),
      started: () => started,
      banner: (folder) => places?.fireRegion(folder),
      toast: (id) => places?.fireLandmark(id),
      talk: (id) => { const sc = talk?.scenes.find((s) => s.id === id); return sc ? talk.start(sc) : false; },
      next: () => talk?.interact(),
      heads: (id) => talk?.headsOf(id) ?? null,
      close: () => talk?.close(),
      help: (open) => help?.set(open),
      night: (on) => { theme = on ? 'night' : 'day'; applyInk(html, THEMES[theme]); if (on) html.dataset.night = ''; else delete html.dataset.night; nightAcc = -1e9; },
      cost: (reset = false) => { const r = { msPerFrame: cost.n ? cost.ms / cost.n : 0, frames: cost.n }; if (reset) { cost.ms = 0; cost.n = 0; } return r; },
      state: () => ({ started, theme, places: places?.state() ?? null, talk: talk?.state() ?? null, help: help?.open ?? null }),
      scenes: () => talk?.scenes.map((s) => ({ id: s.id, section: s.section, host: s.roles[s.host].fig, X: s.X, D: s.D })) ?? [],
      landmarks: () => places?.lm.map((m) => ({ id: m.id, section: m.section, name: m.name, X: m.X, D: m.D, r: m.r })) ?? [],
    },
  };
  return ui;
}
