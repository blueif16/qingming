#!/usr/bin/env node
// The canal wharves' sign atlas (S2, sections/canal): every painted board of S2 with its marks as painted
// (map/text/S2.md), in one texture, so all of them are one material (`signs_canal`, blender/kit_canal.py).
//   node gen/sections/canal/make_signs.mjs
// The method of gen/sections/city_end/make_signs.mjs. No character on S2's boards is legible at the scan's resolution
// (every one is □ in the map), so every mark is drawn as a faded, broken smudge, never a guessed character: the paper
// shop's board is commonly read 王家紙馬… from the scholarship, but the strokes can't confirm it, so it is not written.
// Writes textures/signs_canal.png (512 x 512) and textures/signs_canal.json: per sign its cell in pixels
// [x0, y0, x1, y1] (y down) and its aspect (width / height), read by blender/kit_canal.py (sign_face, cell_aspect).
//   wang_paper_horse: S2.prop.signboard_wang_paper_horse_26896, board ~25 x 117 px, marks in groups at v 97-111,
//     117-132, 140-153, 158-170 and 172-180 (four or five characters): five marks, the last fainter and shorter.
//   pole_sign: S2.prop.signboard_pole_25235, board 25 x 67 px, marks at (25195, 305) and (25196, 330): two marks and a
//     faint third (2-3 characters).
//   shop_sign_3: S2.bld.open_shop_25340's narrow board (the needs list's □□□), board u 25185-25210, v 288-360: three
//     marks. NB the map's two notes place this board where pole_sign's board hangs: one painted board, two cells.
//   far_panel_2: S2.bld.far_lattice_front_23470's light panel, u 23477-23502, v 17-50, two or three dark marks: two.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const S = 512, gap = 8;
const PALE = '#e9e2d3', INK = '#1d1a17', BORDER = '#2e2018';

let seed = 23;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
// an illegible painted character: a few faded, broken strokes, different each time; `fade` thins it further
function smudge(cx, cy, size, ink, fade = 1) {
  let s = '';
  const n = 4 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const x0 = cx + (rnd() - 0.5) * size * 0.6, y0 = cy + (rnd() - 0.5) * size * 0.6;
    const x1 = x0 + (rnd() - 0.5) * size * 0.5, y1 = y0 + (rnd() - 0.3) * size * 0.4;
    s += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} Q${((x0 + x1) / 2 + (rnd() - 0.5) * size * 0.12).toFixed(1)} ` +
      `${((y0 + y1) / 2).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${ink}" ` +
      `stroke-opacity="${((0.18 + 0.2 * rnd()) * fade).toFixed(2)}" stroke-width="${(size * (0.05 + 0.05 * rnd())).toFixed(1)}" ` +
      `fill="none" stroke-linecap="round"/>`;
  }
  return s;
}

// vertical boards: marks top to bottom (1 = a mark, a fraction = a fainter one), the painted board's width / height
const BOARDS = {
  wang_paper_horse: { marks: [1, 1, 1, 1, 0.55], aspect: 25 / 117, ch: 70 },
  pole_sign: { marks: [1, 1, 0.45], aspect: 25 / 67, ch: 70 },
  shop_sign_3: { marks: [1, 1, 1], aspect: 25 / 72, ch: 70 },
};
const cells = {}, aspect = {};
let svg = `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg"><rect width="${S}" height="${S}" fill="#d8ccb6"/>`;
let x = 0;
for (const [name, b] of Object.entries(BOARDS)) {
  const h = Math.round(b.marks.length * b.ch + 24), w = Math.round(h * b.aspect);
  svg += `<rect x="${x}" y="0" width="${w}" height="${h}" fill="${PALE}"/>`;
  svg += `<rect x="${x + 2}" y="2" width="${w - 4}" height="${h - 4}" fill="none" stroke="${BORDER}" stroke-width="4"/>`;
  const size = Math.min(b.ch * 0.84, (w - 12) * 0.95);
  b.marks.forEach((m, i) => {
    svg += smudge(x + w / 2, 12 + b.ch * (i + 0.5), size * (m < 1 ? 0.8 : 1.02), INK, m);
  });
  cells[name] = [x, 0, x + w, h];
  aspect[name] = +(w / h).toFixed(4);
  x += w + gap;
}
// the far light panel with two dark marks (about 25 x 33 px painted)
{
  const w = 150, h = Math.round(w * 33 / 25), x0 = x, y0 = 0;
  svg += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${PALE}"/>`;
  svg += smudge(x0 + w * 0.5, y0 + h * 0.3, w * 0.5, INK, 1.4);
  svg += smudge(x0 + w * 0.5, y0 + h * 0.68, w * 0.5, INK, 1.4);
  cells.far_panel_2 = [x0, y0, x0 + w, y0 + h];
  aspect.far_panel_2 = +(w / h).toFixed(4);
}
svg += '</svg>';
const dir = path.join(HERE, 'textures');
fs.mkdirSync(dir, { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(path.join(dir, 'signs_canal.png'));
fs.writeFileSync(path.join(dir, 'signs_canal.json'), JSON.stringify({
  about: 'Sign atlas cells, px [x0, y0, x1, y1], y down, in a 512 x 512 texture, and each cell\'s width / height (make_signs.mjs).',
  size: S, cells, aspect,
}, null, 1) + '\n');
console.log(`textures/signs_canal.png: ${Object.keys(cells).length} cells`, cells);
