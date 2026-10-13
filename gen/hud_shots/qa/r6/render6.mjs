// node render.mjs <name> hud <z> [close]          -> hud_<name>_<z>.png: what the HUD canvas should show (1006 x 562), next to the screenshot's canvas
// node render.mjs <name> label <scale> <du0> <du1> <dv0> <dv1> [ids|close|all]  -> lab_<name>_....png: boxes numbered, stroke points, ring
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/home/ran/3d_director/qingming/tools/package.json');
const sharp = require('sharp');
const QA = '/tmp/claude-1000/-home-ran-3d-director/5a5a3bca-3a69-416d-986a-71fd47398c96/scratchpad/hud/qa';
const SHOTS = QA + '/../shots_r6';
const Q = '/home/ran/3d_director/qingming';
const drawn = JSON.parse(fs.readFileSync(SHOTS + '/drawn.json', 'utf8'));
const items = {}, strokes = {}, world = {};
for (const f of ['inner_city', 'gate', 'outer_road']) Object.assign(items, JSON.parse(fs.readFileSync(`${Q}/web/public/assets/${f}/scroll_index.json`, 'utf8')).items);
for (const S of ['S6', 'S5', 'S4']) {
  for (const e of JSON.parse(fs.readFileSync(`${Q}/map/strokes/${S}.json`, 'utf8')).entities) strokes[e.id] = e;
  for (const e of JSON.parse(fs.readFileSync(`${Q}/map/world/${S}.json`, 'utf8')).entities) world[e.id] = e;
}
const [name, mode, ...rest] = process.argv.slice(2);
const d = drawn[name];
const stripFile = process.env.STRIP || fs.readdirSync(QA).find((f) => f.startsWith(`strip_${name}_`));
const su0 = +stripFile.match(/_(\d+)\.png$/)[1];
const meta = await sharp(`${QA}/${stripFile}`).metadata();
const P = (p) => Array.isArray(p) && typeof p[0] === 'number';

async function crop(u0, v0, u1, v1, scale) {
  // scan rect -> image of size (u1-u0)*scale, padding with grey outside the strip
  const W = Math.round((u1 - u0) * scale), H = Math.round((v1 - v0) * scale);
  const L = Math.max(0, Math.floor(u0 - su0)), T = Math.max(0, Math.floor(v0)), R = Math.min(meta.width, Math.ceil(u1 - su0)), B = Math.min(meta.height, Math.ceil(v1));
  const part = await sharp(`${QA}/${stripFile}`).extract({ left: L, top: T, width: R - L, height: B - T }).resize(Math.round((R - L) * scale), Math.round((B - T) * scale), { kernel: 'lanczos3' }).png().toBuffer();
  const big = await sharp({ create: { width: W + 8 + Math.round((R - L) * scale), height: H + 8 + Math.round((B - T) * scale), channels: 3, background: '#4e4033' } }).composite([{ input: part, left: Math.max(0, Math.round((L + su0 - u0) * scale)), top: Math.max(0, Math.round((T - v0) * scale)) }]).png().toBuffer();
  return sharp(big).extract({ left: 0, top: 0, width: W, height: H }).png().toBuffer();
}

const dist = (id) => { const w = world[id]; const p = w?.pts?.foot || w?.pos || (w?.pts?.fore && w.pts.hind ? [(w.pts.fore[0] + w.pts.hind[0]) / 2, (w.pts.fore[1] + w.pts.hind[1]) / 2] : null); return p ? Math.hypot(p[0] - d.player.X, p[1] - d.player.D) : NaN; };

if (mode === 'hud') {
  const z = +rest[0], close = rest[1] === 'close';
  const W = 1006, H = 562, u = d.view.u, v = d.view.v;
  const u0 = u - W / 2 / z, v0 = v - H / 2 / z;
  const base = await crop(u0, v0, u0 + W / z, v0 + H / z, z);
  const ids = close ? drawn[name + '_close'] : d.boxes;
  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
  for (const id of ids) { const b = items[id]?.b; if (!b) continue; svg += `<rect x="${(b[0] - u0) * z}" y="${(b[1] - v0) * z}" width="${(b[2] - b[0]) * z}" height="${(b[3] - b[1]) * z}" fill="none" stroke="#00e0ff" stroke-width="1.2"/>`; }
  svg += `<circle cx="${(d.you.u - u0) * z}" cy="${(d.you.v - v0) * z}" r="9" fill="none" stroke="#ff2020" stroke-width="2"/></svg>`;
  const mine = await sharp(base).composite([{ input: Buffer.from(svg) }]).png().toBuffer();
  const shot = await sharp(`${SHOTS}/${name}${close ? '_close' : ''}.png`).extract({ left: 297, top: 123, width: W, height: H }).png().toBuffer();
  await sharp({ create: { width: W, height: H * 2 + 6, channels: 3, background: '#000' } }).composite([{ input: shot, left: 0, top: 0 }, { input: mine, left: 0, top: H + 6 }]).png().toFile(`${QA}/r6/hud_${name}${close ? '_close' : ''}_${z}.png`);
  console.log('wrote', `${QA}/r6/hud_${name}${close ? '_close' : ''}_${z}.png`);
} else {
  const scale = +rest[0], [du0, du1, dv0, dv1] = rest.slice(1, 5).map(Number);
  const sel = rest[5] || 'all';
  const u0 = d.you.u + du0, u1 = d.you.u + du1, v0 = d.you.v + dv0, v1 = d.you.v + dv1;
  const base = await crop(u0, v0, u1, v1, scale);
  const W = Math.round((u1 - u0) * scale), H = Math.round((v1 - v0) * scale);
  let ids = sel === 'all' ? d.boxes : sel === 'close' ? drawn[name + '_close'] : sel === 'map' ? Object.keys(items).filter((id) => /\.(fig|ani)\./.test(id)) : sel.split(',');
  ids = ids.filter((id) => { const b = items[id]?.b; return b && b[2] > u0 && b[0] < u1 && b[3] > v0 && b[1] < v1; });
  ids.sort((a, b) => dist(a) - dist(b));
  const X = (su) => (su - u0) * scale, Y = (sv) => (sv - v0) * scale;
  const colors = ['#00e5ff', '#ff3df2', '#7dff3d', '#ffe100', '#ff7b00', '#3d7dff', '#ffffff', '#ff3d3d'];
  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">`;
  const legend = [];
  ids.forEach((id, i) => {
    const it = items[id], b = it.b, c = colors[i % colors.length];
    const drawnBox = d.boxes.includes(id);
    if (process.env.PTS) { const p = strokes[id]?.pts || {}; const hd = p.head, ft = p.foot || p.fore; if (hd && ft) svg += `<line x1="${X(hd[0])}" y1="${Y(hd[1])}" x2="${X(ft[0])}" y2="${Y(ft[1])}" stroke="${c}" stroke-width="1" opacity="0.7"/>`; if (p.hind) svg += `<line x1="${X(p.fore[0])}" y1="${Y(p.fore[1])}" x2="${X(p.hind[0])}" y2="${Y(p.hind[1])}" stroke="${c}" stroke-width="1.5"/>`; for (const [k, q] of Object.entries(p)) if (P(q)) svg += k === 'head' ? `<path d="M${X(q[0]) - 4} ${Y(q[1]) - 4}l8 8m0 -8l-8 8" stroke="${c}" stroke-width="2"/>` : `<circle cx="${X(q[0])}" cy="${Y(q[1])}" r="3" fill="${c}" stroke="#000" stroke-width="0.8"/>`; const t = hd || ft; svg += `<text x="${X(t[0]) + 5}" y="${Y(t[1]) - 4}" font-size="13" fill="${c}" stroke="#000" stroke-width="3" paint-order="stroke" font-weight="bold">${i + 1}</text>`; legend.push(`${i + 1}\t${id}\t${dist(id).toFixed(1)}m\tb=${it.b}\tpts=${JSON.stringify(p)}\t${strokes[id]?.pose || ''}\t${drawnBox ? '' : 'NOT-DRAWN'}`); return; }
    svg += `<rect x="${X(b[0])}" y="${Y(b[1])}" width="${(b[2] - b[0]) * scale}" height="${(b[3] - b[1]) * scale}" fill="none" stroke="${c}" stroke-width="1.6" ${drawnBox ? '' : 'stroke-dasharray="4 3"'}/>`;
    const p = strokes[id]?.pts || {};
    for (const [k, q] of Object.entries(p)) if (P(q)) svg += k === 'head' ? `<path d="M${X(q[0]) - 4} ${Y(q[1]) - 4}l8 8m0 -8l-8 8" stroke="${c}" stroke-width="2"/>` : `<circle cx="${X(q[0])}" cy="${Y(q[1])}" r="3.5" fill="${c}" stroke="#000" stroke-width="0.8"/>`;
    svg += `<text x="${X(b[0]) + 2}" y="${Y(b[1]) - 2}" font-size="13" fill="${c}" stroke="#000" stroke-width="3" paint-order="stroke" font-weight="bold">${i + 1}</text>`;
    legend.push(`${i + 1}\t${id}\t${dist(id).toFixed(1)}m\tb=${b}\tpts=${JSON.stringify(p)}\t${strokes[id]?.pose || ''}\t${drawnBox ? '' : 'NOT-DRAWN'}`);
  });
  svg += `<circle cx="${X(d.you.u)}" cy="${Y(d.you.v)}" r="9" fill="none" stroke="#ff2020" stroke-width="2.5"/><circle cx="${X(d.you.u)}" cy="${Y(d.you.v)}" r="2" fill="#ff2020"/></svg>`;
  const out = `${QA}/r6/${process.env.PTS ? 'pts' : 'lab'}_${name}_${sel.length > 12 ? 'sel' : sel}_${du0}_${du1}_${dv0}_${dv1}.png`;
  await sharp(base).composite([{ input: Buffer.from(svg) }]).png().toFile(out);
  console.log('wrote', out, W, H);
  console.log(legend.join('\n'));
}
