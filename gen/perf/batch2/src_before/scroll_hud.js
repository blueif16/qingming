// The scroll HUD (the user, 2026-10-12: "whenever we press the space key ... the middle is going to show our current
// position in the original painting ... that's going to create a feeling that we are actually living in the scroll").
// Space (or the scroll button on a touch screen) masks the street and shows the original painting, centred on the spot
// you stand on: you as a cinnabar ring with a wedge for the way you look, and the people and animals around you boxed
// on their painted figures. Those who walk away from their painted spot also show a dot where they are now and a faint
// line back to their figure. Hover (or tap) names them. Wheel or pinch zooms, drag pans, the ring button snaps back to
// you, and a strip of the whole scroll below marks the built range and where you are. The developer's tuning panel
// (lil-gui) shows only while the HUD is open, and only with ?tune=1 (or the settings screen's 進階 row; `tune`); H hides
// it there. The player's settings are the settings screen (ui/settings_screen.js). Space or Esc goes back to the street.
//
// Exact, not by eye: each section's scroll_index.json (tools/scroll_index.mjs) carries the map's frames, and
// scroll_projection.js runs the map's own mapping forward, so a point of the world lands on the pixel of the scan it
// was measured from; the boxes are the strokes' figures by map ID.
// Light: the painting is a webp tile pyramid (tools/scroll_tiles.mjs, assets/scroll/); only the tiles in view are
// fetched, and all of them (and the strip) are dropped when the HUD closes, so the world's download and memory don't
// grow while it is shut. Nothing here touches WebGL; the page stops rendering while the HUD is open (world.js tick).
// No numbers or coordinates are ever shown to the player.
import { ScrollProjection } from './scroll_projection.js';

const BASE = 'assets/scroll/';
const NEAR_M = 15; // people and animals within this many metres of you are boxed (the painting is dense: 15 m round you
// already holds 50-150 painted people in the inner city); boxes fade from FULL_M out to NEAR_M
const FULL_M = 5;
const MAX_LIVE = 40; // decoded tiles kept while open (512 x 512 each)
const INFLIGHT = 6;
const INK = '#2a2420', CINNABAR = '#b5321e', PAPER = '#efe4cc', MOUNT = '#4e4033';
const isTouch = matchMedia('(pointer: coarse)').matches;
const editable = (t) => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const CSS = `
.sh-root { position: fixed; inset: 0; z-index: 900; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 14px 16px; box-sizing: border-box; font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia,
  "Songti SC", "STSong", "Noto Serif CJK SC", serif; color: ${INK}; --side: 290px; user-select: none; -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent; }
.sh-root[hidden] { display: none; }
.sh-mask { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 45%, rgba(236, 224, 198, 0.62), rgba(64, 46, 30, 0.78));
  -webkit-backdrop-filter: blur(8px) saturate(0.55); backdrop-filter: blur(8px) saturate(0.55); }
.sh-frame { position: relative; flex-shrink: 0; width: min(1200px, calc(100vw - 2 * var(--side))); height: min(64vh, 640px); box-sizing: border-box;
  padding: 7px; background: ${MOUNT}; border-radius: 3px; box-shadow: 0 10px 34px rgba(30, 20, 10, 0.5), inset 0 0 0 1px rgba(255, 240, 210, 0.18); }
.sh-view { display: block; width: 100%; height: 100%; touch-action: none; cursor: grab; border-radius: 1px;
  box-shadow: 0 0 0 1px rgba(20, 12, 6, 0.6); }
.sh-view.drag { cursor: grabbing; }
.sh-title { position: absolute; z-index: 2; left: 14px; top: -13px; padding: 3px 12px 4px; background: ${PAPER}; border-radius: 2px; font-size: 14px;
  letter-spacing: 0.04em; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); white-space: nowrap; max-width: calc(100% - 180px); overflow: hidden; text-overflow: ellipsis; }
.sh-title b { font-weight: 600; letter-spacing: 0.12em; margin-right: 0.5em; }
.sh-tools { position: absolute; right: 14px; top: -16px; display: flex; gap: 6px; z-index: 2; }
.sh-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(42, 36, 32, 0.55); background: ${PAPER}; color: ${INK};
  display: grid; place-items: center; padding: 0; cursor: pointer; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); }
.sh-btn:hover { background: #fff6e4; }
.sh-btn svg { width: 18px; height: 18px; display: block; }
.sh-tip { position: absolute; pointer-events: none; max-width: 260px; padding: 6px 9px 7px; background: rgba(247, 239, 220, 0.97); border-radius: 2px;
  border-left: 3px solid ${CINNABAR}; font-size: 13px; line-height: 1.35; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); display: none; }
.sh-tip b { display: block; font-weight: 600; margin-bottom: 1px; }
.sh-tip:first-letter { text-transform: uppercase; }
.sh-strip { position: relative; width: min(1200px, calc(100vw - 2 * var(--side))); padding: 4px 7px; box-sizing: border-box; background: ${MOUNT};
  border-radius: 2px; box-shadow: 0 4px 14px rgba(30, 20, 10, 0.45); }
.sh-strip canvas { display: block; width: 100%; height: 24px; touch-action: none; cursor: pointer; } /* sized by drawStrip; a bare canvas is 300 x 150 and squeezed the frame */
.sh-foot { position: relative; width: min(1200px, calc(100vw - 2 * var(--side))); display: flex; justify-content: space-between; gap: 12px;
  font-size: 12px; color: #f3e9d4; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6); }
.sh-credit { font-style: italic; opacity: 0.9; }
.sh-open { position: fixed; right: 12px; top: 12px; z-index: 899; width: 46px; height: 46px; border-radius: 50%; border: 1px solid rgba(42, 36, 32, 0.5);
  background: rgba(239, 228, 204, 0.92); display: grid; place-items: center; padding: 0; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35); }
.sh-open svg { width: 26px; height: 26px; }
@media (max-width: 1499px) { .sh-root { --side: 24px; } } /* the panel is collapsed to its title bar there */
@media (max-width: 640px) {
  .sh-root { --side: 10px; padding: 46px 10px 12px; gap: 8px; justify-content: flex-start; }
  .sh-frame { height: 64vh; padding: 5px; margin-top: 14px; }
  .sh-title { font-size: 12px; left: 8px; max-width: calc(100% - 150px); }
  .sh-tools { right: 6px; gap: 5px; }
  .sh-btn { width: 30px; height: 30px; }
  .sh-tip { max-width: 200px; font-size: 12px; }
  .sh-foot { flex-direction: column; gap: 2px; font-size: 11px; }
}
`;

// small ink icons (no numbers, no letters)
export const ICON = { // exported for the UI kit page (web/ui.html)
  plus: '<svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  minus: '<svg viewBox="0 0 20 20"><path d="M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  you: `<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="5.2" fill="none" stroke="${CINNABAR}" stroke-width="2"/><circle cx="10" cy="10" r="1.6" fill="${CINNABAR}"/><path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  back: '<svg viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  scroll: `<svg viewBox="0 0 28 28"><rect x="5" y="9" width="18" height="10" rx="1" fill="#e7d6ae" stroke="${INK}" stroke-width="1.2"/><path d="M8 12.5c3-1.5 5 1.5 8 0s4 .8 4 .8M8 16c2.5-1 4.5 1 7 0" fill="none" stroke="${INK}" stroke-width=".9" opacity=".7"/><rect x="3" y="7" width="3" height="14" rx="1.5" fill="#7a2a1a" stroke="${INK}" stroke-width="1"/><rect x="22" y="7" width="3" height="14" rx="1.5" fill="#7a2a1a" stroke="${INK}" stroke-width="1"/><circle cx="17.5" cy="15.5" r="1.6" fill="${CINNABAR}"/></svg>`,
};

export class ScrollHud {
  // sections: the page's live Map of loaded sections (name = folder -> { layout, persons }), which may gain or lose
  // sections at any time; player: { pos, yaw, frozen }; gui: the lil-gui panel; canvas: the 3D canvas (pointer lock);
  // getPeople: the page's People (people.js), to tell walkers from those who stand where painted.
  // The built sections come from assets/scroll/sections.json (tools/scroll_index.mjs, from map/sections.json), never
  // from a fixed list; a section's boxes (assets/<folder>/scroll_index.json) load when its people are loaded.
  // tune: show the lil-gui panel in the HUD (?tune=1; settable later). blocked(): true while another screen (the
  // settings) owns the keys, so Space doesn't open the HUD over it.
  constructor({ sections, player, gui, canvas, getPeople = () => null, tune = false }) {
    Object.assign(this, { sections, player, gui, canvas, getPeople });
    this.tune = !!tune;
    this.blocked = null;
    this.isOpen = false;
    this.proj = new ScrollProjection();
    this.built = null; // [{ section, folder, name, area, frames }], west to east
    this.meta = new Map(); // section key (S4, S4b, ...) -> its entry in built
    this.index = new Map(); // section key -> scroll_index.json
    this.indexFor = new Map(); // folder -> Promise of its index
    this.manifest = null;
    this.tiles = new Map(); // key -> { bmp, used }
    this.pending = new Map(); // key -> AbortController
    this.live = 0; // decoded bitmaps alive (tiles + strip), for the memory check
    this.panelHidden = false;
    this.view = { u: 0, v: 0, z: 0 }; // centre (scan px) and zoom (css px per scan px)
    this.drawn = []; // what the last frame drew, for hover and tap: { x0, y0, x1, y1, tip, area }
    this.hover = null;
    gui?.hide();
    this.build();
    addEventListener('keydown', (e) => this.onKey(e), true);
    // a pointer lock granted after the HUD opened (asked for by a click just before Space) is given back at once
    document.addEventListener('pointerlockchange', () => { if (this.isOpen && document.pointerLockElement) document.exitPointerLock(); });
    addEventListener('resize', () => this.isOpen && this.redraw());
  }

  get open() { return this.isOpen; }

  // ------------------------------------------------------------ DOM
  build() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    const root = (this.root = document.createElement('div'));
    root.className = 'sh-root';
    root.hidden = true;
    root.innerHTML = `<div class="sh-mask"></div>
      <div class="sh-frame"><canvas class="sh-view"></canvas><div class="sh-title"><b>清明上河圖</b><span class="sh-sec"></span></div>
        <div class="sh-tools"><button class="sh-btn" data-a="in" title="Closer">${ICON.plus}</button><button class="sh-btn" data-a="out" title="Further">${ICON.minus}</button>
        <button class="sh-btn" data-a="you" title="Back to where you stand">${ICON.you}</button><button class="sh-btn" data-a="close" title="Back to the street">${ICON.back}</button></div>
        <div class="sh-tip"></div></div>
      <div class="sh-strip"><canvas></canvas></div>
      <div class="sh-foot"><span class="sh-hint">${isTouch ? 'Tap a box to see who it is' : this.tune ? 'Space or Esc · back to the street   ·   H · the tuning panel' : 'Space or Esc · back to the street'}</span><span class="sh-credit">Palace Museum, via Wikimedia Commons</span></div>`;
    document.body.appendChild(root);
    // the page's own wheel (the third-person camera distance) and touches stay out of the HUD
    for (const t of ['wheel', 'touchstart', 'touchmove']) root.addEventListener(t, (e) => e.stopPropagation(), { passive: true });
    this.viewEl = root.querySelector('.sh-view');
    this.stripEl = root.querySelector('.sh-strip canvas');
    this.tipEl = root.querySelector('.sh-tip');
    this.secEl = root.querySelector('.sh-sec');
    root.querySelector('.sh-tools').addEventListener('click', (e) => {
      const a = e.target.closest('button')?.dataset.a;
      if (a === 'in') this.zoomBy(1.4);
      if (a === 'out') this.zoomBy(1 / 1.4);
      if (a === 'you') this.snap();
      if (a === 'close') this.hide();
    });
    // a touch screen has no Space: a small scroll button opens the HUD (the HUD's own button closes it)
    if (isTouch) {
      this.openBtn = document.createElement('button');
      this.openBtn.className = 'sh-open';
      this.openBtn.title = 'The scroll';
      this.openBtn.innerHTML = ICON.scroll;
      this.openBtn.addEventListener('click', () => this.show());
      document.body.appendChild(this.openBtn);
    }
    this.bindView();
    this.bindStrip();
  }

  onKey(e) {
    if (this.blocked?.()) return;
    if (e.code === 'Space' && !editable(e.target)) {
      e.preventDefault(); // never "click" a focused button, never scroll
      if (!e.repeat) this.isOpen ? this.hide({ relock: true }) : this.show();
    } else if (e.code === 'Escape' && this.isOpen) {
      this.hide();
    } else if (e.code === 'KeyH' && this.isOpen && this.tune && !editable(e.target)) {
      this.panelHidden = !this.panelHidden;
      this.panelHidden ? this.gui?.hide() : this.gui?.show();
    }
  }

  // ------------------------------------------------------------ open / close
  async show() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.player.frozen = true;
    document.exitPointerLock?.(); // also a lock still on its way (a click just before Space): see pointerlockchange
    this.root.hidden = false;
    if (this.openBtn) this.openBtn.style.display = 'none';
    if (this.tune && !this.panelHidden) this.gui?.show();
    if (this.tune && innerWidth < 1500) this.gui?.close(); // narrower: the panel folds to its title bar, clear of the painting
    this.session = new AbortController();
    const session = this.session;
    await this.loadData(session.signal);
    if (!this.isOpen || session !== this.session) return;
    this.snap(true);
  }

  hide({ relock = false } = {}) {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.session?.abort();
    for (const c of this.pending.values()) c.abort();
    this.pending.clear();
    for (const t of this.tiles.values()) { t.bmp.close(); this.live--; }
    this.tiles.clear();
    if (this.strip) { this.strip.close(); this.strip = null; this.live--; }
    // release the canvases' backing stores
    this.viewEl.width = this.viewEl.height = 0;
    this.stripEl.width = this.stripEl.height = 0;
    this.drawn = [];
    this.hover = null;
    this.tipEl.style.display = 'none';
    this.root.hidden = true;
    if (this.openBtn) this.openBtn.style.display = '';
    this.gui?.hide();
    this.player.frozen = false;
    // back to walking: Space is a user gesture, so the mouse can be taken again at once (Esc is not: click to walk)
    if (relock && !isTouch) this.canvas?.requestPointerLock?.()?.catch?.(() => {});
  }

  toggle() { this.isOpen ? this.hide() : this.show(); }

  // the built sections and the indexes of the loaded ones (small JSON, kept), the tile manifest and the strip (dropped
  // on close)
  async loadData(signal) {
    if (!this.built) {
      const list = await fetch(`${BASE}sections.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (list) {
        this.built = list.sections;
        for (const b of this.built) { this.meta.set(b.section, b); this.proj.set(b.section, { section: b.section, area: b.area, frames: b.frames }); }
      }
    }
    await Promise.all([...this.sections.keys()].map((f) => this.loadIndex(f)));
    if (!this.manifest) this.manifest = await fetch(`${BASE}tiles.json`, { signal }).then((r) => r.json()).catch(() => null);
    if (this.manifest && !this.strip) {
      const bmp = await fetch(BASE + this.manifest.strip.file, { signal }).then((r) => r.blob()).then((b) => createImageBitmap(b)).catch(() => null);
      if (bmp && signal.aborted) bmp.close();
      else if (bmp) { this.strip = bmp; this.live++; }
    }
  }

  loadIndex(folder) {
    if (!this.indexFor.has(folder)) {
      this.indexFor.set(folder, fetch(`assets/${folder}/scroll_index.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((j) => {
        if (j) {
          this.index.set(j.section, j);
          if (!this.meta.has(j.section)) { this.meta.set(j.section, j); this.proj.set(j.section, { section: j.section, area: j.area, frames: j.frames }); }
        }
        else this.indexFor.delete(folder); // try again next time
        return j;
      }));
    }
    return this.indexFor.get(folder);
  }

  // ------------------------------------------------------------ you and the people round you
  you() {
    const p = this.player.pos, at = this.place(p.x, p.y, p.z), H = at?.H;
    if (!at) return null;
    // the way you look: the camera's yaw (0 looks north, -z); on the ground X east, D north
    const rad = Math.atan2(Math.cos(this.player.yaw), -Math.sin(this.player.yaw));
    at.dir = this.proj.heading(p.x, -p.z, H, rad);
    return at;
  }

  // a built point (page x, y, z) on the painting: its map height (mapH), snapped to the nearest support height the
  // map uses in that section (scroll_index supports: 0, a deck, a floor, the tower) when within 0.25 m
  place(x, y, z) {
    let H = this.mapH(x, y, z), at = this.proj.project(x, -z, H);
    const sup = at && this.meta.get(at.section)?.supports;
    if (sup?.length) {
      const s = sup.reduce((a, b) => (Math.abs(b - H) < Math.abs(a - H) ? b : a));
      if (Math.abs(s - H) < 0.25 && s !== H) { H = s; at = this.proj.project(x, -z, H); }
    }
    return at && Object.assign(at, { H });
  }

  // the painted figures standing still in the loaded sections: { p, S, H (their map height), X, D (painted spot) }
  statics() {
    const people = this.getPeople(), riders = new Set((people?.riders || []).map((r) => r.p)), out = [];
    for (const [, sec] of this.sections) {
      const S = sec.layout?.section;
      if (!S) continue;
      const spot = this.spotsOf(sec);
      for (const p of sec.persons || []) {
        const at = spot.get(p.id);
        if (!at || riders.has(p) || people?.agentOf?.has(p)) continue;
        out.push({ p, S, ...at });
      }
    }
    return out;
  }

  // a section's painted spots by slug: figures (layout.figures) and animals (layout.entities S.ani.*), with map H
  spotsOf(sec) {
    if (sec._hudSpots) return sec._hudSpots;
    const m = new Map(), L = sec.layout;
    for (const f of L.figures || []) m.set(f.id, { X: f.X, D: f.D, H: f.H || 0 });
    for (const [id, e] of Object.entries(L.entities || {})) if (e.kind === 'animal' && e.pos) m.set(id.split('.').slice(2).join('.'), { X: e.pos[0], D: e.pos[1], H: e.H || 0 });
    return (sec._hudSpots = m);
  }

  // the map's height for a built floor height y at (x, z): the build raises or lowers some ground the map takes as
  // level (the courier post's forecourt is built 0.6 m up and mapped at 0), so the still figures standing round you on
  // the same level say how far the build's floor is from the map's here (their built floor minus their map height)
  mapH(x, y, z) {
    const near = [];
    for (const f of this.statics()) {
      const q = f.p.root.position, d = Math.hypot(q.x - x, q.z - z);
      if (d < 8 && Math.abs(q.y - y) < 0.3) near.push([d, q.y - f.H]); // same level only: the forecourt is 0.5 m above the street
    }
    let H;
    if (near.length) {
      const off = near.sort((a, b) => a[0] - b[0]).slice(0, 5).map((n) => n[1]).sort((a, b) => a - b);
      H = y - off[off.length >> 1];
    } else H = Math.abs(y) < 0.8 ? 0 : y; // nobody near: small rises are the build's, a floor is a floor
    return Math.abs(H) < 0.12 ? 0 : H;
  }

  // everyone and every animal within NEAR_M of you (now, or at their painted spot), in the sections loaded right now
  nearby() {
    const out = [], P = this.player.pos, people = this.getPeople();
    for (const [, sec] of this.sections) {
      const S = sec.layout?.section, idx = this.index.get(S);
      if (!S) continue;
      if (!idx) { this.loadIndex(sec.name).then(() => this.redraw()); continue; } // a section that joined while open
      const spot = this.spotsOf(sec), here = new Map();
      for (const p of sec.persons || []) {
        const q = p.root?.position;
        if (!q || !p.id) continue;
        const id = idx.items[`${S}.fig.${p.id}`] ? `${S}.fig.${p.id}` : idx.items[`${S}.ani.${p.id}`] ? `${S}.ani.${p.id}` : null;
        const item = id && idx.items[id];
        // near you now, or painted near you (a walker who has wandered off is still boxed on his painted figure)
        const dNow = Math.hypot(q.x - P.x, q.z - P.z), at = spot.get(p.id);
        const dPainted = at ? Math.hypot(at.X - P.x, -at.D - P.z) : Infinity;
        const d = Math.min(dNow, dPainted);
        if (d > NEAR_M) continue;
        // walkers (people.js agentOf) leave their painted spot; everyone else stands where painted
        const walks = !!people?.agentOf?.has(p);
        const now = walks ? this.place(q.x, q.y, q.z) : null;
        const n = { id, item, now, animal: id?.includes('.ani.'), alpha: clamp(1 - (0.7 * (d - FULL_M)) / (NEAR_M - FULL_M), 0.3, 1) };
        out.push(n);
        here.set(p.id, n);
      }
      // a boat painted under way (boats.js): a dot where it is now and a faint line back to its painted spot, no box
      for (const b of sec.boats?.boats || []) {
        if (!b.under || !idx.items[b.id]) continue;
        const q = b.roots[0].position, d = Math.max(0, Math.hypot(q.x - P.x, q.z - P.z) - (b.info.lw || 20) / 2);
        if (d > NEAR_M) continue;
        out.push({ id: b.id, item: idx.items[b.id], now: this.place(q.x, q.y, q.z), animal: false, noBox: true,
          alpha: clamp(1 - (0.7 * (d - FULL_M)) / (NEAR_M - FULL_M), 0.3, 1) });
      }
      // a child carried in someone's arms or on their back is drawn by the carrier (people.json carried_by): boxed with them
      for (const [slug, f] of Object.entries(sec.people?.figures || {})) {
        const by = f.carried_by && here.get(f.carried_by), item = idx.items[`${S}.fig.${slug}`];
        if (by && item) out.push({ id: `${S}.fig.${slug}`, item, now: null, animal: false, alpha: by.alpha });
      }
    }
    return out;
  }

  // ------------------------------------------------------------ the view
  frameSize() { const r = this.viewEl.getBoundingClientRect(); return [r.width, r.height]; }
  defaultZoom() { const [, h] = this.frameSize(); return clamp(h / 900, 0.35, 0.9); } // painted people about 60-110 px tall
  zoomLimits() { const [, h] = this.frameSize(); return [Math.min(0.12, (h / 1800) * 0.6), 2.2]; }

  snap(first = false) {
    const y = this.you();
    if (!y) return this.redraw();
    if (first) this.view.z = this.defaultZoom(); // every opening starts at the readable zoom, on you
    this.view.u = y.u;
    this.view.v = y.v;
    this.redraw();
  }

  zoomBy(k, sx, sy) {
    const [w, h] = this.frameSize();
    const [zmin, zmax] = this.zoomLimits();
    const z1 = clamp(this.view.z * k, zmin, zmax);
    // keep the scan point under the cursor where it is (the centre for the buttons)
    const ox = (sx ?? w / 2) - w / 2, oy = (sy ?? h / 2) - h / 2;
    this.view.u += ox / this.view.z - ox / z1;
    this.view.v += oy / this.view.z - oy / z1;
    this.view.z = z1;
    this.clampView();
    this.redraw();
  }

  clampView() {
    const m = this.manifest;
    if (!m) return;
    this.view.u = clamp(this.view.u, 0, m.width);
    this.view.v = clamp(this.view.v, 0, m.height);
  }

  redraw() {
    if (!this.isOpen || this.raf) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; if (this.isOpen) this.draw(); });
  }

  draw() {
    const el = this.viewEl, dpr = Math.min(devicePixelRatio || 1, 2);
    const [w, h] = this.frameSize();
    if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) { el.width = Math.round(w * dpr); el.height = Math.round(h * dpr); }
    const ctx = el.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = MOUNT;
    ctx.fillRect(0, 0, w, h);
    const m = this.manifest, { u, v, z } = this.view;
    const X = (su) => (su - u) * z + w / 2, Y = (sv) => (sv - v) * z + h / 2;
    this.drawn = [];
    if (m) {
      // the silk's edge, then the strip as a soft placeholder, then the sharp tiles of the right level
      const px0 = X(0), py0 = Y(0), pw = m.width * z, ph = m.height * z;
      ctx.fillStyle = '#b9a47c';
      ctx.fillRect(px0, py0, pw, ph);
      if (this.strip) ctx.drawImage(this.strip, px0, py0, pw, ph);
      const L = clamp(Math.floor(Math.log2(1 / (z * dpr))), 0, m.levels.length - 1);
      this.drawTiles(ctx, L, X, Y, w, h);
      ctx.strokeStyle = 'rgba(20, 12, 6, 0.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px0, py0, pw, ph);
    }
    // the people round you: a box on each painted figure; a dot where a walker is now, a faint line to its figure
    const ppl = this.nearby();
    for (const n of ppl) {
      if (!n.item || n.noBox) continue;
      const [b0, b1, b2, b3] = n.item.b;
      const x0 = X(b0), y0 = Y(b1), x1 = X(b2), y1 = Y(b3);
      const hot = this.hover && this.hover.id === n.id;
      ctx.globalAlpha = hot ? 1 : n.alpha;
      bracket(ctx, x0, y0, x1, y1, n.animal, hot);
      ctx.globalAlpha = 1;
      this.drawn.push({ id: n.id, x0, y0, x1, y1, area: (x1 - x0) * (y1 - y0), tip: n.item });
    }
    for (const n of ppl) {
      if (!n.now) continue;
      const x = X(n.now.u), y = Y(n.now.v);
      if (n.item?.f) {
        const fx = X(n.item.f[0]), fy = Y(n.item.f[1]);
        if (Math.hypot(fx - x, fy - y) < 6) continue; // at the painted spot right now
        ctx.save();
        ctx.globalAlpha = n.alpha;
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = 'rgba(42, 36, 32, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(fx, fy); ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = n.alpha;
      dot(ctx, x, y, 3.6, INK);
      ctx.globalAlpha = 1;
      if (n.item) this.drawn.push({ id: n.id, x0: x - 7, y0: y - 7, x1: x + 7, y1: y + 7, area: 1, tip: { ...n.item, now: true } });
    }
    // the page's marks (ui/places.js hudMarks: a seal on each landmark you have reached; it may push hover tips to drawn)
    try { this.decorate?.('view', ctx, X, Y, this); } catch (err) { console.warn('hud marks:', err); }
    // you
    const me = this.you();
    if (me) {
      const x = X(me.u), y = Y(me.v);
      if (me.dir != null) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(me.dir);
        const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
        g.addColorStop(0, 'rgba(181, 50, 30, 0.55)');
        g.addColorStop(1, 'rgba(181, 50, 30, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 46, -0.5, 0.5); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(250, 242, 222, 0.85)';
      ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 2.2; ctx.strokeStyle = CINNABAR;
      ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.stroke();
      dot(ctx, x, y, 2.6, CINNABAR);
      const name = this.meta.get(me.section)?.name || '';
      this.drawn.push({ id: 'you', x0: x - 10, y0: y - 10, x1: x + 10, y1: y + 10, area: 0, tip: { n: 'you', w: name ? `Standing in ${sectionWords(name)}.` : '' } });
      this.secEl.textContent = this.titleFor?.(me.section, this.meta.get(me.section)) || sectionWords(name); // titleFor: the page's 繁體 region name (ui/index.js)
    }
    this.drawStrip(me);
    this.showTip();
  }

  drawTiles(ctx, L, X, Y, w, h) {
    const m = this.manifest, lv = m.levels[L], s = lv.scale, T = m.tile;
    const { u, v, z } = this.view;
    const u0 = u - w / 2 / z, u1 = u + w / 2 / z, v0 = v - h / 2 / z, v1 = v + h / 2 / z;
    const c0 = clamp(Math.floor(u0 / s / T), 0, lv.cols - 1), c1 = clamp(Math.floor(u1 / s / T), 0, lv.cols - 1);
    const r0 = clamp(Math.floor(v0 / s / T), 0, lv.rows - 1), r1 = clamp(Math.floor(v1 / s / T), 0, lv.rows - 1);
    const want = [];
    const stamp = performance.now();
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const key = `${L}/${c}_${r}`, t = this.tiles.get(key);
      const su = c * T * s, sv = r * T * s, tw = Math.min(T, lv.width - c * T) * s, th = Math.min(T, lv.height - r * T) * s;
      if (t) {
        t.used = stamp;
        // a hair of overlap hides the seams between tiles
        ctx.drawImage(t.bmp, X(su) - 0.25, Y(sv) - 0.25, tw * z + 0.5, th * z + 0.5);
      } else want.push({ key, d: Math.hypot(su + tw / 2 - u, sv + th / 2 - v) });
    }
    want.sort((a, b) => a.d - b.d);
    for (const { key } of want) {
      if (this.pending.size >= INFLIGHT) break;
      if (!this.pending.has(key)) this.fetchTile(key);
    }
  }

  fetchTile(key) {
    const ctl = new AbortController();
    this.pending.set(key, ctl);
    fetch(`${BASE}${key}.webp`, { signal: ctl.signal }).then((r) => r.blob()).then((b) => createImageBitmap(b)).then((bmp) => {
      if (!this.isOpen || ctl.signal.aborted) { bmp.close(); return; }
      this.tiles.set(key, { bmp, used: performance.now() });
      this.live++;
      // keep at most MAX_LIVE decoded tiles: drop the longest unused
      if (this.tiles.size > MAX_LIVE) {
        const old = [...this.tiles.entries()].sort((a, b) => a[1].used - b[1].used).slice(0, this.tiles.size - MAX_LIVE);
        for (const [k, t] of old) { t.bmp.close(); this.tiles.delete(k); this.live--; }
      }
    }).catch(() => {}).finally(() => { if (this.pending.get(key) === ctl) this.pending.delete(key); this.redraw(); });
  }

  // the whole scroll, thin: the built range clear and the rest veiled, the view's window, and you
  drawStrip(me) {
    const m = this.manifest, el = this.stripEl;
    if (!m) return;
    const dpr = Math.min(devicePixelRatio || 1, 2), w = el.getBoundingClientRect().width;
    const h = Math.max(16, Math.round((w * m.height) / m.width));
    if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) { el.width = Math.round(w * dpr); el.height = Math.round(h * dpr); el.style.height = `${h}px`; }
    const ctx = el.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const k = w / m.width, kv = h / m.height;
    if (this.strip) ctx.drawImage(this.strip, 0, 0, w, h); else { ctx.fillStyle = '#b9a47c'; ctx.fillRect(0, 0, w, h); }
    // the built range: the union of the sections' painted ranges
    const spans = [...this.meta.values()].map((j) => j.area).sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const s of spans) { const last = merged[merged.length - 1]; if (last && s[0] <= last[1] + 1) last[1] = Math.max(last[1], s[1]); else merged.push([...s]); }
    ctx.fillStyle = 'rgba(52, 38, 26, 0.5)';
    let x = 0;
    for (const [a, b] of merged) { ctx.fillRect(x, 0, a * k - x, h); x = b * k; }
    ctx.fillRect(x, 0, w - x, h);
    ctx.strokeStyle = 'rgba(250, 240, 215, 0.9)';
    ctx.lineWidth = 1.5;
    for (const [a, b] of merged) {
      ctx.beginPath();
      ctx.moveTo(a * k + 4, 1); ctx.lineTo(a * k + 1, 1); ctx.lineTo(a * k + 1, h - 1); ctx.lineTo(a * k + 4, h - 1);
      ctx.moveTo(b * k - 4, 1); ctx.lineTo(b * k - 1, 1); ctx.lineTo(b * k - 1, h - 1); ctx.lineTo(b * k - 4, h - 1);
      ctx.stroke();
    }
    try { this.decorate?.('strip', ctx, k, kv, h); } catch (err) { console.warn('hud marks:', err); } // the page's marks (ui/places.js)
    // the main view's window
    const [fw, fh] = this.frameSize(), { u, v, z } = this.view;
    ctx.strokeStyle = 'rgba(42, 36, 32, 0.9)';
    ctx.lineWidth = 1;
    ctx.strokeRect((u - fw / 2 / z) * k, Math.max(0.5, (v - fh / 2 / z) * kv), (fw / z) * k, Math.min(h - 1, (fh / z) * kv));
    if (me) {
      const mx = me.u * k, my = clamp(me.v * kv, 3, h - 3);
      ctx.fillStyle = CINNABAR;
      ctx.strokeStyle = 'rgba(250, 242, 222, 0.95)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(mx, my, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }

  // ------------------------------------------------------------ hover, tap, drag, wheel, pinch
  // what is under the pointer: in a crowd boxes overlap, so the one whose centre is nearest (for its size) wins; you and
  // the walkers' dots first
  pick(x, y) {
    let best = null, bs = Infinity;
    for (const d of this.drawn) {
      if (x < d.x0 || x > d.x1 || y < d.y0 || y > d.y1) continue;
      const score = d.area <= 1 ? -1 : Math.hypot(x - (d.x0 + d.x1) / 2, y - (d.y0 + d.y1) / 2) / Math.hypot(d.x1 - d.x0, d.y1 - d.y0);
      if (score < bs) { bs = score; best = d; }
    }
    return best;
  }

  showTip() {
    const t = this.tipEl, hv = this.hover;
    if (!hv) { t.style.display = 'none'; return; }
    const d = this.drawn.find((q) => q.id === hv.id && (hv.now ? q.tip.now : !q.tip.now)) || this.drawn.find((q) => q.id === hv.id);
    if (!d) { t.style.display = 'none'; return; }
    const it = d.tip;
    t.innerHTML = `<b>${esc(it.n)}${it.now ? ' (walking here now)' : ''}</b>${it.w ? esc(it.w) : ''}`;
    t.style.display = 'block';
    const [w, h] = this.frameSize(), tw = t.offsetWidth, th = t.offsetHeight;
    let x = d.x1 + 10, y = d.y0;
    if (x + tw > w) x = d.x0 - tw - 10;
    if (x < 4) x = clamp(d.x0, 4, w - tw - 4);
    y = clamp(y, 4, h - th - 4);
    t.style.left = `${x + 7}px`; // the frame's padding
    t.style.top = `${y + 7}px`;
  }

  bindView() {
    const el = this.viewEl, pts = new Map();
    let moved = 0, pinch = null;
    const local = (e) => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, local(e));
      moved = 0;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: this.view.z }; }
      el.classList.add('drag');
    });
    el.addEventListener('pointermove', (e) => {
      const p = local(e);
      if (!pts.has(e.pointerId)) {
        if (e.pointerType === 'mouse') { const d = this.pick(...p); const id = d && { id: d.id, now: !!d.tip.now }; if ((id?.id) !== this.hover?.id || id?.now !== this.hover?.now) { this.hover = id; this.redraw(); } }
        return;
      }
      const prev = pts.get(e.pointerId);
      pts.set(e.pointerId, p);
      if (pts.size === 1) {
        this.view.u -= (p[0] - prev[0]) / this.view.z;
        this.view.v -= (p[1] - prev[1]) / this.view.z;
        moved += Math.abs(p[0] - prev[0]) + Math.abs(p[1] - prev[1]);
        this.clampView();
        this.redraw();
      } else if (pts.size === 2 && pinch) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        moved += 10;
        this.zoomBy((pinch.z * d) / pinch.d / this.view.z, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      }
    });
    const up = (e) => {
      const p = pts.get(e.pointerId);
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (!pts.size) el.classList.remove('drag');
      // a tap (or a click without dragging) names what is under it
      if (p && moved < 6 && e.type === 'pointerup') { const d = this.pick(...p); this.hover = d && { id: d.id, now: !!d.tip.now }; this.redraw(); }
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !pts.size && this.hover) { this.hover = null; this.redraw(); } });
    el.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = local(e); this.zoomBy(Math.exp(-e.deltaY * 0.0015), x, y); }, { passive: false });
    el.addEventListener('dblclick', () => this.snap());
  }

  bindStrip() {
    const el = this.stripEl;
    let down = false;
    const go = (e) => {
      const r = el.getBoundingClientRect(), m = this.manifest;
      if (!m) return;
      this.view.u = clamp(((e.clientX - r.left) / r.width) * m.width, 0, m.width);
      this.view.v = clamp(((e.clientY - r.top) / r.height) * m.height, 0, m.height);
      this.redraw();
    };
    el.addEventListener('pointerdown', (e) => { down = true; el.setPointerCapture(e.pointerId); go(e); });
    el.addEventListener('pointermove', (e) => down && go(e));
    el.addEventListener('pointerup', () => { down = false; });
    el.addEventListener('pointercancel', () => { down = false; });
  }

  // for the tools: what the HUD holds right now
  stats() { return { open: this.isOpen, tiles: this.tiles.size, pending: this.pending.size, live: this.live, strip: !!this.strip, view: { ...this.view } }; }
}

// "城门: the city gate" -> "城门 · the city gate"
const sectionWords = (s) => s.replace(/:\s*/, ' · ');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function dot(ctx, x, y, r, fill) {
  ctx.fillStyle = 'rgba(250, 242, 222, 0.9)';
  ctx.beginPath(); ctx.arc(x, y, r + 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

// a box drawn as four corner brackets in ink on a paper halo (cinnabar when hovered); an animal's corners are rounder
function bracket(ctx, x0, y0, x1, y1, animal, hot) {
  const L = Math.max(5, Math.min(14, (x1 - x0) * 0.32, (y1 - y0) * 0.32));
  const path = () => {
    ctx.beginPath();
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x1, y1, -1, -1], [x0, y1, 1, -1]]) {
      ctx.moveTo(x + sx * L, y);
      if (animal) ctx.quadraticCurveTo(x, y, x, y + sy * L); else { ctx.lineTo(x, y); ctx.lineTo(x, y + sy * L); }
    }
  };
  ctx.lineCap = 'round';
  path(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(250, 242, 222, 0.7)'; ctx.stroke();
  path(); ctx.lineWidth = hot ? 2.2 : 1.3; ctx.strokeStyle = hot ? CINNABAR : INK; ctx.stroke();
  if (hot) { ctx.fillStyle = 'rgba(181, 50, 30, 0.08)'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
}
