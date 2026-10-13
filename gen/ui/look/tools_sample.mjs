// median colour (sRGB hex, Lab) of named rects: node tools_sample.mjs regions.json  ([name, file, x, y, w, h])
import { createRequire } from 'module';
import fs from 'fs';
const sharp = createRequire('/home/ran/3d_director/qingming/tools/package.json')('sharp');
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function lab([r, g, b]) {
  const R = lin(r / 255), G = lin(g / 255), B = lin(b / 255);
  let x = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, y = 0.2126 * R + 0.7152 * G + 0.0722 * B, z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x); y = f(y); z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)].map((v) => +v.toFixed(1));
}
const out = [];
for (const [name, file, x, y, w, h] of JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))) {
  const { data } = await sharp(file).removeAlpha().extract({ left: x, top: y, width: w, height: h }).raw().toBuffer({ resolveWithObject: true });
  const px = []; for (let i = 0; i < data.length; i += 3) px.push([data[i], data[i + 1], data[i + 2]]);
  const med = [0, 1, 2].map((c) => px.map((p) => p[c]).sort((a, b) => a - b)[px.length >> 1]);
  const hex = '#' + med.map((v) => v.toString(16).padStart(2, '0')).join('');
  const L = px.map((p) => lab(p)[0]).sort((a, b) => a - b);
  out.push({ name, file: file.split('/').pop(), rect: [x, y, w, h], hex, lab: lab(med), L10: L[Math.floor(L.length * 0.1)], L90: L[Math.floor(L.length * 0.9)] });
  console.log(name.padEnd(20), hex, lab(med).join(' '), ' L10-90', L[Math.floor(L.length * 0.1)], L[Math.floor(L.length * 0.9)]);
}
fs.writeFileSync(process.argv[2].replace('.json', '_out.json'), JSON.stringify(out, null, 1));
