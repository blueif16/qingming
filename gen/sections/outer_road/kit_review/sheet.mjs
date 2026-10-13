// The outer-road kit review's images: node sheet.mjs <render_dir> [out_dir=this folder]
//   -> <out_dir>/<part>.jpg (its two views side by side, labelled with its triangles) and <out_dir>/sheet.jpg (all)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const QM = path.resolve(HERE, '../../../..');
const sharp = createRequire(path.join(QM, 'tools/package.json'))('sharp');
const [dir, outDir = HERE] = process.argv.slice(2);
const tris = JSON.parse(fs.readFileSync(path.join(dir, 'review_tris.json'), 'utf8'));
const W = 640, H = Math.round(W * 700 / 900);
const label = (text, w) => Buffer.from(`<svg width="${w}" height="26"><rect width="${w}" height="26" fill="#000" fill-opacity="0.6"/>` +
  `<text x="8" y="19" font-size="17" font-family="monospace" fill="#fff">${text}</text></svg>`);
const pairs = [];
for (const [name, n] of Object.entries(tris)) {
  const views = ['a', 'b'].map((v) => path.join(dir, `${name}_${v}.png`)).filter((f) => fs.existsSync(f));
  const tiles = await Promise.all(views.map(async (f, i) => ({ input: await sharp(f).resize(W, H).toBuffer(), left: i * W, top: 0 })));
  tiles.push({ input: label(`${name}  ${n} tris`, W * 2), left: 0, top: 0 });
  const buf = await sharp({ create: { width: W * 2, height: H, channels: 3, background: '#222' } }).composite(tiles).jpeg({ quality: 86 }).toBuffer();
  fs.writeFileSync(path.join(outDir, `${name}.jpg`), buf);
  pairs.push(buf);
}
// contact sheet: two parts (four views) per row, at half size
const w2 = W, h2 = H / 2, cols = 2, rows = Math.ceil(pairs.length / cols);
const tiles = await Promise.all(pairs.map(async (b, i) => ({ input: await sharp(b).resize(w2, Math.round(h2)).toBuffer(), left: (i % cols) * w2, top: Math.floor(i / cols) * Math.round(h2) })));
await sharp({ create: { width: w2 * cols, height: Math.round(h2) * rows, channels: 3, background: '#222' } }).composite(tiles).jpeg({ quality: 82 }).toFile(path.join(outDir, 'sheet.jpg'));
console.log(`${pairs.length} parts -> ${outDir}`);
