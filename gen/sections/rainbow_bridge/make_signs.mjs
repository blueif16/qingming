#!/usr/bin/env node
// The Rainbow Bridge's sign atlas (S3, sections/rainbow_bridge): 十千脚店's painted writing and cloths with their
// characters as painted (map/text/S3.md), in one texture, so all of them are one material (`signs_rainbow_bridge`,
// blender/kit_rainbow_bridge_area.py).
//   node gen/sections/rainbow_bridge/make_signs.mjs
// After gen/sections/city_end/make_signs.mjs. Characters come from the OFL brush-kai font with traditional forms (LXGW
// WenKai TC Bold, read from gen/sections/inner_city/fonts/, SIL OFL 1.1), as painted: the lamp-box's front reads 腳店
// (the full form of 脚, copied from the scan, not the restyle) and its east side 十千 (small, in the upper part of the
// face, faint); the banner's 新酒 is faint strokes in the light panel of its middle band. A character the scroll shows
// but that can't be read (□ in the map) is drawn as a faded, broken smudge, never guessed: the gate's three boards
// (□□□□, □□, □□; the scholars' 天之/美禄 can't be confirmed on the scan).
// Writes textures/signs_rainbow_bridge.png (1024 x 1024) and textures/signs_rainbow_bridge.json: per cell its pixels
// [x0, y0, x1, y1] (y down) and its aspect (width / height) at the real proportions the kit builds the face at, so
// nothing is stretched on the face.
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
const S = 1024, CH = 100, pad = 10;

const PALE = '#ebe5d6', INK = '#1d1a17', BORDER = '#2e2018', CLOTH = '#e6e0d2', BAND = '#3b3f46';

function glyphPath(ch, cx, cy, size) {
  const g = font.charToGlyph(ch);
  if (!g || !g.index) throw new Error(`no glyph for ${ch}`);
  const box = g.getPath(0, 0, size).getBoundingBox();
  return g.getPath(cx - (box.x1 + box.x2) / 2, cy - (box.y1 + box.y2) / 2, size).toPathData(1);
}
let seed = 23;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
// an illegible painted character: a few faded, broken strokes, different each time
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

// 1. vertical boards: the lamp-box's two faces and the gate's three illegible boards. aspect = the face as built
// (blender/kit_rainbow_bridge_area.py: width / height); `fill` the share of the height the characters take (from the
// top), `scale` their size against the column, `alpha` their ink (faint as painted).
const BOARDS = {
  jiaodian_front: { text: '腳店', aspect: 0.55 / 1.25, h: 420, fill: 1.0, scale: 0.86, alpha: 0.93 },   // front face
  shiqian_side: { text: '十千', aspect: 0.36 / 1.25, h: 420, fill: 0.66, scale: 0.8, alpha: 0.7 },     // east face
  gate_board_4: { text: '□□□□', aspect: 0.28 / 1.5, h: 420 },     // on the heavy east front post (u 17145-17170)
  gate_board_2: { text: '□□', aspect: 0.36 / 1.05, h: 220 },      // under the east eave (u 17277-17307)
  gate_marks_2: { text: '□□', aspect: 0.34 / 0.56, h: 220 },      // the marks over the lamp-box (u 17010-17035)
};
let x = 0;
for (const [name, b] of Object.entries(BOARDS)) {
  const chars = [...b.text];
  const h = b.h, w = Math.round(h * b.aspect);
  svg += `<rect x="${x}" y="0" width="${w}" height="${h}" fill="${PALE}"/>`;
  svg += `<rect x="${x + 3}" y="3" width="${w - 6}" height="${h - 6}" fill="none" stroke="${BORDER}" stroke-width="5"/>`;
  const fill = b.fill ?? 1.0, rows = chars.length, step = (h - 2 * pad) * fill / rows;
  const size = Math.min(step * (b.scale ?? 0.84), (w - 16) * 0.95);
  chars.forEach((ch, i) => {
    const cx = x + w / 2, cy = pad + step * (i + 0.5);
    svg += ch === '□' ? smudge(cx, cy, size * 1.02, INK)
      : `<path d="${glyphPath(ch, cx, cy, size)}" fill="${INK}" fill-opacity="${b.alpha ?? 0.93}"/>`;
  });
  cells[name] = [x, 0, x + w, h];
  aspect[name] = +(w / h).toFixed(4);
  x += w + 8;
}

// 2. the 新酒 banner, the whole cloth (u 17428-17562, v 915-1125 on the scan): pale cloth, a dark band down each edge
// and one down the middle; the middle band dark at its top and foot with a light panel between (v 985-1045), where
// 新酒 is written in faint strokes, top to bottom. Built 1.5 x 2.3 m.
{
  const W = 375, H = 575, x0 = 0, y0 = 440;   // 1.5 x 2.3 m
  const sx = W / 134, sy = H / 210;     // scan px of the banner -> cell px
  svg += `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="${CLOTH}"/>`;
  const band = (u0, u1, v0, v1) => {
    // a hand-painted band: its edges wander a little
    const L = x0 + u0 * sx, R = x0 + u1 * sx, T = y0 + v0 * sy, B = y0 + v1 * sy;
    let d = `M${L.toFixed(1)} ${T.toFixed(1)}`;
    for (let t = 0; t <= 1.0001; t += 0.1) d += ` L${(R + (rnd() - 0.5) * 2.5).toFixed(1)} ${(T + (B - T) * t).toFixed(1)}`;
    for (let t = 1; t >= -0.0001; t -= 0.1) d += ` L${(L + (rnd() - 0.5) * 2.5).toFixed(1)} ${(T + (B - T) * t).toFixed(1)}`;
    svg += `<path d="${d} Z" fill="${BAND}" fill-opacity="0.92"/>`;
  };
  band(4, 24, 10, 206);          // west edge band
  band(106, 126, 10, 206);       // east edge band
  band(52, 77, 10, 70);          // the middle band, dark at its top ...
  band(52, 77, 135, 206);        // ... and its foot
  // the light panel between: a thin ink border and 新酒 in faint strokes
  svg += `<rect x="${(x0 + 53 * sx).toFixed(1)}" y="${(y0 + 70 * sy).toFixed(1)}" width="${(23 * sx).toFixed(1)}" height="${(65 * sy).toFixed(1)}" fill="none" stroke="${BAND}" stroke-opacity="0.5" stroke-width="3"/>`;
  const cx = x0 + 64.5 * sx;
  [['新', 88], ['酒', 117]].forEach(([ch, v]) => {
    svg += `<path d="${glyphPath(ch, cx, y0 + v * sy, 20 * sx * 0.95)}" fill="${INK}" fill-opacity="0.42"/>`;
  });
  // the hem and the two hanging loops' shadows at the top
  svg += `<rect x="${x0}" y="${y0}" width="${W}" height="6" fill="${BAND}" fill-opacity="0.35"/>`;
  cells.xinjiu_banner = [x0, y0, x0 + W, y0 + H];
  aspect.xinjiu_banner = +(W / H).toFixed(4);
}

svg += '</svg>';
const dir = path.join(HERE, 'textures');
fs.mkdirSync(dir, { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(path.join(dir, 'signs_rainbow_bridge.png'));
fs.writeFileSync(path.join(dir, 'signs_rainbow_bridge.json'), JSON.stringify({
  about: 'Sign atlas cells, px [x0, y0, x1, y1], y down, in a 1024 x 1024 texture, and each cell\'s width / height (make_signs.mjs).',
  size: S, cells, aspect,
}, null, 1) + '\n');
console.log(`textures/signs_rainbow_bridge.png: ${Object.keys(cells).length} cells`);
