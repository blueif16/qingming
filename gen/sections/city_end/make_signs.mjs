#!/usr/bin/env node
// The scroll's end's sign atlas (S7, sections/city_end): every painted board and tablet of S7 with its characters as
// painted (map/text/S7.md), plus the main hall's patterned front, in one texture, so all of them are one material
// (`signs_city_end`, blender/kit_city_end.py).
//   node gen/sections/city_end/make_signs.mjs
// A copy of gen/sections/inner_city/make_signs.mjs. Characters come from the OFL brush-kai font with traditional forms
// (LXGW WenKai TC Bold, read from gen/sections/inner_city/fonts/, SIL OFL 1.1). A character the scroll shows but that
// can't be read (□ in the map) is drawn as a faded, broken smudge, never as a guessed character: the three free-standing
// boards are all smudges (the scholars' readings 治酒所伤真方集香丸 and 大理中丸医肠胃冷 are not legible on the scan).
// Writes textures/signs_city_end.png (1024 x 1024) and textures/signs_city_end.json: per sign its cell in pixels
// [x0, y0, x1, y1] (y down) and its aspect (width / height), read by blender/kit_city_end.py.
//   tablet_*: square cells; the pale lozenge board (a square on its corner, its border along the cell's mid-edges)
//     with the character upright in it: the kit maps the lozenge's corners to the cell's mid-edges, so the character
//     stands upright in the diamond.
//   board_*: vertical boards, characters top to bottom, each cell at its board's real aspect (no stretch on the face).
//   curtain_motifs: the main hall's patterned front (crop [1110, 240, 1380, 340]): 6 rows x 14 columns of small dark
//     curled marks, evenly spaced, each a little different, on a paler ground; about 3:1.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const req = createRequire(path.join(ROOT, 'tools/package.json'));
const sharp = req('sharp');
const opentype = req('opentype.js');
const font = opentype.parse(fs.readFileSync(path.join(ROOT, 'gen/sections/inner_city/fonts/LXGWWenKaiTC-Bold.ttf')).buffer);
const S = 1024, CH = 100, pad = 10, gap = 8;

const PALE = '#e9e2d3', INK = '#1d1a17', BORDER = '#2e2018';
// vertical boards: text (□ = illegible) and the real board's width / height (the cell keeps it)
const BOARDS = {
  // the boards' sizes as blender/city_end_scene.py builds them (2026-10-12): width / (z1 - z0)
  board_west_a: { text: '□□□□□□□□□', aspect: 0.26 / 3.45 },  // board_zhao_west_a_1392
  board_west_b: { text: '□□□□□□□□', aspect: 0.28 / 3.25 },   // board_zhao_west_b_1433
  board_east: { text: '□□□□□□□□□', aspect: 0.30 / 2.95 },    // board_zhao_east_1775
  board_wulao: { text: '五勞七傷□□□', aspect: 0.38 / 1.88 },  // the board on the shop's west column (u 1458-1486, v 675-820)
};
// the name tablets, east to west 趙 · 太 · 丞 · 家
const TABLETS = { tablet_zhao: '趙', tablet_tai: '太', tablet_cheng: '丞', tablet_jia: '家' };

function glyphPath(ch, cx, cy, size) {
  const g = font.charToGlyph(ch);
  if (!g || !g.index) throw new Error(`no glyph for ${ch}`);
  const box = g.getPath(0, 0, size).getBoundingBox();
  return g.getPath(cx - (box.x1 + box.x2) / 2, cy - (box.y1 + box.y2) / 2, size).toPathData(1);
}
// an illegible painted character: a few faded, broken strokes, different each time
let seed = 11;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
function smudge(cx, cy, size, ink) {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const x0 = cx + (rnd() - 0.5) * size * 0.6, y0 = cy + (rnd() - 0.5) * size * 0.6;
    const x1 = x0 + (rnd() - 0.5) * size * 0.5, y1 = y0 + (rnd() - 0.3) * size * 0.4;
    s += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} Q${((x0 + x1) / 2 + (rnd() - 0.5) * 8).toFixed(1)} ${((y0 + y1) / 2).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${ink}" stroke-opacity="${(0.18 + 0.2 * rnd()).toFixed(2)}" stroke-width="${(size * (0.05 + 0.05 * rnd())).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
  }
  return s;
}

const cells = {}, aspect = {};
let svg = `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg"><rect width="${S}" height="${S}" fill="#d8ccb6"/>`;

// 1. the vertical boards, side by side from the left edge
let x = 0;
for (const [name, b] of Object.entries(BOARDS)) {
  const chars = [...b.text];
  const h = chars.length * CH + 2 * pad, w = Math.round(h * b.aspect);
  svg += `<rect x="${x}" y="0" width="${w}" height="${h}" fill="${PALE}"/>`;
  svg += `<rect x="${x + 3}" y="3" width="${w - 6}" height="${h - 6}" fill="none" stroke="${BORDER}" stroke-width="5"/>`;
  const size = Math.min(CH * 0.84, (w - 16) * 0.95);
  chars.forEach((ch, i) => {
    const cx = x + w / 2, cy = pad + CH * (i + 0.5);
    svg += ch === '□' ? smudge(cx, cy, size * 1.02, INK) : `<path d="${glyphPath(ch, cx, cy, size)}" fill="${INK}" fill-opacity="0.93"/>`;
  });
  cells[name] = [x, 0, x + w, h];
  aspect[name] = +(w / h).toFixed(4);
  x += w + gap;
}

// 2. the four tablets, 2 x 2 squares at the top right
const T = 250, tx0 = S - 2 * T - gap;
Object.entries(TABLETS).forEach(([name, ch], i) => {
  const x0 = tx0 + (i % 2) * (T + gap), y0 = Math.floor(i / 2) * (T + gap);
  const c = T / 2, m = 7;   // the lozenge: its corners on the cell's mid-edges (the border a little inside them)
  const dia = `M${x0 + c} ${y0 + m} L${x0 + T - m} ${y0 + c} L${x0 + c} ${y0 + T - m} L${x0 + m} ${y0 + c} Z`;
  svg += `<rect x="${x0}" y="${y0}" width="${T}" height="${T}" fill="${PALE}"/>`;
  svg += `<path d="${dia}" fill="none" stroke="${BORDER}" stroke-width="9" stroke-linejoin="miter"/>`;
  svg += `<path d="${glyphPath(ch, x0 + c, y0 + c, T * 0.56)}" fill="${INK}" fill-opacity="0.94"/>`;
  cells[name] = [x0, y0, x0 + T, y0 + T];
  aspect[name] = 1;
});

// 3. the main hall's patterned curtain: 6 rows x 14 columns of small dark curls on a paler ground
{
  const W = 2 * T + gap, H = Math.round(W / 3), x0 = tx0, y0 = 2 * (T + gap) + 12;
  svg += `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="#e2d8c4"/>`;
  const cols = 14, rows = 6, dx = W / cols, dy = H / rows;
  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) {
      const cx = x0 + dx * (q + 0.5) + (rnd() - 0.5) * 2.5, cy = y0 + dy * (r + 0.5) + (rnd() - 0.5) * 2.5;
      const s = dy * 0.22 * (0.9 + 0.2 * rnd()), rot = (rnd() - 0.5) * 40;
      // a curl: a small open hook turning into a short tail, like the scan's marks (every other row a little turned)
      const d = `M${-s} ${-0.2 * s} C${-s} ${-s} ${s} ${-s} ${s} ${-0.1 * s} C${s} ${0.7 * s} ${-0.3 * s} ${0.8 * s} ${-0.25 * s} ${0.1 * s}` +
        ` M${-0.6 * s} ${0.55 * s} L${-1.0 * s} ${0.9 * s}`;
      svg += `<path transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${(rot + (r % 2) * 25).toFixed(0)})" d="${d}" stroke="${INK}" ` +
        `stroke-opacity="${(0.5 + 0.28 * rnd()).toFixed(2)}" stroke-width="${(dy * (0.065 + 0.025 * rnd())).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
    }
  }
  cells.curtain_motifs = [x0, y0, x0 + W, y0 + H];
  aspect.curtain_motifs = +(W / H).toFixed(4);
}
svg += '</svg>';
const dir = path.join(HERE, 'textures');
fs.mkdirSync(dir, { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(path.join(dir, 'signs_city_end.png'));
fs.writeFileSync(path.join(dir, 'signs_city_end.json'), JSON.stringify({
  about: 'Sign atlas cells, px [x0, y0, x1, y1], y down, in a 1024 x 1024 texture, and each cell\'s width / height (make_signs.mjs).',
  size: S, cells, aspect,
}, null, 1) + '\n');
console.log(`textures/signs_city_end.png: ${Object.keys(cells).length} cells`);
