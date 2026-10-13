#!/usr/bin/env node
// The painting under the start screen (web/world.html .ld-band, web/src/ui/start.js): the painted silk of the scan
// (the built sections' outer edges in web/public/assets/scroll/sections.json, without the mount and the colophons) as
// one band, small enough to load before you press 入畫.
//   node tools/start_band.mjs [height=360] [quality=60]   -> web/public/assets/scroll/band.webp
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN = path.join(ROOT, 'reference/scroll/qingming_commons_38414x1800.jpg');
const OUT = path.join(ROOT, 'web/public/assets/scroll/band.webp');
const height = Number(process.argv[2] || 360), quality = Number(process.argv[3] || 60);

const { sections } = JSON.parse(fs.readFileSync(path.join(ROOT, 'web/public/assets/scroll/sections.json'), 'utf8'));
const u0 = Math.min(...sections.map((s) => s.area[0])), u1 = Math.max(...sections.map((s) => s.area[1]));
sharp.cache(false);
const meta = await sharp(SCAN, { limitInputPixels: false }).metadata();
await sharp(SCAN, { limitInputPixels: false })
  .extract({ left: u0, top: 0, width: u1 - u0, height: meta.height })
  .resize({ height, kernel: 'lanczos3' })
  .webp({ quality, effort: 6 })
  .toFile(OUT);
const out = await sharp(OUT).metadata();
console.log(`${path.relative(ROOT, OUT)}: scan u ${u0}-${u1}, ${out.width} x ${out.height}, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
