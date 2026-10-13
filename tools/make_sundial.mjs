#!/usr/bin/env node
// The sundial (日晷) the scene pages show the time with (web/src/sundial.js), from two sources:
//  - the painted stone face (shyfai, prompts/ui_sundial.txt; blank, so the marks can be laid on exactly): the disc
//    is found on its white ground, cut out round and written at 3x its on-screen size to
//    web/public/assets/ui/sundial_face.webp;
//  - the twelve earthly branches 子丑寅卯辰巳午未申酉戌亥 (the twelve double hours, 时辰), as outlines from an OFL brush
//    font (Ma Shan Zheng, gen/fonts/), so the page needs no font: web/src/sundial_glyphs.js, each glyph centred on
//    its box in a 100-unit em, y down (SVG).
// Usage: node tools/make_sundial.mjs [face.png] [font.ttf]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(path.join(ROOT, 'tools/package.json'));
const sharp = req('sharp');
const opentype = req('opentype.js');
const [faceSrc = 'gen/ui/sundial_face_0.png', fontSrc = 'gen/fonts/MaShanZheng-Regular.ttf'] = process.argv.slice(2);
const OUT_FACE = path.join(ROOT, 'web/public/assets/ui/sundial_face.webp');
const OUT_GLYPHS = path.join(ROOT, 'web/src/sundial_glyphs.js');
const SIZE = 336; // 112 css px at 3x

// the face: the disc's extent on the white ground (rows and columns through the middle), then a round cut
const { data, info } = await sharp(path.resolve(ROOT, faceSrc)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const lum = (x, y) => { const i = (y * W + x) * 3; return (data[i] + data[i + 1] + data[i + 2]) / 3; };
const extent = (n, f) => { let a = -1, b = -1; for (let i = 0; i < n; i++) if (f(i) < 238) { if (a < 0) a = i; b = i; } return [a, b]; };
const [l, r] = extent(W, (i) => lum(i, H >> 1)), [t, b] = extent(H, (i) => lum(W >> 1, i));
const cx = (l + r) / 2, cy = (t + b) / 2, R = Math.min(r - l, b - t) / 2;
const side = Math.ceil(2 * R);
const padded = await sharp(path.resolve(ROOT, faceSrc)).removeAlpha()
  .extend({ top: side, bottom: side, left: side, right: side, background: '#ffffff' }).png().toBuffer();
const square = await sharp(padded)
  .extract({ left: Math.round(cx - R + side), top: Math.round(cy - R + side), width: side, height: side })
  .resize(SIZE, SIZE).removeAlpha().toBuffer();
const mask = Buffer.from(`<svg width="${SIZE}" height="${SIZE}"><circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2 - 1.5}" fill="#fff"/></svg>`);
fs.mkdirSync(path.dirname(OUT_FACE), { recursive: true });
await sharp(square).joinChannel(await sharp(mask).resize(SIZE, SIZE).extractChannel(3).toBuffer())
  .webp({ quality: 90, alphaQuality: 95 }).toFile(OUT_FACE);
console.log(`face: disc at (${cx}, ${cy}) r ${R} in ${W}x${H} -> ${path.relative(ROOT, OUT_FACE)} (${fs.statSync(OUT_FACE).size} bytes)`);

// the glyphs
const font = opentype.parse(fs.readFileSync(path.resolve(ROOT, fontSrc)).buffer);
const CHARS = '子丑寅卯辰巳午未申酉戌亥';
const glyphs = {};
for (const ch of CHARS) {
  const g = font.charToGlyph(ch);
  if (!g || g.index === 0) throw new Error(`no glyph for ${ch}`);
  const box = g.getPath(0, 0, 100).getBoundingBox();
  glyphs[ch] = g.getPath(-(box.x1 + box.x2) / 2, -(box.y1 + box.y2) / 2, 100).toPathData(0);
}
fs.writeFileSync(OUT_GLYPHS, `// The twelve earthly branches (the double hours, 时辰) as SVG outlines: made by tools/make_sundial.mjs from Ma Shan Zheng
// (SIL Open Font License 1.1, gen/fonts/OFL.txt). Each is centred on its box in a 100-unit em, y down.
export const BRANCHES = ${JSON.stringify(CHARS)};
export const GLYPHS = ${JSON.stringify(glyphs, null, 1)};
`);
console.log(`glyphs: ${CHARS.length} -> ${path.relative(ROOT, OUT_GLYPHS)} (${fs.statSync(OUT_GLYPHS).size} bytes)`);
