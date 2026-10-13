// Place notifications (gen/ui/STYLE.md "Place notifications"), two tiers:
//  (a) the region banner, when you walk into a section of another region: its name large, a brush, a seal (~3.6 s);
//  (b) a landmark toast, when you come near a mapped landmark: a paper slip top right with its name and one line from
//      the painting's reading (~5 s).
// Data: assets/ui/places.json (tools/ui_data.mjs from sections/*/places.json). Positions are the map's (X east, D north).
// Triggers, with hysteresis so nothing spams: the region follows the page's own "your section" (it changes only well
// inside the next section) and a region is not announced again within REGION_AGAIN s; a landmark fires on entering its
// radius r, re-arms only after you leave r * 1.5 + 3 m, and waits LANDMARK_AGAIN s before it can fire again. One toast
// at a time, at most two waiting; toasts wait while the banner shows.
import * as THREE from 'three';
import { regionBanner, landmarkToast, plaque, h } from './components.js';

const REGION_AGAIN = 120, LANDMARK_AGAIN = 240;
const BANNER_S = 3.8, TOAST_S = 5.2, FADE_MS = 600, CHECK_S = 0.25;
// plaques: the landmarks within PLAQUE_M of you that are in view, the nearest MAX_PLAQUES of them (anchored DOM, so few)
const PLAQUE_M = 30, MAX_PLAQUES = 3;
const pv = new THREE.Vector3(), ray = new THREE.Ray(), dir = new THREE.Vector3();

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

export class Places {
  // layer: { banner: el, toasts: el }; data: places.json; current(): your section's folder name; where(): { X, D, H };
  // sfx(name, gain)
  // bvh(): the walkable world's collider (player.bvh), to hide a plaque behind a wall (a ray per candidate per check)
  constructor({ layer, data, current, where, sfx = () => {}, camera = null, bvh = () => null }) {
    Object.assign(this, { layer, data, current, where, sfx, camera, bvh });
    this.plaques = new Map(); // landmark -> { anchor, gone }
    this.t = 0;
    this.acc = 0;
    this.region = null; // the region id you are in
    this.shownRegion = new Map(); // region id -> t last shown
    this.lm = (data?.landmarks || []).map((m) => ({ ...m, armed: true, last: -Infinity }));
    this.queue = [];
    this.banner = null; // { el, until }
    this.toast = null;
    this.paused = 0; // seconds before landmarks are checked (after the start banner)
    this.log = []; // what fired, for the checks: [t, kind, id]
  }

  regionOf(folder) { return this.data?.regions?.[folder] || null; }

  update(dt) {
    this.t += dt;
    this.place();
    if (this.banner && this.t > this.banner.until) { this.fade(this.banner.el); this.banner = null; }
    if (this.toast && this.t > this.toast.until) { this.fade(this.toast.el); this.toast = null; this.gapUntil = this.t + 0.5; }
    if (!this.banner && !this.toast && this.queue.length && !(this.gapUntil > this.t)) this.showToast(this.queue.shift());
    this.acc += dt;
    if (this.acc < CHECK_S) return;
    this.acc = 0;
    // (a) the region
    const r = this.regionOf(this.current());
    if (r && r.id !== this.region) {
      this.region = r.id;
      const last = this.shownRegion.get(r.id) ?? -Infinity;
      if (this.t - last > REGION_AGAIN) this.showBanner(r);
    }
    // (b) landmarks
    const at = this.where();
    if (!at) return;
    this.choosePlaques(at);
    if (this.paused > 0) { this.paused -= CHECK_S; return; }
    for (const m of this.lm) {
      const d = distTo(m, at.X, at.D) + Math.max(0, Math.abs((at.H ?? 0) - (m.H ?? 0)) - 3); // up on the tower is not at its foot
      if (d < m.r) {
        if (m.armed && this.t - m.last > LANDMARK_AGAIN) {
          m.armed = false;
          m.last = this.t;
          if (!this.queue.includes(m) && this.toast?.m !== m) { this.queue.push(m); if (this.queue.length > 2) this.queue.shift(); }
        }
      } else if (d > m.r * 1.5 + 3) m.armed = true;
    }
  }

  // the plaques worth hanging now: near, in front of the camera, nearest first
  choosePlaques(at) {
    if (!this.camera || !this.layer.anchors) return;
    const want = [];
    for (const m of this.lm) {
      const d = distTo(m, at.X, at.D);
      if (d > PLAQUE_M || d < 1.5) continue; // standing under it you see its toast instead
      const s = this.screen(m);
      if (!s.on || this.hidden(m)) continue;
      want.push([d, m]);
    }
    want.sort((a, b) => a[0] - b[0]);
    const keep = new Set(want.slice(0, MAX_PLAQUES).map(([, m]) => m));
    for (const [m, p] of this.plaques) if (!keep.has(m) && !p.gone) { p.gone = true; p.el.classList.add('qm-gone'); setTimeout(() => { if (p.gone) { p.anchor.remove(); this.plaques.delete(m); } }, 400); }
    for (const m of keep) {
      const p = this.plaques.get(m);
      if (p) { if (p.gone) { p.gone = false; p.el.classList.remove('qm-gone'); } continue; }
      const el = plaque(m), anchor = h('div', 'qm-anchor');
      anchor.append(el);
      anchor.style.visibility = 'hidden';
      this.layer.anchors.append(anchor);
      this.plaques.set(m, { anchor, el, gone: false });
    }
    this.place();
  }

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
      const under = B && s.x > B.left - 30 && s.x < B.right + 30 && s.y - 150 < B.bottom;
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
      if (this.toast.until - this.t > TOAST_S - 2) this.queue.unshift(this.toast.m);
      this.fade(this.toast.el, 150);
      this.toast = null;
    }
    const el = regionBanner(r);
    this.layer.banner.append(el);
    this.banner = { el, until: this.t + BANNER_S, r };
    this.shownRegion.set(r.id, this.t);
    this.paused = Math.max(this.paused, 1.5);
    this.log.push([+this.t.toFixed(2), 'region', r.id]);
    setTimeout(() => this.sfx('bubble_tap', 0.55), 1050); // the seal lands
  }

  showToast(m) {
    const el = landmarkToast(m);
    this.layer.toasts.append(el);
    this.toast = { el, until: this.t + TOAST_S, m };
    this.log.push([+this.t.toFixed(2), 'landmark', m.id]);
    setTimeout(() => this.sfx('bubble_tap', 0.45), 260);
  }

  fade(el, ms = FADE_MS) {
    el.classList.add('qm-out');
    el.style.transitionDuration = `${ms}ms`;
    setTimeout(() => el.remove(), ms + 50);
  }

  // for the kit and the checks
  fireRegion(folder) { const r = this.regionOf(folder); if (r) this.showBanner(r); return !!r; }
  fireLandmark(id) {
    const m = this.lm.find((x) => x.id === id);
    if (!m) return false;
    if (this.toast) { this.fade(this.toast.el, 100); this.toast = null; }
    if (this.banner) this.queue.unshift(m); else this.showToast(m); // as in play: toasts wait for the banner
    return true;
  }
  state() {
    return { region: this.region, banner: this.banner?.r?.name || null, toast: this.toast?.m?.name || null, queue: this.queue.map((m) => m.id),
      plaques: [...this.plaques].filter(([, p]) => !p.gone).map(([m]) => m.name), log: this.log.slice(-20) };
  }
}
