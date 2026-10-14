// Near conversations (gen/ui/STYLE.md "Talk"; design gen/life/design.md, distance 3 "close"): come within TALK_M of a
// scene's host figure and face it, and an ink prompt rises over its head (an E keycap; a seal to tap on touch screens).
// Interact, and the scene's beats play as speech or thought bubbles over each speaker's head, each with the speaker's
// name tag (their role in period words), at most two bubbles open at once (the pool in bubbles.js, shared with the
// street's chatter: the near talk wins). E (or a tap on a bubble) shows the whole line, then the next; Esc, or walking
// LEAVE_M away, closes it. Text only: voices wait for a provider.
// Depth (gen/life/progress.md): who you play changes the lines (kind(): 'guan' official, 'shi' scholar, 'seng' monk,
// 'fu' woman, 'tong' child, 'jun' soldier, 'li' labourer, 'min' anyone else): a beat's `as` gives the line for a kind,
// `only` / `not` keep a beat for some kinds; talking to the same host again plays its next `again` set.
// Read-only on the people: a figure is found by its slug in its loaded section's persons (people.js).
// Per frame: nothing but the bubbles' placing (bubbles.js); the search for a host runs every SCAN_S.
// The prompt holds still (steady.js; the user, 2026-10-13, labels blinking while walking): it rises inside TALK_M,
// FACE_DEG and the view, and stays until you are past KEEP_M or KEEP_DEG for a moment; a second host about as near
// doesn't take it over.
import * as THREE from 'three';
import { prompt as promptEl, h } from './components.js';
import { headOf, headOfRole, castOf, readSecs, withEnglish } from './bubbles.js';
import { Steady } from './steady.js';

export { headOf };
const TALK_M = 3.2, FACE_DEG = 60, KEEP_M = 4.0, KEEP_DEG = 78, LEAVE_M = 6.5, SCAN_S = 0.12, END_HOLD_S = 2.6, COOLDOWN_S = 1.0;
const v = new THREE.Vector3();

// the beats a talk plays for who you are: the n-th visit's set, beats kept for your kind, lines in your kind's words
export function beatsFor(scene, n, kind) {
  const sets = [scene.beats, ...(scene.again || []).map((a) => a.beats)];
  const set = n === 0 || sets.length === 1 ? sets[0] : sets[1 + ((n - 1) % (sets.length - 1))];
  return set
    .filter((b) => (!b.only || b.only.includes(kind)) && !(b.not && b.not.includes(kind)))
    .map((b) => (b.as?.[kind] ? { ...b, text: b.as[kind], en: b.asEn?.[kind] ?? b.en } : b));
}
export const stepOf = (scene, n) => (n === 0 || !scene.again?.length ? scene.step : scene.again[(n - 1) % scene.again.length]?.step ?? null);

export class Talk {
  // layer: the anchored layer; data: talk.json; sections(): the page's Map of loaded sections (name -> { persons });
  // player: { pos, yaw }; camera; bubbles (bubbles.js); sfx(name, gain); touch; kind(): who you play;
  // heard(key): a thread step overheard (the journal)
  constructor({ layer, data, sections, player, camera, bubbles, sfx = () => {}, touch = false, kind = () => 'min', heard = () => {} }) {
    Object.assign(this, { layer, sections, player, camera, bubbles, sfx, touch, kind, heard });
    this.scenes = (data?.scenes || []).map((s) => ({ ...s, rt: null }));
    this.acc = 0;
    this.t = 0;
    this.host = null; // { scene, p } the prompt is over
    this.conv = null; // the conversation playing: { scene, beats, i, next, ending }
    this.cool = 0;
    this.promptEl = null;
    this.steady = new Steady({ max: 1, showAfter: 0.1, hideAfter: 0.3, minOn: 0.6, minOff: 0.5, stick: 0.75 });
    this.visits = new Map(); // scene id -> times talked (this visit to the page)
    this.log = [];
  }

  // a section's talk (assets/ui/talk/<section>.json), added as the section streams in
  add(data) { for (const s of data?.scenes || []) if (!this.scenes.some((x) => x.id === s.id)) this.scenes.push({ ...s, rt: null }); }

  people(scene) { return castOf(scene, this.sections); }
  headOfRole(role, out) { return headOfRole(role, out); }
  screen(p) { return this.bubbles.screen(p); }

  update(dt) {
    this.t += dt;
    this.cool -= dt;
    if (this.conv) this.updateConv();
    this.acc += dt;
    if (this.acc >= SCAN_S) { this.acc = 0; this.scan(); }
    this.place();
  }

  // the nearest host within reach that you face (steady: tight gates to rise, loose ones to stay)
  scan() {
    if (this.conv || this.cool > 0) { this.steady.reset(); this.setHost(null); return; }
    const P = this.player.pos, fx = -Math.sin(this.player.yaw), fz = -Math.cos(this.player.yaw);
    const cands = [], hosts = new Map();
    for (const sc of this.scenes) {
      if (sc.X != null && Math.hypot(sc.X - P.x, -sc.D - P.z) > 30) continue;
      const rt = this.people(sc);
      const p = rt?.roles[sc.host]?.p;
      if (!p) continue;
      const q = p.root.position, dx = q.x - P.x, dz = q.z - P.z, d = Math.hypot(dx, dz), dy = Math.abs(q.y - P.y);
      if (d > KEEP_M || dy > 2) continue;
      const cos = d < 0.4 ? 1 : (dx * fx + dz * fz) / d;
      const s = this.screen(headOf(p, v));
      const ok = d <= TALK_M && dy <= 1.6 && cos >= Math.cos((FACE_DEG * Math.PI) / 180) && s.on;
      const keep = cos >= Math.cos((KEEP_DEG * Math.PI) / 180) && s.front;
      cands.push({ key: sc, score: d, ok, keep });
      hosts.set(sc, p);
    }
    const [sc] = this.steady.update(this.t, cands);
    this.setHost(sc && hosts.has(sc) ? { scene: sc, p: hosts.get(sc) } : null);
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

  open() { return this.conv ? this.bubbles.list.filter((e) => e.owner === 'talk') : []; }

  // E, or a tap on the prompt or a bubble
  interact() {
    if (this.conv) {
      const open = this.open(), last = open[open.length - 1];
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
    const n = this.visits.get(scene.id) || 0, kind = this.kind();
    this.visits.set(scene.id, n + 1);
    this.conv = { scene, beats: beatsFor(scene, n, kind), visit: n, i: -1, next: 0, ending: false };
    this.bubbles.dropWhere((e) => e.owner === 'chat'); // the near talk wins: the street's chatter makes room
    this.log.push([+this.t.toFixed(2), 'start', scene.id, n, kind]);
    const step = stepOf(scene, n);
    if (step) this.heard(step);
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
      if (c.i >= c.beats.length) { c.ending = true; c.next = this.t + END_HOLD_S; return; }
      const b = c.beats[c.i], role = rt.roles[b.who];
      const at = role && headOfRole(role, v);
      if (!at) continue; // its figure isn't loaded
      if (b.optional && !this.screen(at).on) continue; // e.g. the watchman on the tower, out of view
      this.say(b, role);
      return;
    }
  }

  say(b, role) {
    const c = this.conv;
    const key = `talk:${c.scene.id}:${b.who}`;
    this.bubbles.show({ key, owner: 'talk', head: (out) => headOfRole(role, out), text: b.text, think: b.think, name: role.name,
      en: b.en, nameEn: role.nameEn, onTap: () => this.interact() });
    c.next = this.t + readSecs(b.text) + (b.en && withEnglish() ? 1.2 : 0);
    this.log.push([+this.t.toFixed(2), b.think ? 'think' : 'say', b.who, b.text]);
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
    this.bubbles.dropWhere((e) => e.owner === 'talk');
    this.conv = null;
    this.cool = COOLDOWN_S;
    this.log.push([+this.t.toFixed(2), 'close', c.scene.id]);
  }

  // per frame: the prompt follows its host's head (the bubbles are placed by bubbles.js)
  place() {
    if (!this.promptEl || !this.host) return;
    this.camera.updateMatrixWorld();
    const TOP = this.touch || innerWidth < 640 ? 150 : 112;
    const s = this.screen(headOf(this.host.p, v));
    if (!s.front) { this.promptEl.style.visibility = 'hidden'; return; }
    const x = Math.min(innerWidth - 68, Math.max(94, s.x)), y = Math.min(innerHeight - 30, Math.max(TOP + 40, s.y));
    if (this.promptEl.style.visibility) this.promptEl.style.visibility = '';
    const tf = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    if (this.promptEl._tf !== tf) { this.promptEl.style.transform = tf; this.promptEl._tf = tf; }
  }

  // where each role's head is on the screen now (the kit's stills, the checks)
  headsOf(id) {
    const sc = this.scenes.find((s) => s.id === id), rt = sc && this.people(sc);
    if (!rt) return null;
    this.camera.updateMatrixWorld();
    const out = {};
    for (const [k, r] of Object.entries(rt.roles)) { const at = headOfRole(r, v); if (at) { const s = this.screen(at); out[k] = { x: Math.round(s.x), y: Math.round(s.y), on: s.on }; } }
    return out;
  }

  state() {
    const c = this.conv;
    return {
      host: this.host?.scene.id || null,
      prompt: !!this.promptEl,
      conv: c ? { scene: c.scene.id, visit: c.visit, beat: c.i, beats: c.beats.length, open: this.open().map((o) => ({ who: o.key.split(':').pop(), name: o.name, text: o.api.el.querySelector('.qm-bubble')?.getAttribute('aria-label') })), ending: c.ending } : null,
      log: this.log.slice(-30),
    };
  }
}
