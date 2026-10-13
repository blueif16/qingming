// Tile a part's review renders into one sheet: node sheet.mjs <dir> <tag> <part> [cols=3] [w=640]
//   -> <dir>/<tag>_<part>_sheet.jpg
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const sharp = createRequire(path.join(QM, 'tools/package.json'))('sharp');
const [dir, tag, part, cols = 3, w = 640] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => f.startsWith(`${tag}_${part}_`) && f.endsWith('.png')).sort();
const W = +w, H = Math.round(W * 0.75), C = +cols, rows = Math.ceil(files.length / C);
const tiles = await Promise.all(files.map(async (f, i) => {
  const label = Buffer.from(`<svg width="${W}" height="24"><rect width="${W}" height="24" fill="#000" fill-opacity="0.55"/>` +
    `<text x="6" y="17" font-size="15" font-family="monospace" fill="#fff">${f.replace('.png', '')}</text></svg>`);
  const img = await sharp(path.join(dir, f)).resize(W, H).composite([{ input: label, left: 0, top: 0 }]).toBuffer();
  return { input: img, left: (i % C) * W, top: Math.floor(i / C) * H };
}));
const out = path.join(dir, `${tag}_${part}_sheet.jpg`);
await sharp({ create: { width: W * C, height: H * rows, channels: 3, background: '#222' } }).composite(tiles).jpeg({ quality: 85 }).toFile(out);
console.log(out, files.length);
