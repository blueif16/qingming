// two-column comparison sheet: node tools_pairs.mjs out.jpg dirA dirB name1 name2 ... (labels from the dir names)
import { createRequire } from 'module';
import fs from 'fs';
const sharp = createRequire('/home/ran/3d_director/qingming/tools/package.json')('sharp');
const [out, A, B, ...names] = process.argv.slice(2);
const W = 800, H = 450, LH = 22;
const comp = [];
for (const [i, n] of names.entries()) {
  for (const [j, dir] of [A, B].entries()) {
    const fp = fs.existsSync(`${dir}/${n}.png`) ? `${dir}/${n}.png` : `${dir}/${n}.jpg`;
    comp.push({ input: await sharp(fp).resize(W, H, { fit: 'cover' }).png().toBuffer(), left: j * W, top: i * (H + LH) + LH });
    const label = `${n} — ${dir.split('/').pop()}`;
    comp.push({ input: Buffer.from(`<svg width="${W}" height="${LH}"><rect width="100%" height="100%" fill="#fff"/><text x="6" y="16" font-size="14" font-family="sans-serif">${label}</text></svg>`), left: j * W, top: i * (H + LH) });
  }
}
await sharp({ create: { width: 2 * W, height: names.length * (H + LH), channels: 3, background: '#fff' } }).composite(comp).jpeg({ quality: 85 }).toFile(out);
console.log('wrote', out);
