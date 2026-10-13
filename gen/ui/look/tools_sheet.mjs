// contact sheet of PNGs: node tools_sheet.mjs out.jpg cellW a.png b.png ...
import { createRequire } from 'module';
const sharp = createRequire('/home/ran/3d_director/qingming/tools/package.json')('sharp');
const [out, cw, ...files] = process.argv.slice(2);
const W = +cw, cols = Math.min(4, files.length);
const cells = await Promise.all(files.map(async (f) => {
  const b = await sharp(f).resize({ width: W, height: W, fit: 'contain', background: '#ffffff' }).png().toBuffer();
  return b;
}));
const rows = Math.ceil(files.length / cols);
await sharp({ create: { width: cols * W, height: rows * W, channels: 3, background: '#ffffff' } })
  .composite(cells.map((input, i) => ({ input, left: (i % cols) * W, top: Math.floor(i / cols) * W })))
  .jpeg({ quality: 88 }).toFile(out);
console.log('wrote', out);
