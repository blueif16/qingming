#!/usr/bin/env node
// Crops of frames, side by side, enlarged: node crop.mjs <out.jpg> <x,y,w,h> <scale> <frame.png ...>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const sharp = createRequire(path.join(QM, 'tools/package.json'))('sharp');
const [out, box, sc, ...files] = process.argv.slice(2);
const [x, y, w, h] = box.split(',').map(Number), k = +sc;
const tiles = await Promise.all(files.map((f) => sharp(f).extract({ left: x, top: y, width: w, height: h }).resize(Math.round(w * k), Math.round(h * k), { kernel: 'nearest' }).toBuffer()));
const cols = Math.min(4, tiles.length), W = Math.round(w * k), H = Math.round(h * k);
await sharp({ create: { width: W * cols, height: H * Math.ceil(tiles.length / cols), channels: 3, background: '#fff' } })
  .composite(tiles.map((b, i) => ({ input: b, left: (i % cols) * W, top: Math.floor(i / cols) * H }))).jpeg({ quality: 88 }).toFile(out);
console.log('->', out);
