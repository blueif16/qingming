// side-by-side rows of [left image, right image, label] (each cropped to 16:7 from its top): node tools_vs.mjs out.jpg rows.json
import { createRequire } from 'module';
import fs from 'fs';
const sharp = createRequire('/home/ran/3d_director/qingming/tools/package.json')('sharp');
const [out, rowsFile] = process.argv.slice(2);
const rows = JSON.parse(fs.readFileSync(rowsFile, 'utf8'));
const W = 800, H = 350, LH = 24, comp = [];
for (const [i, [a, b, la, lb]] of rows.entries()) {
  for (const [j, [f, l]] of [[a, la], [b, lb]].entries()) {
    const m = await sharp(f).metadata();
    const h = Math.round(m.width * H / W);
    comp.push({ input: await sharp(f).removeAlpha().extract({ left: 0, top: 0, width: m.width, height: Math.min(h, m.height) }).resize(W, H, { fit: 'cover', position: 'top' }).png().toBuffer(), left: j * W, top: i * (H + LH) + LH });
    comp.push({ input: Buffer.from(`<svg width="${W}" height="${LH}"><rect width="100%" height="100%" fill="#fff"/><text x="6" y="17" font-size="14" font-family="sans-serif">${l}</text></svg>`), left: j * W, top: i * (H + LH) });
  }
}
await sharp({ create: { width: 2 * W, height: rows.length * (H + LH), channels: 3, background: '#fff' } }).composite(comp).jpeg({ quality: 88 }).toFile(out);
console.log('wrote', out);
