#!/usr/bin/env node
// The scroll map (map/README.md): stroke points measured on the scan -> ground metres -> the section in words.
//   node tools/scroll_map.mjs <S> overlay [--parts a.json,b.json] [--x u0-u1] [--y v0-v1] [--zoom 1] [--out f.jpg]
//   node tools/scroll_map.mjs <S> merge                 gen/map/<S>/parts/*.json -> map/strokes/<S>.json
//   node tools/scroll_map.mjs <S> check [--parts f.json] schema and reference checks
//   overlay --parts none --grid 20 draws only a labelled grid (scan px) over the crop, for reading positions
//   node tools/scroll_map.mjs <S> fit                   frames/<S>.json anchors -> frame coefficients, residuals, checks
//   node tools/scroll_map.mjs <S> world                 strokes + frames -> map/world/<S>.json
//   node tools/scroll_map.mjs <S> text                  world -> map/text/<S>.md
//   node tools/scroll_map.mjs <S> plan                  world -> gen/map/<S>/plan.jpg (top-down, for review)
//   node tools/scroll_map.mjs <S> all                   check, fit, world, text, plan, overlay
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.join(ROOT, p);
const sharp = createRequire(r('tools/package.json'))('sharp');
const SCAN = r('reference/scroll/qingming_commons_38414x1800.jpg');

const [S, cmd, ...rest] = process.argv.slice(2);
const opt = {};
for (let i = 0; i < rest.length; i++) if (rest[i].startsWith('--')) opt[rest[i].slice(2)] = rest[i + 1]?.startsWith('--') ? true : rest[++i];
const SECTIONS = JSON.parse(fs.readFileSync(r('map/sections.json'), 'utf8'));
if (!SECTIONS[S]) { console.error(`unknown section ${S}`); process.exit(1); }
const SEC = SECTIONS[S];
const AREA = SEC.area || SEC.x; // the part mapped and built so far (map/sections.json)
const GEN = `gen/map/${S}`;
fs.mkdirSync(r(GEN), { recursive: true });

export const KINDS = { fig: 'figure', ani: 'animal', veh: 'vehicle', tree: 'tree', prop: 'prop', bld: 'building', str: 'structure',
  road: 'road', water: 'water', grd: 'grd', grp: 'group' };
const COLOR = { figure: '#ff2d55', animal: '#ff9500', vehicle: '#ffd60a', tree: '#30d158', prop: '#64d2ff', building: '#bf5af2',
  structure: '#da8fff', road: '#ffffff', water: '#0a84ff', grd: '#c8a26a', group: '#888888' };
const REQUIRED = { figure: ['foot', 'head'], animal: ['fore', 'hind', 'head'], vehicle: ['front', 'rear'], tree: ['base'], prop: ['base'] };
const CORNERS = ['sw', 'se', 'ne', 'nw'];

const readJSON = (p) => JSON.parse(fs.readFileSync(r(p), 'utf8'));
const strokesPath = `map/strokes/${S}.json`;
const loadStrokes = () => (fs.existsSync(r(strokesPath)) ? readJSON(strokesPath).entities : []);
const entitiesOf = (j) => (Array.isArray(j) ? j : j.entities || []);
const loadParts = (list) => (list === true || list === 'none' ? [] : list.split(',').flatMap((f) => entitiesOf(JSON.parse(fs.readFileSync(path.resolve(f), 'utf8')))));

// every ground point of an entity (figures: foot; buildings: base corners and lines), for placing and checking
function groundPts(e) {
  const p = e.pts || {};
  const out = [];
  for (const k of ['foot', 'fore', 'hind', 'front', 'rear', 'base']) if (Array.isArray(p[k]) && typeof p[k][0] === 'number') out.push(p[k]);
  if (p.base && !Array.isArray(p.base)) for (const c of CORNERS) if (p.base[c]) out.push(p.base[c]);
  for (const w of p.wheels || []) out.push(w);
  for (const ln of linesOf(e)) out.push(...ln.pts);
  return out;
}
function linesOf(e) {
  const p = e.pts || {};
  const out = [];
  if (p.line) out.push({ role: e.role || 'line', pts: p.line });
  if (p.lines) for (const [role, pts] of Object.entries(p.lines)) out.push({ role, pts });
  return out;
}
export const primary = (e) => groundPts(e)[0];

// ---------------------------------------------------------------- overlay: entities drawn on the scan

async function overlay() {
  const ents = opt.parts ? loadParts(opt.parts) : loadStrokes();
  const [u0, u1] = opt.x ? opt.x.split('-').map(Number) : AREA;
  const [v0, v1] = opt.y ? opt.y.split('-').map(Number) : [0, 1800];
  const z = +(opt.zoom || (u1 - u0 > 2400 ? 0.5 : 1));
  const W = Math.round((u1 - u0) * z), H = Math.round((v1 - v0) * z);
  const T = ([u, v]) => [((u - u0) * z).toFixed(1), ((v - v0) * z).toFixed(1)];
  const fs_ = Math.max(9, Math.round(11 * Math.sqrt(z)));
  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><g font-family="sans-serif" font-size="${fs_}">`;
  const dot = (p, c, rr = 4) => { const [x, y] = T(p); const est = p[2] === 'est'; return `<circle cx="${x}" cy="${y}" r="${rr}" fill="${est ? 'none' : c}" stroke="${est ? c : '#000'}" stroke-width="${est ? 2 : 1}"/>`; };
  const seg = (a, b, c, wd = 1.5, dash = '') => { const [x1, y1] = T(a), [x2, y2] = T(b); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${wd}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`; };
  const label = (p, t, c) => { const [x, y] = T(p); return `<text x="${+x + 5}" y="${+y - 4}" fill="${c}" stroke="#000" stroke-width="0.35" font-weight="bold">${t}</text>`; };
  const poly = (pts, c, closed) => `<poly${closed ? 'gon' : 'line'} points="${pts.map((p) => T(p).join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="2"/>`;
  for (const e of ents) {
    const c = COLOR[e.kind] || '#fff', p = e.pts || {}, slug = (e.id || '?').split('.').slice(2).join('.');
    if (e.kind === 'group') continue;
    if (p.head && p.foot) svg += seg(p.foot, p.head, c);
    if (p.head && p.fore) svg += seg(p.fore, p.head, c, 1, '3 2');
    if (p.fore && p.hind) svg += seg(p.fore, p.hind, c, 2.5);
    if (p.front && p.rear) svg += seg(p.front, p.rear, c, 2.5);
    if (p.top && p.base && typeof p.base[0] === 'number') svg += seg(p.base, p.top, c, 1, '4 3');
    if (p.crown_w && p.crown_e) svg += seg(p.crown_w, p.crown_e, c, 1, '2 2');
    if (p.base && !Array.isArray(p.base)) {
      const cs = CORNERS.filter((k) => p.base[k]).map((k) => p.base[k]);
      if (cs.length > 1) svg += poly(cs, c, cs.length > 2);
      for (const [k, v] of Object.entries(p)) {
        const m = k.match(/^(sw|se|ne|nw)_(eave|ridge|top)$/);
        if (m && p.base[m[1]]) { svg += seg(p.base[m[1]], v, c, 1, '4 3'); svg += dot(v, c, 3); }
      }
      for (const b of p.bays || []) svg += dot(b, c, 2.5);
    }
    for (const ln of linesOf(e)) svg += poly(ln.pts, c, false);
    for (const g of groundPts(e)) svg += dot(g, c);
    for (const k of ['head', 'top']) if (p[k]) svg += dot(p[k], c, 2.5);
    const at = primary(e) || p.head;
    if (at) svg += label(at, slug, c);
  }
  if (opt.grid) {
    const n = +opt.grid, every = n * z >= 45 ? 1 : 5;
    let gsv = '';
    for (let u = Math.ceil(u0 / n) * n, i = 0; u < u1; u += n, i++) {
      const [x] = T([u, v0]), major = u % (n * every) === 0;
      gsv += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#00e5ff" stroke-opacity="${major ? 0.75 : 0.35}" stroke-width="1"/>`;
      if (major) gsv += `<text x="${+x + 2}" y="${fs_ + 1}" fill="#00e5ff" stroke="#000" stroke-width="0.4">${u}</text>`;
    }
    for (let v = Math.ceil(v0 / n) * n; v < v1; v += n) {
      const [, y] = T([u0, v]), major = v % (n * every) === 0;
      gsv += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#00e5ff" stroke-opacity="${major ? 0.75 : 0.35}" stroke-width="1"/>`;
      if (major) gsv += `<text x="2" y="${+y - 2}" fill="#00e5ff" stroke="#000" stroke-width="0.4">${v}</text>`;
    }
    svg = svg.replace('<g font-family', `${gsv}<g font-family`);
  }
  svg += '</g></svg>';
  const img = await sharp(SCAN, { limitInputPixels: false }).extract({ left: u0, top: v0, width: u1 - u0, height: v1 - v0 }).resize(W, H).toBuffer();
  const out = opt.out ? path.resolve(opt.out) : r(`${GEN}/overlay_${u0}_${u1}.jpg`);
  await sharp(img).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 86 }).toFile(out);
  console.log(out, `${ents.length} entities, scan x ${u0}-${u1}, y ${v0}-${v1}, zoom ${z}`);
}

// ---------------------------------------------------------------- merge: parts -> strokes

function merge() {
  const dir = r(`${GEN}/parts`);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const byId = new Map(), dups = [];
  for (const f of files) {
    for (const e of entitiesOf(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))) {
      e._from = f;
      if (byId.has(e.id)) { dups.push(`${e.id}: ${byId.get(e.id)._from} and ${f}`); continue; }
      byId.set(e.id, e);
    }
  }
  const ents = [...byId.values()];
  const near = [];
  for (let i = 0; i < ents.length; i++) for (let j = i + 1; j < ents.length; j++) {
    const a = ents[i], b = ents[j];
    if (a.kind !== b.kind || a._from === b._from || ['road', 'water', 'grd', 'structure', 'building', 'group'].includes(a.kind)) continue;
    const pa = primary(a), pb = primary(b);
    if (pa && pb && Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) < 30) near.push(`${a.id} (${a._from}) ~ ${b.id} (${b._from}): ${Math.round(Math.hypot(pa[0] - pb[0], pa[1] - pb[1]))} px`);
  }
  const order = Object.values(KINDS);
  ents.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || ((primary(b) || [0])[0] - (primary(a) || [0])[0]));
  for (const e of ents) delete e._from;
  fs.mkdirSync(r('map/strokes'), { recursive: true });
  fs.writeFileSync(r(strokesPath), JSON.stringify({ section: S, entities: ents }, null, 1).replace(/\[\n\s+(-?[\d.]+),\n\s+(-?[\d.]+)(?:,\n\s+("est"))?\n\s+\]/g, (m, a, b, c) => `[${a}, ${b}${c ? ', ' + c : ''}]`) + '\n');
  console.log(`${strokesPath}: ${ents.length} entities from ${files.length} parts`);
  if (dups.length) console.log(`duplicate ids (kept the first):\n  ${dups.join('\n  ')}`);
  if (near.length) console.log(`near-duplicates across parts (same kind, < 30 px) -- resolve by hand:\n  ${near.join('\n  ')}`);
}

// ---------------------------------------------------------------- check

function check() {
  const ents = opt.parts ? loadParts(opt.parts) : loadStrokes(), ids = new Set(), errs = [], warn = [];
  const [x0, x1] = AREA;
  for (const e of ents) {
    const where = e.id || JSON.stringify(e).slice(0, 60);
    if (!/^S\d[a-z]?\.(fig|ani|veh|tree|prop|bld|str|road|water|grd|grp)\.[a-z0-9_]+$/.test(e.id || '')) errs.push(`${where}: bad id`);
    if (ids.has(e.id)) errs.push(`${where}: duplicate id`);
    ids.add(e.id);
    const code = (e.id || '').split('.')[1];
    if (KINDS[code] !== e.kind) errs.push(`${where}: kind "${e.kind}" does not match id code "${code}"`);
    for (const k of REQUIRED[e.kind] || []) if (!e.pts?.[k]) errs.push(`${where}: missing pts.${k}`);
    if (['building', 'structure', 'road', 'water', 'grd'].includes(e.kind) && !groundPts(e).length) errs.push(`${where}: no ground points (base corners or line)`);
    if (e.kind === 'group' && !(e.members || []).length) errs.push(`${where}: group without members`);
    if (!e.what && e.kind !== 'group') warn.push(`${where}: no "what"`);
    for (const g of groundPts(e)) {
      if (!(g.length === 2 || (g.length === 3 && g[2] === 'est')) || g.slice(0, 2).some((n) => typeof n !== 'number')) errs.push(`${where}: bad point ${JSON.stringify(g)}`);
      else if (g[0] < x0 - 400 || g[0] > x1 + 400 || g[1] < 0 || g[1] > 1800) warn.push(`${where}: point ${g} outside the section`);
    }
    if ('facing_deg' in e && !(e.facing_deg >= 0 && e.facing_deg < 360)) errs.push(`${where}: facing_deg out of range`);
  }
  if (fs.existsSync(r(framesPath))) {
    const sup = Object.keys(loadFrames().supports);
    for (const e of ents) if (e.support && !e.support.startsWith('animal') && !sup.some((k) => e.support === k || e.support.startsWith(k + ' ') || e.support.startsWith(k + ':')))
      warn.push(`${e.id}: support "${e.support}" is not in ${framesPath} supports (${sup.join(', ')})`);
  }
  for (const e of ents) for (const m of e.members || []) if (!ids.has(m)) errs.push(`${e.id}: member ${m} not in the map`);
  for (const e of ents) if (e.group && !ids.has(e.group)) warn.push(`${e.id}: group ${e.group} not in the map`);
  // references from the build: people.json figures and walkers
  if (SEC.folder) {
    const pj = r(`sections/${SEC.folder}/people.json`);
    if (fs.existsSync(pj)) {
      const p = JSON.parse(fs.readFileSync(pj, 'utf8'));
      for (const id of Object.keys(p.figures || {})) if (!ids.has(`${S}.fig.${id}`)) warn.push(`people.json figure ${id} has no map entity ${S}.fig.${id}`);
    }
  }
  const counts = {};
  for (const e of ents) counts[e.kind] = (counts[e.kind] || 0) + 1;
  console.log(`${strokesPath}: ${ents.length} entities ${JSON.stringify(counts)}`);
  if (warn.length) console.log(`warnings:\n  ${warn.join('\n  ')}`);
  if (errs.length) { console.log(`ERRORS:\n  ${errs.join('\n  ')}`); process.exitCode = 1; } else console.log('check PASS');
  return !errs.length;
}

// ---------------------------------------------------------------- frames: picture <-> ground

const framesPath = `map/frames/${S}.json`;
const loadFrames = () => readJSON(framesPath);
const frameFor = (F, u) => F.frames.find((f) => u >= f.covers[0] && u < f.covers[1]) || F.frames[0];
// A frame may let the receding (depth) direction drift along the scroll: dx_knots [[u, dx], ...] give the depth
// axis's u-component at picture u (linear between knots, constant beyond), with x = [ax, 0] and d = [*, dy].
const dxAt = (f, u) => {
  const k = f.dx_knots;
  if (!k?.length) return f.d[0];
  if (u <= k[0][0]) return k[0][1];
  for (let i = 0; i + 1 < k.length; i++) if (u <= k[i + 1][0]) return k[i][1] + ((k[i + 1][1] - k[i][1]) * (u - k[i][0])) / (k[i + 1][0] - k[i][0]);
  return k[k.length - 1][1];
};
// scan [u, v] of a point at height H -> ground [X, D]
function toWorld([u, v], H, f) {
  if (f.dx_knots) { const D = (v - f.origin[1] + f.h * H) / f.d[1]; return [(u - f.origin[0] - dxAt(f, u) * D) / f.x[0], D]; }
  const [a, c] = f.x, [b, d] = f.d, ru = u - f.origin[0], rv = v - f.origin[1] + f.h * H, det = a * d - b * c;
  return [(ru * d - b * rv) / det, (a * rv - c * ru) / det];
}
function toScan([X, D, H], f) {
  if (f.dx_knots) { let u = f.origin[0] + f.x[0] * X; for (let i = 0; i < 8; i++) u = f.origin[0] + f.x[0] * X + dxAt(f, u) * D; return [u, f.origin[1] + f.d[1] * D - f.h * H]; }
  return [f.origin[0] + f.x[0] * X + f.d[0] * D, f.origin[1] + f.x[1] * X + f.d[1] * D - f.h * H];
}
// "S5.str.moat_bridge:base.sw", "S5.road.main:lines.centre.3" -> the scan point
function ref(byId, s) {
  const [id, p] = s.split(':');
  let o = byId.get(id)?.pts;
  for (const k of p.split('.')) o = o?.[/^\d+$/.test(k) ? +k : k];
  if (!Array.isArray(o) || typeof o[0] !== 'number') throw new Error(`no point ${s}`);
  return o;
}
// a support's H. A support may instead give an H_profile, [[u, H], ...] in increasing u, read at the point's own u,
// or an H_profile_X, [[X, H], ...] in increasing world X (an arched deck that recedes across the picture: the same X
// has different u at the near and far edges), solved together with the point's depth. Linear between the pairs, flat
// beyond the ends. `pt` is a scan point [u, v] (or a bare u)
const interp = (prof, x) => {
  if (x <= prof[0][0]) return prof[0][1];
  for (let i = 1; i < prof.length; i++) if (x <= prof[i][0]) { const [x0, h0] = prof[i - 1], [x1, h1] = prof[i]; return +(h0 + (h1 - h0) * (x - x0) / (x1 - x0)).toFixed(3); }
  return prof[prof.length - 1][1];
};
function supportH(F, s, pt) {
  if (!s) return 0;
  const key = Object.keys(F.supports).find((k) => s === k || s.startsWith(k + ' ') || s.startsWith(k + ':')) ?? (s.startsWith('animal') ? 'ground' : null);
  if (key == null) { WARN.add(`support "${s}" not in ${framesPath} supports (taken as 0 m)`); return 0; }
  const sup = F.supports[key], u = Array.isArray(pt) ? pt[0] : pt;
  if (Array.isArray(sup.H_profile_X) && sup.H_profile_X.length && Array.isArray(pt)) {
    const f = frameFor(F, u);
    let H = sup.H ?? sup.H_profile_X[0][1];
    for (let i = 0; i < 8; i++) H = interp(sup.H_profile_X, toWorld(pt, H, f)[0]);
    return H;
  }
  if (Array.isArray(sup.H_profile) && sup.H_profile.length && u != null) return interp(sup.H_profile, u);
  return sup.H;
}
const WARN = new Set();

// least squares for one frame from its anchors (scan point <-> assumed ground X, D, H), h fixed
function solve3(rows, rhs) {
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0];
  rows.forEach((row, i) => { for (let j = 0; j < 3; j++) { b[j] += row[j] * rhs[i]; for (let k = 0; k < 3; k++) A[j][k] += row[j] * row[k]; } });
  const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D0 = det(A);
  return [0, 1, 2].map((j) => det(A.map((row, i) => row.map((v, k) => (k === j ? b[i] : v)))) / D0);
}
function fit() {
  const F = loadFrames(), byId = new Map(loadStrokes().map((e) => [e.id, e]));
  for (const f of F.frames) {
    if (!f.anchors?.length || f.dx_knots) continue; // drifting frames are set from their derivation, not fitted
    const pts = f.anchors.map((a) => ({ a, s: ref(byId, a.ref) }));
    const rows = pts.map(({ a }) => [1, a.world[0], a.world[1]]);
    const [ou, ax, dx] = solve3(rows, pts.map(({ s }) => s[0]));
    const [ov, ay, dy] = solve3(rows, pts.map(({ a, s }) => s[1] + f.h * (a.world[2] || 0)));
    Object.assign(f, { origin: [+ou.toFixed(2), +ov.toFixed(2)], x: [+ax.toFixed(3), +ay.toFixed(3)], d: [+dx.toFixed(3), +dy.toFixed(3)] });
    f.residuals_px = pts.map(({ a, s }) => { const q = toScan(a.world, f); return [a.ref, +Math.hypot(q[0] - s[0], q[1] - s[1]).toFixed(1)]; });
    console.log(`${f.id}: origin ${f.origin}, x ${f.x}, d ${f.d}, h ${f.h}; anchor residuals (px):`, f.residuals_px.map((x) => `${x[0]} ${x[1]}`).join(', '));
  }
  F.checks_result = runChecks(F, byId);
  fs.writeFileSync(r(framesPath), JSON.stringify(F, null, 1) + '\n');
}
// independent checks: real sizes that were not used in the fit
function runChecks(F, byId) {
  const out = [];
  for (const c of F.checks || []) {
    try {
      const a = ref(byId, c.a), b = ref(byId, c.b), f = frameFor(F, a[0]);
      let got;
      if (c.measure === 'height') got = (a[1] - b[1]) / f.h;
      else {
        const Ha = c.Ha || 0, Hb = c.Hb ?? Ha;
        const p = toWorld(a, Ha, f), q = toWorld(b, Hb, f);
        got = c.measure === 'direction' ? (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI : Math.hypot(q[0] - p[0], q[1] - p[1]);
      }
      out.push({ what: c.what, expect: c.expect, got: +got.toFixed(2) });
      console.log(`check: ${c.what}: expect ${c.expect}, got ${got.toFixed(2)}`);
    } catch (err) { out.push({ what: c.what, error: err.message }); console.log(`check: ${c.what}: ${err.message}`); }
  }
  return out;
}

// ---------------------------------------------------------------- world: every entity in metres

const COMPASS = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
const compass = (dx, dd) => COMPASS[((Math.round(Math.atan2(dd, dx) / (Math.PI / 4)) % 8) + 8) % 8];
const r2 = (x) => Math.round(x * 100) / 100, r1 = (x) => Math.round(x * 10) / 10;
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return [Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy), t];
}
function inside(p, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// station along a polyline (arc length) and side (+ = left of travel = north for an eastward route)
function stationOf(p, line) {
  let best = { d: 1e9 }, acc = 0;
  for (let i = 0; i + 1 < line.length; i++) {
    const a = line[i], b = line[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const [d, t] = segDist(p, a, b);
    if (d < best.d) {
      const cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
      best = { d, s: acc + t * L, side: Math.sign(cross) * d };
    }
    acc += L;
  }
  // beyond the ends: extend along the end segments
  for (const [i, sgn] of [[0, -1], [line.length - 2, 1]]) {
    const a = line[i], b = line[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
    const t = (p[0] - a[0]) * ux + (p[1] - a[1]) * uy;
    if ((sgn < 0 && t < 0) || (sgn > 0 && t > L)) {
      const side = ux * (p[1] - a[1]) - uy * (p[0] - a[0]);
      if (Math.abs(side) <= best.d + 1e-6) best = { d: Math.abs(side), s: (sgn < 0 ? 0 : acc - L) + t, side };
    }
  }
  return best;
}

function world() {
  const F = loadFrames(), ents = loadStrokes(), byId = new Map(ents.map((e) => [e.id, e]));
  const W = (pt, H) => { const f = frameFor(F, pt[0]); const [X, D] = toWorld(pt, H, f); return [r2(X), r2(D), r2(H)]; };
  const out = [];
  for (const e of ents) {
    if (e.kind === 'group') { out.push({ id: e.id, kind: e.kind, name: e.name, what: e.what, members: e.members }); continue; }
    const p = e.pts || {}, pt0 = primary(e) || p.head || [AREA[0], 0], u0 = pt0[0], H0 = supportH(F, e.support, pt0), f = frameFor(F, u0);
    const w = { id: e.id, kind: e.kind, name: e.name, what: e.what, support: e.support || 'ground', H: H0, pts: {}, est: [] };
    // H point by point (map/README.md, supports): a point or line named in support_by, then a u range in
    // support_ranges, then the entity's own support, whose H_profile (if it has one) is read at the point's own u
    const Hof = (pt, name) => {
      const s = e.support_by?.[name] ?? (e.support_ranges || []).find((r) => pt[0] >= r.u[0] && pt[0] <= r.u[1])?.support;
      return s != null ? supportH(F, s, pt) : supportH(F, e.support, pt);
    };
    for (const k of ['pose', 'facing_deg', 'vis', 'conf', 'src', 'note', 'group', 'route', 'role']) if (e[k] != null && e[k] !== '') w[k] = e[k];
    const put = (name, pt, H = Hof(pt, name)) => { w.pts[name] = W(pt, H); if (pt[2] === 'est') w.est.push(name); };
    for (const k of ['foot', 'fore', 'hind', 'front', 'rear', 'beam_n', 'beam_s']) if (p[k]) put(k, p[k]);
    // a boat's gunwale straight above its front or rear waterline (map/README.md, Boats): same depth, height from the
    // rise on the silk, its own east-west position
    for (const [k, b] of [['bow_top', 'front'], ['stern_top', 'rear']]) if (p[k] && p[b]) { const B = p[b], v = p[k], Hb = Hof(B, b); put(k, [B[0], B[1], ...(v[2] ? [v[2]] : [])], Hb); w.pts[k][0] = r2(w.pts[k][0] + (v[0] - B[0]) / f.x[0]); w.pts[k][2] = r2(Hb + (B[1] - v[1]) / f.h); }
    if (Array.isArray(p.base) && typeof p.base[0] === 'number') put('base', p.base);
    (p.wheels || []).forEach((pt, i) => put(`wheel${i}`, pt));
    if (p.base && !Array.isArray(p.base)) for (const c of CORNERS) if (p.base[c]) put(c, p.base[c]);
    for (const [k, v] of Object.entries(p)) {
      const m = k.match(/^(sw|se|ne|nw)_(eave|ridge|top)$/);
      // a point straight above a base corner: same depth as the corner, height from the rise on the silk, and its
      // own east-west position (a battered wall's top stands in from its foot)
      if (m && p.base?.[m[1]]) { const b = p.base[m[1]], Hb = Hof(b, m[1]); put(k, [b[0], b[1], ...(v[2] ? [v[2]] : [])], Hb); w.pts[k][0] = r2(w.pts[k][0] + (v[0] - b[0]) / f.x[0]); w.pts[k][2] = r2(Hb + (b[1] - v[1]) / f.h); }
    }
    if (p.bays) w.bays = p.bays.map((b) => W(b, Hof(b, 'bays')).slice(0, 2));
    const lines = linesOf(e);
    if (lines.length) {
      w.lines = Object.fromEntries(lines.map((ln) => [ln.role, ln.pts.map((pt) => W(pt, Hof(pt, ln.role)).slice(0, 2))]));
      // each line point's H, when any is off the ground (a road over an arched deck, a deck's edge)
      const lh = lines.map((ln) => [ln.role, ln.pts.map((pt) => r2(Hof(pt, ln.role)))]).filter(([, hs]) => hs.some((h) => h !== 0));
      if (lh.length) w.lines_H = Object.fromEntries(lh);
    }
    // derived sizes
    if (p.head && p.foot) w.painted_height_m = r2((p.foot[1] - p.head[1]) / f.h);
    if (p.top && Array.isArray(p.base)) w.height_m = r2((p.base[1] - p.top[1]) / f.h);
    if (p.crown_w && p.crown_e) w.crown_m = r2(Math.abs(p.crown_e[0] - p.crown_w[0]) / f.x[0]);
    if (p.fore && p.hind) w.length_m = r2(Math.hypot(w.pts.fore[0] - w.pts.hind[0], w.pts.fore[1] - w.pts.hind[1]));
    if (p.front && p.rear) w.length_m = r2(Math.hypot(w.pts.front[0] - w.pts.rear[0], w.pts.front[1] - w.pts.rear[1]));
    const corners = CORNERS.filter((c) => w.pts[c]).map((c) => w.pts[c]);
    if (corners.length >= 3) w.footprint = corners.map((c) => c.slice(0, 2));
    const tops = Object.entries(w.pts).filter(([k]) => /_(eave|ridge|top)$/.test(k)).map(([k, v]) => [k, v[2]]);
    if (tops.length) w.heights = Object.fromEntries(tops);
    // main position
    const gp = groundPts(e);
    if (corners.length) w.pos = [r2(corners.reduce((s, c) => s + c[0], 0) / corners.length), r2(corners.reduce((s, c) => s + c[1], 0) / corners.length)];
    else if (lines.length) { const all = Object.values(w.lines).flat(); w.pos = [r2(all.reduce((s, c) => s + c[0], 0) / all.length), r2(all.reduce((s, c) => s + c[1], 0) / all.length)]; }
    else if (gp.length) { const k = ['foot', 'fore', 'front', 'base'].find((k) => w.pts[k]); w.pos = w.pts[k].slice(0, 2); }
    if (p.fore && p.hind) w.pos = [r2((w.pts.fore[0] + w.pts.hind[0]) / 2), r2((w.pts.fore[1] + w.pts.hind[1]) / 2)];
    if (p.front && p.rear) w.pos = [r2((w.pts.front[0] + w.pts.rear[0]) / 2), r2((w.pts.front[1] + w.pts.rear[1]) / 2)];
    if (e.kind === 'figure' && p.foot) w.pos = w.pts.foot.slice(0, 2);
    out.push(w);
  }
  // route stations
  const route = out.find((e) => e.route);
  if (route) {
    const line = route.lines.centre || Object.values(route.lines)[0];
    const datum = F.datum.pts.map((s) => W(ref(byId, s), 0));
    const dp = [datum.reduce((s, c) => s + c[0], 0) / datum.length, datum.reduce((s, c) => s + c[1], 0) / datum.length];
    // datum.station: the station at the datum, so stations run on from the neighbouring section (map/README.md, Frames)
    const s0 = stationOf(dp, line).s - (F.datum.station || 0);
    const st = (pt) => { const q = stationOf(pt, line); return [r1(q.s - s0), r1(q.side)]; };
    for (const e of out) {
      if (!e.pos) continue;
      [e.station, e.side] = st(e.pos);
      const pts = e.footprint || (e.lines && Object.values(e.lines).flat());
      if (pts) { const ss = pts.map(st); e.station_range = [Math.min(...ss.map((x) => x[0])), Math.max(...ss.map((x) => x[0]))]; e.side_range = [Math.min(...ss.map((x) => x[1])), Math.max(...ss.map((x) => x[1]))]; }
    }
    F._datum = { pos: dp.map(r2), about: F.datum.about, ...(F.datum.station ? { station: F.datum.station } : {}) };
  }
  // relations: the landmark each thing is in or next to, and its nearest neighbours
  const marks = out.filter((e) => ['building', 'structure'].includes(e.kind) && (e.footprint || e.lines));
  const things = out.filter((e) => e.pos && !['building', 'structure', 'road', 'water', 'grd', 'group'].includes(e.kind));
  for (const e of things) {
    let best = null;
    for (const m of marks) {
      let d = 1e9;
      if (m.footprint) { if (inside(e.pos, m.footprint)) d = 0; else for (let i = 0; i < m.footprint.length; i++) d = Math.min(d, segDist(e.pos, m.footprint[i], m.footprint[(i + 1) % m.footprint.length])[0]); }
      if (m.lines) for (const ln of Object.values(m.lines)) for (let i = 0; i + 1 < ln.length; i++) d = Math.min(d, segDist(e.pos, ln[i], ln[i + 1])[0]);
      if (!best || d < best.d) best = { d, m };
    }
    if (best) e.landmark = { id: best.m.id, dist_m: r1(best.d), dir: best.d === 0 ? 'inside' : compass(e.pos[0] - best.m.pos[0], e.pos[1] - best.m.pos[1]) };
    e.near = things.filter((o) => o !== e).map((o) => ({ id: o.id, d: Math.hypot(o.pos[0] - e.pos[0], o.pos[1] - e.pos[1]), dir: compass(o.pos[0] - e.pos[0], o.pos[1] - e.pos[1]) }))
      .sort((a, b) => a.d - b.d).slice(0, 3).map((n) => ({ id: n.id, dist_m: r1(n.d), dir: n.dir }));
  }
  fs.mkdirSync(r('map/world'), { recursive: true });
  const doc = { section: S, about: `Generated by tools/scroll_map.mjs from ${strokesPath} and ${framesPath}. Never edit by hand. Metres: X east, D north, H up; station = metres along the route from the datum, + east; side = metres north (+) of the route centre.`,
    frames: F.frames.map(({ id, covers, origin, x, d, h, dx_knots, assumptions }) => ({ id, covers, origin, x, d, h, dx_knots, assumptions })), datum: F._datum, route: route?.id, entities: out };
  fs.writeFileSync(r(`map/world/${S}.json`), JSON.stringify(doc, null, 1).replace(/\[\n\s+(-?[\d.]+),\n\s+(-?[\d.]+)(?:,\n\s+(-?[\d.]+))?\n\s+\]/g, (m, a, b, c) => `[${a}, ${b}${c != null ? ', ' + c : ''}]`) + '\n');
  console.log(`map/world/${S}.json: ${out.length} entities`);
  for (const w of WARN) console.log('warning:', w);
  return doc;
}

// ---------------------------------------------------------------- text: the section in words

const FACE = (deg) => (deg == null ? '' : `faces ${COMPASS[Math.round(deg / 45) % 8]}`);
const sideWords = (s) => (Math.abs(s) < 0.25 ? 'on the centre line' : `${Math.abs(s).toFixed(1)} m ${s > 0 ? 'N' : 'S'}`);
const stWords = (s) => `${s >= 0 ? '+' : '−'}${Math.abs(s).toFixed(1)}`;
const short = (e) => e.name || e.id.split('.').slice(2).join('.');

function text() {
  const doc = JSON.parse(fs.readFileSync(r(`map/world/${S}.json`), 'utf8')), F = loadFrames();
  const ents = doc.entities, byId = new Map(ents.map((e) => [e.id, e]));
  const L = [];
  L.push(`# ${S} ${SEC.name}: the map in words`, '');
  L.push(`Generated by \`tools/scroll_map.mjs ${S} text\` from \`${strokesPath}\` (stroke points on the scan) and \`${framesPath}\`. Never edit this file: change the strokes or the frame and regenerate. Scan range u ${AREA[0]}–${AREA[1]}${SEC.area ? ` (of the section's ${SEC.x[0]}–${SEC.x[1]}: ${SEC.area_note || 'the rest is a later area'})` : ''}.`, '');
  L.push('## How to read it', '');
  L.push(`- **Station** is metres along the route (\`${doc.route}\`) from the datum, ${F.datum.about}. **+ is east** (picture right${SEC.folder === 'gate' ? ', out of the city, toward the bridge' : ''}); **− is west**. The scroll is read from right to left, so the walk below starts at the east end.`);
  L.push('- **Side** is metres north (N, away from the scroll\'s viewer) or south (S, toward the viewer) of the route\'s centre line. **H** is height above the ground.');
  L.push('- Directions: E = picture right, N = away from the viewer. "faces W" means the body faces west.');
  L.push('- Positions come from points measured on the strokes. "(est)" marks a point estimated because the strokes hide it (feet behind a rail, a corner behind a tree). Metres also rest on the frame\'s assumptions below.');
  L.push('- Painted figures are about 1.3× life size against the architecture; positions use foot points, so this doesn\'t move anyone.', '');
  L.push('## Frame and assumptions', '');
  for (const f of F.frames) {
    if (f.dx_knots) L.push(`- **${f.id}** covers u ${f.covers[0]}–${f.covers[1]}: u = ${f.origin[0]} + ${f.x[0]}·X + dx(u)·D; v = ${f.origin[1]} − ${Math.abs(f.d[1])}·D − ${f.h}·H, where the receding direction dx(u) drifts along the scroll: ${f.dx_knots.map(([u, dx]) => `${dx} at u ${u}`).join(', ')} (linear between, constant beyond).`);
    else L.push(`- **${f.id}** covers u ${f.covers[0]}–${f.covers[1]}: u = ${f.origin[0]} + ${f.x[0]}·X + ${f.d[0]}·D; v = ${f.origin[1]} ${f.x[1] >= 0 ? '+' : '−'} ${Math.abs(f.x[1])}·X ${f.d[1] >= 0 ? '+' : '−'} ${Math.abs(f.d[1])}·D − ${f.h}·H.`);
    for (const dv of f.derivation || []) L.push(`  - Derived: ${dv}`);
    for (const a of f.assumptions || []) L.push(`  - Assumed: ${a}`);
  }
  for (const c of F.checks_result || []) L.push(`- Check: ${c.what}: expected ${c.expect}, measured ${c.got ?? c.error}.`);
  for (const [k, v] of Object.entries(F.supports)) L.push(`- Support **${k}**: H ${v.H} m (${v.how}).`);
  L.push('');

  // landmarks
  const marks = ents.filter((e) => ['building', 'structure', 'road', 'water', 'grd'].includes(e.kind) && e.station != null)
    .sort((a, b) => (b.station_range?.[1] ?? b.station) - (a.station_range?.[1] ?? a.station));
  L.push('## Landmarks, east to west', '');
  for (const m of marks) {
    const sr = m.station_range ? `stations ${stWords(m.station_range[1])} to ${stWords(m.station_range[0])}` : `station ${stWords(m.station)}`;
    const sd = m.side_range ? `side ${sideWords(m.side_range[1])} to ${sideWords(m.side_range[0])}` : sideWords(m.side);
    let size = '';
    if (m.footprint) {
      const fp = m.footprint, len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (fp.length === 4) size = `; footprint ${len(fp[0], fp[1]).toFixed(1)} m (front) × ${len(fp[1], fp[2]).toFixed(1)} m (deep)`;
    }
    const hs = m.heights ? `; heights ${Object.entries(m.heights).map(([k, v]) => `${k} ${v} m`).join(', ')}` : '';
    const est = m.est?.length ? ` (est: ${m.est.join(', ')})` : '';
    L.push(`- **${short(m)}** \`${m.id}\`: ${sr}; ${sd}${size}${hs}${m.facing_deg != null ? `; front ${FACE(m.facing_deg).replace('faces ', 'faces ')}` : ''}${est}. ${m.what || ''}${m.note ? ` Note: ${m.note}` : ''}`);
  }
  L.push('');

  // strip map
  const things = ents.filter((e) => e.station != null && !['road', 'group'].includes(e.kind));
  const lo = Math.floor(Math.min(...things.map((e) => e.station_range?.[0] ?? e.station)) / 5) * 5;
  const hi = Math.ceil(Math.max(...things.map((e) => e.station_range?.[1] ?? e.station)) / 5) * 5;
  const cols = [['far N (> 15 m)', (s) => s > 15], ['N (4–15 m)', (s) => s > 4 && s <= 15], ['road (±4 m)', (s) => Math.abs(s) <= 4], ['S (4–15 m)', (s) => s < -4 && s >= -15], ['far S (> 15 m)', (s) => s < -15]];
  L.push('## Strip map', '', 'Each row is 5 m of the route, east at the top. Each cell lists what stands there (× = how many). Structures appear in every row they cover.', '');
  L.push(`| stations | ${cols.map((c) => c[0]).join(' | ')} |`, `|---|${cols.map(() => '---').join('|')}|`);
  for (let s = hi; s > lo; s -= 5) {
    const cells = cols.map(() => new Map());
    for (const e of things) {
      const inRow = e.station_range ? e.station_range[0] < s && e.station_range[1] >= s - 5 : e.station <= s && e.station > s - 5;
      if (!inRow) continue;
      const sides = e.side_range && e.station_range ? [e.side_range[0], e.side_range[1]] : [e.side];
      cols.forEach(([, test], i) => {
        const hit = sides.length === 2 ? (i === 0 ? sides[1] > 15 : i === 4 ? sides[0] < -15 : i === 1 ? sides[1] > 4 && sides[0] <= 15 : i === 3 ? sides[0] < -4 && sides[1] >= -15 : sides[0] <= 4 && sides[1] >= -4) : test(sides[0]);
        if (hit) cells[i].set(short(e), (cells[i].get(short(e)) || 0) + 1);
      });
    }
    L.push(`| ${stWords(s)} to ${stWords(s - 5)} | ${cells.map((m) => [...m].map(([k, n]) => (n > 1 ? `${k} ×${n}` : k)).join('; ')).join(' | ')} |`);
  }
  L.push('');

  // everything, east to west
  L.push('## Everything, east to west', '');
  const items = ents.filter((e) => e.station != null && !['building', 'structure', 'road', 'water', 'grd', 'group'].includes(e.kind)).sort((a, b) => b.station - a.station);
  for (let s = hi; s > lo; s -= 5) {
    const row = items.filter((e) => e.station <= s && e.station > s - 5);
    if (!row.length) continue;
    L.push(`### Stations ${stWords(s)} to ${stWords(s - 5)}`, '');
    for (const e of row) {
      const bits = [`station ${stWords(e.station)}, ${sideWords(e.side)}`];
      if (e.H) bits.push(`H ${e.H} m (${e.support})`);
      else if (e.support && e.support !== 'ground') bits.push(`on the ${e.support}`);
      if (e.landmark) bits.push(e.landmark.dir === 'inside' ? `inside ${short(byId.get(e.landmark.id))}` : `${e.landmark.dist_m} m ${e.landmark.dir} of ${short(byId.get(e.landmark.id))}`);
      if (e.pose) bits.push(e.pose);
      if (e.facing_deg != null) bits.push(FACE(e.facing_deg));
      if (e.kind === 'tree') { if (e.height_m) bits.push(`about ${e.height_m} m tall`); if (e.crown_m) bits.push(`crown ${e.crown_m} m wide`); }
      if (e.length_m) bits.push(`${e.length_m} m long`);
      const near = (e.near || []).map((n) => `${short(byId.get(n.id))} ${n.dist_m} m ${n.dir}`).join(', ');
      const flags = [e.est?.length ? `est: ${e.est.join(', ')}` : '', e.conf && e.conf !== 'high' ? `identification ${e.conf}` : '', e.vis && e.vis !== 'full' ? e.vis : ''].filter(Boolean).join('; ');
      L.push(`- **${short(e)}** \`${e.id}\`: ${bits.join('; ')}. ${e.what || ''}${e.src ? ` (${e.src})` : ''}${near ? ` Nearest: ${near}.` : ''}${flags ? ` [${flags}]` : ''}${e.note ? ` Note: ${e.note}` : ''}`);
    }
    L.push('');
  }

  // groups
  const groups = ents.filter((e) => e.kind === 'group');
  if (groups.length) {
    L.push('## Groups', '');
    for (const g of groups) {
      const ms = (g.members || []).map((id) => byId.get(id)).filter(Boolean);
      const st = ms.filter((m) => m.station != null).map((m) => m.station);
      L.push(`- **${short(g)}** \`${g.id}\`${st.length ? ` (stations ${stWords(Math.max(...st))} to ${stWords(Math.min(...st))})` : ''}: ${g.what || ''} Members: ${ms.map((m) => `${short(m)} (${m.station != null ? stWords(m.station) : '?'}, ${m.side != null ? sideWords(m.side) : '?'})`).join('; ')}.`);
    }
    L.push('');
  }

  // open questions
  const open = ents.filter((e) => (e.conf && e.conf !== 'high') || (e.note && /unclear|ambiguous|unsure|faded|cannot|can't|not sure|unknown/i.test(e.note)));
  if (open.length || F.questions?.length) {
    L.push('## Open questions', '');
    for (const q of F.questions || []) L.push(`- **Section:** ${q}`);
    for (const e of open) L.push(`- \`${e.id}\` (${short(e)}): ${e.note || `identification ${e.conf}`}`);
    L.push('');
  }
  fs.mkdirSync(r('map/text'), { recursive: true });
  fs.writeFileSync(r(`map/text/${S}.md`), L.join('\n'));
  console.log(`map/text/${S}.md: ${L.length} lines`);
}

// ---------------------------------------------------------------- plan: top-down review image

async function plan() {
  const doc = JSON.parse(fs.readFileSync(r(`map/world/${S}.json`), 'utf8'));
  const ents = doc.entities.filter((e) => e.pos || e.lines);
  const allPts = ents.flatMap((e) => [e.pos, ...(e.footprint || []), ...(e.lines ? Object.values(e.lines).flat() : [])].filter(Boolean));
  const X0 = Math.min(...allPts.map((p) => p[0])) - 3, X1 = Math.max(...allPts.map((p) => p[0])) + 3;
  const D0 = Math.min(...allPts.map((p) => p[1])) - 3, D1 = Math.max(...allPts.map((p) => p[1])) + 3;
  const k = +(opt.scale || 22), W = Math.round((X1 - X0) * k), H = Math.round((D1 - D0) * k);
  const T = ([x, d]) => [((x - X0) * k).toFixed(1), ((D1 - d) * k).toFixed(1)];
  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f4efe4"/><g font-family="sans-serif" font-size="10">`;
  for (let x = Math.ceil(X0 / 5) * 5; x < X1; x += 5) svg += `<line x1="${T([x, 0])[0]}" y1="0" x2="${T([x, 0])[0]}" y2="${H}" stroke="#d8cfbd" stroke-width="${x % 10 ? 0.5 : 1}"/>${x % 10 ? '' : `<text x="${+T([x, 0])[0] + 2}" y="${H - 4}" fill="#9a8f7a">X ${x}</text>`}`;
  for (let d = Math.ceil(D0 / 5) * 5; d < D1; d += 5) svg += `<line x1="0" y1="${T([0, d])[1]}" x2="${W}" y2="${T([0, d])[1]}" stroke="#d8cfbd" stroke-width="${d % 10 ? 0.5 : 1}"/>${d % 10 ? '' : `<text x="3" y="${+T([0, d])[1] - 2}" fill="#9a8f7a">D ${d}</text>`}`;
  const C = { ...COLOR, road: '#8a7a5a', figure: '#d0103a', building: '#7b3fa8', structure: '#9b59b6', tree: '#1e8c3a', water: '#1a6fd1', prop: '#1689b0', vehicle: '#b08a00', animal: '#c96a00' };
  const order = ['water', 'grd', 'road', 'building', 'structure', 'tree', 'prop', 'vehicle', 'animal', 'figure'];
  for (const kind of order) for (const e of ents.filter((x) => x.kind === kind)) {
    const c = C[kind];
    if (e.footprint) svg += `<polygon points="${e.footprint.map((p) => T(p).join(',')).join(' ')}" fill="${c}" fill-opacity="0.15" stroke="${c}" stroke-width="1.5"/>`;
    for (const [role, ln] of Object.entries(e.lines || {})) svg += `<polyline points="${ln.map((p) => T(p).join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="${role === 'centre' ? 1 : 2}"${role === 'centre' ? ' stroke-dasharray="6 4"' : ''}/>`;
    if (kind === 'tree' && e.pos) svg += `<circle cx="${T(e.pos)[0]}" cy="${T(e.pos)[1]}" r="${Math.max(3, ((e.crown_m || 4) / 2) * k * 0.5)}" fill="${c}" fill-opacity="0.12" stroke="${c}"/><circle cx="${T(e.pos)[0]}" cy="${T(e.pos)[1]}" r="2.5" fill="${c}"/>`;
    if (['figure', 'prop'].includes(kind) && e.pos) {
      const [x, y] = T(e.pos);
      svg += `<circle cx="${x}" cy="${y}" r="3.2" fill="${e.est?.length ? 'none' : c}" stroke="${c}" stroke-width="1.3"/>`;
      if (e.facing_deg != null) { const a = (e.facing_deg * Math.PI) / 180; svg += `<line x1="${x}" y1="${y}" x2="${+x + 8 * Math.cos(a)}" y2="${+y - 8 * Math.sin(a)}" stroke="${c}" stroke-width="1.3"/>`; }
    }
    if (['animal', 'vehicle'].includes(kind)) { const a = e.pts.fore || e.pts.front, b = e.pts.hind || e.pts.rear; svg += `<line x1="${T(a)[0]}" y1="${T(a)[1]}" x2="${T(b)[0]}" y2="${T(b)[1]}" stroke="${c}" stroke-width="3"/>`; }
    if (e.pos && kind !== 'road') { const [x, y] = T(e.pos); svg += `<text x="${+x + 4}" y="${+y - 3}" fill="${c}" font-size="${['building', 'structure', 'water'].includes(kind) ? 12 : 8.5}">${e.id.split('.').slice(2).join('.')}</text>`; }
  }
  if (doc.datum) { const [x, y] = T(doc.datum.pos); svg += `<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="#000" stroke-width="2"/><text x="${+x + 8}" y="${+y + 14}" font-size="12" font-weight="bold">datum (station 0)</text>`; }
  svg += `<text x="10" y="18" font-size="15" font-weight="bold">${S} ${SEC.name}: plan from the strokes (X east →, D north ↑, 5 m grid)</text></g></svg>`;
  const out = r(`${GEN}/plan.jpg`);
  await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(out);
  console.log(out, `${W}x${H}`);
}

async function all() { if (!check()) return; fit(); world(); text(); await plan(); await overlay(); }

const steps = { overlay, merge, check, fit, world, text, plan, all };
if (!steps[cmd]) { console.error(`commands: ${Object.keys(steps).join(', ')}`); process.exit(1); }
await steps[cmd]();
