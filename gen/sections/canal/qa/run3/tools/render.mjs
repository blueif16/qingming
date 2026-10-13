// Plan picture of a grid.json: black = no collider (water, void), green = free ground (H -1.2..0.7; darker lower),
// orange = free raised floor/deck/roof only, red = blocked (no free floor). Overlays: the built bank tops (white) and
// shores (cyan) from river_plan.json, the route (yellow), the painted area (magenta), figures (dots: blue crew,
// white others), boats (their root, slug), entity labels. node render.mjs <grid.json> <out.png> [scale] [cx0 cx1]
import fs from 'node:fs';
import { createRequire } from 'node:module';
const sharp = createRequire('/home/ran/3d_director/qingming/tools/package.json')('sharp');
const ROOT = '/home/ran/3d_director/qingming';
const [gF, outF, scA, cx0, cx1] = process.argv.slice(2);
const G = JSON.parse(fs.readFileSync(gF, 'utf8'));
const L = JSON.parse(fs.readFileSync(ROOT + '/sections/canal/layout.json', 'utf8'));
const R = JSON.parse(fs.readFileSync(ROOT + '/gen/sections/canal/river_plan.json', 'utf8'));
const sc = +(scA || 8), S = G.st;
let X0 = G.x0, X1 = G.x1;
const c0 = cx0 ? Math.round((+cx0 - G.x0) / S) : 0, c1 = cx1 ? Math.round((+cx1 - G.x0) / S) : G.rows[0].length - 1;
if (cx0) { X0 = G.x0 + c0 * S; X1 = G.x0 + c1 * S; }
const H = G.rows.length, W = c1 - c0 + 1;
const buf = Buffer.alloc(W * H * 3);
for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
  const [hs, fs_] = G.rows[r][c + c0];
  let rgb;
  if (!hs.length) rgb = [10, 10, 30];
  else {
    const g = fs_.filter((y) => y >= -1.2 && y <= 0.7);
    const hi = fs_.filter((y) => y > 0.7);
    if (g.length) { const y = Math.max(...g); const k = Math.max(0, Math.min(1, (y + 0.9) / 1.6)); rgb = [60 + 90 * k, 110 + 110 * k, 60 + 40 * k]; }
    else if (hi.length) { const y = Math.min(...hi); const k = Math.min(1, y / 5); rgb = [230, 170 - 100 * k, 40]; }
    else if (fs_.length) rgb = [80, 90, 170]; // free only below H -1.2: ground under the water
    else rgb = [200, 30, 30];
  }
  buf.set(rgb, (r * W + c) * 3);
}
const Wp = W * sc, Hp = H * sc;
const px = (X) => ((X - X0) / S) * sc, py = (D) => ((G.d1 - D) / S) * sc;
const poly = (pts, col, w, dash) => `<polyline points="${pts.map(([x, d]) => `${px(x).toFixed(1)},${py(d).toFixed(1)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
let svg = `<svg width="${Wp}" height="${Hp}" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">`;
for (let X = Math.ceil(X0); X <= X1; X += 1) { const x = px(X); const major = X % 5 === 0; svg += `<line x1="${x}" y1="0" x2="${x}" y2="${Hp}" stroke="#fff" stroke-opacity="${major ? 0.45 : 0.12}"/>` + (major ? `<text x="${x + 2}" y="${Hp - 4}" font-size="13" fill="#fff">${X}</text>` : ''); }
for (let D = Math.ceil(G.d0); D <= G.d1; D += 1) { const y = py(D); const major = D % 5 === 0; svg += `<line x1="0" y1="${y}" x2="${Wp}" y2="${y}" stroke="#fff" stroke-opacity="${major ? 0.45 : 0.12}"/>` + (major ? `<text x="2" y="${y - 2}" font-size="13" fill="#fff">D${D}</text>` : ''); }
const pa = L.painted_area.corners; svg += poly([...pa, pa[0]], '#f0f', 2, '6,4');
for (const b of Object.values(R.banks)) { svg += poly(b.bank_top, '#fff', 1.5); svg += poly(b.shore, '#0ff', 1.5); }
svg += poly(L.route.centre, '#ff0', 1.2, '4,4');
for (const f of L.figures) { const crew = /boat/.test(f.support || ''); svg += `<circle cx="${px(f.X)}" cy="${py(f.D)}" r="${0.26 / S * sc}" fill="${crew ? '#39f' : '#fff'}" stroke="#000" stroke-width="1"/>`; }
for (const t of L.trees || []) svg += `<circle cx="${px(t.X)}" cy="${py(t.D)}" r="${0.2 / S * sc}" fill="#0a0" stroke="#fff" stroke-width="1"/>`;
for (const [id, e] of Object.entries(L.entities)) {
  if (!e.pos || !['building', 'structure', 'vehicle', 'animal'].includes(e.kind)) continue;
  const [x, d] = e.pos; if (x < X0 - 2 || x > X1 + 2) continue;
  const name = id.split('.').pop().replace(/_\d+$/, '');
  svg += `<text x="${px(x)}" y="${py(d)}" font-size="12" fill="${e.kind === 'vehicle' ? '#9cf' : e.kind === 'animal' ? '#fc9' : '#ffd'}" stroke="#000" stroke-width="0.4">${name}</text>`;
}
for (const q of G.people || []) for (const [x, d, rr] of q.c) svg += `<circle cx="${px(x)}" cy="${py(d)}" r="${rr / S * sc}" fill="none" stroke="#f33" stroke-width="1.5"/>`;
for (const b of G.boats || []) { if (b.pos[0] < X0 - 2 || b.pos[0] > X1 + 2) continue; svg += `<circle cx="${px(b.pos[0])}" cy="${py(b.pos[1])}" r="5" fill="#09f"/>`; }
svg += '</svg>';
await sharp(buf, { raw: { width: W, height: H, channels: 3 } }).resize(Wp, Hp, { kernel: 'nearest' }).composite([{ input: Buffer.from(svg) }]).png().toFile(outF);
console.log(outF, Wp, Hp);
