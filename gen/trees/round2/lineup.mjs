// gen/trees/lineup_<S>.jpg: a section's trees seen from the south, each card at the page's scale
// (clamp(mapped height / card height, 0.7, 1.4)) and mirroring, its foot at (X, D) in an oblique view; labels below.
// node lineup.mjs <S> [px per m]
import fs from 'node:fs';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const sharp = createRequire(`${Q}/tools/package.json`)('sharp');
const [S, pxm = '16'] = process.argv.slice(2);
const PX = +pxm, OBL = 0.5;
const reg = JSON.parse(fs.readFileSync(`${Q}/web/public/assets/trees/trees.json`, 'utf8'));
const asg = JSON.parse(fs.readFileSync(`${Q}/trees/assign/${S}.json`, 'utf8'));
const ents = JSON.parse(fs.readFileSync(`${Q}/map/world/${S}.json`, 'utf8')).entities.filter((e) => e.kind === 'tree' && asg[e.id] && asg[e.id].card !== 'kit');
const items = ents.map((e) => {
  const a = asg[e.id], c = reg[a.card];
  const s = e.height_m ? Math.min(1.4, Math.max(0.7, e.height_m / c.height_m)) : 1;
  return { e, a, c, s, w: c.width_m * s * PX, h: c.height_m * s * PX };
});
const xs = items.map((t) => t.e.pos[0]), ds = items.map((t) => t.e.pos[1]);
const x0 = Math.min(...xs) - 8, x1 = Math.max(...xs) + 8, dMax = Math.max(...ds), dMin = Math.min(...ds);
const top = Math.max(...items.map((t) => t.h + (t.e.pos[1] - dMin) * PX * OBL)) + 20;
const W = Math.round((x1 - x0) * PX), H = Math.round(top + 60);
const ground = (d) => H - 50 - (d - dMin) * PX * OBL;
const comps = [], labels = [];
items.sort((p, q) => q.e.pos[1] - p.e.pos[1]); // far first
let k = 0;
for (const t of items) {
  let img = sharp(`${Q}/web/public/${t.c.file}`).resize(Math.max(2, Math.round(t.w)), Math.max(2, Math.round(t.h)));
  if (t.a.flip) img = img.flop();
  const buf = await img.png().toBuffer();
  const fu = t.a.flip ? 1 - t.c.base_uv[0] : t.c.base_uv[0];
  const fx = (t.e.pos[0] - x0) * PX, fy = ground(t.e.pos[1]);
  const left = Math.round(fx - fu * t.w), topY = Math.round(fy - (1 - t.c.base_uv[1]) * t.h);
  // sharp needs the overlay inside the canvas: crop what sticks out
  const L = Math.max(0, left), T = Math.max(0, topY), R = Math.min(W, left + Math.round(t.w)), B = Math.min(H, topY + Math.round(t.h));
  if (R > L && B > T) comps.push({ input: await sharp(buf).extract({ left: L - left, top: T - topY, width: R - L, height: B - T }).png().toBuffer(), left: L, top: T });
  const slug = t.e.id.split('.').pop();
  labels.push(`<text x="${fx.toFixed(0)}" y="${(fy + 12 + (k++ % 3) * 11).toFixed(0)}" font-family="sans-serif" font-size="10" text-anchor="middle" fill="#222">${slug} ${t.a.card}${t.a.flip ? 'm' : ''}</text>`);
}
const svg = Buffer.from(`<svg width="${W}" height="${H}">${labels.join('')}<text x="8" y="16" font-family="sans-serif" font-size="13" fill="#000">${S}: ${items.length} card trees seen from the south at the page's scale (${PX} px/m; foot at X, depth raised ${OBL} px per px), mirrored where assigned</text></svg>`);
await sharp({ create: { width: W, height: H, channels: 3, background: '#d2d7dc' } }).composite([...comps, { input: svg, left: 0, top: 0 }]).jpeg({ quality: 84 }).toFile(`${Q}/gen/trees/lineup_${S}.jpg`);
console.log(`gen/trees/lineup_${S}.jpg ${W}x${H}, ${items.length} trees`);
