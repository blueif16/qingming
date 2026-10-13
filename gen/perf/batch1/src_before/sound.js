// Sound for the world page (gen/life/design.md; skill `sounds`; what plays where is sounds/rules.json, shipped with
// the files as assets/sounds/sounds.json by tools/sound_web.mjs). Messenger's way: loops run and only their volumes
// move; nothing is a three.js PositionalAudio (its HRTF panner per object would cost too much for 900 people).
//   - Distance: every source has a radius (rules `range`). Within it you hear it plainly; past it, it keeps fading
//     (the panner's inverse law with refDistance = radius/4: -12 dB at the radius, -24 dB at four times it) and is
//     never cut at an edge: it leaves only when it has faded under the floor, or softly at the reach (80 m).
//   - Beds: each loaded section's day and night backgrounds, weighted smoothly by how far you stand from its painted
//     area (the nearest section never drops below a floor, so there is always a background), and by the hour (the
//     viewer's local clock). The crowd beds follow how many painted people stand round you (the murmur of a busy
//     street, quieter where it thins); the nature beds fill in where the crowd thins. Under a roof, a gate passage or
//     the bridge arch they are muffled and a short room reverb opens.
//   - Point loops (a donkey's hooves while it walks, a porter's creaking pole, a sedan, a towed boat's rope, the moat
//     lapping at the bridge, sparrows in some trees): the loudest as heard where you stand, on a fixed budget (8 on
//     phones, 16 on desktops); a playing loop keeps its place unless another is clearly louder; fades are slow.
//   - Shots (a brush writing, the butcher's cleaver, a bray, hull creaks, the scaffold in a gust): each painted source
//     keeps its own timer within the reach and plays as loud as its distance allows; at most 6/10 at once.
//   - You: footsteps by the floor underfoot (its collider: g_ground, g_deck, g_stone ... or a boat deck), brushing
//     past people and through trees, the scroll unrolling when the HUD opens.
//   - The hours: the gate tower's drum at dusk and the night watches (one stroke per watch, then the watchman's
//     clapper), the 五更 dawn round in the city, roosters in the country, gusts by day.
// Files: the beds and your footsteps are fetched as soon as the page has the world (before your first click), the
// rest when first needed; a bed that is still loading never leaves a gap (the old ones play on until it is in). Sound
// starts on the first click or touch (browsers require one). M or the bell button turns it off and on; with the
// painting (Space) open, a volume bar shows beside the bell. Both are remembered per viewer.
import * as THREE from 'three';

const MOBILE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const PREF = 'qm.sound.on', VOL = 'qm.sound.volume';
const TICK = 0.25; // seconds between the slow passes (beds, choosing loops, shot timers)
const REACH = 80; // metres: sources further than this keep no voice or timer; they fade out softly towards it
const FLOOR = 0.015; // a source heard quieter than this (about -36 dB) is let go
const KEEP = 1.4; // a playing loop is replaced only by one this much louder
const NEAR_M = 3.5; // an animal reacts when you come this close
const rand = (a, b) => a + Math.random() * (b - a);
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const posOf = (e) => new THREE.Vector3(e.pos[0], (e.H || 0) + 1.2, -e.pos[1]);
// a source of radius r: the panner's reference distance, and how loud gain g is heard at distance d (the panner's
// inverse law, times the soft edge of the reach)
const refOf = (r) => Math.max(1, r / 4);
const reachEdge = (d) => 1 - smooth(REACH * 0.65, REACH, d);
const heard = (g, d, r) => { const R = refOf(r); return (g * R) / (R + Math.max(0, d - R)) * reachEdge(d); };

export class Sound {
  // o: { camera, player, people(), boats(), sections() -> [{ name, sec, out }], current() -> section name, hour(),
  //      floor(x, y, z) -> collider name under the feet, ceiling(x, y, z) -> metres to anything above, or null }
  constructor(o) {
    this.o = o;
    this.ctx = null;
    this.ready = false;
    this.on = true;
    this.volume = 0.8;
    try {
      this.on = localStorage.getItem(PREF) !== '0';
      const v = parseFloat(localStorage.getItem(VOL));
      if (Number.isFinite(v)) this.volume = Math.min(1, Math.max(0, v));
    } catch { /* storage blocked: the defaults */ }
    this.cache = new Map(); // sound -> { bufs, bytes, used }
    this.loading = new Map();
    this.bytes = new Map(); // file -> ArrayBuffer fetched ahead (beds, footsteps), decoded at first use
    this.failed = new Set();
    this.beds = new Map(); // bed -> { src, g, target }
    this.loops = new Map(); // key -> { v, cand }
    this.shots = new Set();
    this.timers = new WeakMap(); // a source object -> { next, near }
    this.placeTimers = new Map();
    this.moved = new WeakMap(); // a person -> { x, z, speed }
    this.events = []; // the last fired hour events, for the checks
    this.warned = new Set();
    this.acc = 0;
    this.stride = 0;
    this.lastFeet = null;
    this.lastStep = -1;
    this.bumpAt = 0;
    this.brushAt = new Map();
    this.covered = 0;
    this.hudOpen = false;
    this.lastHour = null;
    this.t = 0;
    this.density = 0; // painted people round you, weighted by distance
    this.crowd = 0.5; // the crowd beds' level from that, smoothed
    this.counts = { steps: 0, bumps: 0, brush: 0, surfaces: {} };
    this.ms = 0;
    this.want = 0; // the bed gain wanted now vs. playing (stats: gaps while files load)
    this.loadLog = [];
  }

  async init(url = 'assets/sounds/sounds.json') {
    const m = await fetch(url).then((r) => (r.ok ? r.json() : null));
    if (!m) throw new Error(`no ${url}`);
    this.base = url.replace(/[^/]+$/, '');
    this.files = m.files;
    this.rules = m.rules;
    this.loopNames = new Set(m.loops);
    const b = this.rules.budget, k = MOBILE ? 0 : 1;
    this.budget = { loops: b.loops[k], shots: b.shots[k], beds: b.beds, bytes: b.memoryMB[k] * 1048576 };
    this.controls();
    addEventListener('keydown', (e) => { if (e.code === 'KeyM' && !e.repeat && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) this.toggle(); });
    document.addEventListener('visibilitychange', () => { if (!this.ctx) return; if (document.hidden) this.ctx.suspend(); else if (this.on) this.ctx.resume(); });
    this.ready = true;
    this.prefetch();
  }

  // the beds of every section and your footsteps, fetched now (small: about 1 MB), so the first click and every seam
  // have them ready; decoding waits for the audio context
  prefetch() {
    const R = this.rules, names = new Set([...Object.values(R.player.surfaces), ...Object.values(R.player.run)]);
    for (const s of Object.values(R.beds)) for (const k of ['day', 'night']) for (const [b] of s[k] || []) names.add(b);
    for (const b of Object.values(R.covered.beds || {})) names.add(b);
    for (const n of names) for (const f of this.files[n] || []) {
      if (this.bytes.has(f)) continue;
      this.bytes.set(f, fetch(this.base + f, { priority: 'low' }).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null));
    }
  }

  // ------------------------------------------------------------------ the audio graph (made on the first gesture)
  unlock() {
    if (!this.ready || !this.on) return;
    if (this.ctx) { if (this.ctx.state !== 'running' && !document.hidden) this.ctx.resume(); return; }
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' }));
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* iOS only */ }
    this.master = ctx.createGain();
    this.master.gain.value = this.level();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.25;
    this.master.connect(comp).connect(ctx.destination);
    // beds go through a low-pass that closes when you are under cover
    this.bedFilter = ctx.createBiquadFilter();
    this.bedFilter.type = 'lowpass';
    this.bedFilter.frequency.value = 20000;
    this.bedFilter.connect(this.master);
    // one short room reverb (made here, no file), sent from points, your steps and events while covered
    this.send = ctx.createGain();
    this.send.gain.value = 0;
    const conv = ctx.createConvolver();
    conv.buffer = this.impulse(1.1);
    this.send.connect(conv).connect(this.master);
    this.groups = {};
    for (const [g, v] of Object.entries({ bed: 0.6, point: 0.85, player: 0.6, event: 0.85, ui: 0.5 })) {
      const n = ctx.createGain();
      n.gain.value = v;
      n.connect(g === 'bed' ? this.bedFilter : this.master);
      if (g !== 'bed' && g !== 'ui') n.connect(this.send);
      this.groups[g] = n;
    }
    this.lastHour = this.o.hour();
    // the beds round you start decoding at once (their bytes are usually here already)
    for (const { name, out } of this.o.sections()) if (out < 40) for (const k of ['day', 'night']) for (const [b] of this.rules.beds[name]?.[k] || []) this.buf(b);
  }

  impulse(seconds) {
    const ctx = this.ctx, n = Math.round(seconds * ctx.sampleRate), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < n; i++) { const t = i / ctx.sampleRate; d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 5.5) * Math.min(1, t * 200); }
    }
    return b;
  }

  // the master level: your volume, lowered while the painting is open
  level() { return 0.95 * this.volume * this.volume * (this.hudOpen ? 0.6 : 1); }
  setVolume(v) {
    this.volume = Math.min(1, Math.max(0, v));
    try { localStorage.setItem(VOL, String(this.volume)); } catch { /* fine */ }
    if (this.master) this.master.gain.setTargetAtTime(this.level(), this.ctx.currentTime, 0.05);
    if (this.slider && +this.slider.value !== this.volume) this.slider.value = String(this.volume);
  }

  toggle() { this.setOn(!this.on); this.ui('toggle'); }
  setOn(on) {
    this.on = on;
    try { localStorage.setItem(PREF, on ? '1' : '0'); } catch { /* fine */ }
    if (on) { this.unlock(); this.ctx?.resume(); } else this.ctx?.suspend();
    this.paintBell();
  }

  // bottom right: a small bronze bell (the period object for sound) and, while the painting is open, a volume bar
  // beside it: an ink stroke with a bronze weight, no numbers (feedback-period-instruments-not-numbers)
  controls() {
    if (typeof document === 'undefined' || document.getElementById('soundCtl')) return;
    const style = document.createElement('style');
    style.textContent = `
#soundCtl { position: fixed; right: 12px; bottom: 12px; z-index: 950; display: flex; align-items: center; gap: 10px; }
#soundCtl .bar { display: none; align-items: center; height: 40px; padding: 0 14px; border-radius: 20px; background: rgba(40, 28, 18, 0.55); }
#soundCtl.open .bar { display: flex; }
#soundCtl input { -webkit-appearance: none; appearance: none; width: 150px; height: 18px; background: transparent; cursor: pointer; margin: 0; }
#soundCtl input::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: linear-gradient(90deg, rgba(217, 178, 106, 0.25), #d9b26a); }
#soundCtl input::-moz-range-track { height: 4px; border-radius: 2px; background: linear-gradient(90deg, rgba(217, 178, 106, 0.25), #d9b26a); }
#soundCtl input::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; margin-top: -6px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #f0d08a, #a67c33); border: 1px solid #5a4020; }
#soundCtl input::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #f0d08a, #a67c33); border: 1px solid #5a4020; }
#soundCtl button { width: 40px; height: 40px; border: 0; border-radius: 20px; background: rgba(40, 28, 18, 0.55); cursor: pointer; padding: 6px; }`;
    document.head.appendChild(style);
    const box = document.createElement('div');
    box.id = 'soundCtl';
    const bar = document.createElement('div');
    bar.className = 'bar';
    const s = document.createElement('input');
    Object.assign(s, { type: 'range', min: '0', max: '1', step: '0.01', value: String(this.volume), title: 'Volume' });
    s.setAttribute('aria-label', 'Volume');
    s.addEventListener('input', () => { this.setVolume(+s.value); if (!this.on && +s.value > 0) this.setOn(true); });
    for (const ev of ['pointerdown', 'keydown', 'wheel']) s.addEventListener(ev, (e) => e.stopPropagation());
    bar.appendChild(s);
    const b = document.createElement('button');
    b.title = 'Sound (M)';
    b.setAttribute('aria-label', 'Sound on or off (M)');
    b.addEventListener('click', (e) => { e.stopPropagation(); this.toggle(); });
    b.addEventListener('pointerdown', (e) => e.stopPropagation());
    box.append(bar, b);
    document.body.appendChild(box);
    Object.assign(this, { box, bell: b, slider: s });
    this.paintBell();
  }
  paintBell() {
    if (!this.bell) return;
    this.bell.dataset.on = this.on ? '1' : '0'; // the ink UI styles on and off from this (ui/ui.css)
    const c = this.on ? '#d9b26a' : '#8a7a66';
    const clapper = this.on ? `<circle cx="15" cy="24.5" r="2.2" fill="${c}"/><path d="M7 12 Q4 14 4 17 M23 12 Q26 14 26 17" stroke="${c}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
      : `<path d="M5 5 L25 25" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`;
    this.bell.innerHTML = `<svg viewBox="0 0 30 30" width="28" height="28"><path d="M15 4 C10 4 9 9 9 13 L8 20 L22 20 L21 13 C21 9 20 4 15 4 Z" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/><path d="M6.5 20.5 L23.5 20.5" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>${clapper}</svg>`;
  }

  // ------------------------------------------------------------------ files
  buf(name) {
    const e = this.cache.get(name);
    if (e) { e.used = this.t; return e.bufs; }
    if (!this.loading.has(name) && !this.failed.has(name) && this.ctx) this.loading.set(name, this.load(name));
    return null;
  }
  async load(name) {
    const t0 = performance.now();
    try {
      const files = this.files[name];
      if (!files) throw new Error('not shipped');
      const bed = !!this.rules.beds && Object.values(this.rules.beds).some((s) => [...(s.day || []), ...(s.night || [])].some(([b]) => b === name));
      const bufs = await Promise.all(files.map(async (f) => {
        let ab = this.bytes.has(f) ? await this.bytes.get(f) : null;
        this.bytes.delete(f);
        if (!ab) {
          const r = await fetch(this.base + f, { priority: bed ? 'high' : 'auto' });
          if (!r.ok) throw new Error(`${f}: ${r.status}`);
          ab = await r.arrayBuffer();
        }
        return this.ctx.decodeAudioData(ab);
      }));
      const bytes = bufs.reduce((a, b) => a + b.length * b.numberOfChannels * 4, 0);
      this.loadLog.push([name, Math.round(performance.now() - t0)]);
      if (this.loadLog.length > 40) this.loadLog.shift();
      this.cache.set(name, { bufs, bytes, used: this.t });
      this.evict();
    } catch (err) {
      this.failed.add(name);
      console.warn(`sound ${name}: ${err.message}`);
    } finally { this.loading.delete(name); }
  }
  decoded() { let n = 0; for (const e of this.cache.values()) n += e.bytes; return n; }
  evict() {
    let total = this.decoded();
    if (total <= this.budget.bytes) return;
    const playing = new Set([...this.beds.keys(), ...[...this.loops.values()].map((l) => l.cand.name)]);
    for (const [name, e] of [...this.cache.entries()].sort((a, b) => a[1].used - b[1].used)) {
      if (total <= this.budget.bytes * 0.85) break;
      if (playing.has(name) || this.t - e.used < 20) continue;
      this.cache.delete(name);
      total -= e.bytes;
    }
  }

  // ------------------------------------------------------------------ voices
  // pos given: placed in the world with the source's radius r (no edge: maxDistance far beyond the reach)
  voice(name, { pos = null, gain = 1, rate = 1, group = 'point', loop = false, r = 12, when = 0, variant = null } = {}) {
    const bufs = this.buf(name);
    if (!bufs || !this.ctx) return null;
    const ctx = this.ctx, src = ctx.createBufferSource();
    const k = variant ?? Math.floor(Math.random() * bufs.length);
    src.buffer = bufs[k % bufs.length];
    src.loop = loop;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    let pan = null;
    if (pos) {
      pan = ctx.createPanner();
      pan.panningModel = 'equalpower';
      pan.distanceModel = 'inverse';
      pan.refDistance = refOf(r);
      pan.maxDistance = 10000;
      pan.rolloffFactor = 1;
      this.place(pan, pos);
      g.connect(pan).connect(this.groups[group]);
    } else g.connect(this.groups[group]);
    // a loop starts somewhere in its length, so two of the same never sound in step
    src.start(ctx.currentTime + when, loop ? Math.random() * src.buffer.duration : 0);
    return { src, g, pan, name, variant: k };
  }
  place(pan, p) {
    if (!Number.isFinite(p.x + p.y + p.z)) return;
    if (pan.positionX) { pan.positionX.value = p.x; pan.positionY.value = p.y; pan.positionZ.value = p.z; } else pan.setPosition(p.x, p.y, p.z);
  }
  // a one-shot from a source of gain g and radius r at distance d (heard from as far as it carries, never cut at r)
  shot(name, { d = 0, g = 0.9, r = 12, force = false, ...opts } = {}) {
    if (this.shots.size >= this.budget.shots && !force) return null;
    if (opts.pos && heard(g, d, r) < FLOOR && !force) return null;
    const v = this.voice(name, { rate: rand(0.95, 1.05), gain: g * (opts.pos ? reachEdge(d) : 1), r, ...opts });
    if (!v) return null;
    this.shots.add(v);
    v.src.onended = () => { this.shots.delete(v); v.g.disconnect(); v.pan?.disconnect(); };
    return v;
  }
  fadeOut(v, s = 0.5) {
    const t = this.ctx.currentTime;
    v.g.gain.cancelScheduledValues(t);
    v.g.gain.setValueAtTime(v.g.gain.value, t);
    v.g.gain.linearRampToValueAtTime(0, t + s);
    v.src.stop(t + s + 0.05);
    v.src.onended = () => { v.g.disconnect(); v.pan?.disconnect(); };
  }

  // ------------------------------------------------------------------ the page's hooks
  hud(open) {
    if (open === this.hudOpen) return;
    this.hudOpen = open;
    this.box?.classList.toggle('open', open);
    if (!this.ctx) return;
    this.ui('hud');
    this.master.gain.setTargetAtTime(this.level(), this.ctx.currentTime, 0.3);
  }
  ui(kind) { const n = this.rules?.ui[kind]; if (n && this.ctx && this.on) this.voice(n, { group: 'ui', gain: 0.9 }); }
  bump() {
    if (!this.ctx || this.t - this.bumpAt < 0.7) return;
    this.bumpAt = this.t;
    this.counts.bumps++;
    this.voice(this.rules.player.bump, { group: 'player', gain: 0.7, rate: rand(0.92, 1.08) });
  }

  update(dt) {
    if (!this.ctx || !this.on || this.ctx.state !== 'running') return;
    const t0 = performance.now();
    this.t += dt;
    this.safe('listener', () => this.listener());
    this.safe('steps', () => this.steps());
    this.acc += dt;
    if (this.acc >= TICK) {
      this.acc = 0;
      const secs = this.o.sections();
      this.safe('cover', () => this.cover());
      this.safe('loops', () => this.loopPass(secs)); // counts the crowd round you too, for the beds
      this.safe('beds', () => this.bedPass(secs));
      this.safe('shots', () => this.shotPass(secs));
      this.safe('hours', () => this.hourPass(secs));
    }
    this.ms = 0.95 * this.ms + 0.05 * (performance.now() - t0); // what sound costs a frame (stats)
  }
  // one failing pass never silences the rest (it is reported once)
  safe(name, fn) {
    try { fn(); } catch (err) { if (!this.warned.has(name)) { this.warned.add(name); console.warn(`sound ${name}:`, err); } }
  }
  listener() {
    const cam = this.o.camera, L = this.ctx.listener;
    cam.updateMatrixWorld();
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    if (L.positionX) {
      L.positionX.value = cam.position.x; L.positionY.value = cam.position.y; L.positionZ.value = cam.position.z;
      L.forwardX.value = f.x; L.forwardY.value = f.y; L.forwardZ.value = f.z; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
    } else { L.setPosition(cam.position.x, cam.position.y, cam.position.z); L.setOrientation(f.x, f.y, f.z, 0, 1, 0); }
    for (const { v, cand } of this.loops.values()) if (v.pan && cand.live) this.place(v.pan, cand.pos);
  }

  // ------------------------------------------------------------------ you
  steps() {
    const p = this.o.player, feet = p.pos;
    if (!this.lastFeet) { this.lastFeet = feet.clone(); return; }
    const d = Math.hypot(feet.x - this.lastFeet.x, feet.z - this.lastFeet.z);
    this.lastFeet.copy(feet);
    if (d > 2 || (!p.onGround && !p.ride)) { this.stride = 0; return; } // a teleport, or in the air
    this.stride += d;
    const R = this.rules.player, run = !!p.running, len = run ? R.stride[1] : R.stride[0];
    if (this.stride < len) return;
    this.stride -= len;
    if (!!p.ride !== this.wasRiding) { this.wasRiding = !!p.ride; if (p.ride && R.board) this.voice(R.board, { group: 'player', gain: 0.8 }); }
    const floor = p.ride ? 'boat' : this.o.floor(feet.x, feet.y + 0.3, feet.z);
    let name = R.surfaces[floor] || R.surfaces.default;
    if (run && R.run[name]) name = R.run[name];
    const bufs = this.buf(name);
    if (!bufs) return;
    let k = Math.floor(Math.random() * bufs.length);
    if (bufs.length > 1 && k === this.lastStep) k = (k + 1) % bufs.length;
    this.lastStep = k;
    this.voice(name, { group: 'player', gain: R.gain * (run ? 1.2 : 1), rate: rand(0.93, 1.07), variant: k });
    this.counts.steps++;
    this.counts.surfaces[name] = (this.counts.surfaces[name] || 0) + 1;
  }

  cover() {
    const p = this.o.player.pos, C = this.rules.covered;
    const up = this.o.ceiling(p.x, p.y + 1.7, p.z);
    const target = up != null && up < C.ceilingM ? 1 : 0;
    if (target === this.covered) return;
    this.covered = target;
    const t = this.ctx.currentTime;
    this.bedFilter.frequency.setTargetAtTime(target ? C.lowpassHz : 20000, t, 0.25);
    this.send.gain.setTargetAtTime(target ? C.reverb : 0, t, 0.3);
  }

  // ------------------------------------------------------------------ beds
  dayness() { const h = this.o.hour(); return smooth(4.8, 6.6, h) * (1 - smooth(18.6, 20.2, h)); }
  bedPass(secs) {
    const B = this.rules.bedMix || {}, reach = B.sectionM ?? 30;
    const want = new Map(), day = this.dayness();
    // each section by its distance from you (smooth, no edge); the nearest never under the floor: always a background
    const ws = secs.map((s) => [s, 1 / (1 + (Math.max(0, s.out) / reach) ** 2)]).filter(([, w]) => w > 0.03);
    if (ws.length) { const near = ws.reduce((a, b) => (b[0].out < a[0].out ? b : a)); near[1] = Math.max(near[1], B.nearestFloor ?? 0.7); }
    const sum = ws.reduce((a, [, w]) => a + w, 0);
    // the crowd beds follow the painted people round you; the nature beds come up where the crowd thins
    const crowd = this.crowd, crowdBeds = new Set(B.crowdBeds || []), lo = B.crowdMin ?? 0.35;
    const shape = (b, g) => g * (crowdBeds.has(b) ? lo + (1 - lo) * Math.min(1.3, crowd) : 1.15 - 0.45 * Math.min(1, crowd));
    for (const [s, w] of ws) {
      const r = this.rules.beds[s.name];
      if (!r) continue;
      const k = w / Math.max(1, sum);
      for (const [b, g] of r.day || []) want.set(b, (want.get(b) || 0) + k * shape(b, g) * day);
      for (const [b, g] of r.night || []) want.set(b, (want.get(b) || 0) + k * shape(b, g) * (1 - day));
    }
    const cb = this.rules.covered.beds?.[this.o.current()];
    if (cb && this.covered) want.set(cb, (want.get(cb) || 0) + 0.8);
    const top = [...want.entries()].filter(([, g]) => g > 0.02).sort((a, b) => b[1] - a[1]).slice(0, this.budget.beds);
    if (!top.length) return; // nothing to choose from (no section known yet): the beds playing stay
    this.want = top.reduce((a, [, g]) => a + g, 0);
    const keep = new Set(top.map(([b]) => b)), t = this.ctx.currentTime;
    let ready = 0;
    for (const [b, g] of top) {
      let bed = this.beds.get(b);
      if (!bed) {
        const v = this.voice(b, { group: 'bed', loop: true, gain: 0 });
        if (!v) continue; // still loading
        bed = { ...v, target: 0 };
        this.beds.set(b, bed);
      }
      bed.target = g * (this.covered ? 0.7 : 1);
      bed.g.gain.setTargetAtTime(bed.target, t, 0.9);
      ready += bed.target;
    }
    // the beds you are leaving go only once the new ones are playing (no silence while a file loads)
    if (ready < 0.5 * this.want) return;
    for (const [b, bed] of this.beds) {
      if (keep.has(b)) continue;
      this.fadeOut(bed, 2.5);
      this.beds.delete(b);
    }
  }

  // ------------------------------------------------------------------ point loops (and the crowd count)
  speedOf(p) {
    const q = p.root.position, m = this.moved.get(p);
    if (!m) { this.moved.set(p, { x: q.x, z: q.z, speed: 0 }); return 0; }
    const d = Math.hypot(q.x - m.x, q.z - m.z);
    m.speed = d > 3 ? 0 : 0.5 * m.speed + 0.5 * (d / TICK);
    m.x = q.x; m.z = q.z;
    return m.speed;
  }
  loopPass(secs) {
    const me = this.o.player.pos, day = this.dayness() > 0.5, cands = [];
    const add = (key, name, pos, gain, r, live = false, rate = 1) => {
      const d = me.distanceTo(pos), score = heard(gain, d, r);
      if (score < FLOOR) return;
      cands.push({ key, name, pos, gain, r, d, live, rate, score });
    };
    const R = this.rules, B = R.bedMix || {};
    // landmarks and trees of the loaded sections
    for (const { sec } of secs) {
      if (!sec?.layout) continue;
      const ents = sec.layout.entities || {};
      for (const [id, pl] of Object.entries(R.places)) {
        const e = ents[id];
        if (!e || !pl.loop || (pl.day && !day) || (pl.night && day)) continue;
        add(`place:${id}`, pl.loop, (e._pos ||= posOf(e)), pl.gain ?? 1, pl.range ?? 20);
      }
      if (day) (sec.layout.trees || []).forEach((t, i) => {
        if (i % R.trees.everyNth) return;
        add(`tree:${sec.name}:${i}`, R.trees.loop, (t._pos ||= new THREE.Vector3(t.X, (t.H || 0) + 3, -t.D)), R.trees.gain, R.trees.range);
      });
    }
    // people and animals moving near you; the painted people round you, for the crowd beds
    const people = this.o.people(), kern = B.crowdKernelM ?? 14;
    let density = 0;
    for (const p of people?.all || []) {
      const q = p.root.position;
      if (Math.abs(q.x - me.x) > REACH || Math.abs(q.z - me.z) > REACH) continue;
      const dist = Math.hypot(q.x - me.x, q.z - me.z);
      if (dist > REACH) continue;
      const speed = this.speedOf(p), model = p.model?.name, an = R.animals[model];
      if (an) {
        if (speed > 0.25) {
          const deck = R.animals_on_timber && q.y > R.animals_on_timber.aboveM;
          const name = speed > 3 && an.run ? an.run : deck ? R.animals_on_timber.loop : an.walk;
          if (name) add(p, name, q, 0.9, 14, true, an.rate || 1);
        }
        continue;
      }
      density += 1 / (1 + (dist / kern) ** 2);
      const c = R.clips[p.clip];
      if (c?.loop && (!c.moving || speed > 0.25)) add(p, c.loop, q, c.gain ?? 0.8, c.range ?? 14, true);
    }
    this.density = density;
    this.crowd += (Math.min(1.4, density / (B.crowdFull ?? 16)) - this.crowd) * 0.12;
    // boats under tow
    for (const b of this.o.boats()?.list || []) {
      const pos = b.roots?.[0]?.position;
      if (pos && b.info?.pose === 'towed' && b.effort > 0.3) add(b, R.boats.tow, pos, 0.8, 20, true);
    }
    // the loudest as heard here, a playing one keeping its place unless another is clearly louder
    for (const c of cands) if (this.loops.has(c.key) && this.loops.get(c.key).cand.name === c.name) c.score *= KEEP;
    const top = cands.sort((a, b) => b.score - a.score).slice(0, this.budget.loops);
    this.pointLevel = top.reduce((a, c) => a + heard(c.gain, c.d, c.r), 0); // stats: how much the loops add where you stand
    const byKey = new Map(top.map((c) => [c.key, c]));
    for (const [key, l] of this.loops) if (byKey.get(key)?.name !== l.cand.name) { this.fadeOut(l.v, 1.5); this.loops.delete(key); }
    const t = this.ctx.currentTime;
    for (const c of top) {
      const l = this.loops.get(c.key), g = c.gain * reachEdge(c.d);
      if (l) { l.cand = c; l.v.g.gain.setTargetAtTime(g, t, 0.5); continue; }
      const v = this.voice(c.name, { pos: c.pos, loop: true, gain: 0, r: c.r, rate: c.rate });
      if (!v) continue;
      v.g.gain.setTargetAtTime(g, t, 0.6);
      this.loops.set(c.key, { v, cand: c });
    }
  }

  // ------------------------------------------------------------------ shots
  due(key, every, map = this.timers) {
    let tm = map.get(key);
    if (!tm) { tm = { next: this.t + rand(every[0], every[1]) * rand(0.15, 1), near: 0 }; map.set(key, tm); }
    if (this.t < tm.next) return false;
    tm.next = this.t + rand(every[0], every[1]);
    return true;
  }
  shotPass(secs) {
    const R = this.rules, me = this.o.player.pos, day = this.dayness() > 0.5, here = this.o.current();
    const people = this.o.people();
    for (const p of people?.all || []) {
      const q = p.root.position;
      if (Math.abs(q.x - me.x) > REACH || Math.abs(q.z - me.z) > REACH) continue;
      const d = me.distanceTo(q);
      if (d > REACH) continue;
      const at = new THREE.Vector3(q.x, q.y + 1.2, q.z);
      const an = R.animals[p.model?.name];
      if (an) {
        let tm = this.timers.get(p);
        if (!tm) { tm = { next: this.t + rand(...(an.every || [60, 120])) * rand(0.15, 1), near: 0 }; this.timers.set(p, tm); }
        if (an.near && d < (an.nearM || NEAR_M) && this.t > tm.near) {
          this.shot(pickOne(an.near), { pos: at, d, g: 0.9, r: 6 });
          tm.near = this.t + (an.cooldown || 14);
        }
        if (an.call && (!an.day || day) && this.t >= tm.next) {
          tm.next = this.t + rand(...an.every);
          this.shot(pickOne(an.call), { pos: at, d, g: 1, r: 30 });
        }
        continue;
      }
      const c = R.figures[p.id] || R.clips[p.clip];
      if (!c?.shot || (c.sections && !c.sections.includes(here))) continue;
      if (this.due(p, c.every)) this.shot(pickOne([].concat(c.shot)), { pos: at, d, g: c.gain ?? 0.9, r: c.range || 16 });
    }
    // boats: moored ones creak, slap and pull at their ropes; under way the water slaps faster; a mast going down
    const B = R.boats;
    for (const b of this.o.boats()?.list || []) {
      const pos = b.roots?.[0]?.position;
      if (!pos) continue;
      const d = me.distanceTo(pos);
      if (d > REACH) continue;
      const under = b.state === 'out' || b.state === 'back', r = B.range ?? 20;
      for (const [name, a, z] of under ? B.underway : B.moored) {
        if (this.due(`${b.id}:${name}`, [a, z], this.placeTimers)) this.shot(name, { pos: pos.clone().setY(pos.y + 0.5), d, g: 0.8, r });
      }
      if (b._lastState === 'rest' && b.state === 'out') {
        if (b.info?.pose === 'lowering mast') this.shot(B.mast, { pos: pos.clone().setY(pos.y + 3), d, g: 1, r: 40, force: true });
        else if (B.setOff) this.shot(B.setOff, { pos: pos.clone().setY(pos.y + 1), d, g: 0.8, r });
      }
      if (b._lastState === 'back' && b.state === 'rest' && B.arrive) this.shot(B.arrive, { pos: pos.clone().setY(pos.y + 0.5), d, g: 0.9, r });
      b._lastState = b.state;
    }
    // landmarks
    for (const { sec } of secs) {
      const ents = sec?.layout?.entities || {};
      for (const [id, pl] of Object.entries(R.places)) {
        const e = ents[id];
        if (!e || !pl.shot) continue;
        const pos = (e._pos ||= posOf(e)), d = me.distanceTo(pos);
        if (d > REACH) continue;
        if (this.due(`place:${id}`, pl.every, this.placeTimers)) this.shot(pickOne([].concat(pl.shot)), { pos, d, g: 0.9, r: pl.range || 20 });
      }
    }
    // brushing past trees while you walk
    const P = this.o.player, br = R.player.brush;
    if (P.velocity?.lengthSq?.() > 0.3 || this.stride > 0.05) {
      for (const { sec } of secs) for (const [i, t] of (sec?.layout?.trees || []).entries()) {
        if (Math.abs(t.X - me.x) > br.radius || Math.abs(-t.D - me.z) > br.radius) continue;
        const key = `${sec.name}:${i}`;
        if (this.t - (this.brushAt.get(key) || -9) < 3) continue;
        this.brushAt.set(key, this.t);
        this.counts.brush++;
        this.voice(/willow/.test(t.card || 'willow') ? br.willow : br.other, { group: 'player', gain: 0.7, rate: rand(0.9, 1.1) });
      }
    }
  }

  // ------------------------------------------------------------------ the hours
  crossed(h0, h1, at) { // did the hour pass `at` going from h0 to h1 (wrapping at 24)?
    if (h0 === h1) return false;
    return h1 > h0 ? at > h0 && at <= h1 : at > h0 || at <= h1;
  }
  hourPass(secs) {
    const h = this.o.hour(), h0 = this.lastHour ?? h;
    this.lastHour = h;
    const H = this.rules.hours, here = this.o.current(), me = this.o.player.pos;
    this.drumPos = null;
    for (const { sec } of secs) { const e = sec?.layout?.entities?.[H.drum.at]; if (e) this.drumPos = (e._pos ||= posOf(e)); }
    if (Math.abs(h - h0) < 1) {
      if (this.crossed(h0, h, H.drum.dusk)) this.fire('dusk');
      H.drum.watches.forEach((w, i) => { if (this.crossed(h0, h, w)) this.fire('watch', i + 1); });
      if (this.crossed(h0, h, H.dawn.hour) && H.dawn.sections.includes(here)) this.fire('dawn');
      const sh = H.shutters;
      if (sh && sh.sections.includes(here)) for (const a of sh.at) if (this.crossed(h0, h, a)) this.voice(sh.sound, { group: 'event', gain: sh.gain });
      for (const { sec } of secs) for (const [id, pl] of Object.entries(this.rules.places)) {
        const e = sec?.layout?.entities?.[id];
        if (!e || !pl.bell) continue;
        const pos = (e._pos ||= posOf(e));
        for (const b of pl.bell) if (this.crossed(h0, h, b)) this.shot(pl.bellSound, { pos, d: me.distanceTo(pos), g: 1, r: 60, group: 'event', force: true });
      }
    }
    const inHours = (a, b) => (a < b ? h >= a && h < b : h >= a || h < b);
    const r = H.rooster, w = H.watch_round, g = H.gust;
    if (inHours(...r.hours) && r.sections.includes(here) && this.due('rooster', r.every, this.placeTimers)) this.voice(r.sound, { group: 'event', gain: 0.5, rate: rand(0.95, 1.05) });
    if (inHours(...w.hours) && w.sections.includes(here) && this.due('watch_round', w.every, this.placeTimers)) this.voice(w.sound, { group: 'event', gain: w.gain });
    if ((!g.day || this.dayness() > 0.5) && this.due('gust', g.every, this.placeTimers)) this.voice(g.sound, { group: 'bed', gain: g.gain });
  }
  // an hour's event now (the checks call it too): 'dusk', 'watch' n, 'dawn'. The drum carries across the town: heard
  // from its tower when that is loaded, else faint from afar.
  fire(kind, n = 1) {
    if (!this.ctx) return null;
    const D = this.rules.hours.drum, pos = this.drumPos;
    const opts = { group: 'event', ...(pos ? { pos, r: 120 } : { gain: 0.25 }) };
    if (kind === 'dusk') { this.voice(D.duskSound, opts); this.voice(D.duskSound, { ...opts, when: 9 }); }
    if (kind === 'watch') {
      for (let i = 0; i < n; i++) this.voice(D.hit, { ...opts, when: i * 1.8 });
      for (let i = 0; i < n; i++) this.voice(D.clapper, { ...opts, ...(pos ? { r: 40 } : {}), gain: pos ? 0.7 : 0.18, when: n * 1.8 + 1 + i * 0.9 });
    }
    if (kind === 'dawn') this.voice(this.rules.hours.dawn.sound, { group: 'event', gain: 0.7 });
    const ev = `${kind}${kind === 'watch' ? ` ${n}` : ''} @${this.o.hour().toFixed(2)}${pos ? ' (drum)' : ''}`;
    this.events.push(ev);
    if (this.events.length > 12) this.events.shift();
    return ev;
  }

  stats() {
    return {
      secs: this.o.sections().map((x) => [x.name, +x.out.toFixed(1)]), pos: this.o.player.pos.toArray().map((v) => +v.toFixed(1)),
      on: this.on, volume: this.volume, state: this.ctx?.state || 'none', covered: !!this.covered, hour: this.o.hour(), section: this.o.current(),
      beds: [...this.beds.entries()].map(([name, b]) => ({ name, gain: b.target })), bedWant: this.want,
      bedPlaying: [...this.beds.values()].reduce((a, b) => a + b.target, 0), pointLevel: this.pointLevel || 0, density: this.density, crowd: this.crowd,
      loads: [...this.loadLog], loading: [...this.loading.keys()], prefetched: this.bytes.size,
      loops: this.loops.size, loopNames: [...this.loops.values()].map((l) => l.cand.name), shots: this.shots.size,
      counts: this.counts, ms: this.ms, budget: this.budget, decodedMB: this.decoded() / 1048576, cached: this.cache.size,
      failed: [...this.failed], warned: [...this.warned], events: [...this.events],
    };
  }
}
