// gridded view of a full-res ref region for picking sample rects: node tools_grid.mjs ref.png x y w h out.jpg [step]
import { createRequire } from 'module';
const sharp = createRequire('/home/ran/3d_director/qingming/tools/package.json')('sharp');
const [src, x, y, w, h, out, st] = process.argv.slice(2);
const X = +x, Y = +y, Wd = +w, H = +h, step = +(st || 100), outW = 1400, s = outW / Wd;
let lines = '';
for (let gx = Math.ceil(X / step) * step; gx < X + Wd; gx += step) { const px = (gx - X) * s; lines += `<line x1="${px}" y1="0" x2="${px}" y2="${H * s}" stroke="#f0f" stroke-width="1" opacity="0.6"/><text x="${px + 2}" y="12" font-size="11" fill="#f0f">${gx}</text>`; }
for (let gy = Math.ceil(Y / step) * step; gy < Y + H; gy += step) { const py = (gy - Y) * s; lines += `<line x1="0" y1="${py}" x2="${outW}" y2="${py}" stroke="#f0f" stroke-width="1" opacity="0.6"/><text x="2" y="${py - 2}" font-size="11" fill="#f0f">${gy}</text>`; }
const img = await sharp(src).removeAlpha().extract({ left: X, top: Y, width: Wd, height: H }).resize({ width: outW }).png().toBuffer();
await sharp(img).composite([{ input: Buffer.from(`<svg width="${outW}" height="${Math.round(H * s)}">${lines}</svg>`) }]).jpeg({ quality: 85 }).toFile(out);
