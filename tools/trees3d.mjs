#!/usr/bin/env node
// The 3D trees (gen/details/trees/method.md): every mapped tree keeps its painted card as the far level of detail and
// gets, near, a real trunk and limbs plus a crown of painted clumps that sway in the wind (web/src/trees3d.js).
// One small step per command; each caches by its inputs, so a rerun does only what changed. --only a,b narrows any step.
//   status    what each Meshy variant has (bare painting, meshes) and each clump sheet
//   bare      shyfai: the card's bare framework (trunk, limbs, heads; no shoots)  -> gen/details/trees/bare/<card>/
//   clumps    shyfai: a sheet of four painted clumps per sheet in trees3d.json   -> gen/details/trees/clumps/<sheet>/
//   meshy     Meshy image-to-3D of each keyed bare painting (15 credits each, logged in
//             gen/expand/round2/workshop_logs/credits.log); needs --go           -> gen/details/trees/meshy/<card>/<key>/
//   convert   Blender (blender/trees3d_convert.py, a Blender slot): weld, decimate, real height (the bare painting's
//             scale fitted to its card on the trunk's width where the form says fit_scale), limb ends, corner UVs
//                                                                                 -> gen/details/trees/build/<card>_trunk.json
//   proc      wood from the card's own strokes for the thin forms (tools/lib/trees3d_proc.mjs)
//   atlas     the clump sheets keyed and cut into the 2048 px crown atlas         -> web/public/assets/trees3d/crowns.webp
//   bark      the Meshy textures into the 2048 px bark atlas                      -> web/public/assets/trees3d/bark.webp
//   build     wood + crown per card, meshopt GLB                                  -> web/public/assets/trees3d/<card>.glb, trees3d.json
//   look      front and side views of each wood and tree                          -> gen/details/trees/check/
//   check     every mapped tree has its card, its far level and its 3D tree; the atlases' KTX2 copies are current
// After atlas or bark: node tools/ktx2.mjs encode --kind tree --only trees3d (under flock /tmp/qingming_charbuild.lock).
// Config: trees/trees3d.json (forms, sheets, the Meshy request). Prompts: gen/details/trees/prompts/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { keyPaper } from './lib/paper_key.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.join(ROOT, p);
const sharp = createRequire(r('tools/package.json'))('sharp');
sharp.cache(false);
const [step = 'status', ...rest] = process.argv.slice(2);
const flag = (f) => rest.includes(f);
const opt = (f, d) => (rest.includes(f) ? rest[rest.indexOf(f) + 1] : d);
const CFG = JSON.parse(fs.readFileSync(r('trees/trees3d.json'), 'utf8'));
const CARDS = JSON.parse(fs.readFileSync(r('trees/cards.json'), 'utf8'));
const GEN = 'gen/details/trees';
const PR = `${GEN}/prompts`;
const CREDITS = 'gen/expand/round2/workshop_logs/credits.log';
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const only = opt('--only') ? new Set(opt('--only').split(',')) : null;
const read = (p) => fs.readFileSync(r(p), 'utf8');
const stamp = () => new Date().toTimeString().slice(0, 5);

// the raw painted card of a variant (its keyed json names it)
const rawCard = (card) => JSON.parse(read(`gen/trees/keyed/${card}.json`)).stamp.raw;
const sizeOf = async (p) => { const m = await sharp(r(p)).metadata(); return `${m.width}x${m.height}`; };

// every variant of every form with a 3D trunk from Meshy: { card, form, prompt, refs, size, key }
async function bareJobs() {
  const frame = read(`${PR}/bare.txt`).trim(), out = [];
  for (const [form, f] of Object.entries(CFG.forms)) {
    if (f.trunk !== 'meshy') continue;
    const body = read(`${PR}/bare_${form}.txt`).trim();
    for (const n of Object.keys(CARDS.forms[form].variants)) {
      const card = `${form}_${n}`;
      if (only && !only.has(card)) continue;
      const refs = [CFG.style, rawCard(card)];
      const prompt = frame.replace('{FORM}', body);
      const size = await sizeOf(refs[1]);
      const key = sha(JSON.stringify({ prompt, model: CFG.model, size, refs: refs.map((p) => sha(fs.readFileSync(r(p)))), retry: f.retry?.[n] || 0 })).slice(0, 12);
      out.push({ card, form, prompt, refs, size, key, dir: `${GEN}/bare/${card}` });
    }
  }
  return out;
}
// every clump sheet: { sheet, prompt, refs, size, key }
function clumpJobs() {
  const frame = read(`${PR}/clumps.txt`).trim(), out = [];
  for (const [sheet, s] of Object.entries(CFG.sheets)) {
    if (only && !only.has(sheet)) continue;
    const kv = Object.fromEntries(read(`${PR}/clumps_${sheet}.txt`).trim().split(/\n(?=[A-Z]+:)/).map((l) => [l.slice(0, l.indexOf(':')), l.slice(l.indexOf(':') + 1).trim()]));
    const prompt = frame.replace(/\{(\w+)\}/g, (_, k) => kv[k] ?? `{${k}}`);
    const refs = [CFG.style, rawCard(s.card)];
    const key = sha(JSON.stringify({ prompt, model: CFG.model, size: s.size, refs: refs.map((p) => sha(fs.readFileSync(r(p)))), retry: s.retry || 0 })).slice(0, 12);
    out.push({ sheet, prompt, refs, size: s.size, key, dir: `${GEN}/clumps/${sheet}` });
  }
  return out;
}
const rawOf = (j) => `${j.dir}/${j.key}_0.png`;

// shyfai, opaque white; a draw the API cut out itself (soft matte) is set aside and drawn again
async function cutOut(file) {
  const img = sharp(r(file));
  if (!(await img.metadata()).hasAlpha) return false;
  const a = await img.extractChannel(3).raw().toBuffer();
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] < 250) n++;
  return n > a.length * 0.01;
}
async function draw(jobs, what) {
  for (let round = 0; round < 3; round++) {
    for (const j of jobs) if (fs.existsSync(r(rawOf(j))) && (await cutOut(rawOf(j)))) {
      const k = fs.readdirSync(r(j.dir)).filter((f) => f.startsWith(`${j.key}_cutout_`)).length;
      fs.renameSync(r(rawOf(j)), r(`${j.dir}/${j.key}_cutout_${k}.png`));
      console.log(`${j.card || j.sheet}: came back cut out by the API; drawing again`);
    }
    const want = jobs.filter((j) => (flag('--force') && round === 0) || !fs.existsSync(r(rawOf(j))));
    if (!want.length) { console.log(`all ${what} up to date`); return; }
    const file = r(`${GEN}/jobs_${what}.jsonl`);
    fs.writeFileSync(file, want.map((j) => {
      fs.mkdirSync(r(j.dir), { recursive: true });
      fs.writeFileSync(r(`${j.dir}/${j.key}.prompt.txt`), j.prompt + '\n');
      return JSON.stringify({ out: `${j.dir}/${j.key}`, prompt: j.prompt, model: CFG.model, size: j.size, ref: j.refs, extra: { background: 'opaque' } });
    }).join('\n') + '\n');
    console.log(`drawing ${want.length} ${what}: ${want.map((j) => j.card || j.sheet).join(' ')}`);
    spawnSync('python3', ['-I', 'tools/shyfai_image.py', '--batch', file, '--jobs', opt('--jobs', '4'), '--timeout', '900'], { cwd: ROOT, stdio: 'inherit' });
  }
}

// white paper -> alpha (tools/lib/paper_key.mjs, the tree cards' keyer), cached by the raw file's size and mtime
async function keyed(j, kp = {}) {
  const raw = rawOf(j), out = `${j.dir}/${j.key}_keyed.png`, meta = `${j.dir}/${j.key}_keyed.json`;
  const st = fs.statSync(r(raw)), stampK = { raw, bytes: st.size, mtime: Math.round(st.mtimeMs), kp };
  if (fs.existsSync(r(meta)) && fs.existsSync(r(out)) && JSON.stringify(JSON.parse(read(meta)).stamp) === JSON.stringify(stampK)) return { out, meta: JSON.parse(read(meta)) };
  const k = await keyPaper(r(raw), kp);
  await sharp(k.rgba, { raw: { width: k.W, height: k.H, channels: 4 } }).png().toFile(r(out));
  const m = { stamp: stampK, paper: k.paper, size: [k.W, k.H], box: k.box, foot: k.foot };
  fs.writeFileSync(r(meta), JSON.stringify(m, null, 1));
  return { out, meta: m };
}

// ---------------------------------------------------------------- meshy: image-to-3D of the keyed bare painting
async function meshy() {
  for (const j of await bareJobs()) {
    if (!fs.existsSync(r(rawOf(j)))) { console.log(`${j.card}: no bare painting yet`); continue; }
    const { out } = await keyed(j);
    // Meshy reads a picture on white best: the keyed framework laid on white, trimmed to its box with a margin
    const png = await sharp(r(out)).flatten({ background: '#ffffff' }).png().toBuffer();
    const body = { image_url: `data:image/png;base64,${png.toString('base64')}`, ...Object.fromEntries(Object.entries(CFG.meshy).filter(([k]) => k !== 'endpoint')), should_texture: true, target_formats: ['glb'] };
    const bkey = sha(JSON.stringify({ ...body, image_url: sha(png) })).slice(0, 12);
    const dir = `${GEN}/meshy/${j.card}/${bkey}`;
    if (fs.existsSync(r(`${dir}/task.json`)) && JSON.parse(read(`${dir}/task.json`)).status === 'SUCCEEDED') { console.log(`${j.card}: mesh ${bkey} up to date`); continue; }
    if (!flag('--go')) { console.log(`${j.card}: would run Meshy ${CFG.meshy.ai_model} (about 15 credits); add --go`); continue; }
    fs.mkdirSync(r(dir), { recursive: true });
    fs.writeFileSync(r(`${dir}/body.json`), JSON.stringify(body));
    fs.appendFileSync(r(CREDITS), `${stamp()} [trees3d] ${j.card} trunk mesh (Meshy ${CFG.meshy.ai_model} image-to-3d, ~15) start\n`);
    const res = spawnSync('python3', ['-I', 'tools/meshy_task.py', CFG.meshy.endpoint, dir, '@' + r(`${dir}/body.json`)], { cwd: ROOT, stdio: 'inherit' });
    const t = fs.existsSync(r(`${dir}/task.json`)) ? JSON.parse(read(`${dir}/task.json`)) : {};
    fs.appendFileSync(r(CREDITS), `${stamp()} [trees3d] ${j.card} trunk mesh ${t.status || 'FAILED'}: ${t.consumed_credits ?? '?'} credits (task ${t.id || '-'})\n`);
    if (res.status) console.log(`${j.card}: Meshy failed`);
  }
}

// ---------------------------------------------------------------- convert: Meshy GLB -> trunk spec (Blender)
// the trunk's real height: the bare painting's wood (its keyed box) at the card's scale (the card's tree, foot to crown
// top, is the variant's height_m: trees/cards.json)
function cardScale(card) {
  const k = JSON.parse(read(`gen/trees/keyed/${card}.json`));
  const [form, n] = [card.replace(/_\d+$/, ''), card.match(/_(\d+)$/)[1]];
  return CARDS.forms[form].variants[n].height_m / (k.box.y1 - k.box.y0 + 1); // m per px
}
const meshOf = (card) => {
  const md = r(`${GEN}/meshy/${card}`);
  if (!fs.existsSync(md)) return null;
  const k = fs.readdirSync(md).map((d) => ({ d, t: `${md}/${d}/task.json` })).filter((x) => fs.existsSync(x.t) && JSON.parse(fs.readFileSync(x.t, 'utf8')).status === 'SUCCEEDED')
    .sort((a, b) => fs.statSync(b.t).mtimeMs - fs.statSync(a.t).mtimeMs)[0];
  return k ? `${GEN}/meshy/${card}/${k.d}/model_urls_glb.glb` : null;
};
// the solid mask's width per row above the foot (px), from the foot up
async function widthProfile(file) {
  const { data, info } = await sharp(r(file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, rows = [];
  let y1 = -1;
  for (let y = H - 1; y >= 0 && y1 < 0; y--) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 128) { y1 = y; break; }
  for (let y = y1; y >= 0; y--) { let a = -1, b = -1; for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 128) { if (a < 0) a = x; b = x; } rows.push(a < 0 ? 0 : b - a + 1); }
  return rows;
}
// the bare painting's scale against its card: k minimising the trunk widths' difference, card(y) ~ k * bare(y / k),
// over 4-18% of the card's height above the foot
async function fitScale(cardFile, bareFile) {
  const c = await widthProfile(cardFile), b = await widthProfile(bareFile), Hc = c.length;
  let best = 1, err = Infinity;
  for (let k = 0.4; k <= 1.15; k += 0.005) {
    let e = 0, n = 0;
    for (let y = Math.round(0.04 * Hc); y <= Math.round(0.18 * Hc); y++) { const yb = Math.round(y / k); if (yb >= b.length) continue; e += (c[y] - k * b[yb]) ** 2; n++; }
    if (n && e / n < err) { err = e / n; best = k; }
  }
  return +best.toFixed(3);
}
async function convert() {
  fs.mkdirSync(r(`${GEN}/build`), { recursive: true });
  for (const j of await bareJobs()) {
    const glb = meshOf(j.card);
    if (!glb) { console.log(`${j.card}: no Meshy mesh yet`); continue; }
    const { meta, out: keyedBare } = await keyed(j);
    // the bare painting may be drawn at another scale than its card (without their whips, the pollard willows came
    // back up to twice as wide): where the form's foliage stays clear of the foot, the scale is fitted on the trunk's
    // width just above the foot (fitScale)
    const k = CFG.forms[j.form].fit_scale ? await fitScale(`gen/trees/keyed/${j.card}.png`, keyedBare) : 1;
    const H = +((meta.box.y1 - meta.box.y0 + 1) * cardScale(j.card) * k).toFixed(3);
    const tris = CFG.forms[j.form].trunk_tris || 2000;
    const out = `${GEN}/build/${j.card}_trunk.json`;
    const want = { glb, H, k, tris, script: sha(fs.readFileSync(r('blender/trees3d_convert.py'))).slice(0, 12) };
    const stampF = `${out}.stamp`;
    if (!flag('--force') && fs.existsSync(r(out)) && fs.existsSync(r(stampF)) && read(stampF) === JSON.stringify(want)) { console.log(`${j.card}: trunk up to date`); continue; }
    const res = spawnSync('tools/blender_slot.sh', ['-b', '--factory-startup', '--python', r('blender/trees3d_convert.py'), '--', r(glb), r(out), String(H), String(tris)], { cwd: ROOT, encoding: 'utf8' });
    const line = (res.stdout || '').split('\n').find((l) => l.startsWith('TREES3D_CONVERT'));
    if (!line || !fs.existsSync(r(out))) { console.log(`${j.card}: convert failed\n${(res.stdout || '').slice(-1500)}\n${(res.stderr || '').slice(-1500)}`); continue; }
    fs.writeFileSync(r(stampF), JSON.stringify(want));
    console.log(`${j.card}: scale ${k}, ${line.replace('TREES3D_CONVERT ', '')}`);
  }
}

// ---------------------------------------------------------------- atlas: the clump sheets keyed and cut into cells
// Each sheet (four clumps in a 2 x 2 grid on white) is keyed to alpha (the cards' keyer) and its quarters become cells
// of the one crown atlas (2048 px square, 6 x 6 cells of 340 px; 8 sheets = 32 cells). Per cell: its rect, the clump's
// root (where its shoots spring: the centre of its lowest solid pixels; of its highest for a hanging sheet; its middle
// for a round leaf cluster), which way it grows, and a tight convex outline round its solid pixels (less overdraw).
const ATLAS_DIR = 'web/public/assets/trees3d';
const CELL = 340, GRID = 6, ATLAS = 2048;
function hull(pts) { // monotone chain, pts [[x, y]]
  pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of pts.slice().reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
// a convex polygon of at most `max` corners that contains the hull: drop the corner whose removal (its two neighbours'
// edges extended to meet) adds the least area, while the extension stays within the cell
function fewer(poly, max, box) {
  poly = poly.slice();
  const meet = (a, b, c, d) => {
    const r1 = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r1[0] * s[1] - r1[1] * s[0];
    if (Math.abs(den) < 1e-9) return null;
    const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
    return [a[0] + t * r1[0], a[1] + t * r1[1]];
  };
  const inBox = (p) => p[0] >= box[0] && p[0] <= box[2] && p[1] >= box[1] && p[1] <= box[3];
  while (poly.length > max) {
    let best = null;
    for (let i = 0; i < poly.length; i++) {
      const n = poly.length, a = poly[(i - 2 + n) % n], b = poly[(i - 1 + n) % n], c = poly[(i + 1) % n], d = poly[(i + 2) % n];
      const q = meet(a, b, d, c);
      if (!q || !inBox(q)) continue;
      const tri = (p1, p2, p3) => Math.abs((p1[0] * (p2[1] - p3[1]) + p2[0] * (p3[1] - p1[1]) + p3[0] * (p1[1] - p2[1])) / 2);
      const area = tri(b, poly[i], q) + tri(poly[i], c, q);
      if (!best || area < best.area) best = { i, q, area };
    }
    if (!best) break;
    const n = poly.length, ib = (best.i - 1 + n) % n, ic = (best.i + 1) % n;
    const keep = poly.filter((_, k) => k !== ib && k !== best.i && k !== ic);
    keep.splice(keep.indexOf(poly[(best.i - 2 + n) % n]) + 1, 0, best.q);
    poly = keep;
  }
  return poly;
}
async function atlas() {
  const cells = [], comps = [];
  for (const [si, j] of clumpJobs().entries()) {
    if (!fs.existsSync(r(rawOf(j)))) { console.log(`sheet ${j.sheet}: not drawn`); continue; }
    const rootRule = CFG.sheets[j.sheet].root || 'bottom';
    const { out } = await keyed(j);
    const m = await sharp(r(out)).metadata();
    const qw = m.width / 2, qh = m.height / 2, S = CELL;
    for (let q = 0; q < 4; q++) {
      const buf = await sharp(r(out)).extract({ left: (q % 2) * qw, top: Math.floor(q / 2) * qh, width: qw, height: qh }).resize(S, S).raw().toBuffer();
      const k = si * 4 + q, ax = (k % GRID) * (ATLAS / GRID | 0), ay = Math.floor(k / GRID) * (ATLAS / GRID | 0);
      comps.push({ input: buf, raw: { width: S, height: S, channels: 4 }, left: ax, top: ay });
      const pts = [];
      let y0 = S, y1 = 0, cx = 0, cy = 0;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (buf[(y * S + x) * 4 + 3] >= 64) { pts.push([x, y]); y0 = Math.min(y0, y); y1 = Math.max(y1, y); cx += x; cy += y; }
      let root, grow;
      if (rootRule === 'top') { const t = pts.filter((p) => p[1] <= y0 + 5); root = [t.reduce((a, p) => a + p[0], 0) / t.length, y0]; grow = 'down'; }
      else if (rootRule === 'centre') { root = [cx / pts.length, cy / pts.length]; grow = 'centre'; }
      else { const t = pts.filter((p) => p[1] >= y1 - 5); root = [t.reduce((a, p) => a + p[0], 0) / t.length, y1]; grow = 'up'; }
      const h = hull(pts.flatMap(([x, y]) => [[x - 1.5, y - 1.5], [x + 2.5, y - 1.5], [x - 1.5, y + 2.5], [x + 2.5, y + 2.5]]).map(([x, y]) => [Math.max(0, Math.min(S, x)), Math.max(0, Math.min(S, y))]));
      const poly = fewer(h, 8, [0, 0, S, S]);
      const area = Math.abs(poly.reduce((a, p, i) => a + p[0] * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * p[1], 0) / 2);
      cells.push({ sheet: j.sheet, q, rect: [ax, ay, S, S], root: root.map((v) => +v.toFixed(1)), grow, poly: poly.map(([x, y]) => [+x.toFixed(1), +y.toFixed(1)]), fill: +(pts.length / area).toFixed(3), area: +(area / (S * S)).toFixed(3) });
    }
  }
  fs.mkdirSync(r(ATLAS_DIR), { recursive: true });
  const png = await sharp({ create: { width: ATLAS, height: ATLAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comps).png().toBuffer();
  // under the clear pixels, the colour of the clumps nearby (mipmaps never pull black into the edges): a blur of the
  // premultiplied colour, divided back by the blurred alpha
  const { data } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const pm = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) { const a = data[i + 3] / 255; pm[i] = data[i] * a; pm[i + 1] = data[i + 1] * a; pm[i + 2] = data[i + 2] * a; pm[i + 3] = data[i + 3]; }
  const bl = await sharp(pm, { raw: { width: ATLAS, height: ATLAS, channels: 4 } }).blur(6).raw().toBuffer();
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] < 8 && bl[i + 3] > 0) { const a = bl[i + 3] / 255; data[i] = Math.min(255, bl[i] / a); data[i + 1] = Math.min(255, bl[i + 1] / a); data[i + 2] = Math.min(255, bl[i + 2] / a); }
  const png2 = await sharp(data, { raw: { width: ATLAS, height: ATLAS, channels: 4 } }).png().toBuffer();
  fs.mkdirSync(r(`${GEN}/build`), { recursive: true });
  fs.writeFileSync(r(`${GEN}/build/crowns.png`), png2);
  await sharp(png2).webp({ quality: 90, alphaQuality: 100, exact: true, effort: 6 }).toFile(r(`${ATLAS_DIR}/crowns.webp`));
  fs.writeFileSync(r(`${GEN}/build/cells.json`), JSON.stringify({ size: [ATLAS, ATLAS], cells }, null, 1));
  console.log(`atlas ${ATLAS}x${ATLAS}, ${cells.length} cells, ${(fs.statSync(r(`${ATLAS_DIR}/crowns.webp`)).size / 1024).toFixed(0)} KB webp; outlines ${cells.map((c) => `${c.sheet}${c.q}:${c.poly.length}v ${Math.round(c.area * 100)}%`).join(', ')}`);
}

// ---------------------------------------------------------------- bark: the Meshy trunks' painted textures in one atlas
// (2048 px square, ETC1S: opaque): 512 px slots for the big willows (their burls, hollows and bark are what the eye goes
// to), 256 px for the elms and pines, and a white slot for wood that keeps its vertex colours (the card-built wood)
const BARK_BIG = new Set(['willow_burl', 'willow_weep', 'willow_fan']);
async function barkAtlas() {
  const cards = allVariants().filter((v) => v.trunk === 'meshy' && meshOf(v.card));
  const big = cards.filter((v) => BARK_BIG.has(v.form)), small = cards.filter((v) => !BARK_BIG.has(v.form));
  const slots = {}, comps = [];
  big.forEach((v, i) => { slots[v.card] = [(i % 4) * 512, Math.floor(i / 4) * 512, 512]; });
  const y0 = Math.ceil(big.length / 4) * 512;
  [...small, { card: 'white' }].forEach((v, i) => { slots[v.card] = [(i % 8) * 256, y0 + Math.floor(i / 8) * 256, 256]; });
  for (const v of cards) {
    const tex = r(`${path.dirname(meshOf(v.card))}/texture_urls_0_base_color.png`);
    const [x, y, n] = slots[v.card];
    comps.push({ input: await sharp(tex).resize(n, n, { kernel: 'lanczos3' }).removeAlpha().toBuffer(), left: x, top: y });
  }
  const [wx, wy, wn] = slots.white;
  comps.push({ input: { create: { width: wn, height: wn, channels: 3, background: '#ffffff' } }, left: wx, top: wy });
  const H = Math.max(...Object.values(slots).map(([, y, n]) => y + n));
  const AH = H <= 1024 ? 1024 : 2048;
  fs.mkdirSync(r(ATLAS_DIR), { recursive: true });
  await sharp({ create: { width: 2048, height: AH, channels: 3, background: '#7a6a58' } }).composite(comps).webp({ quality: 86, effort: 6 }).toFile(r(`${ATLAS_DIR}/bark.webp`));
  fs.writeFileSync(r(`${GEN}/build/bark.json`), JSON.stringify({ size: [2048, AH], slots }, null, 1));
  console.log(`bark atlas 2048x${AH}: ${big.length} at 512, ${small.length} at 256, ${(fs.statSync(r(`${ATLAS_DIR}/bark.webp`)).size / 1024).toFixed(0)} KB webp`);
}

// ---------------------------------------------------------------- build: wood + crown -> web/public/assets/trees3d/<card>.glb
// In three's frame (y up, the painted front facing +z = south), metres, the foot at the origin.
// The wood: a Meshy trunk (its limbs swung in depth about their forks, alternately forward and back, since Meshy builds
// them from one front view nearly in one plane; the front view stays the painting's) or wood from the card's strokes
// (tools/lib/trees3d_proc.mjs, already swung), or thin stems to the crown's clumps (bamboo culms, a shrub's stems).
// The crown (CROWN below), painted clumps placed by the form's way of growing:
//   heads  fans springing from the limbs' heads (pollard willows, the pale grove's fan heads);
//   tips   small sprays at the branch ends, near ones merged (shoot trees, saplings, twig tops);
//   along  clusters along the upper limbs and at their ends (elms' claw twigs, pines' needle fans);
//   hang   curtains of whips hanging from the limbs (the weeping willow);
//   fill   clumps through the card's own crown, given depth (bamboo, the evergreen shrub, the hedge row);
//   foot   fans of stems from the foot (the low stem clumps).
// Each clump is one or more crossed quads cut to its outline; normals spherised from the crown's centre so the crown
// shades as one soft volume; a little darker toward roots and the crown's inside. Index order: the wood, then the
// clumps in farthest-point order (a prefix is a thinner crown of the same shape: the tier's clumpDensity).
// Wind attributes (web/src/trees3d.js): _QMWIND = (pivot x, y, z, flex): the wood -1; a fan's vertices 0 at its root ..
// 1 at its tip; a hanging whip 1 + (0..1) (it swings like a pendulum). _QMBEND = how much of the trunk's sway it takes.
const CROWN = {
  willow_fan: { mode: 'heads', sheet: 'willow_fan', len: 0.42, quads: 3, extra: 1, rise: 0.62, spread: 0.55, stagger: 0.35 },
  willow_burl: { mode: 'heads', sheet: 'whips', len: 0.5, quads: 4, extra: 3, rise: 0.72, spread: 0.6, stagger: 0.5 },
  willow_weep: { mode: 'hang', sheet: 'weep', len: 0.42, spacing: 0.085, per: 1 },
  elm_claw: { mode: 'along', sheet: 'elm_claw', len: 0.2, spacing: 0.085, from: 0.42, per: 2, rise: 0.45 },
  pine_fan: { mode: 'fill', sheet: 'pine_fan', len: 0.1, spacing: 0.085, stems: null, depth: 0.55, per: 2, from: 0.3, shade: 0.85 },
  shoot_tree: { mode: 'heads', sheet: 'shoots', len: 0.55, quads: 3, extra: 1, rise: 0.7, spread: 0.5, stagger: 0.3 },
  sapling: { mode: 'tips', sheet: 'elm_claw', len: 0.12, merge: 0.2, per: 2, rise: 0.5 },
  slender: { mode: 'tips', sheet: 'willow_fan', len: 0.3, merge: 0.12, per: 3, rise: 0.7, twigs: { sheet: 'elm_claw', len: 0.16 } },
  bamboo: { mode: 'fill', sheet: 'bamboo', len: 0.28, spacing: 0.15, stems: 'culms', depth: 0.45 },
  leafy: { mode: 'fill', sheet: 'leafy', len: 0.36, spacing: 0.21, stems: 'stems', depth: 0.7 },
  hedge: { mode: 'fill', sheet: 'leafy', len: 0.6, spacing: 0.32, stems: null, depth: 0.6 },
  whip_clump: { mode: 'foot', sheet: 'shoots', quads: 3, extra: 3, rise: 0.8, spread: 0.6 },
};
// the forms whose Meshy limbs are swung in depth (several limbs from one front view); a pollard's massive bole is not
const SWING = new Set(['willow_fan', 'elm_claw', 'pine_fan', 'willow_weep']);
// slender variants whose top is a few twigs, not a fan head (trees/types.md: _1 straight, _2 a curve, _4 a lean)
const TWIG_TOPS = new Set(['slender_1', 'slender_2', 'slender_4']);
function rng(seed) { let s = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 2166136261); return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const v3 = { sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]), norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; } };
const rot = (v, k, t) => { const c = Math.cos(t), s = Math.sin(t), kv = v3.cross(k, v), kd = v3.dot(k, v); return [0, 1, 2].map((i) => v[i] * c + kv[i] * s + k[i] * kd * (1 - c)); };
// Blender hands the texture's bytes as they are (sRGB); glTF colours are linear
const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const UP = [0, 1, 0];
// farthest-point order: each next point the farthest from those taken (a prefix is evenly spread)
function fpsOrder(pts, start = 0) {
  if (!pts.length) return [];
  const out = [start], d = pts.map((p) => v3.len(v3.sub(p, pts[start])));
  while (out.length < pts.length) {
    let bi = -1, bd = -1;
    for (let i = 0; i < pts.length; i++) if (d[i] > bd && !out.includes(i)) { bd = d[i]; bi = i; }
    out.push(bi);
    for (let i = 0; i < pts.length; i++) d[i] = Math.min(d[i], v3.len(v3.sub(pts[i], pts[bi])));
  }
  return out;
}
// points at least `sp` apart (greedy over a shuffled list)
function spaced(pts, sp, rand) { // tips (p.tip) first, the rest in a shuffled order
  const key = pts.map(() => rand()), order = pts.map((_, i) => i).sort((a, b) => (pts[b].tip ? 1 : 0) - (pts[a].tip ? 1 : 0) || key[a] - key[b]), out = [];
  for (const i of order) if (out.every((j) => v3.len(v3.sub(pts[i].p, pts[j].p)) >= sp)) out.push(i);
  return out.map((i) => pts[i]);
}
// the card's crown as points: (x, y) in metres from the foot, with its alpha (fill mode)
async function cardPoints(card, mPerPx, step) {
  const k = JSON.parse(read(`gen/trees/keyed/${card}.json`));
  const { data, info } = await sharp(r(`gen/trees/keyed/${card}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, out = [], rows = new Map();
  const s = Math.max(2, Math.round(step / mPerPx));
  for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) {
    let a = 0, n = 0;
    for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) { const yy = y + dy, xx = x + dx; if (yy < H && xx < W) { a += data[(yy * W + xx) * 4 + 3]; n++; } }
    a /= n * 255;
    if (a < 0.08) continue;
    const X = (x + s / 2 - k.foot[0]) * mPerPx, Y = (k.foot[1] - y - s / 2) * mPerPx;
    out.push({ x: X, y: Y, a });
    const row = Math.round(Y / step);
    const rr = rows.get(row) || [Infinity, -Infinity];
    rows.set(row, [Math.min(rr[0], X), Math.max(rr[1], X)]);
  }
  return { pts: out, rows, step };
}

async function buildTree(card, form, trunk, cellsJson, bark) {
  const rand = rng(card), cfg = CROWN[form];
  const cellsOf = (sheet) => cellsJson.cells.filter((c) => c.sheet === sheet);
  const mPerPx = cardScale(card);
  const treeH = CARDS.forms[form].variants[card.match(/_(\d+)$/)[1]].height_m;
  // ---- the wood, in three's frame
  let P = [], N = [], C = [], idx = [], tips = [], g = [], H = treeH, paths = [];
  const WUV = []; // the wood's bark-atlas UVs (Meshy wood); the rest takes the atlas's white slot
  const [wx, wy, wn] = bark.slots.white, white = [(wx + wn / 2) / bark.size[0], 1 - (wy + wn / 2) / bark.size[1]];
  if (trunk) {
    const n = trunk.verts ?? trunk.positions.length / 3;
    for (let i = 0; i < n; i++) {
      const [x, y, z] = trunk.positions.slice(i * 3, i * 3 + 3), [nx, ny, nz] = trunk.normals.slice(i * 3, i * 3 + 3);
      P.push([x, z, -y]); N.push([nx, nz, -ny]); C.push([0, 1, 2].map((k) => lin(trunk.colors[i * 3 + k])));
    }
    idx = trunk.indices.slice();
    g = trunk.geo;
    H = trunk.height;
    tips = trunk.tips.map((t) => ({ ...t }));
    paths = (trunk.paths || []).map((p) => ({ ...p, pts: p.pts.map(([x, y, z]) => [x, z, -y]) }));
    if (!trunk.swung) {
      // Meshy guesses the depth: a lean toward or away from the viewer is its invention (the painting shows only the
      // front), so each height's centre is brought back over the foot in depth (smoothly, by 16 slices)
      const B = 16, sum = new Float64Array(B), cnt = new Float64Array(B);
      for (const p of P) { const b = Math.min(B - 1, Math.max(0, Math.floor((p[1] / H) * B))); sum[b] += p[2]; cnt[b]++; }
      const cz = Array.from({ length: B }, (_, b) => (cnt[b] ? sum[b] / cnt[b] : null));
      for (let b = 0; b < B; b++) if (cz[b] === null) cz[b] = b ? cz[b - 1] : 0;
      const sm = cz.map((_, b) => { let a = 0, n = 0; for (let d = -1; d <= 1; d++) { const k = b + d; if (k >= 0 && k < B) { a += cz[k]; n++; } } return a / n; });
      const base = sm[0];
      for (const p of P) { const f = Math.min(B - 1.001, Math.max(0, (p[1] / H) * B - 0.5)), b = Math.floor(f), t = f - b; p[2] -= (sm[b] * (1 - t) + sm[Math.min(B - 1, b + 1)] * t) - base; }
      for (const p of P) p[2] -= base;
    }
    if (!trunk.swung && tips.length >= 2 && SWING.has(form)) {
      // nearest tip along the wood (multi-source Dijkstra from the tips), then each limb swung about its fork
      const adj = Array.from({ length: n }, () => []);
      for (let t = 0; t < idx.length; t += 3) for (const [a, b] of [[idx[t], idx[t + 1]], [idx[t + 1], idx[t + 2]], [idx[t + 2], idx[t]]]) { const d = v3.len(v3.sub(P[a], P[b])); adj[a].push([b, d]); adj[b].push([a, d]); }
      const dist = new Float64Array(n).fill(Infinity), lab = new Int32Array(n).fill(-1), pq = [];
      tips.forEach((t, k) => { dist[t.i] = 0; lab[t.i] = k; pq.push([0, t.i]); });
      while (pq.length) {
        let bi = 0; for (let q = 1; q < pq.length; q++) if (pq[q][0] < pq[bi][0]) bi = q;
        const [d, a] = pq[bi]; pq[bi] = pq[pq.length - 1]; pq.pop();
        if (d > dist[a]) continue;
        for (const [b, w] of adj[a]) if (d + w < dist[b]) { dist[b] = d + w; lab[b] = lab[a]; pq.push([d + w, b]); }
      }
      const order = tips.map((_, k) => k).sort((a, b) => P[tips[a].i][0] - P[tips[b].i][0]);
      const depth = [];
      order.forEach((k, j) => { depth[k] = (j % 2 ? 1 : -1) * (0.25 + 0.2 * rand()) * Math.max(Math.abs(P[tips[k].i][0]), 0.18 * H) + (rand() - 0.5) * 0.1 * H; });
      for (let i = 0; i < n; i++) {
        const k = lab[i]; if (k < 0) continue;
        const w = g[i] / tips[k].g, t = Math.max(0, Math.min(1, (w - 0.42) / 0.58));
        P[i][2] += depth[k] * t * t * (3 - 2 * t);
      }
    }
    for (const t of tips) {
      t.P = P[t.i];
      const near = P.filter((p) => v3.len(v3.sub(p, t.P)) < 0.05 * H);
      t.C = v3.mul(near.reduce((a, p) => v3.add(a, p), [0, 0, 0]), 1 / near.length);
      t.D = v3.norm([t.dir[0], t.dir[2], -t.dir[1]]);
    }
    if (!trunk.swung) {
      // smooth normals again after the swing (area-weighted face normals)
      const acc = P.map(() => [0, 0, 0]);
      for (let k = 0; k < idx.length; k += 3) {
        const [a, b, c] = [idx[k], idx[k + 1], idx[k + 2]], fn = v3.cross(v3.sub(P[b], P[a]), v3.sub(P[c], P[a]));
        for (const v of [a, b, c]) acc[v] = v3.add(acc[v], fn);
      }
      N = acc.map((v) => v3.norm(v));
    }
    // the Meshy wood takes its painted texture (bark atlas): vertices split where the texture's UVs part
    if (trunk.corner_uv && bark.slots[card]) {
      const [sx, sy, sn] = bark.slots[card], [BW, BH] = bark.size;
      const key = new Map(), P2 = [], N2 = [], C2 = [], G2 = [], idx2 = [];
      for (let k = 0; k < idx.length; k++) {
        const v = idx[k], u = trunk.corner_uv[k * 2], w = trunk.corner_uv[k * 2 + 1];
        const kk = `${v}|${u}|${w}`;
        if (!key.has(kk)) {
          key.set(kk, P2.length);
          P2.push(P[v]); N2.push(N[v]); C2.push([1, 1, 1]); G2.push(g[v]);
          WUV.push([(sx + (u - Math.floor(u)) * sn) / BW, 1 - (sy + (1 - (w - Math.floor(w))) * sn) / BH]);
        }
        idx2.push(key.get(kk));
      }
      // tips refer to the welded vertices: keep their points, not their indices
      P = P2; N = N2; C = C2; g = G2; idx = idx2;
    }
  }
  const outOf = (p) => v3.norm([p[0], 0, p[2]].map((v, i) => (i === 1 ? 0 : v)).map((v) => v || 1e-6));
  // ---- the crown: quads { pivot, axis (the way the clump grows), right, cell, len, imp, flex: 'fan'|'hang'|'ball' }
  const quads = [];
  const fanAt = (pivot, axis, len, cells, nMain, nExtra, imp, spread = 0.55, out = null, stagger = 0) => {
    out = out || outOf(pivot);
    const ref = Math.abs(axis[1]) < 0.95 ? UP : [1, 0, 0];
    const right0 = v3.norm(v3.cross(axis, ref)), phi0 = rand() * Math.PI;
    for (let q = 0; q < nMain + nExtra; q++) {
      const main = q < nMain;
      const right = rot(right0, axis, phi0 + (main ? (q * Math.PI) / nMain : (q - nMain + 0.5) * (Math.PI / Math.max(1, nExtra))));
      const ax = main ? axis : v3.norm(rot(axis, right, (q % 2 ? 1 : -1) * spread));
      const side = v3.dot(right, out);
      const cell = main ? (q === 0 ? cells[0] : Math.abs(side) > 0.45 ? cells[side > 0 ? 3 : 2] : cells[1]) : cells[side > 0 ? 3 : 2];
      // stagger: the roots spread round the head (so their dense bases don't pile into one blot), each a little up its way
      const st = stagger * (rand() * 2 - 1), sp = stagger * rand() * 0.5;
      const pv = stagger ? v3.add(v3.add(pivot, v3.mul(right, st)), v3.mul(ax, sp)) : pivot;
      quads.push({ pivot: pv, axis: ax, right, cell, len: len * (main ? 1 : 0.85) * (0.9 + 0.2 * rand()), imp: imp + (main ? 1 : 0), flex: 'fan' });
    }
  };
  const mode = cfg.mode;
  if (mode === 'heads' || mode === 'tips') {
    const twig = form === 'slender' && TWIG_TOPS.has(card);
    const sheet = twig ? cfg.twigs.sheet : cfg.sheet, L0 = twig ? cfg.twigs.len : cfg.len;
    const cells = cellsOf(sheet);
    let heads = tips;
    if (mode === 'tips') { // near tips merged into one spray
      const left = tips.slice(), groups = [];
      while (left.length) {
        const a = left.shift(), grp = [a];
        for (let i = left.length - 1; i >= 0; i--) if (v3.len(v3.sub(left[i].C, a.C)) < cfg.merge * H) grp.push(...left.splice(i, 1));
        groups.push({ C: v3.mul(grp.reduce((s, t) => v3.add(s, t.C), [0, 0, 0]), 1 / grp.length), D: v3.norm(grp.reduce((s, t) => v3.add(s, t.D), [0, 0, 0])), n: grp.length });
      }
      heads = groups;
    }
    for (const t of heads) {
      const out = outOf(t.C);
      const axis = v3.norm(v3.add(v3.add(v3.mul(t.D, 1 - cfg.rise), [0, cfg.rise, 0]), v3.mul(out, 0.15)));
      const reach = Math.min(1.15, 0.75 + 0.5 * (t.C[1] / H));
      const nM = mode === 'heads' ? cfg.quads : cfg.always || Math.min(cfg.per, 1 + (t.n > 1 ? 1 : 0)), nE = mode === 'heads' ? cfg.extra : (t.n > 2 ? 1 : 0);
      const L = L0 * treeH * reach * (0.85 + 0.3 * rand());
      fanAt(t.C, axis, L, cells, nM, nE, t.C[1] / H, cfg.spread || 0.55, out, (cfg.stagger || 0) * Math.min(L * 0.25, 0.6));
    }
  } else if (mode === 'along' || mode === 'hang') {
    // candidate points on the wood: high enough and far enough along the wood from the foot, plus every tip
    const gmax = Math.max(...g, 1e-6), cand = [];
    for (let i = 0; i < P.length; i++) if (P[i][1] > (mode === 'hang' ? 0.45 : cfg.from) * H && g[i] / gmax > (mode === 'hang' ? 0.5 : 0.45)) {
      if (mode === 'hang' && N[i][1] > 0.3) continue; // whips hang from a limb's underside and sides
      cand.push({ p: P[i], n: N[i], tip: false });
    }
    for (const t of tips) cand.push({ p: t.C, n: t.D, tip: true });
    const pts = spaced([...cand.filter((c) => c.tip), ...cand.filter((c) => !c.tip)], cfg.spacing * treeH, rand);
    const cells = cellsOf(cfg.sheet);
    for (const c of pts) {
      if (mode === 'along') {
        const axis = v3.norm(v3.add(v3.mul(v3.norm(c.n), 1 - cfg.rise), [0, cfg.rise, 0]));
        fanAt(c.p, axis, cfg.len * treeH * (0.75 + 0.5 * rand()) * (c.tip ? 1.15 : 1), cells, cfg.per, 0, c.p[1] / H + (c.tip ? 0.5 : 0));
      } else {
        const out = outOf(c.p);
        const axis = v3.norm(v3.add([0, -1, 0], v3.mul(out, 0.18)));
        const len = Math.min(cfg.len * treeH * (0.7 + 0.6 * rand()), c.p[1] - 0.6);
        if (len < 0.5) continue;
        fanAt(c.p, axis, len, cells, cfg.per, 0, c.p[1] / H, 0.3, out);
        for (let q = quads.length - cfg.per; q < quads.length; q++) quads[q].flex = 'hang';
      }
    }
  } else if (mode === 'fill') {
    const { pts, rows, step } = await cardPoints(card, mPerPx, Math.max(0.08, treeH * 0.04));
    const half = (y) => { const rr = rows.get(Math.round(y / step)); return rr ? (rr[1] - rr[0]) / 2 : 0.3; };
    const cand = pts.filter((p) => p.y > (cfg.from ?? (form === 'hedge' ? 0.15 : 0.22)) * treeH && p.a > 0.25).map((p) => ({ p: [p.x, p.y, (rand() * 2 - 1) * half(p.y) * cfg.depth], a: p.a }));
    const chosen = spaced(cand, cfg.spacing * treeH, rand);
    const cells = cellsOf(cfg.sheet);
    for (const c of chosen) {
      const axis = v3.norm(v3.add(UP, [(rand() - 0.5) * 0.5, 0, (rand() - 0.5) * 0.5]));
      const len = cfg.len * treeH * (0.75 + 0.5 * rand());
      const per = cfg.per || 2;
      fanAt(c.p, axis, len, cells, per, 0, c.p[1] / treeH);
      if (cells[0].grow === 'centre') for (let q = quads.length - per; q < quads.length; q++) quads[q].flex = 'ball';
    }
    // stems from the foot to the clumps (bamboo culms: straight, nearly upright; a shrub's stems: short and branching)
    if (cfg.stems) {
      const base = P.length;
      const tube = (a, b, r0, r1, sides, col) => {
        const T = v3.norm(v3.sub(b, a)), ref = Math.abs(T[1]) < 0.9 ? UP : [1, 0, 0], B = v3.norm(v3.cross(T, ref)), Nn = v3.cross(B, T);
        const st = P.length, segs = Math.max(2, Math.ceil(v3.len(v3.sub(b, a)) / 0.4));
        for (let s = 0; s <= segs; s++) {
          const f = s / segs, c = v3.add(a, v3.mul(v3.sub(b, a), f)), rr = r0 + (r1 - r0) * f;
          for (let k = 0; k < sides; k++) { const th = (k / sides) * Math.PI * 2, d = v3.add(v3.mul(Nn, Math.cos(th)), v3.mul(B, Math.sin(th))); P.push(v3.add(c, v3.mul(d, rr))); N.push(d); C.push(col.map((v) => v * (0.85 + 0.15 * Math.cos(th)))); g.push(c[1]); }
        }
        for (let s = 0; s < segs; s++) for (let k = 0; k < sides; k++) { const a0 = st + s * sides + k, b0 = st + s * sides + ((k + 1) % sides); idx.push(a0, a0 + sides, b0, b0, a0 + sides, b0 + sides); }
      };
      const culm = [0.32, 0.38, 0.27].map(lin), stem = [0.22, 0.18, 0.14].map(lin);
      const tops = quads.filter((_, i) => i % 2 === 0).map((q) => q.pivot);
      for (const tp of fpsOrder(tops).slice(0, form === 'bamboo' ? 12 : 8).map((i) => tops[i])) {
        const footP = [tp[0] * 0.25 + (rand() - 0.5) * 0.15, 0, tp[2] * 0.25 + (rand() - 0.5) * 0.15];
        tube(footP, tp, form === 'bamboo' ? 0.025 : 0.03, form === 'bamboo' ? 0.015 : 0.012, form === 'bamboo' ? 5 : 4, form === 'bamboo' ? culm : stem);
      }
      if (P.length > base) H = Math.max(H, ...P.slice(base).map((p) => p[1]));
    }
  } else if (mode === 'foot') {
    const cells = cellsOf(cfg.sheet);
    fanAt([0, 0.02, 0], UP, treeH, cells, cfg.quads, cfg.extra, 1, cfg.spread, [1, 0, 0]);
  }
  // ---- order: the most important first, then farthest-point within each importance band
  const centres = quads.map((q) => v3.add(q.pivot, v3.mul(q.axis, q.len * 0.5)));
  const fo = fpsOrder(centres, centres.reduce((bi, c, i) => (c[1] > centres[bi][1] ? i : bi), 0));
  const rank = new Map(fo.map((qi, k) => [qi, k]));
  const qord = quads.map((_, i) => i).sort((a, b) => (Math.round(quads[b].imp) - Math.round(quads[a].imp)) || rank.get(a) - rank.get(b));
  const qc = quads.length ? v3.mul(centres.reduce((a, c) => v3.add(a, c), [0, 0, 0]), 1 / centres.length) : [0, H * 0.7, 0];
  const Rc = quads.length ? Math.max(...quads.map((q) => v3.len(v3.sub(v3.add(q.pivot, v3.mul(q.axis, q.len)), qc)))) : 1;
  // ---- geometry
  const pos = [], nrm = [], col = [], uv = [], wind = [], bend = [], ind = [];
  for (let i = 0; i < P.length; i++) {
    pos.push(...P[i]); nrm.push(...N[i]); col.push(...C[i]); uv.push(...(WUV[i] || white));
    wind.push(0, 0, 0, -1); bend.push(Math.pow(Math.max(0, P[i][1]) / H, 1.6));
  }
  ind.push(...idx);
  const trunkIndex = ind.length, [AW, AH] = cellsJson.size, levels = [];
  for (const qi of qord) {
    const q = quads[qi], c = q.cell, base = pos.length / 3;
    const ext = c.grow === 'centre' ? Math.max(...c.poly.map((p) => Math.hypot(p[0] - c.root[0], p[1] - c.root[1]))) : Math.max(...c.poly.map((p) => Math.abs(c.root[1] - p[1])));
    const pxM = q.len / ext, sgn = c.grow === 'down' ? -1 : 1;
    const sink = c.grow === 'centre' ? 0 : 0.03 * H;
    const at = (px, py) => v3.add(v3.add(q.pivot, v3.mul(q.right, (px - c.root[0]) * pxM)), v3.mul(q.axis, sgn * (c.root[1] - py) * pxM - sink));
    for (const [px, py] of [c.root, ...c.poly]) {
      const p = at(px, py);
      pos.push(...p);
      const radial = v3.norm(v3.sub(p, qc));
      nrm.push(...v3.norm(v3.add(v3.mul(radial, q.flex === 'ball' ? 0.8 : 0.55), [0, q.flex === 'ball' ? 0.2 : 0.45, 0])));
      const along = Math.max(0, Math.min(1, sgn * (c.root[1] - py) / ext));
      const inner = Math.min(1, v3.len(v3.sub(p, qc)) / Rc);
      const shade = (q.flex === 'ball' ? 0.72 + 0.28 * inner : 0.82 + 0.18 * (c.grow === 'centre' ? inner : along)) * (cfg.shade || 1);
      col.push(shade, shade, shade);
      uv.push((c.rect[0] + px) / AW, 1 - (c.rect[1] + py) / AH);
      const flex = q.flex === 'hang' ? 1 + Math.abs(along) : q.flex === 'ball' ? 0.3 + 0.7 * inner : Math.abs(along);
      wind.push(...q.pivot, flex);
      bend.push(Math.pow(Math.max(0, q.pivot[1]) / H, 1.6));
    }
    const n = c.poly.length;
    for (let i = 1; i <= n; i++) ind.push(base, base + i, base + (i % n) + 1);
    levels.push(ind.length);
  }
  const box = [[Infinity, Infinity, Infinity], [-Infinity, -Infinity, -Infinity]];
  for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { box[0][k] = Math.min(box[0][k], pos[i + k]); box[1][k] = Math.max(box[1][k], pos[i + k]); }
  return { pos, nrm, col, uv, wind, bend, ind, trunkIndex, levels, H: Math.max(H, box[1][1]), box, tips: tips.length, quads: quads.length, crownCentre: qc, crownRadius: Rc, strands: cfg.mode === 'hang' };
}
async function writeGlb(file, t, extras) {
  const { Document, NodeIO } = await import(r('tools/node_modules/@gltf-transform/core/dist/index.modern.js')).catch(() => import('@gltf-transform/core'));
  const doc = new Document(), buf = doc.createBuffer();
  const acc = (arr, type, Ctor = Float32Array) => doc.createAccessor().setType(type).setArray(new Ctor(arr)).setBuffer(buf);
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', acc(t.pos, 'VEC3')).setAttribute('NORMAL', acc(t.nrm, 'VEC3')).setAttribute('COLOR_0', acc(t.col, 'VEC3'))
    .setAttribute('TEXCOORD_0', acc(t.uv, 'VEC2')).setAttribute('_QMWIND', acc(t.wind, 'VEC4')).setAttribute('_QMBEND', acc(t.bend, 'SCALAR'))
    .setIndices(acc(t.ind, 'SCALAR', t.pos.length / 3 > 65535 ? Uint32Array : Uint16Array));
  const mesh = doc.createMesh(extras.card).addPrimitive(prim).setExtras(extras);
  doc.createScene().addChild(doc.createNode(extras.card).setMesh(mesh));
  // meshopt with quantized positions, normals, UVs and colours (the wind attributes stay float: their pivots are in the
  // tree's own metres); the page bakes the node's dequantising transform into the geometry (trees3d.js variant())
  const { quantize, reorder, meshopt } = await import('@gltf-transform/functions');
  const { EXTMeshoptCompression, KHRMeshQuantization } = await import('@gltf-transform/extensions');
  const { MeshoptEncoder } = await import('meshoptimizer');
  await MeshoptEncoder.ready;
  await doc.transform(reorder({ encoder: MeshoptEncoder }), quantize({ pattern: /^(POSITION|NORMAL|TEXCOORD_0|COLOR_0)$/, quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 14, quantizeColor: 8 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder }).write(r(file), doc);
}
async function build() {
  const cellsJson = JSON.parse(read(`${GEN}/build/cells.json`)), bark = JSON.parse(read(`${GEN}/build/bark.json`));
  const regFile = `${ATLAS_DIR}/trees3d.json`;
  const reg = fs.existsSync(r(regFile)) ? JSON.parse(read(regFile)) : {};
  reg.about = 'The 3D trees (tools/trees3d.mjs; gen/details/trees/method.md): per card a GLB of its wood and crown (y up, foot at the origin, the painted front facing +z), all sharing the crown atlas. extras: H (m), trunkIndex (indices of the wood), levels (index count after each clump, most important first), strands (the crown is hanging whips: the tier\'s strands share), crownCentre, crownRadius.';
  reg.atlas = 'assets/trees3d/crowns.webp';
  reg.bark = 'assets/trees3d/bark.webp';
  reg.variants = reg.variants || {};
  for (const v of allVariants()) {
    const f = `${GEN}/build/${v.card}_trunk.json`;
    if (v.trunk !== 'none' && !fs.existsSync(r(f))) { console.log(`${v.card}: no wood yet`); continue; }
    const t = await buildTree(v.card, v.form, v.trunk === 'none' ? null : JSON.parse(read(f)), cellsJson, bark);
    const extras = { card: v.card, H: +t.H.toFixed(3), trunkIndex: t.trunkIndex, levels: t.levels, strands: t.strands, crownCentre: t.crownCentre.map((x) => +x.toFixed(3)), crownRadius: +t.crownRadius.toFixed(3), box: t.box.map((b) => b.map((x) => +x.toFixed(3))) };
    const file = `${ATLAS_DIR}/${v.card}.glb`;
    await writeGlb(file, t, extras);
    // the wood's reach at a walker's height (0.3-1.6 m above the foot): the trunk collider a builder should give it
    let cx = 0, cz = 0, cn = 0, r16 = 0;
    const woodN = t.trunkIndex ? Math.max(...t.ind.slice(0, t.trunkIndex)) + 1 : 0;
    for (let i = 0; i < woodN; i++) { const y = t.pos[i * 3 + 1]; if (y > 0.3 && y < 1.6) { cx += t.pos[i * 3]; cz += t.pos[i * 3 + 2]; cn++; } }
    const ds = [];
    if (cn) { cx /= cn; cz /= cn; for (let i = 0; i < woodN; i++) { const y = t.pos[i * 3 + 1]; if (y > 0.3 && y < 1.6) { const d = Math.hypot(t.pos[i * 3] - cx, t.pos[i * 3 + 2] - cz); r16 = Math.max(r16, d); ds.push(d); } } }
    ds.sort((a, b) => a - b);
    const rc = ds.length ? ds[Math.floor(ds.length * 0.5)] : 0; // the bole's own radius (the median: roots and limbs left out)
    reg.variants[v.card] = { file: `assets/trees3d/${v.card}.glb`, form: v.form, tris: t.ind.length / 3, woodTris: t.trunkIndex / 3, clumps: t.quads, H: +t.H.toFixed(3), kb: Math.round(fs.statSync(r(file)).size / 1024),
      trunk: cn ? { x: +cx.toFixed(2), z: +cz.toFixed(2), r: +rc.toFixed(2), reach: +r16.toFixed(2) } : null };
    // for the look sheet: in blender's frame (x, y depth, z up), with the crown as flat-shaded quads
    const bp = [];
    for (let i = 0; i < t.pos.length; i += 3) bp.push(t.pos[i], -t.pos[i + 2], t.pos[i + 1]);
    fs.writeFileSync(r(`${GEN}/build/${v.card}_tree.json`), JSON.stringify({ height: t.H, positions: bp, colors: t.col.map((c, i) => (i % 3 === 0 && t.wind[(i / 3) * 4 + 3] >= 0 ? 0.55 : i % 3 === 1 && t.wind[((i - 1) / 3) * 4 + 3] >= 0 ? 0.62 : i % 3 === 2 && t.wind[((i - 2) / 3) * 4 + 3] >= 0 ? 0.45 : c)), indices: t.ind, tips: [] }));
    console.log(`${v.card}: ${t.ind.length / 3} tris (wood ${t.trunkIndex / 3}, ${t.quads} clump quads${t.tips ? ` on ${t.tips} tips` : ''}), ${reg.variants[v.card].kb} KB`);
  }
  fs.writeFileSync(r(regFile), JSON.stringify(reg, null, 1));
}

// ---------------------------------------------------------------- proc: wood from the card's own strokes
// (tools/lib/trees3d_proc.mjs) for the forms whose trunk is 'proc'; per form `open` (px the thin strokes are opened by)
const PROC = { shoot_tree: { open: 2 }, slender: { open: 2 }, sapling: { open: 1, minSpur: 8 }, bamboo: { open: 1, minSpur: 14 }, leafy: { open: 1 } };
function allVariants() {
  const out = [];
  for (const [form, f] of Object.entries(CFG.forms)) for (const n of Object.keys(CARDS.forms[form]?.variants || {})) {
    const card = `${form}_${n}`;
    if (!only || only.has(card)) out.push({ card, form, trunk: f.trunk });
  }
  return out;
}
async function proc() {
  const { woodFromCard } = await import('./lib/trees3d_proc.mjs');
  fs.mkdirSync(r(`${GEN}/build`), { recursive: true });
  for (const v of allVariants().filter((x) => x.trunk === 'proc')) {
    const k = JSON.parse(read(`gen/trees/keyed/${v.card}.json`));
    const o = { ...(PROC[v.form] || {}), ...(CFG.forms[v.form].proc || {}), ...(CFG.forms[v.form].variants?.[v.card.match(/_(\d+)$/)[1]]?.proc || {}) };
    try {
      const t = await woodFromCard(r(`gen/trees/keyed/${v.card}.png`), { foot: k.foot, mPerPx: cardScale(v.card), seed: [...v.card].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0, ...o });
      fs.writeFileSync(r(`${GEN}/build/${v.card}_trunk.json`), JSON.stringify(t));
      console.log(`${v.card}: ${t.tris} tris, ${t.branches} branches, ${t.tips.length} tips, ${t.height.toFixed(2)} m`);
    } catch (e) { console.log(`${v.card}: FAILED ${e.message}`); }
  }
}

// ---------------------------------------------------------------- look: a trunk (and its crown) from the front and the side
// flat-shaded triangles sorted back to front (SVG through sharp), the tips as red rings; for reading a step, not the page
async function lookSvg(geo, { W = 420, H = 560, title = '' } = {}) {
  const P = geo.positions, I = geo.indices, C = geo.colors, Hm = geo.height;
  const views = [['front', (x, y, z) => [x, z, y]], ['side', (x, y, z) => [y, z, -x]]]; // blender coords: front looks along +y
  const sc = (H - 40) / (Hm * 1.15), parts = [];
  views.forEach(([name, pr], vi) => {
    const ox = vi * W + W / 2, oy = H - 20;
    const tris = [];
    for (let t = 0; t < I.length; t += 3) {
      const v = [0, 1, 2].map((k) => I[t + k]);
      const p = v.map((i) => pr(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]));
      const e1 = [0, 1, 2].map((k) => p[1][k] - p[0][k]), e2 = [0, 1, 2].map((k) => p[2][k] - p[0][k]);
      const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      const nl = Math.hypot(...n) || 1, lit = 0.45 + 0.55 * Math.abs((n[0] * -0.4 + n[1] * 0.6 + n[2] * -0.7) / nl);
      const c = [0, 1, 2].map((k) => Math.round(255 * Math.min(1, Math.pow((C ? (C[v[0] * 3 + k] + C[v[1] * 3 + k] + C[v[2] * 3 + k]) / 3 : 0.5) * lit, 1 / 2.2))));
      tris.push({ z: (p[0][2] + p[1][2] + p[2][2]) / 3, d: `M${p.map((q) => `${(ox + q[0] * sc).toFixed(1)},${(oy - q[1] * sc).toFixed(1)}`).join('L')}Z`, c });
    }
    tris.sort((a, b) => b.z - a.z);
    for (const t of tris) parts.push(`<path d="${t.d}" fill="rgb(${t.c})" stroke="rgb(${t.c})" stroke-width="0.4"/>`);
    for (const tp of geo.tips || []) { const q = pr(...tp.c); parts.push(`<circle cx="${ox + q[0] * sc}" cy="${oy - q[1] * sc}" r="${Math.max(3, tp.r * sc)}" fill="none" stroke="#e22" stroke-width="2"/>`); }
    parts.push(`<text x="${vi * W + 8}" y="18" font-family="monospace" font-size="14">${title} ${name}</text>`);
  });
  return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W * 2}" height="${H}"><rect width="100%" height="100%" fill="#f4f1ea"/>${parts.join('')}</svg>`)).png().toBuffer();
}
async function look() {
  fs.mkdirSync(r(`${GEN}/check`), { recursive: true });
  const tiles = [];
  for (const j of allVariants()) {
    for (const [kind, f] of [['trunk', `${GEN}/build/${j.card}_trunk.json`], ['tree', `${GEN}/build/${j.card}_tree.json`]]) {
      if (!fs.existsSync(r(f)) || (kind === 'trunk' && flag('--trees'))) continue;
      const g = JSON.parse(read(f));
      const out = `${GEN}/check/${kind}_${j.card}.png`;
      await sharp(await lookSvg(g, { title: `${j.card} ${g.indices.length / 3} tris${g.tips?.length ? `, ${g.tips.length} tips` : ''}` })).toFile(r(out));
      if (kind === 'tree') tiles.push(out);
    }
  }
  // every built tree on one sheet, front and side, 4 to a row
  if (tiles.length) {
    const tw = 420, th = 280, cols = 4;
    const bufs = await Promise.all(tiles.map((f) => sharp(r(f)).resize(tw, th).toBuffer()));
    await sharp({ create: { width: tw * cols, height: th * Math.ceil(bufs.length / cols), channels: 3, background: '#fff' } })
      .composite(bufs.map((b, i) => ({ input: b, left: (i % cols) * tw, top: Math.floor(i / cols) * th }))).jpeg({ quality: 82 }).toFile(r(`${GEN}/check/trees_sheet.jpg`));
    console.log(`${GEN}/check/trees_sheet.jpg (${tiles.length} trees)`);
  }
}

// ---------------------------------------------------------------- check: every mapped tree has its 3D form and its card
// For every tree of every mapped section (trees/assign/<S>.json, as tree_cards.mjs check reads them): its card is in
// trees.json with its small copy (the far level), its 3D variant is in trees3d.json with its GLB, the GLB's crown draws
// from the atlas's cells and its wood from the bark atlas, and the atlases' KTX2 copies are current. A tree built as a
// kit model ({"card": "kit"}) has neither. Exit 1 on any problem.
function check() {
  const reg = JSON.parse(read('web/public/assets/trees/trees.json')), reg3 = JSON.parse(read(`${ATLAS_DIR}/trees3d.json`));
  const ktx = JSON.parse(read('web/public/assets/ktx2.json'));
  const SECS = Object.entries(JSON.parse(read('map/sections.json'))).filter(([k, v]) => /^S\d[a-z]?$/.test(k) && v.folder && fs.existsSync(r(`map/world/${k}.json`))).map(([k]) => k);
  let bad = 0, n = 0, kit = 0;
  const forms = {};
  for (const S of SECS) {
    const assign = fs.existsSync(r(`trees/assign/${S}.json`)) ? JSON.parse(read(`trees/assign/${S}.json`)) : {};
    for (const e of JSON.parse(read(`map/world/${S}.json`)).entities.filter((x) => x.kind === 'tree')) {
      const a = assign[e.id];
      if (!a) { console.log(`MISSING ${e.id}: no card assigned`); bad++; continue; }
      if (a.card === 'kit') { kit++; continue; }
      n++;
      const c = reg[a.card], v = reg3.variants?.[a.card];
      if (!c) { console.log(`NO CARD ${e.id}: ${a.card} not in trees.json`); bad++; continue; }
      if (!c.small || !fs.existsSync(r(`web/public/${c.small}`))) { console.log(`NO FAR LEVEL ${e.id}: ${a.card} has no small card`); bad++; }
      if (!v) { console.log(`NO 3D ${e.id}: ${a.card} not in trees3d.json`); bad++; continue; }
      if (!fs.existsSync(r(`web/public/${v.file}`))) { console.log(`NO GLB ${e.id}: ${v.file}`); bad++; continue; }
      forms[c.form] = (forms[c.form] || 0) + 1;
    }
  }
  for (const f of ['trees3d/crowns.webp', 'trees3d/bark.webp']) {
    const e = ktx.files[f];
    if (!fs.existsSync(r(`web/public/assets/${f}`))) { console.log(`NO ATLAS ${f}`); bad++; continue; }
    const sha1 = crypto.createHash('sha1').update(fs.readFileSync(r(`web/public/assets/${f}`))).digest('hex');
    if (!e || e.src_sha1 !== sha1) { console.log(`STALE KTX2 ${f}: run node tools/ktx2.mjs encode --kind tree --only trees3d`); bad++; }
  }
  // every built variant's GLB is newer than its inputs' build (a variant rebuilt without its GLB, or the other way)
  const cells = JSON.parse(read(`${GEN}/build/cells.json`)).cells.length;
  console.log(`${n} mapped trees (+${kit} kit) with a card, its far level and a 3D tree: ${Object.entries(forms).map(([f, k]) => `${f} ${k}`).join(', ')}; ${Object.keys(reg3.variants || {}).length} variants, ${cells} crown cells; ${bad ? `${bad} problems: FAIL` : 'PASS'}`);
  if (bad) process.exitCode = 1;
}

async function status() {
  for (const j of await bareJobs()) {
    const bare = fs.existsSync(r(rawOf(j))) ? 'bare ok' : 'bare missing';
    const md = r(`${GEN}/meshy/${j.card}`);
    const meshes = fs.existsSync(md) ? fs.readdirSync(md).filter((k) => fs.existsSync(`${md}/${k}/task.json`)) : [];
    console.log(j.card.padEnd(16), bare.padEnd(14), `meshes ${meshes.length}`);
  }
  for (const j of clumpJobs()) console.log(`sheet ${j.sheet}`.padEnd(16), fs.existsSync(r(rawOf(j))) ? 'ok' : 'missing', j.key);
}

if (step === 'status') await status();
if (step === 'bare') await draw(await bareJobs(), 'bare');
if (step === 'clumps') await draw(clumpJobs(), 'clumps');
if (step === "meshy") await meshy();
if (step === "convert") await convert();

if (step === "proc") await proc();
if (step === "look") await look();
if (step === "check") check();
export { bareJobs, clumpJobs, keyed, rawOf };
if (step === "atlas") await atlas();
if (step === "bark") await barkAtlas();
if (step === "build") await build();
