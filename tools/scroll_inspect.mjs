#!/usr/bin/env node
// Side-by-side zoom of the scroll and a section's registered mosaic around a scan point, with a grid
// labelled in scan pixels, for reading off positions.
//   node tools/scroll_inspect.mjs <section> <scanX> <scanY> [halfSize=160] [out.jpg]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const [name, cx, cy, half = 160, out] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, `sections/${name}/section.json`), 'utf8'));
const [SX, SY, W, H] = cfg.rect, k = 2, Z = +half > 300 ? 1 : 3;   // mosaic is 2x the scan; wide views at 1x, zooms at 3x
const x0 = Math.max(SX, +cx - +half), y0 = Math.max(SY, +cy - +half);
const w = Math.min(SX + W, +cx + +half) - x0, h = Math.min(SY + H, +cy + +half) - y0;
const scroll = await sharp(path.join(ROOT, cfg.scan), { limitInputPixels: false }).extract({ left: x0, top: y0, width: w, height: h }).resize(w * Z, h * Z).toBuffer();
const mosaic = await sharp(path.join(ROOT, `gen/sections/${name}/mosaic.jpg`), { limitInputPixels: false })
  .extract({ left: (x0 - SX) * k, top: (y0 - SY) * k, width: w * k, height: h * k }).resize(w * Z, h * Z).toBuffer();
const step = +half > 200 ? 50 : 20;
let svg = `<svg width="${w * Z}" height="${h * Z}" xmlns="http://www.w3.org/2000/svg">`;
for (let x = Math.ceil(x0 / step) * step; x < x0 + w; x += step) {
  const major = x % (step * 5) === 0;
  svg += `<line x1="${(x - x0) * Z}" y1="0" x2="${(x - x0) * Z}" y2="${h * Z}" stroke="${major ? '#ff2d55' : '#00e5ff'}" stroke-opacity="${major ? 0.9 : 0.45}" stroke-width="${major ? 2 : 1}"/>`;
  if (major) svg += `<text x="${(x - x0) * Z + 3}" y="16" font-size="15" font-family="monospace" fill="#ff2d55" stroke="#000" stroke-width="0.6">${x}</text>`;
}
for (let y = Math.ceil(y0 / step) * step; y < y0 + h; y += step) {
  const major = y % (step * 5) === 0;
  svg += `<line x1="0" y1="${(y - y0) * Z}" x2="${w * Z}" y2="${(y - y0) * Z}" stroke="${major ? '#ff2d55' : '#00e5ff'}" stroke-opacity="${major ? 0.9 : 0.45}" stroke-width="${major ? 2 : 1}"/>`;
  if (major) svg += `<text x="3" y="${(y - y0) * Z - 4}" font-size="15" font-family="monospace" fill="#ff2d55" stroke="#000" stroke-width="0.6">${y}</text>`;
}
svg += '</svg>';
const grid = Buffer.from(svg);
const a = await sharp(scroll).composite([{ input: grid }]).toBuffer(), b = await sharp(mosaic).composite([{ input: grid }]).toBuffer();
const file = out || path.join(ROOT, `gen/sections/${name}/check/inspect_${cx}_${cy}.jpg`);
await sharp({ create: { width: w * Z * 2 + 8, height: h * Z, channels: 3, background: '#000' } })
  .composite([{ input: a, left: 0, top: 0 }, { input: b, left: w * Z + 8, top: 0 }]).jpeg({ quality: 88 }).toFile(file);
console.log(file, `scan x ${x0}-${x0 + w}, y ${y0}-${y0 + h}, grid ${step}px (labels every ${step * 5})`);
