// two or more screenshots cropped to the same box, stacked, for a look (study tool): node cropsheet.mjs out.jpg x y w h a.png b.png ...
import sharp from 'sharp';
const [out, x, y, w, h, ...files] = process.argv.slice(2);
const crops = await Promise.all(files.map((f) => sharp(f).extract({ left: +x, top: +y, width: +w, height: +h }).png().toBuffer()));
await sharp({ create: { width: +w, height: +h * crops.length, channels: 3, background: '#fff' } }).composite(crops.map((c, i) => ({ input: c, top: i * +h, left: 0 }))).jpeg({ quality: 88 }).toFile(out);
