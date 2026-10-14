// The bubbles over people's heads (gen/ui/STYLE.md §5, gen/life/progress.md): one pool of at most MAX_OPEN anchored
// bubbles, shared by the near conversations (talk.js, owner 'talk') and the street's own chatter and barks (chatter.js,
// owner 'chat'). The near talk wins: it takes a chat bubble's slot when the pool is full, and chat never takes one of
// its slots. Per frame: each open bubble's head is projected and its anchor moved (translate3d, no layout reads); two
// bubbles are pushed apart, or the older one stacked above, or on a phone with no room above only the newer one shown.
// A bubble's size is read once per line (show), never per frame.
// Also the shared helpers: headOf (a figure's head in the world), personsOf (a loaded section's people by slug).
import * as THREE from 'three';
import { speech, h } from './components.js';
import { prefs } from './prefs.js';

// Chinese plus English (the user, 2026-10-13; the pref is 3d-director-da's): 'zh' (default) or 'zh_en'
export const withEnglish = () => (prefs.get('lang') ?? 'zh') === 'zh_en';

export const MAX_OPEN = 2;
const v = new THREE.Vector3(), w = new THREE.Vector3();

// a figure's head in the world: its feet plus the current clip's hips height plus the head above the hips (people.js
// is read, never changed)
export function headOf(p, out = new THREE.Vector3()) {
  const info = p.model?.info || {}, base = p.model?.scene?.scale?.y || 1, k = p.root.scale.y / base;
  const height = (info.height_m || 1.65) * k;
  const clip = p.model?.clips?.find((c) => c.name === p.clip);
  let head = height;
  const hips = clip?.userData?.hipsY;
  if (hips != null && hips > 0) head = Math.min(height, (hips + 0.45 * (info.height_m || 1.65)) * k);
  else if (/sit|squat|kneel|doze|crouch|knees|sleep/.test(p.clip || '')) head = height * 0.66;
  return out.set(p.root.position.x, p.root.position.y + head + 0.1, p.root.position.z);
}

// a role's head (a carried child: over its carrier's head)
export function headOfRole(role, out) {
  if (role.p) return headOf(role.p, out);
  if (role.carrier) { headOf(role.carrier, out); out.y += 0.55; return out; }
  return null;
}

// a loaded section's people by slug, cached while the section and its list stay the same
const bySec = new WeakMap();
export function personsOf(sec) {
  if (!sec?.persons) return null;
  let c = bySec.get(sec);
  if (!c || c.n !== sec.persons.length) {
    c = { n: sec.persons.length, map: new Map(sec.persons.filter((p) => p?.id).map((p) => [p.id, p])) };
    bySec.set(sec, c);
  }
  return c.map;
}

// the people of a role table ({ key: { fig, name, carriedBy } }), found in their loaded section; cached on the holder
export function castOf(holder, sections) {
  const sec = sections().get(holder.section);
  const map = personsOf(sec);
  if (!map) { holder.rt = null; return null; }
  if (holder.rt?.sec === sec && holder.rt.n === map.size) return holder.rt;
  const roles = {};
  for (const [k, r] of Object.entries(holder.roles || {})) roles[k] = { ...r, p: map.get(r.fig) || null, carrier: r.carriedBy ? map.get(r.carriedBy) || null : null };
  holder.rt = { sec, n: map.size, roles };
  return holder.rt;
}

export const charCount = (s) => [...String(s).replace(/[，。、？！：；「」『』（）—…\s]/g, '')].length;
// how long a line stays: STYLE.md §12 (characters a second for short Chinese lines)
export const readSecs = (s) => Math.max(2.2, 1.0 + charCount(s) / 5.5);

export class Bubbles {
  // layer: the anchored layer; camera; touch; sfx(name, gain)
  constructor({ layer, camera, touch = false, sfx = () => {} }) {
    Object.assign(this, { layer, camera, touch, sfx });
    this.list = []; // { key, owner, head(out) -> Vector3|null, api, anchor, w, h, until, dist, name, think }
    this.t = 0;
    this.shown = 0; // bubbles opened (the checks)
    this.maxSeen = 0; // the most open at once (the checks: never above MAX_OPEN)
  }

  screen(p) {
    w.copy(p).project(this.camera);
    const x = ((w.x + 1) / 2) * innerWidth, y = ((1 - w.y) / 2) * innerHeight;
    const front = w.z < 1 && w.z > -1;
    return { x, y, front, on: front && x > -40 && x < innerWidth + 40 && y > -40 && y < innerHeight + 40 };
  }

  get(key) { return this.list.find((e) => e.key === key) || null; }
  count(owner) { return owner ? this.list.reduce((n, e) => n + (e.owner === owner), 0) : this.list.length; }
  free() { return MAX_OPEN - this.list.length; }

  // show a line over a head: the bubble with this key gets the new line; else a free slot; when full, 'talk' takes a
  // chat bubble's slot (then its own oldest); 'chat' never evicts here (chatter.js decides, nearest first). null when
  // there is no room.
  show({ key, owner, head, text, think = false, name = '', en = '', nameEn = '', until = Infinity, dist = 0, onTap = null, gain = 1 }) {
    if (!withEnglish()) en = '';
    let e = this.get(key);
    if (e) {
      e.api.set(text, think, en);
      this.list.splice(this.list.indexOf(e), 1);
      this.list.push(e);
    } else {
      if (this.list.length >= MAX_OPEN) {
        if (owner !== 'talk') return null;
        this.drop(this.list.find((x) => x.owner !== 'talk') || this.list[0]);
      }
      const api = speech({ text, think, name, en, nameEn: en ? nameEn : '' });
      const anchor = h('div', 'qm-anchor');
      anchor.style.visibility = 'hidden'; // until place() puts it over the head
      anchor.append(api.el);
      if (this.touch && onTap) { api.el.style.pointerEvents = 'auto'; api.el.addEventListener('click', (ev) => { ev.stopPropagation(); onTap(); }); }
      this.layer.append(anchor);
      e = { key, owner, api, anchor, name };
      this.list.push(e);
      this.shown++;
      this.maxSeen = Math.max(this.maxSeen, this.list.length);
    }
    Object.assign(e, { head, until, dist, think, text, owner });
    // its size, read once per line (the per-frame placing never reads layout)
    e.bw = e.api.el.offsetWidth;
    e.w = e.bw + (name ? 30 : 0);
    e.h = e.api.el.offsetHeight;
    this.sfx('bubble_tap', (think ? 0.5 : 0.8) * gain);
    return e;
  }

  drop(e) {
    if (!e) return;
    const i = this.list.indexOf(e);
    if (i >= 0) this.list.splice(i, 1);
    e.anchor.firstChild?.classList.add('qm-out');
    setTimeout(() => e.anchor.remove(), 400);
  }
  dropWhere(fn) { for (const e of this.list.filter(fn)) this.drop(e); }

  // per frame: lines whose time is up close; the open bubbles follow their heads
  update(dt) {
    this.t += dt;
    for (let i = this.list.length - 1; i >= 0; i--) if (this.list[i].until <= this.t) this.drop(this.list[i]);
    if (!this.list.length) return;
    this.camera.updateMatrixWorld(); // the follow camera moved this frame; render() would update it only later
    const TOP = this.touch || innerWidth < 640 ? 150 : 112;
    // keep a bubble readable at the edges: clamped inside the view; its top stays below the time instrument and toasts
    const clampX = (x, bw = 180) => Math.min(innerWidth - bw / 2 - 8, Math.max(bw / 2 + 34, x));
    const clampY = (y, bh = 0) => Math.min(innerHeight - 30, Math.max(TOP + bh, y));
    const pts = [];
    for (const e of this.list) {
      const at = e.head(v), s = at && this.screen(at);
      if (!s?.front) { if (e.anchor.style.visibility !== 'hidden') e.anchor.style.visibility = 'hidden'; continue; }
      pts.push({ e, x: clampX(s.x, e.w), y: clampY(s.y, e.h) });
    }
    // two bubbles must not overlap: push them apart along x; too far to share a row, stack the older one above; no
    // room above (a phone), only the newer line shows. The layout (row, stack, hide) holds (the user, 2026-10-13:
    // bubbles blinking while walking): it steps up at once when the bubbles would overlap, and steps back down only
    // with ROOM px to spare and after HOLD_S in its layout, so a pair at a threshold doesn't flip every frame
    if (pts.length === 2) {
      const ROOM = 24, HOLD_S = 0.6;
      const [a, b] = pts[0].x <= pts[1].x ? pts : [pts[1], pts[0]];
      const older = pts[0], newer = pts[1], key = `${older.e.key}|${newer.e.key}`;
      if (this.pair?.key !== key) this.pair = { key, mode: 'row', at: this.t };
      const pair = this.pair;
      // the row: pushed apart when they overlap by less than 260 px, eased in over the last ROOM px of height between
      // them (no sideways jump as one head bobs past the other's line); overlap left after the push (> 0: they touch)
      const vgap = (a.e.h + b.e.h) / 2 + 6 - Math.abs(a.y - b.y);
      const need = (a.e.w + b.e.w) / 2 + 34 - (b.x - a.x); // 34: room for the right one's name tag
      const k = Math.min(1, Math.max(0, (vgap + ROOM) / ROOM));
      let ax = a.x, bx = b.x;
      if (need > 0 && need < 260 && k > 0) { ax = clampX(a.x - (k * need) / 2, a.e.w); bx = clampX(b.x + (k * need) / 2, b.e.w); }
      const rowLeft = Math.min((a.e.w + b.e.w) / 2 + 34 - (bx - ax), vgap); // > 0: the row overlaps
      const stackY = Math.min(older.y, newer.y) - (newer.e.h + 8), stackRoom = stackY - (TOP + older.e.h); // >= 0: room above
      const settled = this.t - pair.at >= HOLD_S;
      let mode = pair.mode;
      if (mode === 'row' && rowLeft > 0) mode = stackRoom >= 0 ? 'stack' : 'hide';
      else if (mode === 'stack' && stackRoom < 0) mode = rowLeft > 0 ? 'hide' : 'row';
      else if (mode === 'stack' && settled && rowLeft < -ROOM) mode = 'row';
      else if (mode === 'hide' && this.t - pair.at >= 2 * HOLD_S && rowLeft < -2 * ROOM) mode = 'row'; // a hidden line comes back
      else if (mode === 'hide' && this.t - pair.at >= 2 * HOLD_S && stackRoom >= 2 * ROOM) mode = 'stack'; // with more to spare
      if (mode !== pair.mode) { pair.mode = mode; pair.at = this.t; }
      if (mode === 'row') { a.x = ax; b.x = bx; }
      else if (mode === 'stack') older.y = stackY;
      else older.hide = true;
    } else this.pair = null;
    for (const p of pts) {
      const anchor = p.e.anchor;
      if (p.hide) { if (anchor.style.visibility !== 'hidden') anchor.style.visibility = 'hidden'; p.e.box = null; continue; }
      if (anchor.style.visibility) anchor.style.visibility = '';
      const tf = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      if (anchor._tf !== tf) { anchor.style.transform = tf; anchor._tf = tf; } // still camera: no style write at all
      // where it is on screen (the overlap check reads this): the bubble sits centred over (x, y), its foot at y
      p.e.box = { x0: p.x - p.e.bw / 2 - (p.e.name ? 30 : 0), x1: p.x + p.e.bw / 2, y0: p.y - p.e.h, y1: p.y };
    }
    for (const e of this.list) if (!pts.some((p) => p.e === e)) e.box = null;
  }

  // the boxes on screen now (the checks: no two overlap)
  boxes() { return this.list.filter((e) => e.box).map((e) => ({ key: e.key, owner: e.owner, text: e.text, ...e.box })); }
  clear() { for (const e of [...this.list]) this.drop(e); }
}
