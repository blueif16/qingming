// White paper -> alpha with no halo: the tree cards' keyer (tools/tree_cards.mjs keyCard, trees/notes.md "Keying"),
// as a function for other painted cut-outs (the 3D trees' bare frameworks and clump sheets, tools/trees3d.mjs).
//   const { rgba, W, H, paper, box, foot } = await keyPaper(file, { conf, bg, gap, dense, band, gamma })
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');

// float blur (three box passes ~ gaussian), per channel, in place on a copy
function blur(src, W, H, ch, sigma) {
  const rad = Math.max(1, Math.round(Math.sqrt((12 * sigma * sigma) / 3 + 1) / 2));
  let a = Float32Array.from(src), b = new Float32Array(src.length);
  for (let pass = 0; pass < 3; pass++) {
    for (const horiz of [true, false]) {
      const n = horiz ? W : H, m = horiz ? H : W;
      for (let j = 0; j < m; j++) for (let c = 0; c < ch; c++) {
        const at = (i) => (horiz ? (j * W + i) : (i * W + j)) * ch + c;
        let acc = 0;
        for (let i = -rad; i <= rad; i++) acc += a[at(Math.min(n - 1, Math.max(0, i)))];
        for (let i = 0; i < n; i++) {
          b[at(i)] = acc / (2 * rad + 1);
          acc += a[at(Math.min(n - 1, i + rad + 1))] - a[at(Math.max(0, i - rad))];
        }
      }
      [a, b] = [b, a];
    }
  }
  return a;
}
function dilate(mask, W, H, rad) { // max filter, square
  const t = new Uint8Array(mask.length), o = new Uint8Array(mask.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = 0; for (let i = Math.max(0, x - rad); i <= Math.min(W - 1, x + rad) && !v; i++) v = mask[y * W + i]; t[y * W + x] = v; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = 0; for (let i = Math.max(0, y - rad); i <= Math.min(H - 1, y + rad) && !v; i++) v = t[i * W + x]; o[y * W + x] = v; }
  return o;
}

// The tree is painted on white, and nothing in a tree is whiter than the paper, so d = how far a pixel lies below
// the paper (max over channels) says how much tree it holds. Away from the paper (more than 2 px from any clear
// pixel) every pixel deeper than `gap` is tree where the tree around it is dense (`dense`: the share of confident
// pixels within ~3 px, as on a trunk), so highlights stay; in a porous crown such pixels are paper between needles. In the 2 px band along the paper, a pixel's alpha is its
// projection on the line paper -> local tree colour (the mean of the confident tree pixels around it), and it takes
// that local colour, so the paper never tints an edge (no halo). Pale strokes with no dark core near them keep their
// own colour. Transparent pixels carry the nearby tree colour (for mipmaps), and alpha gets a mild coverage boost so
// one-pixel shoots survive alphaTest 0.5.
export async function keyPaper(file, kpIn = {}) {
  const kp = { conf: 0.42, bg: 0.035, gap: 0.1, dense: 0.7, band: 2, gamma: 0.8, ...kpIn };
  const { data, info } = await sharp(file).flatten({ background: '#ffffff' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const P = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) P[i] = data[i] / 255;
  // the paper: median of a border band
  const band = Math.round(Math.min(W, H) * 0.015), bs = [[], [], []];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < band || x >= W - band || y < band || y >= H - band) for (let k = 0; k < 3; k++) bs[k].push(P[(y * W + x) * 3 + k]);
  const B = bs.map((a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; });
  const spread = bs.map((a) => a[Math.floor(a.length * 0.95)] - a[Math.floor(a.length * 0.05)]);
  const d = new Float32Array(N), clear = new Uint8Array(N), core = new Float32Array(N * 4);
  for (let p = 0; p < N; p++) {
    d[p] = Math.max(0, B[0] - P[p * 3], B[1] - P[p * 3 + 1], B[2] - P[p * 3 + 2]);
    clear[p] = d[p] < kp.bg ? 1 : 0;
    if (d[p] >= kp.conf) { for (let k = 0; k < 3; k++) core[p * 4 + k] = P[p * 3 + k]; core[p * 4 + 3] = 1; }
  }
  const nearClear = dilate(clear, W, H, kp.band);
  const local1 = blur(core, W, H, 4, 1.2), local2 = blur(core, W, H, 4, 3.5);
  const A = new Float32Array(N), F = new Float32Array(N * 3);
  for (let p = 0; p < N; p++) {
    for (let k = 0; k < 3; k++) F[p * 3 + k] = P[p * 3 + k];
    if (clear[p]) { A[p] = 0; continue; }
    // inside a dense part of the tree (a trunk, a limb) a pale pixel is a highlight; in a porous crown it is paper
    // showing between needles or leaves, and nearly white pixels are paper anywhere
    if ((!nearClear[p] && d[p] >= kp.gap && local2[p * 4 + 3] >= kp.dense) || d[p] >= kp.conf) { A[p] = 1; continue; }
    const local = local1[p * 4 + 3] > 0.06 ? local1 : local2, w = local[p * 4 + 3];
    if (w > 0.015) { // a tree colour close by: project on paper -> that colour
      let num = 0, den = 0;
      for (let k = 0; k < 3; k++) { const f = local[p * 4 + k] / w, e = f - B[k]; num += (P[p * 3 + k] - B[k]) * e; den += e * e; F[p * 3 + k] = f; }
      A[p] = Math.max(0, Math.min(1, den > 1e-4 ? num / den : 0));
    } else { // a pale stroke on its own: its own colour, alpha rising with its depth below the paper
      const a = Math.min(1, (d[p] - kp.bg) / (0.2 - kp.bg));
      A[p] = a;
      for (let k = 0; k < 3; k++) F[p * 3 + k] = Math.max(0, Math.min(1, B[k] + (P[p * 3 + k] - B[k]) / Math.max(a, 0.35)));
    }
    A[p] *= Math.min(1, (d[p] - kp.bg) / kp.bg); // fade in over the paper's noise
  }
  for (let p = 0; p < N; p++) A[p] = Math.pow(A[p], kp.gamma);
  // colour under the clear: premultiplied blur / alpha blur, near then far
  const pm = new Float32Array(N * 4);
  for (let p = 0; p < N; p++) { for (let k = 0; k < 3; k++) pm[p * 4 + k] = F[p * 3 + k] * A[p]; pm[p * 4 + 3] = A[p]; }
  const near = blur(pm, W, H, 4, 3), far = blur(pm, W, H, 4, 24);
  const rgba = Buffer.alloc(N * 4);
  for (let p = 0; p < N; p++) {
    const a = A[p];
    for (let k = 0; k < 3; k++) {
      const src = near[p * 4 + 3] > 0.01 ? near : far;
      const bc = src[p * 4 + 3] > 1e-4 ? src[p * 4 + k] / src[p * 4 + 3] : 0.42;
      const t = Math.min(1, a * 2);
      rgba[p * 4 + k] = Math.round(255 * Math.max(0, Math.min(1, t * F[p * 3 + k] + (1 - t) * bc)));
    }
    rgba[p * 4 + 3] = Math.round(255 * a);
  }
  // the tree's box (columns and rows holding at least 3 solid pixels) and its foot
  const solid = (p) => rgba[p * 4 + 3] >= 128;
  const colN = new Int32Array(W), rowN = new Int32Array(H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (solid(y * W + x)) { colN[x]++; rowN[y]++; }
  const first = (arr) => arr.findIndex((v) => v >= 3), last = (arr) => arr.length - 1 - [...arr].reverse().findIndex((v) => v >= 3);
  const box = { x0: first(colN), x1: last(colN), y0: first(rowN), y1: last(rowN) };
  const footRows = Math.max(3, Math.round((box.y1 - box.y0) * 0.02));
  let sx = 0, sn = 0;
  for (let y = box.y1 - footRows + 1; y <= box.y1; y++) for (let x = box.x0; x <= box.x1; x++) if (solid(y * W + x)) { sx += x; sn++; }
  const foot = [sx / sn, box.y1];
  return { rgba, W, H, paper: B.map((v) => +v.toFixed(3)), spread: spread.map((v) => +v.toFixed(3)), box, foot };
}
