// Near conversations (gen/ui/STYLE.md "Talk"; design gen/life/design.md, distance 3 "close"): come within TALK_M of a
// scene's host figure and face it, and an ink prompt rises over its head (an E keycap; a seal to tap on touch screens).
// Interact, and the scene's beats play as speech or thought bubbles over each speaker's head, each with the speaker's
// name tag (their role in period words), at most two bubbles open at once. E (or a tap on a bubble) shows the whole
// line, then the next; Esc, or walking LEAVE_M away, closes it. Text only: voices wait for a provider.
// Read-only on the people: a figure is found by its slug in its loaded section's persons (people.js), and its head is
// its feet plus the current clip's hips height plus the head above the hips. Nothing in people.js is changed.
// Per frame: the open bubbles' and the prompt's screen positions (a projection and a transform each); the search for
// a host runs every SCAN_S.
import * as THREE from 'three';
import { speech, prompt as promptEl, h } from './components.js';

const TALK_M = 3.2, FACE_DEG = 60, LEAVE_M = 6.5, SCAN_S = 0.12, MAX_OPEN = 2, END_HOLD_S = 2.6, COOLDOWN_S = 1.0;
const READ_CPS = 5.5; // characters a second (Chinese reading pace for short lines)
const v = new THREE.Vector3(), w = new THREE.Vector3();

export function headOf(p, out = new THREE.Vector3()) {
  const info = p.model?.info || {}, base = p.model?.scene?.scale?.y || 1, k = p.root.scale.y / base;
  const height = (info.height_m || 1.65) * k;
  const clip = p.model?.clips?.find((c) => c.name === p.clip);
  let head = height;
  const hips = clip?.userData?.hipsY;
  if (hips != null && hips > 0) head = Math.min(height, (hips + 0.45 * (info.height_m || 1.65)) * k);
  else if (/sit|squat|kneel|doze|crouch|knees/.test(p.clip || '')) head = height * 0.66;
  return out.set(p.root.position.x, p.root.position.y + head + 0.1, p.root.position.z);
}

export class Talk {
  // layer: the anchored layer; data: talk.json; sections(): the page's Map of loaded sections (name -> { persons });
  // player: { pos, yaw }; camera; sfx(name, gain); touch: bool; blocked(): true while the HUD is open
  constructor({ layer, data, sections, player, camera, sfx = () => {}, touch = false }) {
    Object.assign(this, { layer, sections, player, camera, sfx, touch });
    this.scenes = (data?.scenes || []).map((s) => ({ ...s, rt: null }));
    this.acc = 0;
    this.t = 0;
    this.host = null; // { scene, p } the prompt is over
    this.conv = null; // the conversation playing: { scene, i, open: [{ who, p, api, anchor }], next, ending }
    this.cool = 0;
    this.promptEl = null;
    this.log = [];
  }

  // the scene's people, found by slug in its section's persons (cached while that section stays loaded)
  people(scene) {
    const sec = this.sections().get(scene.section);
    if (!sec?.persons) { scene.rt = null; return null; }
    if (scene.rt?.sec === sec) return scene.rt;
    const bySlug = new Map(sec.persons.filter((p) => p?.id).map((p) => [p.id, p]));
    const roles = {};
    for (const [k, r] of Object.entries(scene.roles)) roles[k] = { ...r, p: bySlug.get(r.fig) || null, carrier: r.carriedBy ? bySlug.get(r.carriedBy) || null : null };
    scene.rt = { sec, roles };
    return scene.rt;
  }

  // a role's head in the world (a carried child: over its carrier's head)
  headOfRole(role, out) {
    if (role.p) return headOf(role.p, out);
    if (role.carrier) { headOf(role.carrier, out); out.y += 0.55; return out; }
    return null;
  }

  // screen position of a world point: { x, y, on } (on: in front of the camera and inside the view, with a margin)
  screen(p) {
    w.copy(p).project(this.camera);
    const x = ((w.x + 1) / 2) * innerWidth, y = ((1 - w.y) / 2) * innerHeight;
    const front = w.z < 1 && w.z > -1;
    return { x, y, front, on: front && x > -40 && x < innerWidth + 40 && y > -40 && y < innerHeight + 40 };
  }

  update(dt) {
    this.t += dt;
    this.cool -= dt;
    if (this.conv) this.updateConv();
    this.acc += dt;
    if (this.acc >= SCAN_S) { this.acc = 0; this.scan(); }
    this.place();
  }

  // the nearest host within reach that you face
  scan() {
    if (this.conv || this.cool > 0) { this.setHost(null); return; }
    const P = this.player.pos, fx = -Math.sin(this.player.yaw), fz = -Math.cos(this.player.yaw);
    let best = null, bd = Infinity;
    for (const sc of this.scenes) {
      if (sc.X != null && Math.hypot(sc.X - P.x, -sc.D - P.z) > 30) continue;
      const rt = this.people(sc);
      const p = rt?.roles[sc.host]?.p;
      if (!p) continue;
      const q = p.root.position, dx = q.x - P.x, dz = q.z - P.z, d = Math.hypot(dx, dz);
      if (d > TALK_M || Math.abs(q.y - P.y) > 1.6 || d >= bd) continue;
      const cos = d < 0.4 ? 1 : (dx * fx + dz * fz) / d;
      if (cos < Math.cos((FACE_DEG * Math.PI) / 180)) continue;
      if (!this.screen(headOf(p, v)).on) continue;
      best = { scene: sc, p }; bd = d;
    }
    this.setHost(best);
  }

  setHost(hst) {
    if ((hst?.scene || null) === (this.host?.scene || null)) { this.host = hst; return; }
    this.host = hst;
    this.promptEl?.remove();
    this.promptEl = null;
    if (!hst) return;
    const el = promptEl({ touch: this.touch, onTap: () => this.interact() });
    const anchor = h('div', 'qm-anchor');
    anchor.style.visibility = 'hidden';
    anchor.append(el);
    this.layer.append(anchor);
    this.promptEl = anchor;
    this.sfx('bubble_tap', 0); // warm the tap sound (decoded on first use)
  }

  // E, or a tap on the prompt or a bubble
  interact() {
    if (this.conv) {
      const last = this.conv.open[this.conv.open.length - 1];
      if (last?.api.revealing()) { last.api.finish(); return true; }
      if (this.conv.ending) { this.close(); return true; }
      this.next();
      return true;
    }
    if (!this.host) return false;
    this.start(this.host.scene);
    return true;
  }

  start(scene) {
    if (!this.people(scene)) return false;
    this.setHost(null);
    this.conv = { scene, i: -1, open: [], next: 0, ending: false };
    this.log.push([+this.t.toFixed(2), 'start', scene.id]);
    this.next();
    return true;
  }

  next() {
    const c = this.conv;
    if (!c) return;
    const rt = this.people(c.scene);
    if (!rt) { this.close(); return; }
    for (;;) {
      c.i++;
      if (c.i >= c.scene.beats.length) { c.ending = true; c.next = this.t + END_HOLD_S; return; }
      const b = c.scene.beats[c.i], role = rt.roles[b.who];
      const at = role && this.headOfRole(role, v);
      if (!at) continue; // its figure isn't loaded
      if (b.optional && !this.screen(at).on) continue; // e.g. the watchman on the tower, out of view
      this.say(b, role);
      return;
    }
  }

  say(b, role) {
    const c = this.conv;
    let o = c.open.find((x) => x.who === b.who);
    if (o) {
      o.api.set(b.text, b.think);
      c.open.splice(c.open.indexOf(o), 1);
      c.open.push(o);
    } else {
      while (c.open.length >= MAX_OPEN) this.drop(c.open.shift());
      const api = speech({ text: b.text, think: b.think, name: role.name });
      const anchor = h('div', 'qm-anchor');
      anchor.style.visibility = 'hidden'; // until place() puts it over the head
      anchor.append(api.el);
      if (this.touch) { api.el.style.pointerEvents = 'auto'; api.el.addEventListener('click', (e) => { e.stopPropagation(); this.interact(); }); }
      this.layer.append(anchor);
      o = { who: b.who, role, api, anchor };
      c.open.push(o);
    }
    // its size, read once per line (the per-frame placing never reads layout)
    o.w = o.api.el.offsetWidth + (o.role.name ? 30 : 0);
    o.h = o.api.el.offsetHeight;
    const n = [...b.text.replace(/[，。、？！：；「」『』—…\s]/g, '')].length;
    c.next = this.t + Math.max(2.2, 1.0 + n / READ_CPS);
    this.sfx('bubble_tap', b.think ? 0.5 : 0.8);
    this.log.push([+this.t.toFixed(2), b.think ? 'think' : 'say', b.who, b.text]);
  }

  drop(o) {
    if (!o) return;
    o.anchor.firstChild?.classList.add('qm-out');
    setTimeout(() => o.anchor.remove(), 400);
  }

  updateConv() {
    const c = this.conv, rt = this.people(c.scene);
    const host = rt?.roles[c.scene.host];
    const P = this.player.pos, q = host?.p?.root.position;
    if (!q || Math.hypot(q.x - P.x, q.z - P.z) > LEAVE_M) { this.close(); return; }
    if (this.t >= c.next) { if (c.ending) this.close(); else this.next(); }
  }

  close() {
    const c = this.conv;
    if (!c) return;
    for (const o of c.open) this.drop(o);
    this.conv = null;
    this.cool = COOLDOWN_S;
    this.log.push([+this.t.toFixed(2), 'close', c.scene.id]);
  }

  // per frame: the open bubbles and the prompt follow their heads
  place() {
    if (!this.conv && !this.promptEl) return;
    this.camera.updateMatrixWorld(); // the follow camera moved this frame; render() would update it only later
    const show = (anchor, x, y) => {
      if (anchor.style.visibility) anchor.style.visibility = '';
      const tf = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      if (anchor._tf !== tf) { anchor.style.transform = tf; anchor._tf = tf; } // still camera: no style write at all
    };
    // keep a bubble readable at the edges: clamped inside the view (its top can't leave the screen)
    const clampX = (x, w = 180) => Math.min(innerWidth - w / 2 - 8, Math.max(w / 2 + 34, x));
    // a bubble's top stays below the sundial and the toasts: its foot at least TOP + its height down
    const TOP = this.touch || innerWidth < 640 ? 150 : 112;
    const clampY = (y, h = 0) => Math.min(innerHeight - 30, Math.max(TOP + h, y));
    if (this.conv) {
      const pts = [];
      for (const o of this.conv.open) {
        const at = this.headOfRole(o.role, v), s = at && this.screen(at);
        if (!s?.front) { o.anchor.style.visibility = 'hidden'; continue; }
        pts.push({ o, x: clampX(s.x, o.w), y: clampY(s.y, o.h) });
      }
      // two bubbles side by side must not overlap: push them apart along x (sizes measured once per line, in say())
      if (pts.length === 2) {
        const [a, b] = pts[0].x <= pts[1].x ? pts : [pts[1], pts[0]];
        const need = (a.o.w + b.o.w) / 2 + 34 - (b.x - a.x); // 34: room for the right one's name tag
        const vert = Math.abs(a.y - b.y) < (a.o.h + b.o.h) / 2;
        if (need > 0 && vert) {
          if (need < 260) { a.x = clampX(a.x - need / 2, a.o.w); b.x = clampX(b.x + need / 2, b.o.w); }
          // too far to share a row, or the screen's edges stopped the push (a phone): stack the older one above
          if ((a.o.w + b.o.w) / 2 + 34 - (b.x - a.x) > 0) {
            const older = pts[0], newer = pts[1], y = Math.min(older.y, newer.y) - (newer.o.h + 8);
            if (y >= TOP + older.o.h) older.y = y;
            else { older.hide = true; } // no room above (a phone): only the newer line shows
          }
        }
      }
      for (const p of pts) { if (p.hide) p.o.anchor.style.visibility = 'hidden'; else show(p.o.anchor, p.x, p.y); }
    }
    if (this.promptEl && this.host) {
      const s = this.screen(headOf(this.host.p, v));
      if (!s.front) this.promptEl.style.visibility = 'hidden';
      else show(this.promptEl, clampX(s.x, 120), clampY(s.y, 40));
    }
  }

  // where each role's head is on the screen now (the kit's stills, the checks)
  headsOf(id) {
    const sc = this.scenes.find((s) => s.id === id), rt = sc && this.people(sc);
    if (!rt) return null;
    this.camera.updateMatrixWorld();
    const out = {};
    for (const [k, r] of Object.entries(rt.roles)) { const at = this.headOfRole(r, v); if (at) { const s = this.screen(at); out[k] = { x: Math.round(s.x), y: Math.round(s.y), on: s.on }; } }
    return out;
  }

  state() {
    const c = this.conv;
    return {
      host: this.host?.scene.id || null,
      prompt: !!this.promptEl,
      conv: c ? { scene: c.scene.id, beat: c.i, open: c.open.map((o) => ({ who: o.who, name: o.role.name, text: o.api.el.querySelector('.qm-bubble')?.getAttribute('aria-label') })), ending: c.ending } : null,
      log: this.log.slice(-30),
    };
  }
}
