#!/usr/bin/env node
// node montage.mjs <out.jpg> <cols> <tileWidth> <png ...>: a labelled grid of shots
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const [out, colsS, twS, ...files] = process.argv.slice(2);
const cols = +colsS, tw = +twS;
const m = await sharp(files[0]).metadata();
const th = Math.round((tw * m.height) / m.width);
const tiles = await Promise.all(files.map(async (f) => {
  const n = path.basename(f, '.png');
  const label = Buffer.from(`<svg width="${tw}" height="16"><rect width="${tw}" height="16" fill="#000" opacity="0.6"/><text x="3" y="12" font-size="11" fill="#fff" font-family="monospace">${n}</text></svg>`);
  return sharp(await sharp(f).resize(tw, th).png().toBuffer()).composite([{ input: label, top: 0, left: 0 }]).png().toBuffer();
}));
const rows = Math.ceil(files.length / cols);
await sharp({ create: { width: tw * cols, height: th * rows, channels: 3, background: '#fff' } })
  .composite(tiles.map((input, i) => ({ input, left: (i % cols) * tw, top: Math.floor(i / cols) * th }))).jpeg({ quality: 85 }).toFile(out);
console.log(out);
