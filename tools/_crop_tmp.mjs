import * as E from './eye_check.mjs';
import sharp from 'sharp';
const names = process.argv[2].split(','), src = process.argv[3] === 'src', out = process.argv[4];
const bufs = [];
for (const name of names) {
  const c = await E.checkCharacter(name, { src });
  const cy = c.m.found ? c.m.cy : 110, mid = c.m.found ? c.m.mid : 0;
  const b = await (await E.imageOf(c.fr, { x0: mid - 50, x1: mid + 50, y0: cy - 15, y1: cy + 25 })).resize({ width: 400 }).png().toBuffer();
  const lab = Buffer.from(`<svg width="200" height="20"><text x="3" y="15" font-size="14" font-family="monospace" fill="#ff0">${name}</text></svg>`);
  bufs.push(await sharp(b).composite([{ input: lab, left: 0, top: 0 }]).png().toBuffer());
}
const metas = await Promise.all(bufs.map((b) => sharp(b).metadata()));
const comp = []; const ch = metas[0].height + 4;
bufs.forEach((b, i) => comp.push({ input: b, left: (i % 3) * 404, top: Math.floor(i / 3) * ch }));
await sharp({ create: { width: 3 * 404, height: Math.ceil(bufs.length / 3) * ch, channels: 3, background: '#000' } }).composite(comp).jpeg({ quality: 90 }).toFile(out);
