#!/usr/bin/env node
// Scroll-section pipeline: restyle one section of the scroll into our art style, keeping the
// scroll's positions as ground truth.
//
//   node tools/scroll_pipeline.mjs <section> [status|cut|restyle|check|stitch|all] [options]
//   node tools/scroll_pipeline.mjs <section> snapshot <label>   keep this run's review files for A/B
//   node tools/scroll_pipeline.mjs <section> figures            figures.json -> world positions + marker sheets
//     --only overview,t_r0c1   limit restyle/check to these units
//     --force                  regenerate even when up to date
//     --dry-run                show what restyle would run, call nothing
//     --jobs N                 parallel image jobs (default 3)
//
// A section is sections/<name>/section.json (scan rect, model, prompts, tile grid). Its units:
//   overview   the whole section, restyled once; sets colours and interpretation for the tiles
//   t_rRcC     tiles, the smallest unit; each gets [scroll tile, overview crop, style image]
// Every unit is cached by a key over its prompt text, model, size and reference-image hashes.
// Editing a prompt file, the style image or the section config regenerates exactly the units
// that depend on it; a new overview makes every tile stale.
//
// Prompts are prompts/<name>.txt; {other} inside a prompt is replaced by prompts/other.txt.
// Outputs go to gen/sections/<name>/: src/ (cut inputs), <unit>_0.png (raw restyle),
// <unit>_reg.png (registered onto the scroll), check/, mosaic.jpg.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const r = (p) => path.join(ROOT, p);

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const [name, step = 'status', label] = args.filter((a, i) => !a.startsWith('--') && !['--only', '--jobs'].includes(args[i - 1]));
if (!name) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 20).join('\n')); process.exit(1); }

const cfg = JSON.parse(fs.readFileSync(r(`sections/${name}/section.json`), 'utf8'));
const OUT = `gen/sections/${name}`;
const only = opt('--only') ? new Set(opt('--only').split(',')) : null;
const [SX, SY, W, H] = cfg.rect;
const sizeOf = (s) => s.split('x').map(Number);
for (const d of ['src', 'check']) fs.mkdirSync(r(`${OUT}/${d}`), { recursive: true });

// ---- units ----------------------------------------------------------------------------
function tileGrid() {
  const { src, overlap } = cfg.tiles, stride = src - overlap;
  // fewest tiles with at least `overlap`, spread evenly so no tile is wasted at the far edge
  const pos = (len) => { const n = len <= src ? 1 : Math.ceil((len - src) / stride) + 1; return [...Array(n)].map((_, i) => n === 1 ? 0 : Math.round(i * (len - src) / (n - 1))); };
  const ys = pos(H), xs = pos(W);
  return ys.flatMap((y, ri) => xs.map((x, ci) => ({ id: `t_r${ri}c${ci}`, x, y, w: src, h: src, row: ri, col: ci })));
}
const tiles = tileGrid();
const overview = { id: 'overview', x: 0, y: 0, w: W, h: H };
const units = [overview, ...tiles];
const outPng = (u) => `${OUT}/${u.id}_0.png`;
const srcJpg = (u) => `${OUT}/src/${u.id}.jpg`;
const ovCrop = (u) => `${OUT}/src/${u.id}_ov.jpg`;
const regPng = (u) => `${OUT}/${u.id}_reg.png`;

function prompt(pname, seen = new Set()) {
  if (seen.has(pname)) throw new Error(`prompt loop at ${pname}`);
  const text = fs.readFileSync(r(`prompts/${pname}.txt`), 'utf8').trim();
  return text.replace(/\{(\w+)\}/g, (m, k) => fs.existsSync(r(`prompts/${k}.txt`)) ? prompt(k, new Set([...seen, pname])) : m);
}
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
function job(u) {
  const isOv = u.id === 'overview', spec = isOv ? cfg.overview : cfg.tiles;
  const refs = isOv ? [srcJpg(u), cfg.style_image] : [srcJpg(u), ovCrop(u), cfg.style_image];
  const body = { prompt: prompt(spec.prompt), model: spec.model || cfg.model, size: spec.size, quality: spec.quality || 'auto' };
  const key = refs.every((p) => fs.existsSync(r(p)))
    ? sha(JSON.stringify({ ...body, refs: refs.map((p) => sha(fs.readFileSync(r(p)))) })) : null;
  return { u, refs, body, key };
}
const keyFile = (u) => `${OUT}/${u.id}.key`;
function state(u) {
  const j = job(u);
  if (!fs.existsSync(r(outPng(u)))) return 'missing';
  if (!j.key) return 'stale (inputs not cut)';
  return fs.existsSync(r(keyFile(u))) && fs.readFileSync(r(keyFile(u)), 'utf8') === j.key ? 'ok' : 'stale';
}

// ---- steps ----------------------------------------------------------------------------
const scan = () => sharp(r(cfg.scan), { limitInputPixels: false });

async function cut() {
  const [ow, oh] = sizeOf(cfg.overview.size);
  await scan().extract({ left: SX, top: SY, width: W, height: H }).resize(ow, oh, { fit: 'fill' }).jpeg({ quality: 92 }).toFile(r(srcJpg(overview)));
  for (const t of tiles) await scan().extract({ left: SX + t.x, top: SY + t.y, width: t.w, height: t.h }).jpeg({ quality: 92 }).toFile(r(srcJpg(t)));
  console.log(`cut overview + ${tiles.length} tiles from scan rect ${cfg.rect.join(',')}`);
}

// The overview crop under each tile, so tiles inherit the overview's colours.
async function cutOverviewCrops() {
  const ov = r(outPng(overview)), m = await sharp(ov).metadata(), k = m.width / W;
  for (const t of tiles) {
    await sharp(ov).extract({ left: Math.round(t.x * k), top: Math.round(t.y * k), width: Math.round(t.w * k), height: Math.round(t.h * k) })
      .resize(t.w, t.h).jpeg({ quality: 92 }).toFile(r(ovCrop(t)));
  }
}

function runBatch(list, label) {
  if (!list.length) return;
  const file = `${OUT}/jobs_${label}.jsonl`;
  fs.writeFileSync(r(file), list.map((j) => JSON.stringify({ out: `${OUT}/${j.u.id}`, ref: j.refs, format: 'png', ...j.body })).join('\n') + '\n');
  const mtime = (j) => fs.existsSync(r(outPng(j.u))) ? fs.statSync(r(outPng(j.u))).mtimeMs : 0;
  const before = list.map(mtime);
  const p = spawnSync('python3', ['-I', 'tools/shyfai_image.py', '--batch', file, '--jobs', opt('--jobs', '3'), '--timeout', '900'], { cwd: ROOT, stdio: 'inherit' });
  list.forEach((j, i) => { if (mtime(j) > before[i]) fs.writeFileSync(r(keyFile(j.u)), j.key); });
  if (p.status) console.log(`some ${label} jobs failed; rerun restyle to retry only those`);
}

async function restyle() {
  if (!fs.existsSync(r(srcJpg(overview)))) await cut();
  const want = (u) => (!only || only.has(u.id)) && (flag('--force') || state(u) !== 'ok');
  const ovJobs = want(overview) ? [job(overview)] : [];
  if (flag('--dry-run')) {
    console.log('would run:', [...ovJobs.map((j) => j.u.id), ...tiles.filter(want).map((t) => t.id + (ovJobs.length ? ' (after overview)' : ''))].join(' ') || 'nothing');
    return;
  }
  runBatch(ovJobs, 'overview');
  if (!fs.existsSync(r(outPng(overview)))) { console.log('no overview yet; tiles need it'); return; }
  await cutOverviewCrops();
  runBatch(tiles.filter(want).map(job), 'tiles');
}

// ---- registration ---------------------------------------------------------------------
// The image model returns each unit slightly zoomed and shifted. register() finds the per-axis
// scale and shift that best map the restyle onto its scroll input (correlation of edge maps,
// coarse-to-fine search) and writes <unit>_reg.png: the restyle resampled into the scroll's
// frame. check and stitch use the registered images, so the mosaic overlays the scan.
async function edges(p, w, h) {
  const { data } = await sharp(p).resize(w, h, { fit: 'fill' }).greyscale().blur(1.2).raw().toBuffer({ resolveWithObject: true });
  const e = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x; e[i] = Math.hypot(data[i + 1] - data[i - 1], data[i + w] - data[i - w]);
  }
  return e;
}
// Correlation of edge map a with edge map b sampled through the transform, in normalised
// coordinates u = 0.5 + sx * (x - 0.5) + dx, over the pixels that land inside b.
function ncc(a, b, w, h, [sx, sy, dx, dy]) {
  let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let y = 0; y < h; y++) {
    const v = Math.round((0.5 + sy * ((y + 0.5) / h - 0.5) + dy) * h - 0.5);
    if (v < 0 || v >= h) continue;
    for (let x = 0; x < w; x++) {
      const u = Math.round((0.5 + sx * ((x + 0.5) / w - 0.5) + dx) * w - 0.5);
      if (u < 0 || u >= w) continue;
      const p = a[y * w + x], q = b[v * w + u];
      n++; sa += p; sb += q; saa += p * p; sbb += q * q; sab += p * q;
    }
  }
  if (n < w * h * 0.6) return -1;
  return (sab - sa * sb / n) / Math.sqrt((saa - sa * sa / n) * (sbb - sb * sb / n));
}
const range = (c, half, step) => { const out = []; for (let v = c - half; v <= c + half + 1e-9; v += step) out.push(v); return out; };
function search(a, b, w, h, grid) {
  let best = { t: [1, 1, 0, 0], s: -2 };
  for (const t of grid) { const s = ncc(a, b, w, h, t); if (s > best.s) best = { t, s }; }
  return best;
}

async function register(u) {
  const out = r(outPng(u)), reg = r(regPng(u)), meta = r(`${OUT}/${u.id}.align.json`);
  if (fs.existsSync(meta) && fs.existsSync(reg) && fs.statSync(meta).mtimeMs > fs.statSync(out).mtimeMs) return JSON.parse(fs.readFileSync(meta, 'utf8'));
  const aspect = u.h / u.w;
  let w = 128, h = Math.round(128 * aspect);
  let [ea, eb] = [await edges(r(srcJpg(u)), w, h), await edges(out, w, h)];
  const coarse = [];
  for (const s of range(1, 0.1, 0.01)) for (const dx of range(0, 0.1, 1 / w)) for (const dy of range(0, 0.1, 1 / h)) coarse.push([s, s, dx, dy]);
  let best = search(ea, eb, w, h, coarse);
  w = 256; h = Math.round(256 * aspect);
  [ea, eb] = [await edges(r(srcJpg(u)), w, h), await edges(out, w, h)];
  const [s0x, s0y, d0x, d0y] = best.t, fine = [];
  for (const sx of range(s0x, 0.015, 0.005)) for (const sy of range(s0y, 0.015, 0.005))
    for (const dx of range(d0x, 3 / w, 1 / w)) for (const dy of range(d0y, 3 / h, 1 / h)) fine.push([sx, sy, dx, dy]);
  best = search(ea, eb, w, h, fine);
  const before = ncc(ea, eb, w, h, [1, 1, 0, 0]);
  // resample the restyle into the scroll frame at full resolution (bilinear, edges clamped)
  const { data, info } = await sharp(out).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const OW = info.width, OH = info.height, C = info.channels, dst = Buffer.alloc(OW * OH * C), [sx, sy, dx, dy] = best.t;
  for (let y = 0; y < OH; y++) {
    const fv = Math.min(OH - 1, Math.max(0, (0.5 + sy * ((y + 0.5) / OH - 0.5) + dy) * OH - 0.5)), v0 = Math.floor(fv), v1 = Math.min(OH - 1, v0 + 1), tv = fv - v0;
    for (let x = 0; x < OW; x++) {
      const fu = Math.min(OW - 1, Math.max(0, (0.5 + sx * ((x + 0.5) / OW - 0.5) + dx) * OW - 0.5)), u0 = Math.floor(fu), u1 = Math.min(OW - 1, u0 + 1), tu = fu - u0;
      const i00 = (v0 * OW + u0) * C, i01 = (v0 * OW + u1) * C, i10 = (v1 * OW + u0) * C, i11 = (v1 * OW + u1) * C, o = (y * OW + x) * C;
      for (let c = 0; c < C; c++) dst[o + c] = Math.round((data[i00 + c] * (1 - tu) + data[i01 + c] * tu) * (1 - tv) + (data[i10 + c] * (1 - tu) + data[i11 + c] * tu) * tv);
    }
  }
  await sharp(dst, { raw: { width: OW, height: OH, channels: C } }).png().toFile(reg);
  const res = { t: best.t, scale: [sx, sy].map((v) => +v.toFixed(3)), shift_px: [Math.round(dx * u.w), Math.round(dy * u.h)], align_before: +before.toFixed(3), align_after: +best.s.toFixed(3) };
  fs.writeFileSync(meta, JSON.stringify(res) + '\n');
  return res;
}

async function check() {
  const S = 768, rows = [];
  for (const u of units.filter((u) => (!only || only.has(u.id)) && fs.existsSync(r(outPng(u))))) {
    const a = await register(u);
    const h = Math.round(S * u.h / u.w), src = await sharp(r(srcJpg(u))).resize(S, h, { fit: 'fill' }).toBuffer();
    const out = await sharp(r(regPng(u))).resize(S, h, { fit: 'fill' }).toBuffer();
    const blend = await sharp(src).composite([{ input: await sharp(out).ensureAlpha(0.5).toBuffer() }]).toBuffer();
    await sharp({ create: { width: S * 3, height: h, channels: 3, background: '#000' } })
      .composite([src, out, blend].map((input, i) => ({ input, left: i * S, top: 0 }))).jpeg({ quality: 85 }).toFile(r(`${OUT}/check/${u.id}.jpg`));
    rows.push(`${u.id.padEnd(9)} align ${a.align_before.toFixed(3)} -> ${a.align_after.toFixed(3)}  scale ${a.scale.join('/')}  shift ${a.shift_px.join(',')}px  ${state(u)}`);
  }
  console.log(rows.join('\n') || 'nothing restyled yet');
  console.log(`sheets (scroll | registered restyle | 50% overlay): ${OUT}/check/`);
}

// Registered tiles back at scan positions, feathered across overlaps, at the tiles' output scale.
async function stitch() {
  const done = tiles.filter((t) => fs.existsSync(r(outPng(t))));
  if (done.length < tiles.length) console.log(`stitching ${done.length}/${tiles.length} tiles; missing ones show the overview`);
  for (const u of [overview, ...done].filter((u) => fs.existsSync(r(outPng(u))))) await register(u);
  const k = sizeOf(cfg.tiles.size)[0] / cfg.tiles.src, ramp = Math.round(cfg.tiles.overlap * k);
  const CW = Math.round(W * k), CH = Math.round(H * k);
  const base = fs.existsSync(r(regPng(overview))) ? await sharp(r(regPng(overview))).resize(CW, CH, { fit: 'fill' }).toBuffer()
    : await sharp({ create: { width: CW, height: CH, channels: 3, background: '#000' } }).png().toBuffer();
  const layers = [];
  for (const t of done) {
    // feather toward earlier neighbours, and drop the clamped strip that registration pulled in
    const [sx, sy, dx, dy] = (await register(t)).t, inside = (v) => v >= 0 && v <= 1;
    const tw = Math.round(t.w * k), th = Math.round(t.h * k), a = Buffer.alloc(tw * th);
    for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
      const valid = inside(0.5 + sx * ((x + 0.5) / tw - 0.5) + dx) && inside(0.5 + sy * ((y + 0.5) / th - 0.5) + dy);
      const fx = t.col > 0 ? Math.min(1, x / ramp) : 1, fy = t.row > 0 ? Math.min(1, y / ramp) : 1;
      a[y * tw + x] = valid ? Math.round(255 * Math.min(fx, fy)) : 0;
    }
    const rgb = await sharp(r(regPng(t))).resize(tw, th, { fit: 'fill' }).removeAlpha().toBuffer();
    layers.push({ input: await sharp(rgb).joinChannel(a, { raw: { width: tw, height: th, channels: 1 } }).png().toBuffer(), left: Math.round(t.x * k), top: Math.round(t.y * k) });
  }
  await sharp(base).composite(layers).jpeg({ quality: 92 }).toFile(r(`${OUT}/mosaic.jpg`));
  await sharp(r(`${OUT}/mosaic.jpg`)).resize(2400).jpeg({ quality: 85 }).toFile(r(`${OUT}/mosaic_view.jpg`));
  console.log(`${OUT}/mosaic.jpg  ${CW}x${CH}  (${k}x the scan; scan x = ${SX} + px/${k}, scan y = ${SY} + py/${k})`);
}

// Figures (sections/<name>/figures.json): picture positions -> ground positions through the section's
// oblique projection, written to figures_world.json for the Blender builder, plus review sheets with each
// figure's foot, head and facing drawn on the scroll and on the registered mosaic.
async function figures() {
  const f = JSON.parse(fs.readFileSync(r(`sections/${name}/figures.json`), 'utf8')), P = f.projection;
  const [cu, cv] = P.depth_px_per_m, kx = P.px_per_m_x, kh = P.px_per_m_height;
  const world = f.figures.map((g) => {
    const H = g.support_height_m || 0, D = (g.foot[1] - P.origin_v + kh * H) / cv, X = (g.foot[0] - P.origin_u - cu * D) / kx;
    return { id: g.id, X: +X.toFixed(2), D: +D.toFixed(2), H, pose: g.pose, facing_deg: g.facing_deg, support: g.support };
  });
  fs.writeFileSync(r(`${OUT}/figures_world.json`), JSON.stringify({ projection: P, figures: world }, null, 1) + '\n');
  const mark = (g, x0, y0, z) => {
    const p = ([u, v]) => [(u - x0) * z, (v - y0) * z], [fx, fy] = p(g.foot), [hx, hy] = p(g.head);
    const a = g.facing_deg * Math.PI / 180, dx = kx * Math.cos(a) + cu * Math.sin(a), dy = cv * Math.sin(a), n = Math.hypot(dx, dy), L = 45 * z;
    const ax = fx + dx / n * L, ay = fy + dy / n * L;
    return `<line x1="${hx}" y1="${hy}" x2="${fx}" y2="${fy}" stroke="#ff2d55" stroke-width="${z}" stroke-dasharray="${3 * z}"/>` +
      `<circle cx="${fx}" cy="${fy}" r="${5 * z}" fill="none" stroke="#ff2d55" stroke-width="${1.5 * z}"/><circle cx="${hx}" cy="${hy}" r="${2.5 * z}" fill="#ff2d55"/>` +
      `<line x1="${fx}" y1="${fy}" x2="${ax}" y2="${ay}" stroke="#00e5ff" stroke-width="${2 * z}"/><circle cx="${ax}" cy="${ay}" r="${3 * z}" fill="#00e5ff"/>` +
      `<text x="${fx + 8 * z}" y="${fy + 16 * z}" font-size="${11 * z}" font-family="monospace" fill="#fff" stroke="#000" stroke-width="${0.5 * z}">${g.id}</text>`;
  };
  const Z = 2.5, rows = [];
  for (const g of f.figures) {
    const half = Math.max(110, Math.abs(g.foot[1] - g.head[1]) * 0.85), cx = (g.foot[0] + g.head[0]) / 2, cy = (g.foot[1] + g.head[1]) / 2;
    const x0 = Math.round(Math.max(SX, cx - half)), y0 = Math.round(Math.max(SY, cy - half));
    const w = Math.round(Math.min(SX + W, cx + half) - x0), h = Math.round(Math.min(SY + H, cy + half) - y0);
    const svg = Buffer.from(`<svg width="${w * Z}" height="${h * Z}" xmlns="http://www.w3.org/2000/svg">${mark(g, x0, y0, Z)}</svg>`);
    const a = await scan().extract({ left: x0, top: y0, width: w, height: h }).resize(Math.round(w * Z), Math.round(h * Z)).composite([{ input: svg }]).toBuffer();
    const b = await sharp(r(`${OUT}/mosaic.jpg`), { limitInputPixels: false }).extract({ left: (x0 - SX) * 2, top: (y0 - SY) * 2, width: w * 2, height: h * 2 })
      .resize(Math.round(w * Z), Math.round(h * Z)).composite([{ input: svg }]).toBuffer();
    rows.push({ a, b, w: Math.round(w * Z), h: Math.round(h * Z) });
  }
  const RW = Math.max(...rows.map((q) => q.w)) * 2 + 8, RH = rows.reduce((s, q) => s + q.h + 8, 0);
  let y = 0; const comp = [];
  for (const q of rows) { comp.push({ input: q.a, left: 0, top: y }, { input: q.b, left: q.w + 8, top: y }); y += q.h + 8; }
  await sharp({ create: { width: RW, height: RH, channels: 3, background: '#111' } }).composite(comp).jpeg({ quality: 86 }).toFile(r(`${OUT}/check/figures.jpg`));
  const VW = 2400, vz = VW / W;
  const svg = Buffer.from(`<svg width="${VW}" height="${Math.round(H * vz)}" xmlns="http://www.w3.org/2000/svg">${f.figures.map((g) => mark(g, SX, SY, vz * 2.2).replace(/(x|y|cx|cy|x1|y1|x2|y2)="([\d.-]+)"/g, (m, k, v) => `${k}="${(+v / 2.2).toFixed(1)}"`)).join('')}</svg>`);
  await sharp(r(`${OUT}/mosaic.jpg`), { limitInputPixels: false }).resize(VW).composite([{ input: svg }]).jpeg({ quality: 86 }).toFile(r(`${OUT}/check/figures_overview.jpg`));
  for (const g of world) console.log(`${g.id.padEnd(17)} X ${String(g.X).padStart(7)} m  D ${String(g.D).padStart(6)} m  H ${g.H} m  ${g.pose}, facing ${g.facing_deg}°`);
  console.log(`${OUT}/figures_world.json, check/figures.jpg (scroll | restyle per figure), check/figures_overview.jpg`);
}

// Copy the light review files of the current run (overview, mosaic preview, check sheets, the
// exact prompts sent, alignment) to runs/<label>/, so a prompt change can be compared with it.
function snapshot() {
  if (!label) { console.log('snapshot needs a label'); process.exit(1); }
  const dst = r(`${OUT}/runs/${label}`);
  fs.mkdirSync(path.join(dst, 'check'), { recursive: true });
  const files = fs.readdirSync(r(OUT)).filter((f) => /^(overview_0\.png|mosaic_view\.jpg|jobs_.*\.jsonl|.*\.align\.json)$/.test(f));
  for (const f of files) fs.copyFileSync(r(`${OUT}/${f}`), path.join(dst, f));
  for (const f of fs.readdirSync(r(`${OUT}/check`))) fs.copyFileSync(r(`${OUT}/check/${f}`), path.join(dst, 'check', f));
  console.log(`snapshot ${OUT}/runs/${label}: ${files.length} files + check sheets`);
}

function status() {
  console.log(`${name}: ${cfg.title}\nscan rect ${cfg.rect.join(',')}, ${tiles.length} tiles of ${cfg.tiles.src}px (overlap ${cfg.tiles.overlap}), model ${cfg.model}`);
  for (const u of units) console.log(`  ${u.id.padEnd(9)} ${state(u)}`);
}

const steps = { status, snapshot, figures, cut, restyle, check, stitch, all: async () => { await cut(); await restyle(); await check(); await stitch(); } };
if (!steps[step]) { console.log(`unknown step ${step}`); process.exit(1); }
await steps[step]();
