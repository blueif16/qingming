#!/usr/bin/env node
// Cut a painted material sheet (a 3x2 grid of swatches with light gutters, as prompts/material_sheet_*.txt asks
// for) into 512 px textures tex_<name>.png. Gutters are found from the brightest columns and rows; a swatch can
// override its crop with name=x,y,w,h in sheet pixels (e.g. to skip battens painted across a timber swatch).
// Writes <out_dir>/tex_<name>.png and <out_dir>/tile_check.jpg (each texture 2x2, to judge the seams).
// Usage: node tools/cut_material_sheet.mjs <sheet.png> <out_dir> <name1> ... <name6>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const [sheet, outDir, ...specs] = process.argv.slice(2);
if (!sheet || specs.length !== 6) { console.error('usage: cut_material_sheet.mjs <sheet.png> <out_dir> <6 names, each optionally name=x,y,w,h>'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

const { data, info } = await sharp(sheet).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const colMean = (x, y0, y1) => { let s = 0; for (let y = y0; y < y1; y++) s += data[y * W + x]; return s / (y1 - y0); };
const rowMean = (y, x0, x1) => { let s = 0; for (let x = x0; x < x1; x++) s += data[y * W + x]; return s / (x1 - x0); };
// the gutter nearest to an expected split: the brightest run within +-8% of the size
function gutter(expected, size, mean) {
  let best = expected, bestV = -1;
  for (let p = Math.round(expected - size * 0.08); p <= expected + size * 0.08; p++) { const v = mean(p); if (v > bestV) { bestV = v; best = p; } }
  let a = best, b = best;
  while (a > 0 && mean(a - 1) > bestV - 18) a--;
  while (b < size - 1 && mean(b + 1) > bestV - 18) b++;
  return [a, b];
}
const c1 = gutter(W / 3, W, (x) => colMean(x, 0, H)), c2 = gutter((2 * W) / 3, W, (x) => colMean(x, 0, H));
const r1 = gutter(H / 2, H, (y) => rowMean(y, 0, W));
const xs = [[0, c1[0]], [c1[1] + 1, c2[0]], [c2[1] + 1, W]], ys = [[0, r1[0]], [r1[1] + 1, H]];
const INSET = 8;

const tiles = [];
for (let i = 0; i < 6; i++) {
  const [name, rect] = specs[i].split('=');
  let left, top, width, height;
  if (rect) [left, top, width, height] = rect.split(',').map(Number);
  else {
    const [x0, x1] = xs[i % 3], [y0, y1] = ys[Math.floor(i / 3)];
    left = x0 + INSET; top = y0 + INSET; width = x1 - x0 - 2 * INSET; height = y1 - y0 - 2 * INSET;
  }
  const out = path.join(outDir, `tex_${name}.png`);
  await sharp(sheet).extract({ left, top, width, height }).resize(512, 512, { kernel: 'lanczos3' }).png().toFile(out);
  tiles.push(out);
  console.log(`tex_${name}.png  <- ${left},${top} ${width}x${height}`);
}
const quads = await Promise.all(tiles.map(async (t) => {
  const b = await sharp(t).resize(256, 256).toBuffer();
  return sharp({ create: { width: 512, height: 512, channels: 3, background: '#fff' } })
    .composite([{ input: b, left: 0, top: 0 }, { input: b, left: 256, top: 0 }, { input: b, left: 0, top: 256 }, { input: b, left: 256, top: 256 }]).png().toBuffer();
}));
await sharp({ create: { width: 512 * 3 + 20, height: 512 * 2 + 10, channels: 3, background: '#fff' } })
  .composite(quads.map((q, i) => ({ input: q, left: (i % 3) * 522, top: Math.floor(i / 3) * 522 }))).jpeg({ quality: 85 }).toFile(path.join(outDir, 'tile_check.jpg'));
console.log(`gutters: x ${c1} ${c2}, y ${r1} -> ${path.join(outDir, 'tile_check.jpg')}`);
