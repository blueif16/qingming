// Intent marks (gen/life/design.md, distance 1 "far"; gen/ui/STYLE.md §5): a small paper disc with an ink pictogram over
// a figure whose group is up to something (one of its exchanges is playing), seen from beyond earshot: further than the
// chatter's showM and within its wakeM, on screen, not behind a wall (one BVH ray per candidate per scan), at most the
// tier's `marks` (detail.talk: 0 low, 4 mid, 6 high) nearest first. It tells you who is up to something across the
// street; walk closer and their words appear. Data: a chatter group's `mark` (a pictogram below).
// Per frame: one projection and one transform per mark shown; the choice runs with the chatter's scan.
import * as THREE from 'three';
import { h } from './components.js';
import { headOfRole } from './bubbles.js';

// the pictograms: ink strokes on a 28-unit square (currentColor), each a painted thing of the scroll
const S = (d, extra = '') => `<svg viewBox="0 0 28 28" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${d}</g>${extra}</svg>`;
export const PICTOS = {
  coin: S('<circle cx="14" cy="14" r="9"/><rect x="11" y="11" width="6" height="6"/>'), // a square-holed cash coin
  scale: S('<path d="M4 9 H24"/><path d="M8 9 V14"/><path d="M5 14 Q8 19 11 14 Z"/><path d="M20 9 V12"/><rect x="18" y="12" width="4" height="5" rx="1"/>'), // the steelyard
  bow: S('<path d="M8 4 Q22 14 8 24"/><path d="M8 4 L8 24" stroke-width="1.2"/><path d="M8 14 H23 M20 11 L23 14 L20 17"/>'),
  paper: S('<path d="M7 5 H19 L22 8 V23 H7 Z"/><path d="M10 10 H18 M10 14 H19 M10 18 H16"/>'), // a manifest, a notice
  zzz: S('<path d="M5 9 H11 L5 15 H11"/><path d="M13 14 H18 L13 19 H18"/><path d="M19 4 H23 L19 8 H23"/>'),
  alarm: S('<path d="M9 5 V16"/><path d="M15 9 Q15 5 19 5 Q23 5 23 9 Q23 12 19 13 V16"/>', '<circle cx="9" cy="21.5" r="1.7" fill="currentColor"/><circle cx="19" cy="21.5" r="1.7" fill="currentColor"/>'), // !?
  cup: S('<path d="M6 8 H22 Q21 16 14 17 Q7 16 6 8 Z"/><path d="M14 17 V22 M9 23 H19"/>'), // a wine cup
  sack: S('<path d="M10 7 Q14 9 18 7"/><path d="M11 8 Q4 14 7 21 Q14 25 21 21 Q24 14 17 8"/><path d="M12 5 L14 7 L16 5"/>'), // a grain sack
  book: S('<path d="M4 7 Q9 5 14 8 Q19 5 24 7 V21 Q19 19 14 22 Q9 19 4 21 Z"/><path d="M14 8 V22"/>'),
  boat: S('<path d="M3 16 Q14 22 25 16"/><path d="M5 16 H23"/><path d="M14 16 V4 L21 12 H14"/>'),
  voice: S('<path d="M7 10 Q10 14 7 18"/><path d="M12 7 Q17 14 12 21"/><path d="M17 4 Q24 14 17 24"/>'), // a voice carrying: the storyteller, a hawker
  flower: S('<path d="M14 24 V12"/><path d="M14 16 Q9 15 8 11 M14 14 Q19 13 20 9"/><circle cx="14" cy="8" r="3"/>'), // a sprig of flowers
  fan: S('<circle cx="14" cy="11" r="7"/><path d="M14 18 V25"/>'), // a round fan
  wheel: S('<circle cx="14" cy="14" r="9"/><circle cx="14" cy="14" r="2"/><path d="M14 5 V23 M5 14 H23 M8 8 L20 20 M20 8 L8 20"/>'), // a cart wheel
  rope: S('<path d="M4 20 Q9 8 14 14 Q19 20 24 8"/><path d="M22 6 L24 8 L21 10"/>'), // a tow rope, a line thrown
  bowl: S('<path d="M5 12 H23 Q22 20 14 21 Q6 20 5 12 Z"/><path d="M9 9 Q11 6 9 3 M14 9 Q16 6 14 3 M19 9 Q21 6 19 3" stroke-width="1.5"/>'), // a steaming bowl
};

const v = new THREE.Vector3(), dir = new THREE.Vector3(), ray = new THREE.Ray();

export class Marks {
  // layer: the anchored layer; chatter (chatter.js); camera; player: { pos }; bvh(): the walkable world's collider
  constructor({ layer, chatter, camera, player, bvh = () => null }) {
    Object.assign(this, { layer, chatter, camera, player, bvh });
    this.shown = new Map(); // group -> { el, role }
  }

  hiddenBehindWall(at) {
    const b = this.bvh?.();
    if (!b) return false;
    dir.copy(at).sub(this.camera.position);
    const L = dir.length();
    ray.set(this.camera.position, dir.multiplyScalar(1 / L));
    const hit = b.raycastFirst(ray, THREE.DoubleSide);
    return !!hit && hit.distance < L - 1;
  }

  // with the chatter's scan: which groups get a mark now
  choose(silent = false) {
    const C = this.chatter, n = C.cfg.marks || 0, P = this.player.pos;
    const want = new Map();
    if (n > 0 && !silent) {
      const cands = [];
      for (const g of C.groups) {
        if (!g.mark || !g.st?.cur) continue;
        const role = g.st.cur.role || Object.values(g.rt?.roles || {})[0];
        if (!role || !headOfRole(role, v)) continue;
        const d = Math.hypot(v.x - P.x, v.z - P.z);
        if (d <= C.cfg.showM + 1 || d > C.cfg.wakeM) continue;
        if (!this.chatter.bubbles.screen(v).on) continue;
        cands.push({ g, role, d, at: v.clone() });
      }
      cands.sort((a, b) => a.d - b.d);
      for (const c of cands) {
        if (want.size >= n) break;
        if (this.hiddenBehindWall(c.at)) continue;
        want.set(c.g, c.role);
      }
    }
    for (const [g, m] of this.shown) if (!want.has(g)) { m.el.classList.add('qm-out'); setTimeout(() => m.el.remove(), 600); this.shown.delete(g); }
    for (const [g, role] of want) {
      const m = this.shown.get(g);
      if (m) { m.role = role; continue; }
      const el = h('div', 'qm-anchor qm-mark-a', {}, [h('span', 'qm-mark', { html: PICTOS[g.mark] || PICTOS.voice, 'aria-hidden': 'true' })]);
      el.style.visibility = 'hidden';
      this.layer.append(el);
      this.shown.set(g, { el, role });
    }
  }

  // per frame: each mark over its figure's head
  update() {
    if (!this.shown.size) return;
    for (const [, m] of this.shown) {
      const at = headOfRole(m.role, v);
      const s = at && this.chatter.bubbles.screen(at.setY(at.y + 0.35));
      if (!s?.front) { if (m.el.style.visibility !== 'hidden') m.el.style.visibility = 'hidden'; continue; }
      if (m.el.style.visibility) m.el.style.visibility = '';
      const tf = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
      if (m.el._tf !== tf) { m.el.style.transform = tf; m.el._tf = tf; }
    }
  }

  clear() { for (const [, m] of this.shown) m.el.remove(); this.shown.clear(); }
  state() { return [...this.shown.keys()].map((g) => ({ id: g.id, mark: g.mark })); }
}
