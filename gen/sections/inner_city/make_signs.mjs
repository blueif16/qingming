#!/usr/bin/env node
// The inner city's sign atlas: every painted signboard, lamp-box, banner and plaque of S6 with its characters as
// painted (map/text/S6.md), in one texture, so all the signs of the section are one material.
//   node gen/sections/inner_city/make_signs.mjs
// Characters come from an OFL brush-kai font with traditional forms (LXGW WenKai TC Bold, gen/sections/inner_city/
// fonts/, SIL OFL 1.1): Ma Shan Zheng (gen/fonts/) lacks 孫 劉 揀 員 楊 應 錦 鋪, which the scroll paints. A character the
// scroll shows but that can't be read (□ in the map) is drawn as a faded, broken smudge, never as a guessed character.
// Writes textures/signs_inner_city.png (1024 x 1024) and textures/signs_inner_city.json: per sign its cells in pixels
// [x0, y0, x1, y1] (y down), read by blender/inner_city_scene.py.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const req = createRequire(path.join(ROOT, 'tools/package.json'));
const sharp = req('sharp');
const opentype = req('opentype.js');
const font = opentype.parse(fs.readFileSync(path.join(HERE, 'fonts/LXGWWenKaiTC-Bold.ttf')).buffer);
const S = 1024, CW = 112, CH = 100; // column width, character cell height (px)

// name: { text (□ = illegible), ground (board colour), ink, border, small: optional top cell of two small characters }
const SIGNS = {
  lampbox_zhengdian: { text: '正店', ground: '#efeae0', ink: '#1d1a17', border: '#3a2a1e' },
  lampbox_sun: { text: '孫□', ground: '#efeae0', ink: '#1d1a17', border: '#3a2a1e' },
  lampbox_xiang: { text: '香□', ground: '#efeae0', ink: '#1d1a17', border: '#3a2a1e' },
  liu_incense: { text: '劉家上色沉檀揀香', ground: '#e7dfcf', ink: '#1d1a17', border: '#2e2018' },
  inn_wang: { small: '久住', text: '王員外家', ground: '#e7dfcf', ink: '#1d1a17', border: '#2e2018' },
  cloth_shop: { text: '□錦疋帛', ground: '#e7dfcf', ink: '#1d1a17', border: '#2e2018' },
  cloth_shop_box: { text: '鋪', ground: '#e7dfcf', ink: '#1d1a17', border: '#2e2018' },
  street: { text: '□□□香□□', ground: '#e4dccb', ink: '#1d1a17', border: '#2e2018' },
  stele_5129: { text: '□□□', ground: '#ddd5c4', ink: '#2a2420', border: '#2e2018' },
  zi_2888: { text: '□□子', ground: '#e4dccb', ink: '#1d1a17', border: '#2e2018' },
  jie: { text: '解', ground: '#ece6d8', ink: '#141210', border: '#2b1d14' },
  banner_sunyang: { text: '孫羊店', ground: '#ece8df', ink: '#1a1715', border: '#2c2a33' },
  clinic_yang: { text: '楊家應症', ground: '#e7dfcf', ink: '#1d1a17', border: '#2e2018' },
  plaque: { text: '□', ground: '#d9cfbb', ink: '#3a3029', border: '#2e2018' },
  fascia: { text: '□□□', ground: '#d4c9b4', ink: '#3a3029', border: '#2e2018', across: true },
};

function glyphPath(ch, cx, cy, size) {
  const g = font.charToGlyph(ch);
  if (!g || !g.index) throw new Error(`no glyph for ${ch}`);
  const box = g.getPath(0, 0, size).getBoundingBox();
  return g.getPath(cx - (box.x1 + box.x2) / 2, cy - (box.y1 + box.y2) / 2, size).toPathData(1);
}
// an illegible painted character: a few faded, broken strokes, different each time
let seed = 7;
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
function chars(text, x, y, w, cell, ink, across) {
  let s = '';
  [...text].forEach((ch, i) => {
    const cx = across ? x + cell * (i + 0.5) : x + w / 2, cy = across ? y + cell / 2 : y + cell * (i + 0.5);
    s += ch === '□' ? smudge(cx, cy, cell * 0.8, ink) : `<path d="${glyphPath(ch, cx, cy, cell * 0.78)}" fill="${ink}" fill-opacity="0.93"/>`;
  });
  return s;
}

// pack: vertical boards in columns of CW px, each sign a padded rectangle; the across ones in a row at the bottom
const out = {};
let svg = `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg"><rect width="${S}" height="${S}" fill="#d8ccb6"/>`;
let col = 0, y = 0;
const pad = 10;
for (const [name, sg] of Object.entries(SIGNS)) {
  const n = [...sg.text].length;
  let w, h;
  if (sg.across) { w = n * CH + 2 * pad; h = CH + 2 * pad; } else { w = CW; h = n * CH + 2 * pad + (sg.small ? CH * 0.75 : 0); }
  if (sg.across) { col = 0; y = S - h; }
  if (!sg.across && y + h > S - 140) { col++; y = 0; }
  const x0 = sg.across ? 0 : col * (CW + 8), y0 = y;
  svg += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${sg.ground}"/>`;
  svg += `<rect x="${x0 + 3}" y="${y0 + 3}" width="${w - 6}" height="${h - 6}" fill="none" stroke="${sg.border}" stroke-width="5"/>`;
  let ty = y0 + pad;
  if (sg.small) {
    // two small characters side by side in a box at the top (久住)
    const cs = CH * 0.44;
    svg += `<rect x="${x0 + 10}" y="${ty + 2}" width="${w - 20}" height="${CH * 0.7}" fill="none" stroke="${sg.border}" stroke-width="2.5"/>`;
    [...sg.small].forEach((ch, i) => { svg += `<path d="${glyphPath(ch, x0 + w / 2 + (i - 0.5) * cs * 1.05, ty + CH * 0.37, cs * 0.9)}" fill="${sg.ink}"/>`; });
    ty += CH * 0.75;
  }
  svg += chars(sg.text, x0, ty, w, CH, sg.ink, sg.across);
  out[name] = [x0, y0, x0 + w, y0 + h];
  if (!sg.across) y += h + 8;
}
svg += '</svg>';
const dir = path.join(HERE, 'textures');
fs.mkdirSync(dir, { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(path.join(dir, 'signs_inner_city.png'));
fs.writeFileSync(path.join(dir, 'signs_inner_city.json'), JSON.stringify({ about: 'Sign atlas cells, px [x0, y0, x1, y1], y down, in a 1024 x 1024 texture (make_signs.mjs).', size: S, cells: out }, null, 1) + '\n');
console.log(`textures/signs_inner_city.png: ${Object.keys(out).length} signs`);
