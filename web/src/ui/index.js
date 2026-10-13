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
import { createHud } from './hud.js';
import { prefs } from './prefs.js';

const THEMES = {
  day: { paper: '#efe4cc', bubble: '#f7efdc', ink: '#2a2420' },
  night: { paper: '#e8d9b8', bubble: '#efe2c4', ink: '#2a2420' },
};
const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);

// o: { camera, player, sections() (loaded: name -> sec), current() (your section's folder), night() (0..1),
//      hudOpen(), sfx(name, gain), hud (the ScrollHud, for its chrome), query (URLSearchParams),
//      settings: { s, set(k, v), reset() } (world.js's tuning object and its one setter), time (the time agent's
//      object, r2_time.md), sound() (sound.js, once built), canvas (for the pointer lock), tune: { get, set } (the
//      lil-gui panel behind ?tune=1) }: the direct HUD and the settings screen (hud.js, settings_screen.js)
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

  // the 圖志 journal (journal.js; lore agent, gen/ui/r2_lore.md): a lazy chunk, made on the first J, toast foot or settings
  // row. lore.json (the long texts) is fetched once, by the first unfolded toast or the journal, never at first load.
  let loreP = null, jn = null, jnLoading = null, placesData = null, talkData = null;
  const lore = () => (loreP ??= json('assets/ui/lore.json'));
  const journal = {
    isOpen: () => !!jn?.isOpen,
    async open(opts = {}) {
      if (off || o.hudOpen() || dhud.isOpen()) return;
      jnLoading ??= import('./journal.js').then((m) => (jn = new m.Journal({ places: placesData, talk: talkData, data: () => ({ places: placesData, talk: talkData }), lore, player: o.player,
        canvas: o.canvas || o.hud?.canvas, touch, sfx: o.sfx })));
      try { await jnLoading; } catch (err) { console.warn('journal failed to load:', err); jnLoading = null; return; }
      return jn.open(opts);
    },
    close: (opts) => jn?.close(opts),
    toggle(opts) { return jn?.isOpen ? jn.close(opts) : journal.open(opts); },
    state: () => jn?.state() ?? { open: false },
  };
  // J's tap target on a touch screen: a 志 seal beside the 說明 seal (places.css)
  if (touch && !off) {
    const jb = h('button', 'qm-ringbtn qm-jn-open', { type: 'button', title: W.lore.journalAria, 'aria-label': W.lore.journalAria },
      [h('span', 'qm-seal', { text: W.lore.journalSeal, 'aria-hidden': 'true' })]);
    jb.addEventListener('pointerdown', (e) => e.stopPropagation());
    jb.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    jb.addEventListener('click', (e) => { e.stopPropagation(); journal.toggle(); });
    document.body.append(jb);
  }

  // the controls help (STYLE.md §14): open on the first visit until you have walked a while (at least HELP_MIN s and
  // HELP_WALK m, or HELP_MAX s), then folded into its 說明 seal for good (prefs.helpSeen, also set by any fold); later
  // visits start folded, the seal stamping in once. H (or ?), the seal, or the settings' 說明 row open it again.
  const HELP_MIN = 25, HELP_WALK = 12, HELP_MAX = 75;
  const helpHost = document.getElementById('help');
  const firstVisit = !prefs.get('helpSeen');
  const help = helpHost ? helpPanel(helpHost, { touch, open: firstVisit }) : null;
  let helpT = firstVisit ? 0 : -1, walked = 0, last = null;
  if (help) help.onchange = (open) => { if (!open && helpT >= 0) { helpT = -1; prefs.set('helpSeen', true); } };
  // the direct HUD (hud.js): the view tiles and the › to the settings screen, by the time instrument (#dial)
  const dhud = createHud({
    view: { get: () => o.settings?.s.view, set: (v) => o.settings?.set('view', v) },
    hudOpen: () => o.hudOpen(),
    blocked: () => journal.isOpen(),
    settings: o.settings ? { world: o.settings, time: o.time, sound: o.sound, player: o.player, canvas: o.canvas || o.hud?.canvas,
      help: () => help, journal: () => ui?.journal ?? null, tune: o.tune, touch } : null,
  });
  if (o.hud) o.hud.blocked = () => dhud.isOpen() || journal.isOpen(); // no scroll HUD (Space) over the settings screen or the journal
  addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
    if (dhud.isOpen()) return; // the settings screen takes its own keys
    if ((e.key === '?' || (e.code === 'Slash' && e.shiftKey) || e.code === 'KeyH') && !o.hudOpen()) help?.toggle();
    if (o.hudOpen()) return;
    if (journal.isOpen()) return; // the journal takes its own keys (journal.js: J or Esc close it)
    if (e.code === 'KeyJ') { journal.open(); return; }
    if (e.code === 'KeyE') talk?.interact();
    if (e.code === 'Escape') talk?.close();
  });

  // the scroll HUD's chrome in 繁體 (its own words stay in scroll_hud.js; the title comes from regionTitle)
  if (o.hud?.root) {
    const hint = o.hud.root.querySelector('.sh-hint'), credit = o.hud.root.querySelector('.sh-credit');
    const [zh, en] = touch ? W.hud.hintTouch : o.hud.tune ? W.hud.hintTune : W.hud.hintDesktop;
    if (hint) hint.replaceChildren(zh, h('span', 'qm-gloss', { text: en }));
    if (credit) credit.textContent = W.hud.credit;
  }

  let places = null, talk = null;
  const ready = Promise.all([json('assets/ui/places.json'), json('assets/ui/talk.json')]).then(([pl, tk]) => {
    if (off) return;
    const where = () => { const p = o.player.pos; return { X: p.x, D: -p.z, H: p.y }; };
    places = new Places({ layer: { banner, toasts, anchors }, data: pl, current: o.current, where, sfx: o.sfx, camera: o.camera, bvh: () => o.player.bvh,
      lore, touch, blocked: () => o.hudOpen() || dhud.isOpen() || journal.isOpen(), journal: (id) => journal.open({ at: id }) });
    talk = new Talk({ layer: anchors, data: tk, sections: o.sections, player: o.player, camera: o.camera, sfx: o.sfx, touch });
    // the journal's memory and the painting's marks (lore agent): a conversation heard goes in 見聞; the scroll HUD draws
    // a cinnabar seal on each landmark reached (scroll_hud.js calls hud.decorate)
    placesData = pl; talkData = tk;
    const start = talk.start.bind(talk);
    talk.start = (sc) => { const ok = start(sc); if (ok) places.discover(`t:${sc.id}`); return ok; };
    if (o.hud) o.hud.decorate = (...a) => places.hudMarks(...a);
  });

  let started = false, nightAcc = 0;
  const cost = { ms: 0, n: 0 }; // the UI's own script time per frame (the checks read it: test.cost())
  const ui = {
    root, places: () => places, talk: () => talk, help, hud: dhud, journal,
    progress: (f) => loading.progress(f),
    loaded() {
      loading.done();
      if (!firstVisit) setTimeout(() => helpHost?.querySelector('.qm-help-seal')?.classList.add('qm-stamp-in'), 1200);
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
      // the help folds away on the first visit, once you have walked a while (help.onchange marks it seen)
      if (help?.open && helpT >= 0) {
        helpT += dt;
        const p = o.player.pos;
        if (last) walked += Math.hypot(p.x - last.x, p.z - last.z);
        last = { x: p.x, z: p.z };
        if ((helpT > HELP_MIN && walked > HELP_WALK) || helpT > HELP_MAX) help.set(false);
      }
      dhud.sync(dt);
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
      toast: (id, open = false) => places?.fireLandmark(id, { open }),
      // the lore (r2_lore.md): unfold the toast showing; mark places found (the journal and the HUD marks); the journal
      unfold: (open = true) => places?.unfold(open),
      untoast: () => places?.clearToasts(),
      discover: (ids) => { for (const id of [].concat(ids)) { const m = places?.byId.get(id); if (m) places.reached(m); else places?.discover(id); } return places?.found.size ?? 0; },
      journal: { open: (at) => journal.open({ at }), close: () => journal.close(), state: () => journal.state(), turn: (step) => jn?.turn(step) },
      talk: (id) => { const sc = talk?.scenes.find((s) => s.id === id); return sc ? talk.start(sc) : false; },
      next: () => talk?.interact(),
      heads: (id) => talk?.headsOf(id) ?? null,
      close: () => talk?.close(),
      help: (open) => help?.set(open),
      // the direct HUD and the settings screen (hud.js, settings_screen.js)
      settings: {
        open: (cat) => dhud.open({ cat }),
        close: () => dhud.close(),
        state: () => dhud.screen()?.state() ?? { open: false },
        page: (cat) => dhud.screen()?.setCat(cat),
        select: (id) => { const sc = dhud.screen(), i = sc ? sc.specs.findIndex((r) => r.id === id) : -1; if (i >= 0) sc.select(i); return i; },
      },
      night: (on) => { theme = on ? 'night' : 'day'; applyInk(html, THEMES[theme]); if (on) html.dataset.night = ''; else delete html.dataset.night; nightAcc = -1e9; },
      cost: (reset = false) => { const r = { msPerFrame: cost.n ? cost.ms / cost.n : 0, frames: cost.n }; if (reset) { cost.ms = 0; cost.n = 0; } return r; },
      state: () => ({ started, theme, places: places?.state() ?? null, talk: talk?.state() ?? null, help: help?.open ?? null, helpSeen: prefs.get('helpSeen'), settings: dhud.isOpen() }),
      scenes: () => talk?.scenes.map((s) => ({ id: s.id, section: s.section, host: s.roles[s.host].fig, X: s.X, D: s.D })) ?? [],
      landmarks: () => places?.lm.map((m) => ({ id: m.id, section: m.section, name: m.name, X: m.X, D: m.D, r: m.r })) ?? [],
    },
  };
  return ui;
}
