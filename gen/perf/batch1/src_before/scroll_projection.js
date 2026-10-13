// Page -> painting: a point of the walkable world (X east, D north, H up: the page's x, -z, y) -> the scan pixel
// [u, v] of reference/scroll/qingming_commons_38414x1800.jpg it was mapped from, with the frames the map itself uses
// (map/README.md, Frames; each section's layout.json carries them):
//   u = ou + ax·X + dx(u)·D,   v = ov + ay·X + dy·D − h·H
// The receding direction dx drifts along u (dx_knots, linear between knots, constant beyond), so u appears on both
// sides. Each piece of dx is linear in u, so u is solved exactly piece by piece (a fixed-point iteration diverges
// where the drift is steep: S5 between the gate and the bridge, deep points). No three.js: Node tests import it too.

// the receding direction's u-component at picture u (tools/scroll_map.mjs dxAt)
export function dxAt(f, u) {
  const k = f.dx_knots;
  if (!k?.length) return f.d[0];
  if (u <= k[0][0]) return k[0][1];
  for (let i = 0; i + 1 < k.length; i++) if (u <= k[i + 1][0]) return k[i][1] + ((k[i + 1][1] - k[i][1]) * (u - k[i][0])) / (k[i + 1][0] - k[i][0]);
  return k[k.length - 1][1];
}

// the frame that covers picture u (tools/scroll_map.mjs frameFor)
export const frameAt = (frames, u) => frames.find((f) => u >= f.covers[0] && u < f.covers[1]) || frames[0];

// every u with u = c + dx(u)·D: piecewise linear, solved on each piece and kept if it falls inside it
function solveU(f, X, D) {
  const c = f.origin[0] + f.x[0] * X;
  const k = f.dx_knots;
  if (!k?.length) return [c + f.d[0] * D];
  const out = [];
  const lo = c + k[0][1] * D; // before the first knot: dx constant
  if (lo <= k[0][0]) out.push(lo);
  for (let i = 0; i + 1 < k.length; i++) {
    const [u0, d0] = k[i], [u1, d1] = k[i + 1], b = (d1 - d0) / (u1 - u0), a = d0 - b * u0; // dx = a + b·u
    const den = 1 - b * D;
    if (Math.abs(den) < 1e-9) continue;
    const u = (c + a * D) / den;
    if (u >= u0 - 1e-6 && u <= u1 + 1e-6) out.push(u);
  }
  const hi = c + k[k.length - 1][1] * D; // past the last knot
  if (hi >= k[k.length - 1][0]) out.push(hi);
  return out;
}

// one frame: ground [X, D] at height H -> scan [u, v]. Inside the silk the solution is unique (the drift never folds
// the ground there); if a frame ever folds, the solution nearest the straight reading is taken.
export function toScanOn(f, X, D, H = 0) {
  let us = solveU(f, X, D);
  if (!us.length) us = [f.origin[0] + f.x[0] * X + dxAt(f, f.origin[0] + f.x[0] * X) * D];
  let u = us[0];
  if (us.length > 1) { const ref = f.origin[0] + f.x[0] * X + dxAt(f, f.origin[0] + f.x[0] * X) * D; u = us.reduce((a, b) => (Math.abs(b - ref) < Math.abs(a - ref) ? b : a)); }
  return [u, f.origin[1] + (f.x[1] || 0) * X + f.d[1] * D - f.h * H];
}

// a section's frames: pick the frame by the u it gives (one frame per section today; several would chain)
export function toScan(frames, X, D, H = 0) {
  let f = frames[0], p = toScanOn(f, X, D, H);
  for (let i = 0; i < 3 && frames.length > 1; i++) {
    const g = frameAt(frames, p[0]);
    if (g === f) break;
    f = g;
    p = toScanOn(f, X, D, H);
  }
  return p;
}

// the inverse, scan [u, v] of a point at height H -> ground [X, D] (tools/scroll_map.mjs toWorld)
export function toGround(frames, u, v, H = 0) {
  const f = frameAt(frames, u);
  if (f.dx_knots) { const D = (v - f.origin[1] + f.h * H) / f.d[1]; return [(u - f.origin[0] - dxAt(f, u) * D) / f.x[0], D]; }
  const [a, c] = f.x, [b, d] = f.d, ru = u - f.origin[0], rv = v - f.origin[1] + f.h * H, det = a * d - b * c;
  return [(ru * d - b * rv) / det, (a * rv - c * ru) / det];
}

// The joined world: every loaded section's frames and painted range (scroll_index.json: section, area [u0, u1],
// frames). A point belongs to the section whose painted range its projection falls in; frames agree on the seams
// (one knot list along the scroll), so either neighbour gives the same pixel there.
export class ScrollProjection {
  constructor() { this.sections = new Map(); } // key -> { section, area, frames }
  set(key, sec) { this.sections.set(key, sec); }
  delete(key) { this.sections.delete(key); }
  get size() { return this.sections.size; }

  // -> { u, v, section } or null when no section is known
  project(X, D, H = 0) {
    let best = null;
    for (const sec of this.sections.values()) {
      const [u, v] = toScan(sec.frames, X, D, H);
      const [a, b] = sec.area;
      const off = u < a ? a - u : u > b ? u - b : 0; // 0 inside its painted range
      if (!best || off < best.off) best = { u, v, section: sec.section, off };
      if (off === 0) break;
    }
    return best && { u: best.u, v: best.v, section: best.section };
  }

  // a heading on the ground (facing_deg convention: radians, 0 = east, pi/2 = north) -> the direction it takes on
  // the painting, as an angle in scan pixels (u right, v down), from a step of `step` metres along it
  heading(X, D, H, rad, step = 1.5) {
    const a = this.project(X, D, H), b = this.project(X + Math.cos(rad) * step, D + Math.sin(rad) * step, H);
    return a && b ? Math.atan2(b.v - a.v, b.u - a.u) : null;
  }
}
