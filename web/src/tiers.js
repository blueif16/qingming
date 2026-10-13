// Device tiers (gen/perf/proposal.md, "Device tiers"; the perf batch, gen/perf/batch1/notes.md). Every tier draws every
// mapped building, tree, boat and painted figure; a tier changes only how they are drawn. The rest of the page reads
// its settings from here (tiers.cfg): the render targets and anti-aliasing (post.js), the shadow policy (world.js,
// crowd.js), the streaming window (world.js).
//   1. A guess before loading, from what the browser says (touch, screen, memory, cores, the GPU's name).
//   2. A check during the first seconds of real frames: the median frame against the frame interval, CPU part (the
//      tick) against the rest. Slow and CPU-bound: one tier down; slow and GPU-bound: the render scale to its floor.
//      Fast again on a later visit: back up toward the guess (never above it).
//   3. While playing, Messenger's controller: every 4 s from the average fps, under 30 -> scale -0.1, 55 or more ->
//      +0.1, within the tier's range, paused while a section streams in or the scroll is open; it stops after 4
//      reversals. Held at its floor and still slow for 8 s, an automatic tier steps down once.
//   4. By hand: ?tier=low|mid|high (never stored), or the Quality choice (settings key `quality`: auto|low|mid|high),
//      saved with the page's settings. ?adapt=0 holds the render scale at 1 (benches, look checks).
//   5. What the automatic choice settled on is remembered per device with its GPU name (localStorage, try/catch), so
//      a second visit starts there.
export const TIERS = {
  // older phones, mid Android, 2-4 GB
  low: {
    dprCap: 1.0, scaleMin: 0.6, msaa: 0, fxaa: true, hdr: false,
    // the shadow box: half-size, metres pushed ahead of the camera, snap of its centre (m), people's redraw rate (Hz),
    // how far people cast shadows (m); the map is redrawn when the snapped centre or the sun moves, or at peopleHz
    shadow: { size: 1024, half: 32, ahead: 12, snap: 2, peopleHz: 15, peopleFar: 15 },
    flowCap: 0, // the most extra boats on the river a section (boatflow.js): none here, so by device this tier's river
    // is the painted boats sailing it (world.js boatMode); 2 when Boats is set to waves by hand
    // metres: people further off are drawn with their far body, a quarter of the triangles over the same vertices
    // (crowd.js, tools/char_lod.mjs): here a person is ~70 px tall on a phone held upright and the body moves ~1 px
    peopleLod: 20,
    // the window stays 1 here: 'ahead' (your section and the one you walk or look toward; ?window=ahead) failed two
    // of the world's walks (gen/perf/batch1/notes.md), so it waits for its own round
    window: 1,
    // the optional detail systems' numbers (detail.js): trees3d (meshNear m: 3D trees within, cards beyond; by the
    // rivers' tight GPU window meshNearRiver), ambient, the chatter bubbles; the details session tunes them
    detail: {
      trees: { meshNear: 25, meshNearRiver: 0, clumpDensity: 0.5, strands: 0.4, windFar: 15 },
      ambient: { birds: 4, particles: 120, sparrows: 0, smoke: false, bannerSway: 'near' },
      talk: { chatterOpen: 1, marks: 0, scanHz: 3, wakeM: 20, showM: 9, barkM: 7, gapScale: 1.35, perMin: 5 }, // ui/chatter.js DEFAULTS
    },
  },
  // recent phones, laptops with integrated graphics
  mid: {
    dprCap: 1.5, scaleMin: 0.7, msaa: 0, fxaa: true, hdr: false,
    shadow: { size: 2048, sizeTouch: 1024, half: 36, ahead: 12, snap: 1, peopleHz: 20, peopleFar: 30 },
    flowCap: 3,
    peopleLod: 30,
    window: 1,
    detail: {
      trees: { meshNear: 45, meshNearRiver: 45, clumpDensity: 0.75, strands: 0.6, windFar: 30 },
      ambient: { birds: 12, particles: 400, sparrows: 6, smoke: true, bannerSway: 'near' },
      talk: { chatterOpen: 2, marks: 4, scanHz: 4, wakeM: 26, showM: 10, barkM: 8, gapScale: 1, perMin: 8 },
    },
  },
  // a desktop or a discrete GPU: as before (4x MSAA on a half-float target, the shadow map round you, its people every
  // frame); the box's centre snapped to 1 m, so the world's layer of the map (world.js shadowLayers) is redrawn as you
  // walk a metre, not every frame
  high: {
    dprCap: 2.0, scaleMin: 0.8, msaa: 4, fxaa: false, hdr: true,
    shadow: { size: 2048, sizeTouch: 1024, half: 48, ahead: 0, snap: 1, peopleHz: Infinity, peopleFar: 40 }, // 40: past it a
    // person's shadow changed no pixel at the crown, the grain wharf or the storyteller (gen/perf/batch2/framerate.md)
    flowCap: 6,
    peopleLod: 50, // a person is about as many pixels tall here on a 4K screen as at 20 m on low and 30 m on mid on a phone
    window: 1,
    detail: {
      trees: { meshNear: 70, meshNearRiver: 70, clumpDensity: 1, strands: 1, windFar: 60 },
      ambient: { birds: 30, particles: 900, sparrows: 12, smoke: true, bannerSway: 'all' },
      talk: { chatterOpen: 2, marks: 6, scanHz: 4, wakeM: 26, showM: 10, barkM: 8, gapScale: 1, perMin: 9 },
    },
  },
};
export const ORDER = ['low', 'mid', 'high'];
const STORE = 'qingming-tier-v1';
const lower = (t) => ORDER[Math.max(0, ORDER.indexOf(t) - 1)];
const rank = (t) => ORDER.indexOf(t);

// the GPU's name as the browser gives it (masked on some browsers: then "")
export function gpuName(gl) {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return String((ext && gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || '');
  } catch { return ''; }
}

// 1. the guess, with its reasons
export function guessTier(gl, nav = navigator) {
  const gpu = gpuName(gl), ua = nav.userAgent || '', why = [];
  const touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  const iOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (nav.maxTouchPoints || 0) > 1);
  const mem = nav.deviceMemory, cores = nav.hardwareConcurrency || 4;
  let t = 'high';
  const cap = (to, reason) => { if (rank(to) < rank(t)) { t = to; why.push(reason); } };
  if (/SwiftShader|llvmpipe|softpipe|Software|Microsoft Basic Render/i.test(gpu)) cap('low', 'software renderer');
  if (mem && mem <= 4) cap('low', `deviceMemory ${mem} GB`);
  // older and mid-range mobile GPUs: Mali (Midgard, early Bifrost/Valhall G5x/G6x), Adreno 3xx-5xx and 6xx below 640, PowerVR
  if (/Mali-(T|4|G5\d|G6\d|G7[0-1])/i.test(gpu) || /Adreno \(TM\) ([3-5]\d\d|6[0-3]\d)\b/i.test(gpu) || /PowerVR|Vivante|VideoCore/i.test(gpu)) cap('low', `GPU ${gpu}`);
  if (iOS) cap('mid', 'iPhone / iPad (the tab dies at 1-1.5 GB)');
  if (touch || /Android|Mobile/i.test(ua)) cap('mid', 'touch screen');
  if (/Intel/i.test(gpu) && !/Arc/i.test(gpu)) cap('mid', `integrated GPU ${gpu}`);
  if (/AMD Radeon\(TM\) Graphics|Radeon Vega|Radeon\(TM\) (Vega|R[57]) Graphics/i.test(gpu)) cap('mid', `integrated GPU ${gpu}`);
  if (/^Apple GPU$/i.test(gpu.trim()) && !iOS) cap('mid', 'a Mac with its GPU masked (Safari)');
  if (cores <= 4) cap('mid', `${cores} cores`);
  return { tier: t, gpu, touch, why };
}

export class Tiers {
  // gl: the WebGL context; settings: the page's settings object (its `quality` key); query: URLSearchParams;
  // onChange(cfg, name, previous): the page applies a new tier (targets, shadows, window); onDetail(cfg, detailScale):
  // the detail systems' counts scale (detail.js)
  constructor({ gl, settings, query, onChange, onDetail }) {
    this.s = settings;
    this.onChange = onChange;
    this.onDetail = onDetail;
    this.detailScale = 1; // the detail systems' counts (detail.js): lowered 1 -> 0.5 before an automatic tier steps down
    const g = guessTier(gl);
    this.guess = g.tier;
    this.why = g.why;
    this.gpu = g.gpu;
    this.touch = g.touch;
    this.hdrOk = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
    this.url = ORDER.includes(query.get('tier')) ? query.get('tier') : null;
    this.adapt = query.get('adapt') !== '0';
    this.scale = 1;
    this.log = []; // what the checks and the controller did: [seconds, what]
    // the automatic choice remembered for this device (the same GPU)
    let stored = null;
    try { const j = JSON.parse(localStorage.getItem(STORE) || 'null'); if (j && j.gpu === this.gpu && ORDER.includes(j.tier)) stored = j.tier; } catch { /* private mode */ }
    this.auto = stored && rank(stored) <= rank(this.guess) ? stored : this.guess;
    this.name = this.resolve();
    this.cfg = this.config(this.name);
    this.ctl = { frames: 0, time: 0, cpu: 0, reversals: 0, last: 0, floorTime: 0, stopped: !this.adapt };
    this.check = { done: !this.adapt, t: 0, frames: [] };
  }

  get manual() { return !!this.url || (this.s.quality && this.s.quality !== 'auto'); }
  resolve() { return this.url || (ORDER.includes(this.s.quality) ? this.s.quality : this.auto); }

  // a tier's settings for this device (touch screens: the smaller shadow map; no float targets: 8-bit)
  config(name) {
    const t = TIERS[name], sh = t.shadow;
    return { ...t, name, hdr: t.hdr && this.hdrOk, shadow: { ...sh, size: this.touch && sh.sizeTouch ? sh.sizeTouch : sh.size } };
  }

  // apply a tier now (the Quality choice, a step down); the page rebuilds what depends on it
  apply(name, reason) {
    if (!ORDER.includes(name) || name === this.name) return false;
    const prev = this.name;
    this.name = name;
    this.cfg = this.config(name);
    this.scale = 1;
    this.detailScale = 1;
    Object.assign(this.ctl, { frames: 0, time: 0, cpu: 0, reversals: 0, last: 0, floorTime: 0 });
    this.note(`${prev} -> ${name}: ${reason}`);
    this.onChange?.(this.cfg, name, prev);
    return true;
  }
  // the settings' Quality changed (auto|low|mid|high)
  chosen() { return this.apply(this.resolve(), `chosen (${this.s.quality})`); }
  remember(tier) {
    this.auto = tier;
    try { localStorage.setItem(STORE, JSON.stringify({ gpu: this.gpu, tier, at: new Date().toISOString() })); } catch { /* private mode */ }
  }
  note(what) { this.log.push([+(performance.now() / 1000).toFixed(1), what]); if (this.log.length > 50) this.log.shift(); }

  // the pixel ratio to draw at: the device's, under the tier's cap and the settings' sharpness, times the scale
  pixelRatio(dpr) { return Math.min(dpr, this.cfg.dprCap, this.s.pixelRatioCap ?? Infinity) * this.scale; }

  // every drawn frame: dt (s), cpuMs (the tick's own time), busy (a section streams in, the scroll is open)
  // -> true when the render scale changed (the page resizes)
  frame(dt, cpuMs, busy) {
    if (!(dt > 0)) return false;
    const c = this.check;
    if (!c.done) {
      // 2. the check: the first 3 s of real frames once the world shows (stalls of the window streaming in are outliers)
      c.t += dt;
      c.frames.push([dt * 1000, cpuMs]);
      if (c.t >= 3 && c.frames.length >= 20) return this.firstCheck();
      return false;
    }
    const k = this.ctl;
    if (k.stopped) return false;
    if (busy) { k.frames = 0; k.time = 0; k.cpu = 0; return false; }
    k.frames++; k.time += dt; k.cpu += cpuMs;
    if (k.time < 4) return false;
    const fps = k.frames / k.time, cpuShare = k.cpu / (k.time * 1000);
    k.frames = 0; k.time = 0; k.cpu = 0;
    const lo = this.cfg.scaleMin;
    let dir = 0;
    // under 30 fps: fewer pixels help only a GPU-bound frame (the tick itself under 70% of the frame)
    if (fps < 30 && cpuShare < 0.7 && this.scale > lo + 1e-3) dir = -1;
    else if (fps >= 55 && this.scale < 1 - 1e-3) dir = 1;
    if (fps < 30 && (this.scale <= lo + 1e-3 || cpuShare >= 0.7)) k.floorTime += 4; else k.floorTime = 0;
    // held at the floor and still slow: first fewer details (birds, particles, 3D trees' reach), a quarter at a time,
    // then a tier down
    if (k.floorTime >= 8 && !this.manual && this.detailScale > 0.5 + 1e-3) {
      this.detailScale = +(this.detailScale - 0.25).toFixed(2);
      k.floorTime = 0;
      this.note(`details x${this.detailScale} (${fps.toFixed(0)} fps)`);
      this.onDetail?.(this.cfg, this.detailScale);
      return false;
    }
    if (k.floorTime >= 8 && !this.manual && this.name !== 'low') {
      const to = lower(this.name);
      this.remember(to);
      this.apply(to, `${fps.toFixed(0)} fps for 8 s at ${cpuShare >= 0.7 ? 'a CPU-bound frame' : 'the lowest render scale'}`);
      return true;
    }
    if (!dir) return false;
    if (k.last && dir !== k.last && ++k.reversals >= 4) { k.stopped = true; this.note('controller stopped after 4 reversals'); }
    k.last = dir;
    this.scale = Math.min(1, Math.max(lo, +(this.scale + 0.1 * dir).toFixed(2)));
    this.note(`scale ${this.scale} (${fps.toFixed(0)} fps)`);
    return true;
  }

  firstCheck() {
    const c = this.check, f = c.frames;
    c.done = true;
    const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
    const frame = med(f.map((x) => x[0])), cpu = med(f.map((x) => x[1]));
    const cpuBound = cpu >= 0.7 * frame;
    c.result = { frameMs: +frame.toFixed(1), cpuMs: +cpu.toFixed(1), cpuBound, frames: f.length };
    c.frames = [];
    this.note(`first check: median frame ${frame.toFixed(1)} ms, tick ${cpu.toFixed(1)} ms`);
    if (this.manual) return false;
    if (frame > 1000 / 30) {
      if (cpuBound && this.name !== 'low') { const to = lower(this.name); this.remember(to); return this.apply(to, `first check: ${(1000 / frame).toFixed(0)} fps, CPU-bound`); }
      if (!cpuBound && this.adapt) { this.scale = this.cfg.scaleMin; this.note(`first check: GPU-bound, scale ${this.scale}`); return true; }
    } else if (frame < 1000 / 55 && rank(this.name) < rank(this.guess)) {
      // a later visit that runs well: back up toward the guess
      const to = ORDER[rank(this.name) + 1];
      this.remember(to);
      return this.apply(to, `first check: ${(1000 / frame).toFixed(0)} fps`);
    } else if (rank(this.name) === rank(this.auto)) this.remember(this.name);
    return false;
  }

  stats() {
    return { name: this.name, guess: this.guess, why: this.why, gpu: this.gpu, manual: this.manual, url: this.url, scale: this.scale,
      adapt: this.adapt, detailScale: this.detailScale, controller: { ...this.ctl }, check: this.check.result || null, log: this.log, cfg: this.cfg };
  }
}
