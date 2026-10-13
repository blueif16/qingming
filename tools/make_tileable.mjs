#!/usr/bin/env node
// Make painted swatches seamless in place: cross-fade each image with a copy rolled by half its width (weight 1
// at the left/right edges, 0 from 30% inward, so the wrap seam is replaced and the rolled copy's own seam at the
// centre never shows), then do the same along y. Suits soft washes; sharp motifs would ghost where they blend.
// Writes <dir of first file>/tileable_check.jpg (each texture 2x2).
// Usage: node tools/make_tileable.mjs <tex.png> [more.png ...]
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const files = process.argv.slice(2);
if (!files.length) { console.error('usage: make_tileable.mjs <tex.png> ...'); process.exit(1); }

const weight = (i, n) => {
  const d = Math.min(i, n - 1 - i) / n; // 0 at the edges, 0.5 at the centre
  const t = Math.max(0, 1 - d / 0.3);
  return t * t * (3 - 2 * t);
};

function blend(src, w, h, c, alongX) {
  const out = Buffer.alloc(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = alongX ? weight(x, w) : weight(y, h);
      const xs = alongX ? (x + w / 2) % w : x, ys = alongX ? y : (y + h / 2) % h;
      const a = (y * w + x) * c, b = (ys * w + xs) * c;
      for (let ch = 0; ch < c; ch++) out[a + ch] = Math.round(src[a + ch] * (1 - k) + src[b + ch] * k);
    }
  }
  return out;
}

const checks = [];
for (const f of files) {
  const { data, info } = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const done = blend(blend(data, w, h, c, true), w, h, c, false);
  await sharp(done, { raw: { width: w, height: h, channels: c } }).png().toFile(f + '.tmp.png');
  const fs = await import('node:fs');
  fs.renameSync(f + '.tmp.png', f);
  const tile = await sharp(done, { raw: { width: w, height: h, channels: c } }).resize(256, 256).png().toBuffer();
  checks.push(await sharp({ create: { width: 512, height: 512, channels: 3, background: '#fff' } })
    .composite([0, 1, 2, 3].map((i) => ({ input: tile, left: (i % 2) * 256, top: Math.floor(i / 2) * 256 }))).png().toBuffer());
  console.log(`seamless: ${f}`);
}
const out = path.join(path.dirname(files[0]), 'tileable_check.jpg');
await sharp({ create: { width: 520 * Math.min(3, checks.length), height: 520 * Math.ceil(checks.length / 3), channels: 3, background: '#fff' } })
  .composite(checks.map((b, i) => ({ input: b, left: (i % 3) * 520, top: Math.floor(i / 3) * 520 }))).jpeg({ quality: 85 }).toFile(out);
console.log(`-> ${out}`);
