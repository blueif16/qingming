// look pairs: the baseline's shot over the snapshot's, half size (gen/perf/batch2/framerate/pair.mjs <dirA> <dirB> <out_prefix> views...)
import sharp from 'sharp';
const [A, B, out, ...views] = process.argv.slice(2);
for (const v of views) {
  const a = await sharp(`${A}/${v}_base.png`).resize(960, 540).toBuffer(), b = await sharp(`${B}/${v}_base.png`).resize(960, 540).toBuffer();
  await sharp({ create: { width: 960, height: 1080, channels: 3, background: '#fff' } }).composite([{ input: a, top: 0, left: 0 }, { input: b, top: 540, left: 0 }]).jpeg({ quality: 85 }).toFile(`${out}_${v}.jpg`);
}
