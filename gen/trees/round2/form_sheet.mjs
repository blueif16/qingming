// gen/trees/check/form_<form>.jpg: the form's scan refs first, then each card on dark (alpha-tested) and light
// usage: node form_sheet.mjs <form> <refIdx,..> <card,..>
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const sharp = createRequire(`${Q}/tools/package.json`)('sharp');
const [form, refs, cards] = process.argv.slice(2);
const H = 560, tiles = [];
for (const k of refs.split(',')) tiles.push(await sharp(`${Q}/gen/trees/refs/${form}_${+k + 1}.jpg`).resize({ height: H }).png().toBuffer());
const reg = JSON.parse((await import('node:fs')).readFileSync(`${Q}/web/public/assets/trees/trees.json`, 'utf8'));
for (const id of cards.split(',')) {
  const { data, info } = await sharp(`${Q}/web/public/${reg[id].file}`).resize({ height: H }).raw().toBuffer({ resolveWithObject: true });
  for (const [bg, test] of [[[24, 26, 30], true], [[226, 224, 216], false]]) {
    const o = Buffer.alloc(info.width * H * 3);
    for (let p = 0; p < info.width * H; p++) { const a = test ? (data[p * 4 + 3] >= 128 ? 1 : 0) : data[p * 4 + 3] / 255; for (let c = 0; c < 3; c++) o[p * 3 + c] = Math.round(data[p * 4 + c] * a + bg[c] * (1 - a)); }
    tiles.push(await sharp(o, { raw: { width: info.width, height: H, channels: 3 } }).png().toBuffer());
  }
}
let x = 0; const comps = [];
for (const t of tiles) { const m = await sharp(t).metadata(); comps.push({ input: t, left: x, top: 0 }); x += m.width + 8; }
const out = `${Q}/gen/trees/check/form_${form}${process.argv[5] ? '_' + process.argv[5] : ''}.jpg`;
await sharp({ create: { width: x, height: H, channels: 3, background: '#000' } }).composite(comps).jpeg({ quality: 84 }).toFile(out);
console.log(out, x);
