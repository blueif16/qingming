// The direct HUD (gen/ui/STYLE.md §14; the user, 2026-10-12: "leave only the time related setting + first/third person
// switch on direct hud, can have a right arrow and place else stuff there"): what stays on screen while you walk.
//   - the time instrument, #dial (the time agent's; its box is --qm-dial-w x --qm-dial-h, set by time.css);
//   - the view switch: two small ink tiles, an eye (first person) and a figure (third person); the active one is
//     sealed (cinnabar ground, paper ink). One click switches; V still works;
//   - the 鳥瞰 tile beside them (the user, 2026-10-13: a camera view you can switch on anywhere, "a shortcut on the main
//     game UI"): the camera lifts over you and circles (birdseye.js); sealed while it does. C still works;
//   - a › button that opens the settings screen (O; Esc goes back). The screen is a lazy chunk
//     (settings_screen.js), fetched on first use or when the page is idle, so the first load doesn't grow.
// Placement: under #dial on a desktop, right of it on a phone (where the time agent's region banner moves under the
// instrument); see hud.css. Navigation keeps its own seats: the 說明 seal bottom left, the scroll button top right on
// touch screens. The bell and the volume live in the settings screen (and beside the painting while the scroll HUD is
// open); M still mutes.
// Nothing here runs per frame: the tiles repaint when the view changes (sync() every half second from ui.frame
// catches changes made by V or the tools).
import './hud.css';
import { h } from './components.js';
import { icons } from './icons.js';
import { W } from './words.js';

// the two view tiles (also used by the settings screen's 視角 row)
export function viewTiles({ get, set, small = false }) {
  const I = icons();
  const box = h('div', `qm-view${small ? ' qm-view-sm' : ''}`, { role: 'radiogroup', 'aria-label': W.view.aria });
  const tile = (mode, icon, [zh, en]) => {
    const b = h('button', 'qm-view-tile', { type: 'button', role: 'radio', 'data-view': mode, title: `${zh} · ${en} (V)`, 'aria-label': `${zh} (${en}, V)`, html: icon });
    b.addEventListener('pointerdown', (e) => e.stopPropagation());
    b.addEventListener('click', (e) => { e.stopPropagation(); if (get() !== mode) set(mode); paint(); });
    return b;
  };
  const first = tile('first', I.eye, W.view.first), third = tile('third', I.figure, W.view.third);
  box.append(first, third);
  const paint = () => {
    const v = get() === 'first' ? 'first' : 'third';
    first.setAttribute('aria-checked', String(v === 'first'));
    third.setAttribute('aria-checked', String(v === 'third'));
  };
  paint();
  return { el: box, paint };
}

// the 鳥瞰 tile: a toggle (aria-pressed) in the view tiles' paper, sealed while the camera circles above you
function skyTile({ get, set }) {
  const [zh, en] = W.sky;
  const b = h('button', 'qm-view-tile qm-sky-tile', { type: 'button', 'aria-pressed': 'false', title: `${zh} · ${en} (C)`, 'aria-label': `${zh} (${en}, C)`, html: icons().sky });
  const paint = () => b.setAttribute('aria-pressed', String(!!get()));
  b.addEventListener('pointerdown', (e) => e.stopPropagation());
  // a click or tap lets go of the focus (Space is the painting's and W walks; a focused button would take them)
  b.addEventListener('click', (e) => { e.stopPropagation(); set(!get()); paint(); if (e.detail) b.blur(); });
  paint();
  return { el: b, paint };
}

// o: { view: { get, set }, sky: { get, set } (the 鳥瞰 tile; none on a page without it), settings: ctx for the screen
//      (settings_screen.js), hudOpen(), blocked() (another screen, the journal, is up), touch }
export function createHud(o) {
  const root = h('div', 'qm-hud', { id: 'qm-hud' });
  const view = viewTiles(o.view);
  const sky = o.sky ? skyTile(o.sky) : null;
  const more = h('button', 'qm-ringbtn qm-more', { type: 'button', title: W.more.title, 'aria-label': W.more.aria, 'aria-haspopup': 'dialog', html: icons().more });
  more.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.append(view.el, ...(sky ? [sky.el] : []), more);
  document.body.append(root);

  // the settings screen: a lazy chunk, made on first use
  let screen = null, loading = null;
  const load = () => (loading ??= import('./settings_screen.js').then((m) => (screen = new m.SettingsScreen({ ...o.settings, onClose: () => view.paint() }))));
  if (!o.settings) more.hidden = true; // a page without world settings has no screen to open
  const open = async ({ cat, relock = false } = {}) => {
    if (!o.settings || o.hudOpen?.() || o.blocked?.() || screen?.isOpen) return;
    try { await load(); } catch (err) { console.warn('settings screen failed to load:', err); loading = null; return; }
    if (!o.hudOpen?.()) screen.open({ cat, relock });
  };
  const close = (opts) => screen?.close(opts);
  more.addEventListener('click', (e) => { e.stopPropagation(); screen?.isOpen ? close() : open(); });
  // O opens it (and closes it: the open screen takes O itself, with the mouse given back as Space gives it back)
  addEventListener('keydown', (e) => {
    if (e.code !== 'KeyO' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
    if (screen?.isOpen) return;
    const locked = !!document.pointerLockElement;
    document.exitPointerLock?.(); // free the mouse at once, before the chunk arrives
    open({ relock: locked });
  });
  // fetch the chunk once the page is idle (small; the fonts it needs stay lazy until it shows)
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
  if (o.settings) setTimeout(() => idle(() => load().catch(() => { loading = null; })), 8000);

  let acc = 0;
  return {
    el: root,
    view, sky,
    open, close,
    isOpen: () => !!screen?.isOpen,
    screen: () => screen,
    // cheap: one attribute compare every half second (V and the tools change the view outside the tiles)
    sync(dt) { acc += dt; if (acc > 0.5) { acc = 0; view.paint(); sky?.paint(); } },
  };
}
