#!/usr/bin/env node
// The outer road's sign atlas: the fortune-teller's three hanging boards and the paper notice on the courier gate's
// open leaf (map/text/S4.md: S4.prop.sign_kanming_12266, S4.prop.sign_shenke_12335, S4.prop.sign_left_12207,
// S4.bld.post_gatehouse_11730), in one texture, so all the signs of the area are one material.
//   node gen/sections/outer_road/make_signs.mjs
// Made the way the inner city's atlas is (gen/sections/inner_city/make_signs.mjs): characters from its OFL brush-kai
// font (LXGW WenKai TC Bold, gen/sections/inner_city/fonts/, SIL OFL 1.1, read only). A character the scroll shows
// but that can't be read (□ in the map) is drawn as a faded, broken smudge, never as a guessed character.
// Each cell has the painted board's own proportions (w/h of the board in scan px), so a board built at those
// proportions shows its characters undistorted.
// Writes textures/signs_outer_road.png (1024 x 1024) and textures/signs_outer_road.json: per sign its cell in pixels
// [x0, y0, x1, y1] (y down) and the cell's aspect (w / h), read by blender/kit_outer_road.py.
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
const S = 1024;

// name: the painted board (scan px w x h) -> cell width in the atlas; slots top to bottom: [char, opacity, size]
// (□ = illegible smudge); `faint`: a slot of faint strokes at the board's lower end.
const SIGNS = {
  // 看命 'reading fates': board 12253-12280 x 684-731 (27 x 47 px), clearly legible
  kanming: { board: [27, 47], w: 192, slots: [['看', 0.94, 1], ['命', 0.94, 1]], ground: '#ebe5d6', ink: '#1c1916', border: '#33251b' },
  // 神課 'divine lessons': board 26 x 60 px; the second character less clear, faint strokes below them
  shenke: { board: [26, 60], w: 192, slots: [['神', 0.94, 1], ['課', 0.62, 1], ['□', 0.5, 0.55]], ground: '#e8e2d2', ink: '#1c1916', border: '#33251b' },
  // 決□: board 21 x 50 px, faded; the top character's 氵 + 夬 fits 決, the bottom one is not legible
  jue: { board: [21, 50], w: 192, slots: [['決', 0.7, 1], ['□', 1, 1]], ground: '#e4ddcc', ink: '#24201c', border: '#3a2b20' },
};
// the notice on the open leaf: a pale paper sheet, 42 x 45 px, about five columns of tiny dotted characters, none legible
const NOTICE = { board: [42, 45], w: 384, cols: 5, paper: '#efe9da', ink: '#2b2621' };

function glyphPath(ch, cx, cy, size) {
  const g = font.charToGlyph(ch);
  if (!g || !g.index) throw new Error(`no glyph for ${ch}`);
  const box = g.getPath(0, 0, size).getBoundingBox();
  return g.getPath(cx - (box.x1 + box.x2) / 2, cy - (box.y1 + box.y2) / 2, size).toPathData(1);
}
// characters the font draws in another form than the scroll paints, built from parts of two glyphs: the font's 決
// has the two-dot 冫, the scroll's has the three-dot 氵 (map: 氵 + 夬), so 氵 comes from 江 and 夬 from 快.
// [glyph, from, to]: the part of the glyph's em box (fraction of its width) that is kept.
const COMPOSE = { '決': [['江', 0, 0.42], ['快', 0.39, 1.2]] };
let clipN = 0;
function charSvg(ch, cx, cy, size, ink, op) {
  if (!COMPOSE[ch]) return `<path d="${glyphPath(ch, cx, cy, size)}" fill="${ink}" fill-opacity="${op}"/>`;
  const parts = COMPOSE[ch];
  const ref = font.charToGlyph(parts[parts.length - 1][0]).getPath(0, 0, size).getBoundingBox();
  const ox = cx - (ref.x1 + ref.x2) / 2, oy = cy - (ref.y1 + ref.y2) / 2;
  let s = `<g fill="${ink}" opacity="${op}">`;
  for (const [g, a, b] of parts) {
    const id = `c${clipN++}`;
    s += `<clipPath id="${id}"><rect x="${(ox + size * a).toFixed(1)}" y="${(oy - size * 1.2).toFixed(1)}" width="${(size * (b - a)).toFixed(1)}" height="${(size * 1.6).toFixed(1)}"/></clipPath>`;
    s += `<path clip-path="url(#${id})" d="${font.charToGlyph(g).getPath(ox, oy, size).toPathData(1)}"/>`;
  }
  return s + '</g>';
}
let seed = 11;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
// an illegible painted character: a few faded, broken strokes, different each time
function smudge(cx, cy, size, ink, op = 1) {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const x0 = cx + (rnd() - 0.5) * size * 0.6, y0 = cy + (rnd() - 0.5) * size * 0.6;
    const x1 = x0 + (rnd() - 0.5) * size * 0.5, y1 = y0 + (rnd() - 0.3) * size * 0.4;
    s += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} Q${((x0 + x1) / 2 + (rnd() - 0.5) * 8).toFixed(1)} ${((y0 + y1) / 2).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${ink}" stroke-opacity="${((0.18 + 0.2 * rnd()) * op).toFixed(2)}" stroke-width="${(size * (0.05 + 0.05 * rnd())).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
  }
  return s;
}

const out = {};
let svg = `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg"><rect width="${S}" height="${S}" fill="#d8ccb6"/>`;
let x = 0;
const pad = 16;
for (const [name, sg] of Object.entries(SIGNS)) {
  const [bw, bh] = sg.board;
  const w = sg.w, h = Math.round(w * bh / bw);
  svg += `<rect x="${x}" y="0" width="${w}" height="${h}" fill="${sg.ground}"/>`;
  // a worn wash on the board: a few faint streaks along the grain
  for (let i = 0; i < 6; i++) {
    const xx = x + 10 + rnd() * (w - 20);
    svg += `<line x1="${xx.toFixed(1)}" y1="6" x2="${(xx + (rnd() - 0.5) * 6).toFixed(1)}" y2="${h - 6}" stroke="${sg.border}" stroke-opacity="0.06" stroke-width="${(2 + rnd() * 4).toFixed(1)}"/>`;
  }
  svg += `<rect x="${x + 4}" y="4" width="${w - 8}" height="${h - 8}" fill="none" stroke="${sg.border}" stroke-width="7"/>`;
  const units = sg.slots.reduce((a, s) => a + s[2], 0);
  const cell = (h - 2 * pad) / units;
  let y = pad;
  for (const [ch, op, size] of sg.slots) {
    const ch_h = cell * size, cx = x + w / 2, cy = y + ch_h / 2;
    const fs_ = Math.min(w * 0.74, cell * 0.86);
    svg += ch === '□' ? smudge(cx, cy, Math.min(fs_, ch_h * 0.9), sg.ink, op)
      : charSvg(ch, cx, cy, fs_, sg.ink, op);
    y += ch_h;
  }
  out[name] = [x, 0, x + w, h];
  x += w + 8;
}
{
  const [bw, bh] = NOTICE.board;
  const w = NOTICE.w, h = Math.round(w * bh / bw), x0 = x;
  // paper with a slightly darker, uneven edge (paste and weather), the marks in five columns, read right to left
  svg += `<rect x="${x0}" y="0" width="${w}" height="${h}" fill="${NOTICE.paper}"/>`;
  svg += `<rect x="${x0 + 3}" y="3" width="${w - 6}" height="${h - 6}" fill="none" stroke="#b9ad93" stroke-opacity="0.55" stroke-width="10"/>`;
  for (let i = 0; i < 9; i++) {
    const cx = x0 + rnd() * w, cy = rnd() * h;
    svg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(8 + rnd() * 26).toFixed(1)}" fill="#c9bea4" fill-opacity="0.12"/>`;
  }
  const colW = (w - 70) / NOTICE.cols;
  for (let c = 0; c < NOTICE.cols; c++) {
    const cx = x0 + w - 35 - colW * (c + 0.5);
    const n = 12 + Math.floor(rnd() * 3);
    const top = 34 + rnd() * 10, bottom = h - 40 - (c === NOTICE.cols - 1 ? 90 * rnd() : rnd() * 20);
    for (let k = 0; k < n; k++) {
      const cy = top + (bottom - top) * (k + 0.5) / n;
      if (rnd() < 0.12) continue;
      // a tiny character: two or three short dots and dashes, too small and faded to read
      for (let q = 0; q < 3 + Math.floor(rnd() * 2); q++) {
        const dx = (rnd() - 0.5) * colW * 0.36, dy = (rnd() - 0.5) * 11;
        const len = 2 + rnd() * 7, ang = (rnd() - 0.5) * 3.2;
        svg += `<line x1="${(cx + dx).toFixed(1)}" y1="${(cy + dy).toFixed(1)}" x2="${(cx + dx + Math.cos(ang) * len).toFixed(1)}" y2="${(cy + dy + Math.sin(ang) * len).toFixed(1)}" stroke="${NOTICE.ink}" stroke-opacity="${(0.35 + 0.35 * rnd()).toFixed(2)}" stroke-width="${(3 + rnd() * 3).toFixed(1)}" stroke-linecap="round"/>`;
      }
    }
  }
  out.notice = [x0, 0, x0 + w, h];
}
svg += '</svg>';
const dir = path.join(HERE, 'textures');
fs.mkdirSync(dir, { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(path.join(dir, 'signs_outer_road.png'));
const aspect = Object.fromEntries(Object.entries(out).map(([k, [x0, y0, x1, y1]]) => [k, +((x1 - x0) / (y1 - y0)).toFixed(3)]));
fs.writeFileSync(path.join(dir, 'signs_outer_road.json'), JSON.stringify({
  about: 'Sign atlas cells, px [x0, y0, x1, y1], y down, in a 1024 x 1024 texture (make_signs.mjs); aspect = cell w / h, the painted board\'s.',
  size: S, cells: out, aspect,
}, null, 1) + '\n');
console.log(`textures/signs_outer_road.png: ${Object.keys(out).length} signs`, aspect);
