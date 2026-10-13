#!/usr/bin/env node
// Lay a render made through a section's oblique camera (same size as the section rect, transparent background)
// over the section's registered mosaic, and cut a close-up around every figure in sections/<name>/figures.json.
//   node tools/overlay_render.mjs <section> <render.png> [opacity=0.7]
// Writes <render>_overlay.jpg, <render>_overlay_view.jpg and <render>_figures.jpg next to the render.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const [name, renderPath, opacity = 0.7] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, `sections/${name}/section.json`), 'utf8'));
const figs = JSON.parse(fs.readFileSync(path.join(ROOT, `sections/${name}/figures.json`), 'utf8')).figures;
const [SX, SY, W, H] = cfg.rect, stem = renderPath.replace(/\.png$/, '');

const base = await sharp(path.join(ROOT, `gen/sections/${name}/mosaic.jpg`), { limitInputPixels: false }).resize(W, H).toBuffer();
const { data, info } = await sharp(renderPath).resize(W, H).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 3; i < data.length; i += 4) data[i] = Math.round(data[i] * +opacity);
const over = await sharp(base).composite([{ input: await sharp(data, { raw: info }).png().toBuffer() }]).jpeg({ quality: 88 }).toBuffer();
await sharp(over).toFile(`${stem}_overlay.jpg`);
await sharp(over).resize(2400).jpeg({ quality: 86 }).toFile(`${stem}_overlay_view.jpg`);

const Z = 2, tiles = [];
for (const g of figs) {
  const half = Math.max(120, Math.abs(g.foot[1] - g.head[1]) * 0.9), cx = (g.foot[0] + g.head[0]) / 2 - SX, cy = (g.foot[1] + g.head[1]) / 2 - SY;
  const x0 = Math.round(Math.max(0, cx - half)), y0 = Math.round(Math.max(0, cy - half));
  const w = Math.round(Math.min(W, cx + half) - x0), h = Math.round(Math.min(H, cy + half) - y0);
  const cap = Buffer.from(`<svg width="${w * Z}" height="28"><rect width="100%" height="100%" fill="#111"/><text x="8" y="20" font-size="18" font-family="monospace" fill="#fff">${g.id}</text></svg>`);
  const img = await sharp(over).extract({ left: x0, top: y0, width: w, height: h }).resize(w * Z, h * Z).toBuffer();
  tiles.push(await sharp({ create: { width: w * Z, height: h * Z + 28, channels: 3, background: '#111' } })
    .composite([{ input: cap, left: 0, top: 0 }, { input: img, left: 0, top: 28 }]).png().toBuffer({ resolveWithObject: true }));
}
const cols = 3, cw = Math.max(...tiles.map((t) => t.info.width)), ch = Math.max(...tiles.map((t) => t.info.height));
await sharp({ create: { width: cw * cols + 8 * (cols - 1), height: (ch + 8) * Math.ceil(tiles.length / cols), channels: 3, background: '#111' } })
  .composite(tiles.map((t, i) => ({ input: t.data, left: (i % cols) * (cw + 8), top: Math.floor(i / cols) * (ch + 8) }))).jpeg({ quality: 86 }).toFile(`${stem}_figures.jpg`);
console.log(`${stem}_overlay.jpg, ${stem}_overlay_view.jpg, ${stem}_figures.jpg`);
