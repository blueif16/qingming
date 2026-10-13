// pigment samples by filter: median colour of the pixels in a rect that pass a Lab test, and their share.
// node gen/ui/look/tools_pigments.mjs  -> prints and appends `pigments` to gen/ui/look/palette.json
import { createRequire } from 'module';
import fs from 'fs';
const sharp = createRequire('/home/ran/3d_director/qingming/tools/package.json')('sharp');
const R = 'reference/jiangnan/';
const IM = { jn1: R + 'jn1_keyart_pink_sky.png', jn2: R + 'jn2_bridge_ink_sky.png', jn3: R + 'jn3_ingame_iso.png' };
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function lab([r, g, b]) {
  const R_ = lin(r / 255), G = lin(g / 255), B = lin(b / 255);
  let x = (0.4124 * R_ + 0.3576 * G + 0.1805 * B) / 0.95047, y = 0.2126 * R_ + 0.7152 * G + 0.0722 * B, z = (0.0193 * R_ + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x); y = f(y); z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const TESTS = {
  carmine: ([L, a, b]) => a > 16 && L > 35 && b < a * 0.9, // 胭脂: pink-red blossoms (a high, b lower than a)
  cinnabar: ([L, a, b]) => a > 30 && b > 25 && L < 62, // 朱砂: rail, seals
  gamboge: ([L, a, b]) => b > 40 && a < 15 && L > 55, // 藤黃: yellow flowers, straw
  white: ([L, a, b]) => L > 86 && Math.abs(a) < 6 && b < 16, // 鉛白: white blossom, plaster highlights
  ink: ([L]) => L < 22, // 墨: line work, darkest strokes
  azurite: ([L, a, b]) => b < -6 && L > 35, // 石青: the bluest water and cloth
  malachite: ([L, a, b]) => a < -14 && L > 35, // 石綠: the greenest leaves
};
const SAMPLES = [
  ['blossom_pink', 'jn2', 1500, 580, 120, 140, 'carmine'],
  ['blossom_pink', 'jn3', 2700, 300, 360, 300, 'carmine'],
  ['red_rail', 'jn3', 700, 540, 560, 120, 'cinnabar'],
  ['seal', 'jn2', 185, 277, 41, 44, 'cinnabar'],
  ['flowers_yellow', 'jn1', 2400, 760, 400, 300, 'gamboge'],
  ['straw_awning', 'jn2', 1100, 600, 300, 200, 'gamboge'],
  ['blossom_white', 'jn2', 540, 200, 360, 280, 'white'],
  ['plaster_white', 'jn2', 700, 1520, 300, 250, 'white'],
  ['line_ink_roof', 'jn2', 600, 120, 420, 260, 'ink'],
  ['line_ink_house', 'jn1', 300, 870, 400, 280, 'ink'],
  ['water_blue', 'jn3', 900, 1000, 400, 300, 'azurite'],
  ['cloth_blue', 'jn3', 1600, 780, 200, 120, 'azurite'],
  ['leaf_green', 'jn2', 300, 900, 600, 400, 'malachite'],
  ['leaf_green', 'jn3', 1800, 800, 600, 400, 'malachite'],
];
const res = [];
for (const [name, im, x, y, w, h, test] of SAMPLES) {
  const { data } = await sharp(IM[im]).removeAlpha().extract({ left: x, top: y, width: w, height: h }).raw().toBuffer({ resolveWithObject: true });
  const px = [];
  for (let i = 0; i < data.length; i += 3) { const p = [data[i], data[i + 1], data[i + 2]]; if (TESTS[test](lab(p))) px.push(p); }
  const share = px.length / (w * h);
  const med = px.length ? [0, 1, 2].map((c) => px.map((p) => p[c]).sort((a, b) => a - b)[px.length >> 1]) : null;
  const r = { name, im, rect: [x, y, w, h], pigment: test, hex: med ? hex(med) : null, lab: med ? lab(med).map((v) => +v.toFixed(1)) : null, share: +share.toFixed(4) };
  res.push(r);
  console.log(name.padEnd(16), im, test.padEnd(9), r.hex, r.lab?.join(' '), 'share', (share * 100).toFixed(2) + '%');
}
const p = JSON.parse(fs.readFileSync('gen/ui/look/palette.json', 'utf8'));
p.pigments = res;
fs.writeFileSync('gen/ui/look/palette.json', JSON.stringify(p, null, 1));
