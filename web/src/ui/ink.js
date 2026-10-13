// Ink frames for the UI (gen/ui/STYLE.md "Ink frames"): a few hand-made brush shapes, generated once from a fixed seed
// as small SVGs and handed to CSS as custom properties. No live SVG filters, nothing redrawn per frame:
//   --qm-frame-slip    9-slice paper slip with a brush-line border (border-image, slice 24, fill)
//   --qm-frame-bubble  9-slice rounded paper with a brush-line border (speech bubbles)
//   --qm-frame-cloud   9-slice scalloped paper (thought bubbles; slice 32, repeat round)
//   --qm-ring          a brush circle for round buttons (background-image)
//   --qm-seal-mask     a stamp's worn edge and speckles (mask-image on .qm-seal)
// Pure functions: the same module renders in the page, the kit and node (tools that bake a stroke into HTML).

// seeded random (mulberry32), so every load draws the same brush
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f1 = (v) => (Math.round(v * 10) / 10).toString();
// a smooth wobble along a stroke: a sum of two seeded sines
function wobble(r, amp) {
  const a = r() * 6.28, b = r() * 6.28, k1 = 0.8 + r() * 1.2, k2 = 2.5 + r() * 2;
  return (t) => amp * (0.65 * Math.sin(a + k1 * t * 6.28) + 0.35 * Math.sin(b + k2 * t * 6.28));
}

// a tapered brush stroke along an open polyline: thick where the brush lands, thinner as it lifts
export function strokePath(pts, w0, w1, { r = rng(1), jitter = 0.4, wob = 0 } = {}) {
  const n = pts.length, L = [], R = [], wf = wobble(r, wob);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)];
    let dx = q[0] - o[0], dy = q[1] - o[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    const t = i / (n - 1);
    // landing blob, body, lift
    const w = (w0 + (w1 - w0) * t) * (t < 0.08 ? 0.75 + 3 * t : 1) * (t > 0.9 ? 1 - (t - 0.9) * 5 : 1) + wf(t);
    const j = (r() - 0.5) * jitter;
    L.push([p[0] - dy * (w / 2 + j), p[1] + dx * (w / 2 + j)]);
    R.push([p[0] + dy * (w / 2 - j), p[1] - dx * (w / 2 - j)]);
  }
  const all = [...L, ...R.reverse()];
  return 'M' + all.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') + 'Z';
}

// a closed brush ring along a closed centreline: width varies round it, both edges as one even-odd shape
export function ringPath(pts, w, { r = rng(2), vary = 0.35, jitter = 0.25 } = {}) {
  const n = pts.length, O = [], I = [], wf = wobble(r, w * vary);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n], o = pts[(i - 1 + n) % n];
    let dx = q[0] - o[0], dy = q[1] - o[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    const ww = Math.max(0.6, w + wf(i / n)), j = (r() - 0.5) * jitter;
    O.push([p[0] + dy * (ww / 2 + j), p[1] - dx * (ww / 2 + j)]);
    I.push([p[0] - dy * (ww / 2 - j), p[1] + dx * (ww / 2 - j)]);
  }
  const ring = (a) => 'M' + a.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') + 'Z';
  return ring(O) + ring(I);
}

const poly = (a) => 'M' + a.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') + 'Z';
const line = (a, b, step = 3) => {
  const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
  return Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
};

// a rounded rectangle's centreline (clockwise from the top-left corner's end), corner radius rad
function roundRect(x0, y0, x1, y1, rad, step = 2.5) {
  const pts = [];
  const arc = (cx, cy, a0) => { for (let k = 0; k <= 6; k++) { const a = a0 + (k / 6) * (Math.PI / 2); pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); } };
  pts.push(...line([x0 + rad, y0], [x1 - rad, y0], step)); arc(x1 - rad, y0 + rad, -Math.PI / 2);
  pts.push(...line([x1, y0 + rad], [x1, y1 - rad], step)); arc(x1 - rad, y1 - rad, 0);
  pts.push(...line([x1 - rad, y1], [x0 + rad, y1], step)); arc(x0 + rad, y1 - rad, Math.PI / 2);
  pts.push(...line([x0, y1 - rad], [x0, y0 + rad], step)); arc(x0 + rad, y0 + rad, Math.PI);
  return pts.filter((p, i, a) => i === 0 || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) > 0.3);
}

// width/height matter: border-image slices an image by its intrinsic size (an SVG without one takes the element's)
const svg = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${vb}" height="${vb}" viewBox="0 0 ${vb} ${vb}">${body}</svg>`;
export const dataUri = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

// the paper slip: four strokes that overshoot their corners a little (a box drawn by hand), on a paper fill
export function slipSvg({ paper = '#efe4cc', ink = '#2a2420', seed = 7 } = {}) {
  const r = rng(seed), S = 96, c = 13, o = 4.2;
  const C = [[c, c], [S - c, c], [S - c, S - c], [c, S - c]];
  const fill = [C[0], C[1], C[2], C[3]].map(([x, y]) => [x + (r() - 0.5) * 0.8, y + (r() - 0.5) * 0.8]);
  let ink4 = '';
  for (let k = 0; k < 4; k++) {
    const a = C[k], b = C[(k + 1) % 4], dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]);
    const pts = line([a[0] - dx * o, a[1] - dy * o], [b[0] + dx * o * 0.6, b[1] + dy * o * 0.6], 2);
    ink4 += strokePath(pts, 5.8, 3.4, { r, jitter: 0.45, wob: 0.5 });
  }
  return svg(S, `<path d="${poly(fill)}" fill="${paper}"/><path d="${ink4}" fill="${ink}"/>`);
}

// the speech bubble: one closed brush line round a rounded rectangle
export function bubbleSvg({ paper = '#f7efdc', ink = '#2a2420', seed = 11 } = {}) {
  const r = rng(seed), S = 96, c = 13;
  const pts = roundRect(c, c, S - c, S - c, 11);
  return svg(S, `<path d="${poly(pts)}" fill="${paper}"/><path d="${ringPath(pts, 5.2, { r, vary: 0.38 })}" fill="${ink}" fill-rule="evenodd"/>`);
}

// the thought cloud: scallops whose straight runs lie exactly in the middle slices (32..64), so `round` tiles them
export function cloudSvg({ paper = '#f7efdc', ink = '#2a2420', seed = 13 } = {}) {
  const r = rng(seed), S = 96, c = 16, rad = 16, A = 3.6;
  const base = roundRect(c, c, S - c, S - c, rad, 1);
  const pts = base.map(([x, y]) => {
    // outward normal of the base shape and the bump at this point
    let nx = 0, ny = 0, a = 0;
    if (y <= c + 0.01 && x >= 32 && x <= 64) { ny = -1; a = Math.abs(Math.sin(((x - 32) / 16) * Math.PI)); }
    else if (y >= S - c - 0.01 && x >= 32 && x <= 64) { ny = 1; a = Math.abs(Math.sin(((x - 32) / 16) * Math.PI)); }
    else if (x <= c + 0.01 && y >= 32 && y <= 64) { nx = -1; a = Math.abs(Math.sin(((y - 32) / 16) * Math.PI)); }
    else if (x >= S - c - 0.01 && y >= 32 && y <= 64) { nx = 1; a = Math.abs(Math.sin(((y - 32) / 16) * Math.PI)); }
    else {
      const cx = x < S / 2 ? c + rad : S - c - rad, cy = y < S / 2 ? c + rad : S - c - rad;
      const ang = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, y - cy) || 1;
      nx = (x - cx) / d; ny = (y - cy) / d;
      // one bump per corner, zero where it meets the straight runs
      const q = ((ang % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2);
      a = Math.sin((q / (Math.PI / 2)) * Math.PI) * 1.25;
    }
    return [x + nx * A * a, y + ny * A * a];
  });
  return svg(S, `<path d="${poly(pts)}" fill="${paper}"/><path d="${ringPath(pts, 4.4, { r, vary: 0.12, jitter: 0.05 })}" fill="${ink}" fill-rule="evenodd"/>`);
}

// a brush circle for round buttons and the sundial's frame
export function ringSvg({ ink = '#2a2420', seed = 17, width = 3.6 } = {}) {
  const r = rng(seed), S = 64, R = 28.5, n = 72, a0 = r() * 6.28;
  const pts = Array.from({ length: n }, (_, i) => { const a = a0 + (i / n) * Math.PI * 2; return [32 + Math.cos(a) * R, 32 + Math.sin(a) * R]; });
  // the brush lands a little past where it started: a short second stroke over the join
  const tail = Array.from({ length: 9 }, (_, i) => { const a = a0 - 0.25 + (i / 8) * 0.55; return [32 + Math.cos(a) * (R + 0.6), 32 + Math.sin(a) * (R + 0.6)]; });
  return svg(S, `<path d="${ringPath(pts, width, { r, vary: 0.4 })}" fill="${ink}" fill-rule="evenodd"/><path d="${strokePath(tail, width * 1.1, width * 0.5, { r })}" fill="${ink}"/>`);
}

// a stamp's worn outline: a slightly uneven square with a few speckles where the paste didn't take
export function sealMaskSvg({ seed = 23 } = {}) {
  const r = rng(seed), S = 40, m = 1.2;
  const sq = [];
  for (const [a, b] of [[[m, m], [S - m, m]], [[S - m, m], [S - m, S - m]], [[S - m, S - m], [m, S - m]], [[m, S - m], [m, m]]]) {
    for (const p of line(a, b, 2.5).slice(0, -1)) sq.push([p[0] + (r() - 0.5) * 1.1, p[1] + (r() - 0.5) * 1.1]);
  }
  let holes = '';
  for (let k = 0; k < 22; k++) {
    const x = 2 + r() * (S - 4), y = 2 + r() * (S - 4), rr = 0.25 + r() * 0.75;
    holes += `M${f1(x - rr)} ${f1(y)}a${f1(rr)} ${f1(rr)} 0 1 0 ${f1(2 * rr)} 0a${f1(rr)} ${f1(rr)} 0 1 0 ${f1(-2 * rr)} 0Z`;
  }
  return svg(S, `<path d="${poly(sq)}${holes}" fill="#000" fill-rule="evenodd"/>`);
}

// a long horizontal brush stroke (the loading progress, the banner's rule): returns a path in a w x h box
export function longStroke({ w = 600, h = 36, seed = 29 } = {}) {
  const r = rng(seed), wf = wobble(r, h * 0.035);
  const mid = (t) => h / 2 + Math.sin(t * 3.4 + 0.2) * h * 0.1 - t * h * 0.08;
  // the width along the stroke: the brush presses down (a round head), runs, thins, and lifts to a point
  const W = (t) => h * 0.5 * (t < 0.035 ? 0.55 + 13 * t : 1) * (1 - 0.4 * t) * (t > 0.8 ? Math.pow(Math.max(0, 1 - (t - 0.8) / 0.2), 0.8) : 1) + wf(t);
  const L = [], R = [];
  for (let i = 0; i <= 90; i++) {
    const t = i / 90, x = 10 + t * (w - 20), y = mid(t), y2 = mid(Math.min(1, t + 0.01)) - mid(Math.max(0, t - 0.01));
    const a = Math.atan2(y2, (w - 20) * 0.02), ww = Math.max(0.3, W(t)) / 2, j = (r() - 0.5) * 0.5;
    L.push([x - Math.sin(a) * (ww + j), y + Math.cos(a) * (ww + j)]);
    R.push([x + Math.sin(a) * (ww - j), y - Math.cos(a) * (ww - j)]);
  }
  // the head: the brush enters from the upper left and turns (藏鋒)
  const hx = 10, hy = mid(0);
  let d = 'M' + [[hx + h * 0.15, hy - h * 0.34], ...R.reverse()].map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') + 'L' +
    [...L.reverse()].map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') + `L${f1(hx - h * 0.12)} ${f1(hy)}Z`;
  // dry brush (飛白): thin streaks of paper where the brush ran out of ink, towards the end (even-odd holes)
  for (let k = 0; k < 5; k++) {
    const t0 = 0.45 + r() * 0.3, t1 = Math.min(0.97, t0 + 0.12 + r() * 0.3), off = (r() - 0.5) * h * 0.22, sw = 0.5 + r() * 0.7;
    const s = [];
    for (let i = 0; i <= 16; i++) { const t = t0 + ((t1 - t0) * i) / 16; s.push([8 + t * (w - 16), mid(t) + off * (1 - 0.3 * (t - t0))]); }
    d += strokePath(s, sw, sw * 0.4, { r, jitter: 0.1 });
  }
  return d;
}

// the frames for one theme, as CSS custom properties on the root
export function applyInk(root, { paper = '#efe4cc', bubble = '#f7efdc', ink = '#2a2420' } = {}) {
  const set = (k, v) => root.style.setProperty(k, v);
  set('--qm-frame-slip', dataUri(slipSvg({ paper, ink })));
  set('--qm-frame-plaque', dataUri(slipSvg({ paper: '#faf6ec', ink: '#1d1916', seed: 41 }))); // the plaques are white, as in 江南百景圖
  set('--qm-frame-bubble', dataUri(bubbleSvg({ paper: bubble, ink })));
  set('--qm-frame-cloud', dataUri(cloudSvg({ paper: bubble, ink })));
  set('--qm-ring', dataUri(ringSvg({ ink })));
  set('--qm-seal-mask', dataUri(sealMaskSvg()));
}
