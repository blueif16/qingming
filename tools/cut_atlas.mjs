#!/usr/bin/env node
// Cut a painted grid of cells (cols x rows, light gutters between them, as prompts/atlas_*.txt ask for) into a
// tight atlas with no gutters: each cell is found between the brightest columns/rows near the expected splits,
// trimmed by a small inset and resized to <cell> px. The kit maps each face of a piece onto one whole cell
// (song_kit.ATLAS), so the painted edge of the cell falls on the edges of that face.
// Writes <out.png> and <out>_check.jpg (the cells with their numbers).
// Usage: node tools/cut_atlas.mjs <sheet.png> <out.png> <cols> <rows> [cell_px=256]
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const [sheet, out, colsArg, rowsArg, cellArg] = process.argv.slice(2);
const cols = Number(colsArg), rows = Number(rowsArg), cell = Number(cellArg || 256);
if (!sheet || !out || !cols || !rows) { console.error('usage: cut_atlas.mjs <sheet.png> <out.png> <cols> <rows> [cell_px]'); process.exit(1); }

const { data, info } = await sharp(sheet).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const colMean = (x) => { let s = 0; for (let y = 0; y < H; y++) s += data[y * W + x]; return s / H; };
const rowMean = (y) => { let s = 0; for (let x = 0; x < W; x++) s += data[y * W + x]; return s / W; };
// the gutter nearest an expected split: the brightest run within +-6% of the size
function gutter(expected, size, mean) {
  let best = expected, bestV = -1;
  for (let p = Math.round(expected - size * 0.06); p <= expected + size * 0.06; p++) { const v = mean(p); if (v > bestV) { bestV = v; best = p; } }
  let a = best, b = best;
  while (a > 0 && mean(a - 1) > bestV - 18) a--;
  while (b < size - 1 && mean(b + 1) > bestV - 18) b++;
  return [a, b];
}
// outer margins: skip bright border rows/columns
const edge = (size, mean, from, step) => { let p = from; const ref = mean(from); while (Math.abs(p - from) < size * 0.05 && mean(p) > ref - 18) p += step; return p; };
const splits = (n, size, mean) => {
  const cuts = [[0, edge(size, mean, 0, 1) - 1]];
  for (let i = 1; i < n; i++) cuts.push(gutter((size * i) / n, size, mean));
  cuts.push([edge(size, mean, size - 1, -1) + 1, size - 1]);
  return cuts.slice(0, -1).map((c, i) => [c[1] + 1, cuts[i + 1][0]]);
};
const xs = splits(cols, W, colMean), ys = splits(rows, H, rowMean);
const INSET = 4;
const cells = [];
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const [x0, x1] = xs[c], [y0, y1] = ys[r];
    const region = { left: x0 + INSET, top: y0 + INSET, width: x1 - x0 - 2 * INSET, height: y1 - y0 - 2 * INSET };
    cells.push(await sharp(sheet).removeAlpha().extract(region).resize(cell, cell, { fit: 'fill' }).png().toBuffer());
  }
}
await sharp({ create: { width: cols * cell, height: rows * cell, channels: 3, background: '#808080' } })
  .composite(cells.map((b, i) => ({ input: b, left: (i % cols) * cell, top: Math.floor(i / cols) * cell }))).png().toFile(out);
const g = 12;
const labels = cells.map((_, i) => Buffer.from(`<svg width="${cell}" height="${cell}"><text x="8" y="28" font-size="24" fill="#c00" font-family="sans-serif">${i}</text></svg>`));
await sharp({ create: { width: cols * (cell + g), height: rows * (cell + g), channels: 3, background: '#fff' } })
  .composite(cells.flatMap((b, i) => {
    const left = (i % cols) * (cell + g), top = Math.floor(i / cols) * (cell + g);
    return [{ input: b, left, top }, { input: labels[i], left, top }];
  })).jpeg({ quality: 85 }).toFile(out.replace(/\.png$/, '') + '_check.jpg');
console.log(`cells x ${xs.map((x) => x.join('-')).join(' ')} | y ${ys.map((y) => y.join('-')).join(' ')} -> ${out}`);
