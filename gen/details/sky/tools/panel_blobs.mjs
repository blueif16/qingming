#!/usr/bin/env node
// Stray marks in the backdrop panels: connected opaque regions (alpha > 40, at 1/2 scale) that are not part of the
// painting's main mass, with their box (in image fractions) and whether they lie above the panel's painted horizon.
// Writes <out>/panels_on_magenta.jpg (every panel on magenta, so any leftover in the keyed-out sky shows).
//   node gen/details/sky/tools/panel_blobs.mjs <out_dir>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const assets = path.join(ROOT, 'web/public/assets');
const files = [];
for (const sec of fs.readdirSync(assets)) {
  const d = path.join(assets, sec);
  if (!fs.statSync(d).isDirectory()) continue;
  for (const f of fs.readdirSync(d)) if (/^backdrop_\w+\.webp$/.test(f)) files.push([sec, f.slice(9, -5), path.join(d, f)]);
}
const tiles = [];
for (const [sec, side, f] of files) {
  let cfg = null;
  try { cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'sections', sec, 'backdrop.json'), 'utf8')).panels.find((p) => p.side === side); } catch { /* none */ }
  const meta = await sharp(f).metadata();
  const W = Math.round(meta.width / 2), H = Math.round(meta.height / 2);
  const { data } = await sharp(f).ensureAlpha().resize(W, H).raw().toBuffer({ resolveWithObject: true });
  const lab = new Int32Array(W * H).fill(-1), comps = [];
  for (let i = 0; i < W * H; i++) {
    if (lab[i] >= 0 || data[4 * i + 3] <= 40) continue;
    const id = comps.length, st = [i];
    let n = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
    lab[i] = id;
    while (st.length) {
      const j = st.pop(), x = j % W, y = (j / W) | 0;
      n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const k = Y * W + X;
        if (lab[k] < 0 && data[4 * k + 3] > 40) { lab[k] = id; st.push(k); }
      }
    }
    comps.push({ n, box: [x0 / W, y0 / H, x1 / W, y1 / H].map((v) => +v.toFixed(3)) });
  }
  comps.sort((a, b) => b.n - a.n);
  const main = comps[0]?.n || 0;
  const stray = comps.slice(1).filter((c) => c.n >= 12);
  const hz = cfg?.horizon;
  console.log(`${sec}/${side} ${meta.width}x${meta.height} horizon=${hz} hold=${!!cfg?.hold} main=${main}px comps=${comps.length} stray>=12px: ${stray.length}`);
  for (const c of stray.slice(0, 15)) console.log(`   ${c.n}px box ${JSON.stringify(c.box)}${hz != null && c.box[3] < hz ? ' ABOVE HORIZON' : ''}`);
  const tw = 1400, th = Math.round((tw * meta.height) / meta.width);
  const label = Buffer.from(`<svg width="${tw}" height="22"><rect width="${tw}" height="22" fill="#000" opacity="0.6"/><text x="6" y="16" font-size="15" fill="#fff" font-family="monospace">${sec}/${side} horizon ${hz}</text></svg>`);
  const img = await sharp(f).resize(tw, th).png().toBuffer();
  tiles.push(await sharp({ create: { width: tw, height: th, channels: 3, background: '#ff00ff' } }).composite([{ input: img }, { input: label, top: 0, left: 0 }]).png().toBuffer().then((b) => [b, th]));
}
let y = 0;
const comp = tiles.map(([input, th]) => { const o = { input, left: 0, top: y }; y += th + 6; return o; });
await sharp({ create: { width: 1400, height: y, channels: 3, background: '#fff' } }).composite(comp).jpeg({ quality: 80 }).toFile(path.join(out, 'panels_on_magenta.jpg'));
console.log('->', path.join(out, 'panels_on_magenta.jpg'));
