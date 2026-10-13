// where two screenshots differ most: the densest 400x300 window of pixels changed by more than 30 a channel, cropped
// side by side (a | b | diff x4): node diffwin.mjs a.png b.png out.jpg
import sharp from 'sharp';
const [a, b, out] = process.argv.slice(2);
const load = async (f) => sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const A = await load(a), B = await load(b), W = A.info.width, H = A.info.height;
const d = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) { const s = Math.abs(A.data[i * 3] - B.data[i * 3]) + Math.abs(A.data[i * 3 + 1] - B.data[i * 3 + 1]) + Math.abs(A.data[i * 3 + 2] - B.data[i * 3 + 2]); d[i] = s > 90 ? 1 : 0; }
const ww = 400, wh = 300; let best = [0, 0, 0];
for (let y = 0; y + wh <= H; y += 25) for (let x = 0; x + ww <= W; x += 25) { let c = 0; for (let yy = y; yy < y + wh; yy += 2) for (let xx = x; xx < x + ww; xx += 2) c += d[yy * W + xx]; if (c > best[0]) best = [c, x, y]; }
const [, x, y] = best;
const crop = (f) => sharp(f).extract({ left: x, top: y, width: ww, height: wh }).png().toBuffer();
const diff = Buffer.alloc(ww * wh * 3);
for (let yy = 0; yy < wh; yy++) for (let xx = 0; xx < ww; xx++) { const i = (y + yy) * W + x + xx, o = (yy * ww + xx) * 3; for (let c = 0; c < 3; c++) diff[o + c] = Math.min(255, Math.abs(A.data[i * 3 + c] - B.data[i * 3 + c]) * 4); }
const dimg = await sharp(diff, { raw: { width: ww, height: wh, channels: 3 } }).png().toBuffer();
await sharp({ create: { width: ww * 3, height: wh, channels: 3, background: '#fff' } }).composite([{ input: await crop(a), left: 0, top: 0 }, { input: await crop(b), left: ww, top: 0 }, { input: dimg, left: ww * 2, top: 0 }]).jpeg({ quality: 90 }).toFile(out);
console.log(out, 'window', x, y, 'changed px (sampled)', best[0]);
