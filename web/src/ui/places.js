// Place notifications (gen/ui/STYLE.md "Place notifications"), two tiers:
//  (a) the region banner, when you walk into a section of another region: its name large, a brush, a seal (~3.8 s);
//  (b) a landmark toast, when you come near a mapped landmark: a paper slip top right. Round 2 (gen/ui/r2_lore.md): the
//      name in display brush, then the short line, then the long description under a fold. Folded it stays TOAST_S;
//      unfolded long enough to read (openDur); it holds while the pointer is over it. It unfolds on its own when
//      prefs.expandDescriptions is set, or by a click or tap on it, or R. Its long text comes from assets/ui/lore.json,
//      fetched only when a toast first unfolds (or ahead of time when expandDescriptions is on), so the first load and
//      its fonts don't grow.
// Discovery (the 圖志 journal, journal.js): every landmark you reach and every region you enter is kept in
// prefs.discovered (with prefs.lastPlace, where J opens the journal), even when the notes are turned off. The scroll
// HUD marks the landmarks you have reached with a cinnabar seal (hudMarks, hooked into scroll_hud.js as hud.decorate).
// Data: assets/ui/places.json (tools/ui_data.mjs from sections/*/places.json). Positions are the map's (X east, D north).
// Triggers, with hysteresis so nothing spams: the region follows the page's own "your section" (it changes only well
// inside the next section) and a region is not announced again within REGION_AGAIN s; a landmark fires on entering its
// radius r, re-arms only after you leave r * 1.5 + 3 m, and waits LANDMARK_AGAIN s before it can fire again. One toast
// at a time, at most two waiting; toasts wait while the banner shows. prefs.placeNotes = false keeps banners and toasts
// away (discovery still counts); prefs.plaques = false hangs no plaques.
import * as THREE from 'three';
import './places.css';
import { regionBanner, plaque, seal, h } from './components.js';
import { prefs } from './prefs.js';
import { W } from './words.js';
import { Steady } from './steady.js';

const REGION_AGAIN = 120, LANDMARK_AGAIN = 240;
const BANNER_S = 3.8, TOAST_S = 9, FADE_MS = 600, CHECK_S = 0.25;
// unfolded: long enough to read the long text (about 6 characters a second, never under 16 s or over 45 s)
const openDur = (m) => Math.min(45, Math.max(16, 9 + [...(m.lore?.long || '')].length / 6));
// plaques: the landmarks within PLAQUE_M of you that are in view, the nearest MAX_PLAQUES of them (anchored DOM, so few).
// Steady (steady.js): a plaque appears inside the tight gates and stays inside the loose ones (PLAQUE_KEEP_M, a wider
// screen margin, nearer under it), hidden behind a wall only after a few checks running, never swapped for a place
// about as near: no blinking as you walk (the user, 2026-10-13)
const PLAQUE_M = 30, PLAQUE_KEEP_M = 35, MAX_PLAQUES = 3;
const pv = new THREE.Vector3(), ray = new THREE.Ray(), dir = new THREE.Vector3();
const CINNABAR = '#b5321e';
// the English under the Chinese when the viewer picks 中英 (prefs.lang; each text's `_en` sibling, tools/ui_data.mjs)
const bi = () => prefs.get('lang') === 'zh_en';
const en = (t, cls) => (bi() && t ? h('span', `qm-gloss qm-en ${cls}`, { text: t }) : null);

// distance from (x, y) to a polygon (0 inside), or to a point
function distTo(lm, x, y) {
  const P = lm.poly;
  if (!P || P.length < 3) return Math.hypot(x - lm.X, y - lm.D);
  let inside = false, best = Infinity;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    const dx = xj - xi, dy = yj - yi, L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - xi) * dx + (y - yi) * dy) / L));
    best = Math.min(best, Math.hypot(x - (xi + t * dx), y - (yi + t * dy)));
  }
  return inside ? 0 : best;
}

// the landmark toast: the seal as its icon; the name in display brush, the short line, and under a fold the long text,
// its quote and sources; a hint for the fold (R on a desktop, a tap on a touch screen) and for the journal (J)
function loreToast(m, { touch }) {
  const body = h('div', 'qm-lt-body', { 'aria-hidden': 'true' });
  const more = h('span', 'qm-lt-more', { 'aria-hidden': 'true' }, touch
    ? [h('span', 'qm-lt-chev'), h('span', '', { text: W.lore.more })]
    : [h('kbd', 'qm-kbd', { text: 'R' }), h('span', '', { text: W.lore.more })]);
  const el = h('div', 'qm-toast qm-slip qm-lt', { role: 'status', 'aria-live': 'polite', 'aria-expanded': 'false', title: W.lore.moreAria }, [
    seal(m.seal || '名'),
    h('div', 'qm-toast-text', {}, [
      h('b', 'qm-toast-name', { text: m.name }),
      en(m.name_en, 'qm-en-name'),
      m.line ? h('span', 'qm-toast-line', { text: m.line }) : null,
      en(m.line_en, 'qm-en-line'),
      more, body,
    ]),
  ]);
  return { el, body };
}

// fill a toast's fold (or the journal's entry) with the long text, its quote and its sources
export function loreBody(body, lore, { journalHint = null } = {}) {
  if (!lore) { body.replaceChildren(h('p', 'qm-lt-wait', { text: '……' })); return; }
  body.replaceChildren(...[
    h('p', 'qm-lt-long', { text: lore.long }),
    bi() && lore.long_en ? h('p', 'qm-gloss qm-en qm-lt-long-en', { text: lore.long_en }) : null,
    lore.quote ? h('blockquote', 'qm-lt-quote', {}, [h('span', '', { text: `「${lore.quote}」` }), en(lore.quote_en, 'qm-en-quote'), h('cite', '', { text: lore.quoteSrc || '' })]) : null,
    lore.cite ? h('p', 'qm-lt-cite', { text: `${W.lore.cite}${lore.cite}` }, [en(lore.cite_en, 'qm-en-cite')]) : null,
    journalHint,
  ].filter(Boolean));
}

export class Places {
  // layer: { banner: el, toasts: el }; data: places.json; current(): your section's folder name; where(): { X, D, H };
  // sfx(name, gain); bvh(): the walkable world's collider (player.bvh), to hide a plaque behind a wall (a ray per
  // candidate per check); lore(): a Promise of lore.json (fetched once, on first need); touch; blocked(): true while
  // another screen owns the keys; journal(id): open the 圖志 at a landmark (the toast's foot)
  constructor({ layer, data, current, where, sfx = () => {}, camera = null, bvh = () => null, lore = null, touch = false, blocked = () => false, journal = null }) {
    Object.assign(this, { layer, data, current, where, sfx, camera, bvh, loreFetch: lore, touch, blocked, journal });
    this.plaques = new Map(); // landmark -> { anchor, gone }
    this.steady = new Steady({ max: MAX_PLAQUES, showAfter: 0.2, hideAfter: 0.6, minOn: 1.5, minOff: 1.2, stick: 0.8 });
    this.t = 0;
    this.acc = 0;
    this.region = null; // the region id you are in
    this.shownRegion = new Map(); // region id -> t last shown
    this.lm = (data?.landmarks || []).map((m) => ({ ...m, armed: true, last: -Infinity }));
    this.byId = new Map(this.lm.map((m) => [m.id, m]));
    this.queue = [];
    this.banner = null; // { el, until }
    this.toast = null; // { el, body, until, m, open, hover }
    this.paused = 0; // seconds before landmarks are checked (after the start banner)
    this.log = []; // what fired, for the checks: [t, kind, id]
    this.found = new Set(prefs.get('discovered') || []);
    this.lore = null; // lore.json once fetched
    // R folds and unfolds the toast showing (a desktop's mouse is captured while walking, so it can't click it)
    addEventListener('keydown', (e) => {
      if (e.code !== 'KeyR' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
      if (this.toast && !this.blocked()) this.unfold(!this.toast.open);
    });
    if (prefs.get('expandDescriptions')) this.fetchLore();
    prefs.on('expandDescriptions', (on) => { if (on) { this.fetchLore(); if (this.toast && !this.toast.open) this.unfold(true); } });
    prefs.on('plaques', (on) => { if (on === false) this.dropPlaques(); });
  }

  regionOf(folder) { return this.data?.regions?.[folder] || null; }

  // ------------------------------------------------------------ discovery (the journal's memory)
  discover(key) {
    if (this.found.has(key)) return;
    this.found.add(key);
    prefs.set('discovered', [...this.found]);
  }
  reached(m) {
    this.discover(m.id);
    prefs.set('lastPlace', m.id);
  }

  fetchLore() {
    if (!this.loreFetch) return Promise.resolve(null);
    return (this.lorePromise ??= Promise.resolve(this.loreFetch()).then((j) => { this.lore = j; return j; }).catch(() => null));
  }

  update(dt) {
    this.t += dt;
    this.place();
    if (this.banner && this.t > this.banner.until) { this.fade(this.banner.el); this.banner = null; }
    if (this.toast) {
      if (this.toast.hover) this.toast.until = Math.max(this.toast.until, this.t + 3); // held while the pointer is on it
      // a long read gives way to a landmark waiting once it has had a fair while
      if (this.queue.length && this.toast.open && !this.toast.hover && this.t - this.toast.openedAt > 14) this.toast.until = Math.min(this.toast.until, this.t);
      if (this.t > this.toast.until) { this.fade(this.toast.el); this.toast = null; this.gapUntil = this.t + 0.5; }
    }
    if (!this.banner && !this.toast && this.queue.length && !(this.gapUntil > this.t)) this.showToast(this.queue.shift());
    this.acc += dt;
    if (this.acc < CHECK_S) return;
    this.acc = 0;
    const notes = prefs.get('placeNotes') !== false;
    // (a) the region
    const r = this.regionOf(this.current());
    if (r && r.id !== this.region) {
      this.region = r.id;
      this.discover(`r:${r.id}`);
      const last = this.shownRegion.get(r.id) ?? -Infinity;
      if (notes && this.t - last > REGION_AGAIN) this.showBanner(r);
    }
    // (b) landmarks
    const at = this.where();
    if (!at) return;
    if (prefs.get('plaques') !== false) this.choosePlaques(at);
    if (this.paused > 0) { this.paused -= CHECK_S; return; }
    for (const m of this.lm) {
      const d = distTo(m, at.X, at.D) + Math.max(0, Math.abs((at.H ?? 0) - (m.H ?? 0)) - 3); // up on the tower is not at its foot
      if (d < m.r) {
        if (m.armed && this.t - m.last > LANDMARK_AGAIN) {
          m.armed = false;
          m.last = this.t;
          this.reached(m);
          if (notes && !this.queue.includes(m) && this.toast?.m !== m) { this.queue.push(m); if (this.queue.length > 2) this.queue.shift(); }
        }
      } else if (d > m.r * 1.5 + 3) m.armed = true;
    }
  }

  // the plaques worth hanging now: near, in front of the camera, nearest first
  choosePlaques(at) {
    if (!this.camera || !this.layer.anchors) return;
    const cands = [];
    for (const m of this.lm) {
      const d = distTo(m, at.X, at.D);
      if (d > PLAQUE_KEEP_M && !this.steady.isOn(m)) continue;
      const s = this.screen(m);
      // to appear: within PLAQUE_M, not standing under it (you see its toast instead), well inside the view; to stay:
      // the loose gates. Behind a wall only counts when it is in either band (one ray each).
      const ok = d <= PLAQUE_M && d >= 1.5 && s.on;
      const keep = d <= PLAQUE_KEEP_M && d >= 0.8 && s.front && s.x > -30 && s.x < innerWidth + 30 && s.y > 70 && s.y < innerHeight;
      const hid = (ok || keep) && this.hidden(m);
      cands.push({ key: m, score: d, ok: ok && !hid, keep: keep && !hid });
    }
    const keep = this.steady.update(this.t, cands);
    for (const [m, p] of this.plaques) if (!keep.has(m) && !p.gone) { p.gone = true; p.el.classList.add('qm-gone'); setTimeout(() => { if (p.gone) { p.anchor.remove(); this.plaques.delete(m); } }, 400); }
    for (const m of keep) {
      const p = this.plaques.get(m);
      if (p) { if (p.gone) { p.gone = false; p.el.classList.remove('qm-gone'); } continue; }
      const el = plaque(m), anchor = h('div', 'qm-anchor');
      const pe = en(m.name_en, 'qm-plaque-en'); // the map name in English, under the slip
      if (pe) el.insertBefore(pe, el.lastChild);
      anchor.append(el);
      anchor.style.visibility = 'hidden';
      this.layer.anchors.append(anchor);
      this.plaques.set(m, { anchor, el, gone: false });
    }
    this.place();
  }
  dropPlaques() { for (const [, p] of this.plaques) p.anchor.remove(); this.plaques.clear(); this.steady.reset(); }

  // is the plaque's bead behind something solid (the city wall, a building) from where the camera is?
  hidden(m) {
    const b = this.bvh?.();
    if (!b) return false;
    pv.set(m.X, m.top ?? (m.H || 0) + 4, -m.D);
    dir.copy(pv).sub(this.camera.position);
    const L = dir.length();
    ray.set(this.camera.position, dir.multiplyScalar(1 / L));
    const hit = b.raycastFirst(ray, THREE.DoubleSide);
    return !!hit && hit.distance < L - 1.5;
  }

  screen(m) {
    pv.set(m.X, m.top ?? (m.H || 0) + 4, -m.D).project(this.camera);
    const x = ((pv.x + 1) / 2) * innerWidth, y = ((1 - pv.y) / 2) * innerHeight;
    const front = pv.z < 1 && pv.z > -1;
    return { x, y, front, on: front && x > 20 && x < innerWidth - 20 && y > 120 && y < innerHeight - 40 };
  }

  // per frame: the plaques follow their places on the screen
  place() {
    if (!this.plaques.size) return;
    this.camera.updateMatrixWorld();
    // while the banner shows, a plaque never hangs over it (its box is read once, when it appears)
    const B = this.banner && (this.banner.box ??= this.banner.el.getBoundingClientRect());
    for (const [m, p] of this.plaques) {
      const s = this.screen(m);
      // once under the banner it stays hidden until the banner goes (no blinking at its edge as the view swings)
      if (B && s.x > B.left - 30 && s.x < B.right + 30 && s.y - 150 < B.bottom) p.under = this.banner;
      const under = !!this.banner && p.under === this.banner;
      if (!s.front || under) { p.anchor.style.visibility = 'hidden'; continue; }
      if (p.anchor.style.visibility) p.anchor.style.visibility = '';
      const tf = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
      if (p.anchor._tf !== tf) { p.anchor.style.transform = tf; p.anchor._tf = tf; }
    }
  }

  showBanner(r) {
    if (this.banner) this.fade(this.banner.el, 200);
    // the banner owns the top of the screen: a toast showing goes back to wait if it has only just come, else it ends
    if (this.toast) {
      if (this.t - this.toast.shownAt < 2) this.queue.unshift(this.toast.m);
      this.fade(this.toast.el, 150);
      this.toast = null;
    }
    const el = regionBanner(r);
    const be = en([r.name_en, r.sub_en].filter(Boolean).join(' · '), 'qm-banner-en');
    if (be) el.append(be);
    this.layer.banner.append(el);
    this.banner = { el, until: this.t + BANNER_S, r };
    this.shownRegion.set(r.id, this.t);
    this.paused = Math.max(this.paused, 1.5);
    this.log.push([+this.t.toFixed(2), 'region', r.id]);
    setTimeout(() => this.sfx('bubble_tap', 0.55), 1050); // the seal lands
  }

  showToast(m) {
    const { el, body } = loreToast(m, { touch: this.touch });
    this.layer.toasts.append(el);
    const toast = (this.toast = { el, body, until: this.t + TOAST_S, shownAt: this.t, m, open: false, hover: false });
    // a click or a tap folds and unfolds it; the pointer resting on it holds it (pointer events: places.css)
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target.closest?.('.qm-lt-journal')) return;
      if (this.toast === toast) this.unfold(!toast.open);
    });
    el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') toast.hover = true; });
    el.addEventListener('pointerleave', () => { toast.hover = false; });
    this.log.push([+this.t.toFixed(2), 'landmark', m.id]);
    setTimeout(() => this.sfx('bubble_tap', 0.45), 260);
    if (prefs.get('expandDescriptions') || this.openNext === m.id) { this.openNext = null; this.unfold(true); }
  }

  // open (or close) the fold of the toast showing; its time grows to fit the reading
  unfold(open = true) {
    const toast = this.toast;
    if (!toast || toast.open === open) return;
    toast.open = open;
    toast.el.classList.toggle('qm-open', open);
    toast.el.setAttribute('aria-expanded', String(open));
    toast.body.setAttribute('aria-hidden', String(!open));
    if (!open) { toast.until = Math.max(this.t + 4, Math.min(toast.until, this.t + TOAST_S)); return; }
    toast.openedAt = this.t;
    const fill = () => {
      if (this.toast !== toast) return;
      const lore = this.lore?.landmarks?.[toast.m.id] || null;
      toast.m.lore = lore;
      const hint = this.journal ? h('button', 'qm-lt-journal', { type: 'button', title: W.lore.journalAria },
        this.touch ? [h('span', '', { text: W.lore.journal })] : [h('kbd', 'qm-kbd', { text: 'J' }), h('span', '', { text: W.lore.journal })]) : null;
      hint?.addEventListener('click', (e) => { e.stopPropagation(); this.journal(toast.m.id); });
      loreBody(toast.body, lore, { journalHint: hint });
      toast.until = Math.max(toast.until, this.t + openDur(toast.m));
    };
    fill();
    if (!this.lore) this.fetchLore().then(fill);
  }

  fade(el, ms = FADE_MS) {
    el.classList.add('qm-out');
    el.style.transitionDuration = `${ms}ms`;
    setTimeout(() => el.remove(), ms + 50);
  }

  // the scroll HUD's marks (scroll_hud.js calls hud.decorate(kind, ...)): a small cinnabar seal on each landmark you
  // have reached, in the painting view (with its name as the hover tip) and on the strip below it
  hudMarks(kind, ctx, a, b, c) {
    if (kind === 'view') {
      const X = a, Y = b, hud = c;
      for (const m of this.lm) {
        if (!this.found.has(m.id) || m.u == null) continue;
        const x = X(m.u), y = Y(m.v);
        if (x < -20 || y < -20 || x > ctx.canvas.width + 20 || y > ctx.canvas.height + 20) continue;
        ctx.save();
        ctx.translate(x, y - 16);
        ctx.rotate(-0.07);
        ctx.fillStyle = 'rgba(250, 242, 222, 0.92)';
        ctx.fillRect(-7.5, -7.5, 15, 15);
        ctx.fillStyle = CINNABAR;
        ctx.fillRect(-6, -6, 12, 12);
        // a seal's cut border and one stroke in white (no glyph: the canvas has no brush font to spare)
        ctx.strokeStyle = 'rgba(250, 242, 222, 0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-3.6, -3.6, 7.2, 7.2);
        ctx.fillStyle = 'rgba(250, 242, 222, 0.9)';
        ctx.fillRect(-1.2, -1.2, 2.4, 2.4);
        ctx.restore();
        ctx.strokeStyle = 'rgba(181, 50, 30, 0.75)';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y - 1); ctx.stroke();
        hud?.drawn?.push({ id: `lm:${m.id}`, x0: x - 9, y0: y - 25, x1: x + 9, y1: y, area: 1, tip: bi() ? { n: m.name_en ? `${m.name} · ${m.name_en}` : m.name, w: m.line_en ? `${m.line} ${m.line_en}` : m.line } : { n: m.name, w: m.line } });
      }
    } else if (kind === 'strip') {
      const k = a, kv = b, H = c;
      ctx.fillStyle = CINNABAR;
      ctx.strokeStyle = 'rgba(250, 242, 222, 0.9)';
      ctx.lineWidth = 1;
      for (const m of this.lm) {
        if (!this.found.has(m.id) || m.u == null) continue;
        const x = m.u * k, y = Math.min(H - 3, Math.max(3, m.v * kv));
        ctx.beginPath(); ctx.rect(x - 2, y - 2, 4, 4); ctx.fill(); ctx.stroke();
      }
    }
  }

  // for the kit and the checks
  fireRegion(folder) { const r = this.regionOf(folder); if (r) this.showBanner(r); return !!r; }
  fireLandmark(id, { open } = {}) {
    const m = this.byId.get(id);
    if (!m) return false;
    this.reached(m);
    if (this.toast) { this.fade(this.toast.el, 100); this.toast = null; }
    if (open) this.openNext = m.id; // (opened as it shows, also when it waits for the banner)
    if (this.banner) this.queue.unshift(m); else this.showToast(m);
    return true;
  }
  clearToasts() { if (this.toast) { this.fade(this.toast.el, 100); this.toast = null; } this.queue.length = 0; }
  state() {
    return { region: this.region, banner: this.banner?.r?.name || null, toast: this.toast?.m?.name || null, toastOpen: !!this.toast?.open,
      toastLeft: this.toast ? +(this.toast.until - this.t).toFixed(1) : null, queue: this.queue.map((m) => m.id),
      plaques: [...this.plaques].filter(([, p]) => !p.gone).map(([m]) => m.name), found: this.found.size, log: this.log.slice(-20) };
  }
}
