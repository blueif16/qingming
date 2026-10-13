// The time instrument (gen/ui/r2_time.md): 晝夜卷 with its 時牌. The day is a short painted handscroll of sky, unrolled
// under a cinnabar thread that marks "now". Read it right to left, as the painting reads and as the sun goes (east is on
// the scroll's right): dawn comes in from the right, noon, dusk, then the night with its stars and moon. The sun (or
// the moon) stands on the thread at its true height. The hour's name stands beside it on an ivory tablet, as the Song
// court showed the hour by day on seven ivory 時牌 (Songshi, chapter 70); under the scroll, its 初/正 and 刻 (after dark, the
// watch and its 點), the pace of time and, when the hour isn't yours, the 歸今 seal.
//   drag the scroll (mouse or finger): set the hour; the sky, sun, shadows and light follow live; let go: it stays
//   double-click / double-tap the scroll, or the 歸今 seal, or Home: back to your own clock
//   the pace word (今 · 靜 · 緩 · 常 · 疾): tap to change how fast time runs
//   T: take the keys (← → the hour, Shift for a whole 時辰, ↑ ↓ the pace, Home 歸今, T / Esc / Enter to let go)
// Cheap: DOM and one canvas painted once (the sky of a day and a quarter, true colours from daylight.js lightAt).
// set() is called from world.js applyLight(); it writes the DOM only when something visibly changes. Nothing runs per
// frame except while you drag or fling it.
import './time.css';
import { lightAt } from '../daylight.js';
import { BRANCHES, PACE_ORDER, TW, hourWords, paceOf } from './time_words.js';

const SPAN = 6; // hours seen in the window (three either side of now)
const H0 = -3, H1 = 27; // the strip's canvas covers these hours (a day plus a window), later hours to the left
const NS = 'http://www.w3.org/2000/svg';
const editable = (t) => /INPUT|TEXTAREA|SELECT/.test(t?.tagName || '') || t?.isContentEditable;
const wrap = (h) => ((h % 24) + 24) % 24;
const el = (tag, cls, parent, attrs = {}) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.append(e);
  return e;
};

// the lit part of a moon of radius r at phase p (0 new, 0.5 full), waxing lit on the right
function moonPath(r, p) {
  const waxing = p < 0.5, c = Math.cos(2 * Math.PI * p), rx = Math.max(0.01, Math.abs(c) * r);
  const outer = waxing ? 1 : 0, term = waxing ? (c < 0 ? 1 : 0) : (c > 0 ? 1 : 0);
  return `M0 ${-r} A${r} ${r} 0 0 ${outer} 0 ${r} A${rx} ${r} 0 0 ${term} 0 ${-r}Z`;
}

// the sun's disc: pale high up, vermilion when low, as the ink sky paints it (daylight.js Sky.INK_COLORS)
const sunFill = (low) => {
  const A = [255, 244, 226], B = [217, 96, 58];
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * low)).join(', ')})`;
};

// a small seeded random, so the painted strip is the same every time
const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

export class TimeScroll {
  // host: #dial; o: { time: { setHour(h, { scrub }), setFlow(step), toLocal() }, blocked() (the scroll HUD is open),
  //                   date (the moon's date) }
  constructor(host, o = {}) {
    this.o = o;
    this.root = el('div', 'qm-time', host, { role: 'group', 'aria-label': TW.aria });
    const slip = el('div', 'tm-slip', this.root);
    this.tablet = el('div', 'tm-tablet', slip, { 'aria-hidden': 'true' });
    this.name = el('b', 'tm-name', this.tablet);
    this.scroll = el('div', 'tm-scroll', slip, { role: 'slider', tabindex: '-1', 'aria-label': TW.aria });
    this.strip = el('div', 'tm-strip', this.scroll);
    this.canvas = el('canvas', 'tm-sky', this.strip);
    this.marks = el('div', 'tm-marks', this.strip);
    this.orbs = el('div', 'tm-orbs', this.scroll);
    this.orb = document.createElementNS(NS, 'svg');
    this.orb.setAttribute('class', 'tm-orb');
    this.orb.setAttribute('viewBox', '-12 -12 24 24');
    this.orbs.append(this.orb);
    this.orb.innerHTML = '<circle class="tm-glow" r="11"/><circle class="tm-disc" r="6.5"/><path class="tm-lit"/><circle class="tm-rim" r="6.5"/>';
    this.disc = this.orb.querySelector('.tm-disc');
    this.lit = this.orb.querySelector('.tm-lit');
    el('i', 'tm-now', this.scroll);
    el('i', 'tm-roller tm-l', this.scroll);
    el('i', 'tm-roller tm-r', this.scroll);
    const row = el('div', 'tm-row', slip);
    this.sub = el('span', 'tm-sub', row);
    this.pace = el('button', 'tm-pace', row, { type: 'button' });
    this.back = el('button', 'tm-back', row, { type: 'button', title: `${TW.back} · back to ${TW.glossLocal}`, 'aria-label': `${TW.back} · back to ${TW.glossLocal}` });
    el('span', 'tm-back-seal', this.back).textContent = TW.back;
    this.hint = el('div', 'tm-hint', this.root, { 'aria-hidden': 'true' });
    this.hint.append(TW.hint[0], el('span', 'qm-gloss', null));
    this.hint.lastChild.textContent = TW.hint[1];

    this.state = { hour: null, local: null, flow: null, x: null, orbY: null, orbKind: null, words: '', index: -1, night: null, theme: '' };
    this.layout();
    addEventListener('resize', () => { this.layout(); this.redraw(); });
    this.bind();
  }

  // sizes come from time.css (desktop / phone), read once here and on resize, never per frame
  layout() {
    const r = this.scroll.getBoundingClientRect();
    const w = Math.max(60, r.width || 170), skyH = parseFloat(getComputedStyle(this.root).getPropertyValue('--tm-sky')) || 36;
    const dpr = Math.min(3, devicePixelRatio || 1);
    if (this.dims && this.dims.w === w && this.dims.skyH === skyH && this.dims.dpr === dpr) return;
    this.dims = { w, skyH, dpr, pph: w / SPAN, bandH: Math.max(10, (this.scroll.clientHeight || 52) - skyH) };
    this.paint();
    this.placeMarks();
    this.state.x = null;
    this.state.orbY = null;
  }

  // the painted day: the sky of each moment in its true colours, a band of distant willows and roofs in ink wash, thin
  // wash strokes, the sun's path as a faint dotted arc, stars at night; the ruler of 刻 and hours along its foot
  paint() {
    const { pph, skyH, bandH, dpr } = this.dims;
    const W = Math.ceil((H1 - H0) * pph), H = Math.ceil(skyH + bandH), c = this.canvas;
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    c.style.width = `${W}px`;
    c.style.height = `${H}px`;
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const X = (t) => (H1 - t) * pph; // later to the left
    const horizon = skyH * 0.78;
    const L = {}, date = this.o.date || new Date();
    const step = 1 / 12;
    for (let t = H0; t < H1; t += step) {
      lightAt(t, L, date);
      const grd = g.createLinearGradient(0, 0, 0, skyH);
      grd.addColorStop(0, L.zenith.getStyle());
      grd.addColorStop(horizon / skyH, L.horizon.getStyle());
      grd.addColorStop(1, L.horizon.getStyle());
      g.fillStyle = grd;
      g.fillRect(X(t + step) - 0.5, 0, step * pph + 1, skyH);
    }
    // a period of 24 h, so the strip joins itself across midnight
    const per = (fn) => { for (const k of [-24, 0, 24]) fn(k); };
    const rand = rng(7);
    // thin wash strokes high in the sky (the ink sky's "small blocks of ink"), a little deeper than the sky under them
    g.save();
    g.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 9; i++) {
      const t = rand() * 24, y = skyH * (0.12 + rand() * 0.38), len = (1.2 + rand() * 2.2) * pph, th = 1.6 + rand() * 2.2;
      per((k) => {
        const x = X(t + k);
        if (x < -len || x > W + len) return;
        g.fillStyle = 'rgba(120, 132, 150, 0.16)';
        g.beginPath();
        g.ellipse(x, y, len / 2, th, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(120, 132, 150, 0.1)';
        g.beginPath();
        g.ellipse(x + len * 0.18, y + th * 0.6, len * 0.32, th * 0.7, 0, 0, Math.PI * 2);
        g.fill();
      });
    }
    g.restore();
    // stars, where it is night
    for (let i = 0; i < 70; i++) {
      const t = rand() * 24, y = rand() * horizon * 0.85, a = 0.35 + rand() * 0.6;
      lightAt(t, L, date);
      if (L.night < 0.3) continue;
      g.fillStyle = `rgba(232, 236, 248, ${(a * L.night).toFixed(2)})`;
      per((k) => { const x = X(t + k); if (x >= 0 && x <= W) g.fillRect(x, y, 1.1, 1.1); });
    }
    // the sun's path: a faint dotted arc over the hours it is up
    g.fillStyle = 'rgba(255, 250, 236, 0.55)';
    const ey = (e) => horizon - (Math.max(-8, Math.min(66, e)) / 66) * (horizon - 6);
    for (let t = H0; t < H1; t += 0.25) {
      lightAt(t, L, date);
      if (L.elevation < 1) continue;
      g.beginPath();
      g.arc(X(t), ey(L.elevation), 0.75, 0, Math.PI * 2);
      g.fill();
    }
    // the distant bank: willows and roofs in ink wash along the horizon, tinted by the sky behind them (multiply)
    const land = (t) => {
      const u = (2 * Math.PI * t) / 24;
      return 1.6 + 1.3 * (0.5 + 0.5 * Math.sin(u * 5 + 0.7)) + 0.9 * Math.sin(u * 11 + 2.1) + 0.6 * Math.sin(u * 23 + 0.3) + 0.5 * Math.sin(u * 41 + 1.7);
    };
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = 'rgba(86, 92, 104, 0.55)';
    g.beginPath();
    g.moveTo(0, skyH);
    for (let x = 0; x <= W; x += 1.5) g.lineTo(x, horizon - land(H1 - x / pph) * (skyH / 40));
    g.lineTo(W, skyH);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(70, 74, 84, 0.45)';
    g.beginPath();
    g.moveTo(0, skyH);
    for (let x = 0; x <= W; x += 1.5) g.lineTo(x, horizon + 3 + 0.7 * land((H1 - x / pph) * 1.7 + 3) * (skyH / 40));
    g.lineTo(W, skyH);
    g.closePath();
    g.fill();
    g.restore();
    // the ruler at the foot: a fine tick per 刻, a longer one per 初/正, a rule between the 時辰
    g.strokeStyle = 'rgba(42, 36, 32, 0.55)';
    g.lineWidth = 0.8;
    g.beginPath();
    for (let q = Math.ceil(H0 * 4); q <= H1 * 4; q++) {
      const t = q / 4, x = Math.round(X(t)) + 0.5;
      const len = q % 8 === 4 ? bandH : q % 4 === 0 ? 4 : 2; // odd hours bound the 時辰 (子 is 23:00-01:00)
      g.moveTo(x, skyH);
      g.lineTo(x, skyH + len);
    }
    g.stroke();
  }

  // the twelve 時辰 along the ruler, each under its middle (子 at midnight), in ink; the current one in cinnabar
  placeMarks() {
    const { pph } = this.dims;
    this.marks.replaceChildren();
    this.glyphs = [];
    for (let t = H0 + 1; t <= H1 - 1; t += 2) {
      const i = Math.floor(((wrap(t) + 1) % 24) / 2);
      const s = el('span', 'tm-mark', this.marks);
      s.textContent = BRANCHES[i];
      s.style.left = `${((H1 - t) * pph).toFixed(1)}px`;
      this.glyphs.push([i, s]);
    }
    this.state.index = -1;
    this.state.tick20 = null;
  }

  redraw() { if (this.last) this.set(...this.last); }

  // hour: s.hour; light: lightAt(hour); { local: s.localTime, flow: s.timeFlow }
  set(hour, light, { local = true, flow = 0 } = {}) {
    this.last = [hour, light, { local, flow }];
    const st = this.state, h = wrap(hour), { pph, skyH, dpr } = this.dims;
    // the strip: now under the thread (window from h + 3 on the left to h - 3 on the right)
    const x = -(H1 - (h + SPAN / 2)) * pph;
    if (st.x == null || Math.abs(x - st.x) * dpr >= 0.25) {
      st.x = x;
      this.strip.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    }
    // the sun by day, the moon by night (when it is up), at its true height on the thread
    // (the sun stays through the twilight, sinking behind the far bank; the moon only once it is dark and up)
    const moon = light.elevation < -6;
    const elev = moon ? light.moonElevation : light.elevation;
    const shown = !moon || (light.moonElevation > -3 && light.moonLit > 0.03);
    if (shown !== st.orbShown) { st.orbShown = shown; this.orb.style.visibility = shown ? '' : 'hidden'; }
    const horizon = skyH * 0.78, y = horizon - (Math.max(-8, Math.min(66, elev)) / 66) * (horizon - 6);
    const low = moon ? 0 : 1 - Math.min(1, Math.max(0, (elev - 2) / 14));
    const kind = moon ? 1000 + Math.round(light.moonPhase * 100) : Math.round(low * 10);
    if (st.orbY == null || Math.abs(y - st.orbY) * dpr >= 0.5 || kind !== st.orbKind) {
      st.orbY = y;
      this.orb.style.transform = `translate3d(-50%, ${(y - 0.5 * this.orbSize()).toFixed(1)}px, 0)`;
      if (kind !== st.orbKind) {
        st.orbKind = kind;
        this.orb.classList.toggle('is-moon', moon);
        if (moon) this.lit.setAttribute('d', moonPath(6.5, light.moonPhase));
        else this.disc.style.fill = sunFill(low);
      }
    }
    // the words, only when the reading can have changed (every 刻 and 點 boundary falls on a twentieth of an hour)
    const tick20 = Math.floor(h * 20), night = h >= 19 || h < 5;
    if (tick20 !== st.tick20 || local !== st.wordsLocal) {
      st.tick20 = tick20;
      st.wordsLocal = local;
      const w = hourWords(h);
      if (this.name.textContent !== w.name) this.name.textContent = w.name;
      this.sub.textContent = night ? `${w.watch}${w.point}` : w.full; // 巳正初刻 reads whole; 正初刻 alone is a fragment
      const reading = `${w.full}${night ? ` · ${w.watch}${w.point}` : ''}`;
      this.scroll.setAttribute('aria-valuetext', reading);
      this.scroll.title = `${reading} · ${local ? `${TW.local} · ${TW.glossLocal}` : `${TW.glossSet} · ${TW.back}: double-click`}`;
      if (w.index !== st.index) {
        st.index = w.index;
        for (const [i, g] of this.glyphs) g.classList.toggle('on', i === w.index);
      }
    }
    if (night !== st.night) { st.night = night; this.root.classList.toggle('is-night', night); }
    const pace = paceOf(flow, local);
    if (local !== st.local || pace !== st.flow) {
      st.local = local;
      st.flow = pace;
      this.root.classList.toggle('is-local', local);
      this.pace.textContent = pace;
      const t = `${TW.paceName[pace]} · ${local ? 'your own time; tap: let it run' : 'the pace of time; tap to change'}`;
      this.pace.title = t;
      this.pace.setAttribute('aria-label', t);
    }
  }

  orbSize() { return (this.orbPx ??= this.orb.getBoundingClientRect().height || 14); }

  // ------------------------------------------------------------------ input
  bind() {
    const sc = this.scroll, T = this.o.time || {};
    const hourNow = () => this.last?.[0] ?? 12;
    const setHour = (h, scrub) => T.setHour?.(h, { scrub });
    let drag = null, tap = null, fling = 0;
    sc.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      cancelAnimationFrame(fling);
      sc.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, x: e.clientX, h0: hourNow(), h: hourNow(), moved: 0, t: e.timeStamp, v: 0 }; // input times, not handling times
      this.root.classList.add('is-drag');
    });
    sc.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, now = e.timeStamp;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      if (drag.moved < 3) return;
      const h = drag.h0 + dx / this.dims.pph; // the paper follows the finger: pulled right, later hours come in
      const dt = Math.max(1, now - drag.t);
      drag.v = 0.7 * drag.v + 0.3 * (((h - drag.h) / dt) * 1000);
      drag.h = h;
      drag.t = now;
      setHour(h, true);
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      this.root.classList.remove('is-drag');
      if (d.moved < 3) { // a tap: two in a row go back to your own clock
        const now = performance.now();
        if (tap && now - tap < 340) { tap = null; T.toLocal?.(); } else tap = now;
        return;
      }
      tap = null;
      // a fling runs on and slows, as paper does
      let v = e.timeStamp - d.t > 90 ? 0 : Math.max(-8, Math.min(8, d.v)), h = d.h, t0 = performance.now(); // at most 8 h/s; none after a pause
      if (Math.abs(v) < 0.3) { setHour(h, false); return; }
      const step = (now) => {
        const dt = Math.min(0.05, (now - t0) / 1000);
        t0 = now;
        h += v * dt;
        v *= Math.exp(-5 * dt);
        if (Math.abs(v) < 0.15) { setHour(h, false); return; }
        setHour(h, true);
        fling = requestAnimationFrame(step);
      };
      fling = requestAnimationFrame(step);
    };
    sc.addEventListener('pointerup', end);
    sc.addEventListener('pointercancel', end);
    sc.addEventListener('dblclick', (e) => e.preventDefault());
    // the wheel over the scroll turns it a 刻 a notch (and doesn't zoom the camera)
    let wheelT = 0, wheelH = null;
    sc.addEventListener('wheel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      wheelH = (wheelH ?? hourNow()) + Math.sign(e.deltaY || e.deltaX) * 0.25 * Math.min(4, Math.max(1, Math.abs(e.deltaY || e.deltaX) / 100));
      setHour(wheelH, true);
      clearTimeout(wheelT);
      wheelT = setTimeout(() => { setHour(wheelH, false); wheelH = null; }, 260);
    }, { passive: false });
    for (const b of [this.pace, this.back]) b.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.pace.addEventListener('click', () => this.stepPace(1));
    this.back.addEventListener('click', () => T.toLocal?.());
    this.root.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });

    // T takes the keys; arrows scrub (a tap is one 刻; held, the scroll runs on), Shift a whole 時辰
    let hold = null;
    const keyStep = (dir, big) => { const h = hourNow() + dir * (big ? 2 : 0.25); setHour(big ? Math.round(h / 2 - 0.5) * 2 + 1 : Math.round(h * 4) / 4, false); };
    const run = (now) => {
      if (!hold) return;
      const dt = Math.min(0.05, (now - hold.t) / 1000);
      hold.t = now;
      if (now - hold.t0 > 280) { hold.h += hold.dir * (hold.big ? 6 : 2) * dt; setHour(hold.h, true); hold.ran = true; }
      hold.raf = requestAnimationFrame(run);
    };
    addEventListener('keydown', (e) => {
      if (editable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === 'KeyT') {
        if (!e.repeat && !this.o.blocked?.()) this.focus(!this.focused);
        e.preventDefault();
        return;
      }
      if (!this.focused) return;
      const k = e.code;
      if (k === 'ArrowLeft' || k === 'ArrowRight') {
        if (!e.repeat) {
          const dir = k === 'ArrowRight' ? 1 : -1; // → later (the paper moves right, as when you drag it)
          keyStep(dir, e.shiftKey);
          cancelAnimationFrame(hold?.raf);
          hold = { dir, big: e.shiftKey, h: hourNow(), t0: performance.now(), t: performance.now() };
          hold.raf = requestAnimationFrame(run);
        }
      } else if (k === 'ArrowUp' || k === 'ArrowDown') { if (!e.repeat) this.stepPace(k === 'ArrowUp' ? 1 : -1, true); } else if (k === 'Home' || k === 'Digit0' || k === 'Numpad0') T.toLocal?.();
      else if (k === 'Escape' || k === 'Enter') { this.focus(false); return; } else return;
      e.preventDefault();
      e.stopImmediatePropagation(); // the walking keys stay off while the instrument has them
    }, true);
    addEventListener('keyup', (e) => {
      if (hold && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
        cancelAnimationFrame(hold.raf);
        if (hold.ran) setHour(hold.h, false);
        hold = null;
      }
    }, true);
    addEventListener('blur', () => { if (hold) { cancelAnimationFrame(hold.raf); hold = null; } });
    // a click into the world gives the keys back
    addEventListener('pointerdown', (e) => { if (this.focused && !this.root.contains(e.target)) this.focus(false); }, true);
  }

  // the pace. A tap cycles 緩 → 常 → 疾 → 靜 → 緩 (from your own clock the first tap lets time run slowly); the arrow keys
  // go up and down 靜 · 緩 · 常 · 疾 and stop at the ends
  stepPace(dir, clamp = false) {
    const T = this.o.time || {}, cur = this.state.flow, CYCLE = ['緩', '常', '疾', '靜'];
    let next;
    if (cur === '今' || cur == null) next = dir > 0 ? '緩' : '靜';
    else if (clamp) next = PACE_ORDER[Math.max(0, Math.min(PACE_ORDER.length - 1, PACE_ORDER.indexOf(cur) + dir))];
    else next = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length];
    T.setFlow?.(next);
  }

  focus(on) {
    this.focused = on;
    this.root.classList.toggle('is-focus', on);
    if (on && document.pointerLockElement) document.exitPointerLock?.();
  }
}
