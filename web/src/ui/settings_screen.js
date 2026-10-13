// The settings screen (gen/ui/STYLE.md §14): the user's Battlefield reference ("settings be space and not in row form
// like this … we have more spacings and we keep the exact ink style") in our paper and ink. Its layout, not its look:
// one spacious row per setting on a ruled paper sheet (朱絲欄, the red-ruled paper of Song manuscripts), the label left
// in 繁體 with a small English gloss, the value right (ink ‹ › steppers with named steps, an ink switch with a seal for
// its knob, a brush slider, the view tiles, or a button); the highlighted row in a brush frame; a description slip on
// the right (on a phone, under the list) that says what the setting does and what it costs; an Esc keycap 返回.
// Categories are seals over the list: 朱文 (red strokes on paper) when idle, 白文 (paper strokes on red) when chosen.
// Opened by O or the HUD's ›; Esc, O or 返回 close it. Keys: ↑↓ rows, ←→ values (Shift: big slider steps), Enter
// toggles or runs, Q / E (or Tab, PageUp/Down) change the page. Touch: tap a row to read it, tap its control to change.
// The world keeps drawing behind it (so a change shows at once, as Battlefield's screen sits over the live scene); you
// stand still (player.frozen) and the mouse is free; closing with O gives the mouse back as Space does for the
// scroll HUD; Esc and 返回 leave it free (click to walk), as the HUD does.
// Every world setting goes through world.js's setter (o.world.set -> setSetting -> onSettingChange), time through the
// time agent's object (o.time; r2_time.md), UI preferences through prefs.js, sound through its own methods.
// Loaded lazily by hud.js (a chunk of its own, with settings.css and settings_words.js), so the first load doesn't grow.
import './settings.css';
import { h } from './components.js';
import { slipSvg, sealMaskSvg, dataUri, longStroke } from './ink.js';
import { icons } from './icons.js';
import { viewTiles } from './hud.js';
import { prefs } from './prefs.js';
import { SW } from './settings_words.js';

const CATS = ['time', 'view', 'sound', 'ui', 'display', 'adv'];
const PACES = ['靜', '緩', '常', '疾'];
const PACE_FLOW = { 靜: 0, 緩: 1, 常: 4, 疾: 15 }; // r2_time.md's table (game minutes per second); only without o.time
const SHARP = [0.75, 1, 1.5, 2];
const QUALITY = ['auto', 'low', 'mid', 'high']; // the device tier (tiers.js, settings key `quality`)
const SHADING = ['lambert', 'toon', 'unlit', 'pbr'];
const BOATS = ['auto', 'moored', 'painted', 'waves']; // the river's boats (world.js boatMode, settings key `boats`)
const mod = (x, n) => ((x % n) + n) % n;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const nearest = (list, v) => list.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
const gloss = (t) => h('span', 'qm-gloss', { text: t });

// the half double hour of a clock hour (0..23): 子初 23-24, 子正 0-1, 丑初 1-2 … 午正 12-13 (as sundial.js reads it)
function hourName(hr) {
  const hh = mod(Math.floor(hr), 24), i = Math.floor(((hh + 1) % 24) / 2), [b, en] = SW.branches[i];
  return [b + (hh % 2 === 1 ? SW.halves.early : SW.halves.late), en];
}

// time goes through the time agent's object when it exists; else straight to the world setter (same rules)
function timeOf(c) {
  if (c.time) return c.time;
  const W = c.world;
  const pace = () => PACES.reduce((a, p) => (Math.abs(PACE_FLOW[p] - W.s.timeFlow) < Math.abs(PACE_FLOW[a] - W.s.timeFlow) ? p : a));
  return {
    get: () => ({ hour: W.s.hour, local: !!W.s.localTime, flow: W.s.localTime ? '今' : pace() }),
    setHour: (hr) => W.set('hour', mod(hr, 24)),
    setFlow: (w) => (w === '今' ? W.set('localTime', true) : W.set('timeFlow', PACE_FLOW[w])),
    toLocal: () => W.set('localTime', true),
  };
}

let trackSvg = null; // the slider's brush stroke (the loading stroke's generator, thinner), drawn once
const track = (cls) => {
  trackSvg ??= `<path d="${longStroke({ w: 600, h: 22, seed: 83 })}" fill-rule="evenodd"/>`;
  return `<svg class="${cls}" viewBox="0 0 600 22" preserveAspectRatio="none" aria-hidden="true">${trackSvg}</svg>`;
};

export class SettingsScreen {
  // c: { world: { s, set(k, v), reset() }, time?, sound(), player, canvas, help(), journal(), tune: { get, set },
  //      touch, onClose() }
  constructor(c) {
    this.c = c;
    this.touch = !!c.touch;
    this.isOpen = false;
    this.cat = 'time';
    this.selBy = {};
    this.specs = [];
    this.sel = 0;
    this.build();
    addEventListener('keydown', (e) => this.onKey(e), true);
    // a lock granted after opening (a click just before O) is given back at once, as the scroll HUD does
    document.addEventListener('pointerlockchange', () => { if (this.isOpen && document.pointerLockElement) document.exitPointerLock(); });
  }

  // ------------------------------------------------------------ DOM (built once; the list per page)
  build() {
    const I = icons();
    const root = (this.root = h('div', 'qs', { role: 'dialog', 'aria-modal': 'true', 'aria-label': `${SW.title[0]} · ${SW.title[1]}`, tabindex: '-1' }));
    root.hidden = true;
    // nothing reaches the world under it: no walking touches, no wheel zoom, no click for the mouse
    for (const t of ['pointerdown', 'click', 'wheel', 'touchstart', 'touchmove', 'contextmenu']) root.addEventListener(t, (e) => e.stopPropagation(), { passive: t !== 'contextmenu' && t !== 'click' });
    root.addEventListener('contextmenu', (e) => e.preventDefault());

    // the head: the title, the category seals between Q and E keycaps, and (touch) a 返回 button
    this.tabs = h('div', 'qs-tabs', { role: 'tablist', 'aria-label': SW.title[1] });
    this.tabEls = {};
    CATS.forEach((cat, i) => {
      const [zh, en] = SW.cats[cat];
      const b = h('button', 'qs-tab', { type: 'button', role: 'tab', title: `${zh} · ${en}`, 'aria-label': `${zh} (${en})`, 'data-cat': cat });
      // two glyphs stacked as a seal reads, top to bottom (plain blocks: a vertical writing-mode box mis-sizes here)
      b.append(h('span', 'qs-tab-seal', {}, [...zh].map((g) => h('span', '', { text: g }))));
      b.style.setProperty('--tilt', `${[-3, 2, -1.5, 3, -2.5, 1.5][i]}deg`);
      b.addEventListener('click', () => this.setCat(cat));
      this.tabs.append(b);
      this.tabEls[cat] = b;
    });
    const kq = h('kbd', 'qm-kbd qs-k', { text: 'Q' }), ke = h('kbd', 'qm-kbd qs-k', { text: 'E' });
    const close = h('button', 'qs-close', { type: 'button', 'aria-label': `${SW.back[0]} · ${SW.back[1]}`, html: I.left });
    close.append(h('span', '', { text: SW.back[0] }));
    close.addEventListener('click', () => this.close());
    const head = h('header', 'qs-head', {}, [
      h('h2', 'qs-title', {}, [h('span', '', { text: SW.title[0] }), gloss(SW.title[1])]),
      h('nav', 'qs-nav', {}, [kq, this.tabs, ke]),
      close,
    ]);

    // the page title over the list, the list, the keys under it
    this.catEl = h('h3', 'qs-cat');
    this.list = h('div', 'qs-list', { role: 'listbox', 'aria-label': SW.title[1] });
    const keys = h('p', 'qs-keys', { 'aria-hidden': 'true' });
    for (const [k, zh, en] of SW.keys) keys.append(h('span', '', {}, [...k.split(' ').map((x) => h('kbd', 'qm-kbd', { text: x })), h('span', '', { text: zh }), gloss(en)]));

    // the description slip
    this.dTitle = h('h4', 'qs-d-title');
    this.dZh = h('p', 'qs-d-zh');
    this.dEn = h('p', 'qs-d-en');
    this.dNote = h('p', 'qs-d-note');
    this.dCost = h('div', 'qs-d-cost');
    const back = h('button', 'qs-back', { type: 'button' }, [h('kbd', 'qm-kbd', { text: 'Esc' }), h('span', '', { text: SW.back[0] }), gloss(SW.back[1])]);
    back.addEventListener('click', () => this.close());
    this.desc = h('aside', 'qs-desc', { 'aria-live': 'polite' }, [this.dTitle, this.dZh, this.dEn, this.dNote, h('div', 'qs-d-rule', { html: track('') }), this.dCost, back]);

    root.append(head, this.catEl, this.list, this.desc, keys);
    document.body.append(root);
  }

  // the brush frame of the highlighted row, in the paper of the hour (lamp-lit after dark), as the other frames
  frames() {
    const night = document.documentElement.hasAttribute('data-night');
    if (this.night === night) return;
    this.night = night;
    this.root.style.setProperty('--qs-frame-row', dataUri(slipSvg({ paper: night ? '#efe2c4' : '#f8f1e0', ink: '#2a2420', seed: 57 })));
    // the stamp's worn edge for seals that aren't square (the category seals, 耗費): stretched, not letterboxed
    this.root.style.setProperty('--qs-seal-mask', dataUri(sealMaskSvg({ seed: 29 }).replace('<svg ', '<svg preserveAspectRatio="none" ')));
  }

  // ------------------------------------------------------------ the rows of a page
  specsOf(cat) {
    const c = this.c, W = c.world, s = W.s, T = timeOf(c);
    const world = (key, kind, more = {}) => ({ id: key, kind, get: () => s[key], set: (v) => W.set(key, v), ...more });
    const slider = (key, min, max, more = {}) => world(key, 'slider', { min, max, ...more });
    const pref = (key) => ({ id: key, kind: 'toggle', get: () => !!prefs.get(key), set: (v) => prefs.set(key, v) });
    const sound = () => { try { return c.sound?.() || null; } catch { return null; } };
    const journal = (() => { try { return c.journal?.() || null; } catch { return null; } })();
    switch (cat) {
      case 'time': return [
        { id: 'localTime', kind: 'toggle', get: () => !!T.get().local, set: (v) => (v ? T.toLocal() : T.setFlow('靜')) },
        { id: 'hour', kind: 'step', values: [...Array(24).keys()], wrap: true, get: () => mod(Math.floor(T.get().hour), 24),
          set: (v) => { const hr = T.get().hour; T.setHour(v + (hr - Math.floor(hr))); }, text: hourName },
        // 今 (your clock) shows as the value while you follow it; ← from it holds the hour (靜), → goes 緩
        { id: 'timeFlow', kind: 'step', values: PACES, dots: true, get: () => T.get().flow, from: (cur, d) => (d < 0 ? '靜' : '緩'),
          set: (v) => T.setFlow(v), text: (v) => [v, SW.paces[v] || ''] },
        world('daylight', 'toggle'),
      ];
      case 'view': return [
        world('view', 'tiles', { values: ['first', 'third'], text: (v) => SW.views[v === 'first' ? 'first' : 'third'] }),
        slider('camDistance', 1.4, 7, { disabled: () => (s.view === 'first' ? SW.unused : null) }),
        slider('fov', 35, 85),
      ];
      case 'sound': return [
        { id: 'soundOn', kind: 'toggle', get: () => !!sound()?.on, set: (v) => { const sd = sound(); if (sd) { sd.setOn(v); sd.ui?.('toggle'); } }, disabled: () => (sound() ? null : SW.noSound) },
        { id: 'volume', kind: 'slider', min: 0, max: 1, get: () => sound()?.volume ?? 0.8,
          set: (v) => { const sd = sound(); if (!sd) return; sd.setVolume(v); if (!sd.on && v > 0) sd.setOn(true); }, disabled: () => (sound() ? null : SW.noSound) },
      ];
      case 'ui': return [
        { id: 'lang', kind: 'step', values: ['zh', 'zh_en'], get: () => prefs.get('lang') || 'zh', set: (v) => prefs.set('lang', v), text: (v) => SW.langs[v] },
        pref('expandDescriptions'), pref('placeNotes'), pref('plaques'),
        { id: 'help', kind: 'action', act: SW.open, run: () => { this.close(); c.help?.()?.set(true); } },
        ...(journal ? [{ id: 'journal', kind: 'action', act: SW.open, run: () => { this.close(); (journal.open || journal.toggle)?.call(journal); } }] : []),
      ];
      case 'display': return [
        world('quality', 'step', { values: QUALITY, dots: true, text: (v) => SW.quality[v] || [v, v],
          disabled: () => (new URLSearchParams(location.search).has('tier') ? SW.tierInUrl : null) }),
        world('pixelRatioCap', 'step', { values: SHARP, dots: true, get: () => nearest(SHARP, s.pixelRatioCap), text: (v) => SW.sharp[v] }),
        world('shadows', 'toggle'),
        world('ink', 'toggle'),
        world('boats', 'step', { values: BOATS, dots: true, text: (v) => SW.boats[v] || [v, v],
          disabled: () => (new URLSearchParams(location.search).has('boatflow') ? SW.boatsInUrl : null) }),
      ];
      case 'adv': return [
        world('shading', 'step', { values: SHADING, dots: true, text: (v) => SW.shading[v] || [v, v] }),
        world('trueColors', 'toggle'),
        slider('exposure', 0.4, 2), slider('saturation', 0, 1.6), slider('warmth', -1, 1),
        slider('inkStrength', 0, 1), slider('inkThickness', 0.5, 3),
        slider('fogNear', 0, 60), slider('fogFar', 40, 300),
        slider('grain', 0, 0.2), slider('vignette', 0, 1),
        slider('walkSpeed', 0.5, 6), slider('runMultiplier', 1, 4), slider('eyeHeight', 1, 2.2),
        ...(c.tune ? [{ id: 'tune', kind: 'toggle', get: () => !!c.tune.get(), set: (v) => c.tune.set(v) }] : []),
        { id: 'reset', kind: 'action', act: SW.reset, run: () => W.reset?.() },
      ];
    }
    return [];
  }

  setCat(cat) {
    if (!CATS.includes(cat)) cat = 'time';
    this.cat = cat;
    for (const [k, b] of Object.entries(this.tabEls)) b.setAttribute('aria-selected', String(k === cat));
    const [zh, en] = SW.cats[cat];
    this.catEl.replaceChildren(h('span', '', { text: zh }), gloss(en));
    this.specs = this.specsOf(cat);
    this.list.replaceChildren(...this.specs.map((sp, i) => this.rowOf(sp, i)));
    this.list.scrollTop = 0;
    this.paint(true);
    this.select(this.selBy[cat] ?? 0, { scroll: true });
  }

  page(d) { this.setCat(CATS[mod(CATS.indexOf(this.cat) + d, CATS.length)]); }

  rowOf(sp, i) {
    const t = SW.rows[sp.id];
    const row = h('div', `qs-row qs-k-${sp.kind}`, { role: 'option', id: `qs-row-${sp.id}`, 'aria-selected': 'false' });
    const value = h('div', 'qs-value');
    row.append(h('span', 'qs-mark', { 'aria-hidden': 'true' }), h('div', 'qs-label', {}, [h('span', 'qs-zh', { text: t.label[0] }), gloss(t.label[1])]), value);
    sp.row = row;
    row.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') this.select(i, { scroll: false }); });
    row.addEventListener('click', () => this.select(i, { scroll: false }));
    const I = icons(), label = `${t.label[0]} (${t.label[1]})`;
    if (sp.kind === 'toggle') {
      const state = h('span', 'qs-state'), sw = h('button', 'qs-toggle', { type: 'button', role: 'switch', 'aria-label': label }, [h('span', 'qs-knob')]);
      value.append(state, sw);
      value.addEventListener('click', () => this.step(sp, 1));
      sp.paint = () => {
        const on = !!sp.get(), [zh, en] = on ? SW.on : SW.off;
        if (sp.last === on) return;
        sp.last = on;
        state.replaceChildren(h('b', '', { text: zh }), gloss(en));
        sw.setAttribute('aria-checked', String(on));
      };
    } else if (sp.kind === 'step') {
      const L = h('button', 'qs-arrow', { type: 'button', 'aria-label': `${label} ‹`, html: I.left });
      const R = h('button', 'qs-arrow', { type: 'button', 'aria-label': `${label} ›`, html: I.right });
      const mid = h('span', 'qs-step');
      const dots = sp.dots ? h('span', 'qs-dots', { 'aria-hidden': 'true' }, sp.values.map(() => h('i'))) : null;
      value.append(L, mid, R);
      L.addEventListener('click', (e) => { e.stopPropagation(); this.select(i, { scroll: false }); this.step(sp, -1); });
      R.addEventListener('click', (e) => { e.stopPropagation(); this.select(i, { scroll: false }); this.step(sp, 1); });
      sp.paint = () => {
        const cur = sp.get();
        if (sp.last === cur) return;
        sp.last = cur;
        const [zh, en] = sp.text(cur);
        mid.replaceChildren(h('b', '', { text: zh }), gloss(en), ...(dots ? [dots] : []));
        if (dots) [...dots.children].forEach((d, k) => d.classList.toggle('on', sp.values[k] === cur));
      };
    } else if (sp.kind === 'slider') {
      const knob = h('span', 'qs-knob');
      const sl = h('div', 'qs-slider', { role: 'slider', 'aria-label': label, html: track('qs-track') + track('qs-fill') });
      sl.append(knob);
      value.append(sl);
      const fromX = (x) => { const r = sl.getBoundingClientRect(); return sp.min + clamp((x - r.left - 9) / Math.max(1, r.width - 18), 0, 1) * (sp.max - sp.min); };
      let drag = null;
      sl.addEventListener('pointerdown', (e) => {
        if (sp.disabled?.()) return;
        drag = e.pointerId;
        sl.setPointerCapture?.(e.pointerId);
        this.select(i, { scroll: false });
        this.setValue(sp, fromX(e.clientX));
      });
      sl.addEventListener('pointermove', (e) => { if (drag === e.pointerId) this.setValue(sp, fromX(e.clientX)); });
      const up = (e) => { if (drag === e.pointerId) drag = null; };
      sl.addEventListener('pointerup', up);
      sl.addEventListener('pointercancel', up);
      sp.paint = () => {
        const f = clamp((sp.get() - sp.min) / (sp.max - sp.min), 0, 1);
        if (sp.last === f) return;
        sp.last = f;
        sl.style.setProperty('--v', f.toFixed(4));
        sl.setAttribute('aria-valuenow', String(Math.round(f * 100)));
      };
    } else if (sp.kind === 'tiles') {
      const tiles = viewTiles({ get: sp.get, set: (v) => { sp.set(v); this.paint(); }, small: true });
      const state = h('span', 'qs-state');
      value.append(state, tiles.el);
      sp.paint = () => {
        const cur = sp.get();
        tiles.paint();
        if (sp.last === cur) return;
        sp.last = cur;
        const [zh, en] = sp.text(cur);
        state.replaceChildren(h('b', '', { text: zh }), gloss(en));
      };
    } else if (sp.kind === 'action') {
      const b = h('button', 'qs-act', { type: 'button', 'aria-label': label }, [h('span', '', { text: sp.act[0] }), gloss(sp.act[1])]);
      value.append(b);
      if (!this.touch) value.prepend(h('kbd', 'qm-kbd qs-enter', { text: 'Enter', 'aria-hidden': 'true' }));
      b.addEventListener('click', (e) => { e.stopPropagation(); sp.run(); });
      sp.paint = () => {};
    }
    return row;
  }

  // ------------------------------------------------------------ changing values
  setValue(sp, v) {
    if (sp.disabled?.()) return;
    v = Math.round(clamp(v, sp.min, sp.max) * 1000) / 1000;
    if (v !== sp.get()) sp.set(v);
    this.paint();
  }

  step(sp, d, big = false) {
    if (!sp || sp.disabled?.()) return;
    if (sp.kind === 'toggle') sp.set(!sp.get());
    else if (sp.kind === 'step') {
      const vs = sp.values, cur = sp.get();
      let k = vs.indexOf(cur), next;
      if (k < 0) next = sp.from ? sp.from(cur, d) : vs[0];
      else next = vs[sp.wrap ? mod(k + d, vs.length) : clamp(k + d, 0, vs.length - 1)];
      if (next !== cur) sp.set(next);
    } else if (sp.kind === 'slider') this.setValue(sp, sp.get() + (d * (sp.max - sp.min)) / (big ? 5 : 20));
    else if (sp.kind === 'tiles') sp.set(sp.values[d < 0 ? 0 : sp.values.length - 1]);
    this.paint();
  }

  // Enter: a switch flips, a stepper goes on (round to the first), a button runs
  activate(sp) {
    if (!sp || sp.disabled?.()) return;
    if (sp.kind === 'action') return sp.run();
    if (sp.kind === 'step') {
      const vs = sp.values, k = vs.indexOf(sp.get());
      sp.set(k < 0 ? (sp.from ? sp.from(sp.get(), 1) : vs[0]) : vs[mod(k + 1, vs.length)]);
      return this.paint();
    }
    if (sp.kind === 'tiles') { sp.set(sp.get() === 'first' ? 'third' : 'first'); return this.paint(); }
    if (sp.kind === 'toggle') this.step(sp, 1);
  }

  select(i, { scroll = true } = {}) {
    if (!this.specs.length) return;
    i = clamp(i, 0, this.specs.length - 1);
    const old = this.specs[this.sel];
    if (old?.row) { old.row.classList.remove('on'); old.row.setAttribute('aria-selected', 'false'); }
    const sp = this.specs[i];
    this.sel = i;
    this.selBy[this.cat] = i;
    sp.row.classList.add('on');
    sp.row.setAttribute('aria-selected', 'true');
    this.list.setAttribute('aria-activedescendant', sp.row.id);
    this.describe(sp, true);
    if (scroll) sp.row.scrollIntoView?.({ block: 'nearest' });
  }

  describe(sp, force = false) {
    const t = SW.rows[sp.id], dis = sp.disabled?.() || null;
    const key = sp.id + (dis ? dis[0] : '');
    if (!force && this.described === key) return;
    this.described = key;
    this.dTitle.replaceChildren(h('span', '', { text: t.label[0] }), gloss(t.label[1]));
    this.dZh.textContent = t.zh;
    this.dEn.textContent = t.en;
    this.dNote.hidden = !dis;
    if (dis) this.dNote.replaceChildren(h('span', '', { text: dis[0] }), ' ', gloss(dis[1]));
    const lvl = t.cost || 'none', [cz, ce] = SW.cost[lvl];
    this.dCost.dataset.level = lvl;
    this.dCost.replaceChildren(
      h('p', 'qs-cost-zh', {}, [h('span', 'qs-cost-k', { text: SW.costKey[0] }), h('b', '', { text: cz }), t.costZh ? h('span', '', { text: t.costZh }) : null]),
      h('p', 'qs-cost-en', { text: `${SW.costKey[1]}: ${ce}${t.costEn ? '. ' + t.costEn : '.'}` }),
    );
  }

  paint() {
    for (const sp of this.specs) {
      try { sp.paint?.(); } catch (err) { console.warn('settings row', sp.id, err); }
      const dis = !!sp.disabled?.();
      if (sp.dis !== dis) { sp.dis = dis; sp.row?.classList.toggle('qs-dis', dis); }
    }
    const cur = this.specs[this.sel];
    if (cur) this.describe(cur);
  }

  // ------------------------------------------------------------ keys (capture: nothing else hears them while open)
  onKey(e) {
    if (!this.isOpen || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.code;
    if (k === 'KeyM' || k === 'KeyV') { setTimeout(() => this.paint(), 0); return; } // sound and view still work: repaint
    if (k.startsWith('F') && k.length > 1 && /^F\d+$/.test(k)) return; // F5, F11, F12 stay the browser's
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.repeat && !k.startsWith('Arrow')) return;
    const sp = this.specs[this.sel];
    switch (k) {
      case 'ArrowUp': this.select(this.sel - 1); break;
      case 'ArrowDown': this.select(this.sel + 1); break;
      case 'ArrowLeft': this.step(sp, -1, e.shiftKey); break;
      case 'ArrowRight': this.step(sp, 1, e.shiftKey); break;
      case 'Enter': case 'NumpadEnter': this.activate(sp); break; // Space stays inert: it is the scroll's key outside
      case 'Escape': this.close(); break;
      case 'KeyO': this.close({ relock: true }); break;
      case 'Tab': this.page(e.shiftKey ? -1 : 1); break;
      case 'KeyQ': case 'PageUp': this.page(-1); break;
      case 'KeyE': case 'PageDown': this.page(1); break;
      case 'Home': this.select(0); break;
      case 'End': this.select(this.specs.length - 1); break;
      case 'KeyH': this.close(); this.c.help?.()?.set(true); break;
      default: break;
    }
  }

  // ------------------------------------------------------------ open / close
  open({ cat, relock = false } = {}) {
    if (this.isOpen) return;
    this.isOpen = true;
    this.relock = relock;
    const p = this.c.player;
    this.wasFrozen = !!p?.frozen;
    if (p) p.frozen = true;
    document.exitPointerLock?.();
    this.frames();
    document.documentElement.classList.add('qm-set-open');
    this.root.hidden = false;
    this.setCat(cat || this.cat);
    // values can change behind the screen (your clock ticking, sound arriving, V, the tools): a cheap repaint
    this.timer = setInterval(() => this.paint(), 500);
    this.root.focus?.({ preventScroll: true });
  }

  close({ relock = false } = {}) {
    if (!this.isOpen) return;
    this.isOpen = false;
    clearInterval(this.timer);
    this.root.hidden = true;
    document.documentElement.classList.remove('qm-set-open');
    const p = this.c.player;
    if (p) p.frozen = this.wasFrozen;
    if (document.activeElement && this.root.contains(document.activeElement)) document.activeElement.blur();
    this.c.onClose?.();
    // O is a user gesture, so the mouse can be taken again at once (Esc is not, and 返回 leaves it free: click to walk)
    if (relock && this.relock && !this.touch) this.c.canvas?.requestPointerLock?.()?.catch?.(() => {});
  }

  toggle(opts) { this.isOpen ? this.close(opts) : this.open(opts); }

  state() {
    return { open: this.isOpen, cat: this.cat, sel: this.specs[this.sel]?.id ?? null, rows: this.specs.map((sp) => ({ id: sp.id, kind: sp.kind, disabled: !!sp.disabled?.() })) };
  }
}
