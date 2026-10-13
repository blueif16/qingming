#!/usr/bin/env node
// The painting's own picture of each landmark, for the 圖志 journal (gen/ui/r2_lore.md): a small webp cut from the scan
// that the scroll tile pyramid is made from (reference/scroll/qingming_commons_38414x1800.jpg, public domain; cutting
// from the scan itself saves one re-encode over the q70 tiles), framed on the stroke boxes of the map IDs listed in the
// landmark's `crop` (sections/*/places.json; default: the landmark's own ID), padded and widened to 3:2.
//   node tools/place_crops.mjs [--w 480] [--q 46] [--only S6.bld.sunyang_zhengdian] [--sheet out.jpg]
// Writes web/public/assets/ui/places/<landmark id>.webp and prints each file's box and KB (aim: 10-25 KB). The page
// fetches one only when the journal shows its entry (loading="lazy"), never at first load. A `cropBox`
// [u0, v0, u1, v1] in places.json overrides the computed box where the strokes frame it badly.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { scanBoxes } from './scan_box.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const SCAN = path.join(ROOT, 'reference/scroll/qingming_commons_38414x1800.jpg');
const OUT = path.join(ROOT, 'web/public/assets/ui/places');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const W = +opt('w', 480), H = Math.round(W / 1.5), Q = +opt('q', 46), ONLY = opt('only', null), SHEET = opt('sheet', null);
const ASPECT = W / H, PAD = 0.14, MIN_H = 260; // scan px: never closer than this, or the brushwork turns to mush

const box = scanBoxes(ROOT);
const jobs = [];
for (const folder of fs.readdirSync(path.join(ROOT, 'sections')).sort()) {
  const p = path.join(ROOT, 'sections', folder, 'places.json');
  if (!fs.existsSync(p)) continue;
  for (const m of JSON.parse(fs.readFileSync(p, 'utf8')).landmarks || []) {
    if (ONLY && m.id !== ONLY) continue;
    let b = m.cropBox ? { u0: m.cropBox[0], v0: m.cropBox[1], u1: m.cropBox[2], v1: m.cropBox[3] } : box(m.crop || [m.id]);
    if (!b) { console.log(`FAIL ${m.id}: no strokes for ${m.crop || m.id}`); process.exitCode = 1; continue; }
    jobs.push({ m, b });
  }
}

const meta = await sharp(SCAN, { limitInputPixels: false }).metadata();
const SW = meta.width, SH = meta.height;
fs.mkdirSync(OUT, { recursive: true });
let total = 0;
const tiles = [];
for (const { m, b } of jobs) {
  // pad, then widen (or heighten) to the aspect round the centre, then fit inside the scan
  const pad = m.cropBox ? 0 : PAD; // a chosen box is used as it is (only widened to the aspect)
  let w = (b.u1 - b.u0) * (1 + 2 * pad), h = (b.v1 - b.v0) * (1 + 2 * pad);
  h = Math.max(h, MIN_H);
  if (w / h < ASPECT) w = h * ASPECT; else h = w / ASPECT;
  if (h > SH) { h = SH; w = h * ASPECT; }
  const cu = (b.u0 + b.u1) / 2, cv = (b.v0 + b.v1) / 2;
  const left = Math.round(Math.min(Math.max(0, cu - w / 2), SW - w)), top = Math.round(Math.min(Math.max(0, cv - h / 2), SH - h));
  const rect = { left, top, width: Math.round(w), height: Math.round(h) };
  const file = path.join(OUT, `${m.id}.webp`);
  await sharp(SCAN, { limitInputPixels: false }).extract(rect).resize(W, H, { kernel: 'lanczos3' })
    .webp({ quality: Q, effort: 6, smartSubsample: true }).toFile(file);
  const kb = fs.statSync(file).size / 1024;
  total += kb;
  tiles.push(file);
  console.log(`${m.id.padEnd(36)} ${m.name.padEnd(8, '　')} box u ${rect.left}-${rect.left + rect.width} v ${rect.top}-${rect.top + rect.height}  ${kb.toFixed(1)} KB`);
}
console.log(`${jobs.length} crops, ${total.toFixed(1)} KB in all (${(total / Math.max(1, jobs.length)).toFixed(1)} KB each) -> ${path.relative(ROOT, OUT)}/`);
if (SHEET && tiles.length) {
  // a contact sheet to look at (not shipped)
  const cols = 5, rows = Math.ceil(tiles.length / cols);
  const comp = tiles.map((f, i) => ({ input: f, left: (i % cols) * W, top: Math.floor(i / cols) * H }));
  await sharp({ create: { width: cols * W, height: rows * H, channels: 3, background: '#4e4033' } }).composite(comp).jpeg({ quality: 80 }).toFile(SHEET);
  console.log(`sheet -> ${SHEET}`);
}
