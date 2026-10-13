// Palette of the jiangnan refs: k-means in CIELAB over each image (downsampled), plus the median colour of named
// material regions (full-res rects). Writes palette.json and palette_swatches.png in gen/ui/look/.
// node gen/ui/look/tools_palette.mjs
import { createRequire } from 'module';
import fs from 'fs';
const sharp = createRequire('/home/ran/3d_director/qingming/tools/package.json')('sharp');
const R = 'reference/jiangnan/', OUT = 'gen/ui/look/';
const IM = { jn1: R + 'jn1_keyart_pink_sky.png', jn2: R + 'jn2_bridge_ink_sky.png', jn3: R + 'jn3_ingame_iso.png' };
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function lab([r, g, b]) {
  const R_ = lin(r / 255), G = lin(g / 255), B = lin(b / 255);
  let x = (0.4124 * R_ + 0.3576 * G + 0.1805 * B) / 0.95047, y = 0.2126 * R_ + 0.7152 * G + 0.0722 * B, z = (0.0193 * R_ + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x); y = f(y); z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const hex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
async function pixels(file, rect, w) {
  let p = sharp(file).removeAlpha();
  if (rect) p = p.extract({ left: rect[0], top: rect[1], width: rect[2], height: rect[3] });
  if (w) p = p.resize({ width: w });
  const { data, info } = await p.raw().toBuffer({ resolveWithObject: true });
  const px = [];
  for (let i = 0; i < data.length; i += 3) px.push([data[i], data[i + 1], data[i + 2]]);
  return { px, info };
}
function kmeans(px, k, iters = 25) {
  const L = px.map(lab);
  let C = []; // k-means++ seeding (deterministic stride)
  C.push(L[Math.floor(L.length / 2)]);
  while (C.length < k) {
    let best = -1, bi = 0;
    for (let i = 0; i < L.length; i += 7) {
      const d = Math.min(...C.map((c) => (c[0] - L[i][0]) ** 2 + (c[1] - L[i][1]) ** 2 + (c[2] - L[i][2]) ** 2));
      if (d > best) { best = d; bi = i; }
    }
    C.push(L[bi]);
  }
  let asg = new Int32Array(L.length);
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < L.length; i++) {
      let bd = 1e9, b = 0;
      for (let j = 0; j < k; j++) { const d = (C[j][0] - L[i][0]) ** 2 + (C[j][1] - L[i][1]) ** 2 + (C[j][2] - L[i][2]) ** 2; if (d < bd) { bd = d; b = j; } }
      asg[i] = b;
    }
    const S = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (let i = 0; i < L.length; i++) { const s = S[asg[i]]; s[0] += L[i][0]; s[1] += L[i][1]; s[2] += L[i][2]; s[3]++; }
    C = S.map((s, j) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : C[j]));
  }
  // representative sRGB: median of members per channel
  const out = [];
  for (let j = 0; j < k; j++) {
    const m = px.filter((_, i) => asg[i] === j);
    if (!m.length) continue;
    const med = [0, 1, 2].map((c) => m.map((p) => p[c]).sort((a, b) => a - b)[m.length >> 1]);
    out.push({ hex: hex(med), share: +(m.length / px.length).toFixed(3), lab: lab(med).map((v) => +v.toFixed(1)) });
  }
  return out.sort((a, b) => b.share - a.share);
}
// named regions: [name, image, x, y, w, h] (full-res px), chosen on the crops in gen/ui/look/crops/
const REGIONS = JSON.parse(fs.readFileSync(OUT + 'palette_regions.json', 'utf8'));
const result = { kmeans: {}, regions: [] };
for (const [k, f] of Object.entries(IM)) {
  const { px } = await pixels(f, null, 360);
  result.kmeans[k] = kmeans(px, 16);
  console.log(k, result.kmeans[k].map((c) => `${c.hex} ${(c.share * 100).toFixed(1)}%`).join('  '));
}
const tiles = [];
for (const [name, im, x, y, w, h, note] of REGIONS) {
  const { px } = await pixels(IM[im], [x, y, w, h]);
  const med = [0, 1, 2].map((c) => px.map((p) => p[c]).sort((a, b) => a - b)[px.length >> 1]);
  // spread: the 10th and 90th percentile lightness, to show the wash's gradient
  const Ls = px.map((p) => lab(p)[0]).sort((a, b) => a - b);
  const r = { name, im, rect: [x, y, w, h], hex: hex(med), lab: lab(med).map((v) => +v.toFixed(1)), L10: +Ls[Math.floor(Ls.length * 0.1)].toFixed(1), L90: +Ls[Math.floor(Ls.length * 0.9)].toFixed(1), note };
  result.regions.push(r);
  console.log(name.padEnd(22), r.hex, 'L', r.lab[0], 'a', r.lab[1], 'b', r.lab[2], ' L10-90', r.L10, r.L90);
  tiles.push({ name, hex: r.hex, crop: await sharp(IM[im]).removeAlpha().extract({ left: x, top: y, width: w, height: h }).resize(120, 120, { fit: 'cover' }).png().toBuffer() });
}
fs.writeFileSync(OUT + 'palette.json', JSON.stringify(result, null, 1));
// swatch sheet: per region its crop and its flat median colour
const W = 120, cols = 8, rows = Math.ceil(tiles.length / cols);
const comp = [];
tiles.forEach((t, i) => {
  const x = (i % cols) * W, y = Math.floor(i / cols) * (2 * W + 24);
  comp.push({ input: t.crop, left: x, top: y });
  comp.push({ input: { create: { width: W, height: W, channels: 3, background: t.hex } }, left: x, top: y + W });
  const svg = `<svg width="${W}" height="24"><text x="3" y="16" font-size="12" font-family="sans-serif">${t.name.slice(0, 18)}</text></svg>`;
  comp.push({ input: Buffer.from(svg), left: x, top: y + 2 * W });
});
await sharp({ create: { width: cols * W, height: rows * (2 * W + 24), channels: 3, background: '#ffffff' } }).composite(comp).png().toFile(OUT + 'crops/palette_swatches.png');
