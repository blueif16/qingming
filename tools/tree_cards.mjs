#!/usr/bin/env node
// The painted tree cards: one alpha card per tree form the scroll paints, 2-4 variants each (trees/notes.md).
// trees/cards.json lists the forms, their reference crops of the scan and their variants; the prompt of a card is
// prompts/tree_card.txt around prompts/tree_<form>.txt (the form, then one [n] block per variant).
//   node tools/tree_cards.mjs [status|refs|gen|key|ship|small|sheet|check|all] [--form a,b] [--only willow_fan_1,..] [--force] [--jobs 3]
//   refs   crop each form's reference strips from the scan     -> gen/trees/refs/<form>_<k>.jpg
//   gen    draw the cards whose prompt, size or refs changed     -> gen/trees/raw/<card>/<key>_0.png (shyfai, opaque white)
//   key    white background -> clean alpha, no halo               -> gen/trees/keyed/<card>.png, gen/trees/check/<card>.jpg
//   ship   crop, 768 px tall (ship_h for small trees), webp      -> web/public/assets/trees/<card>.webp, trees.json
//   small  (also after ship) a 256 px copy, shown first            -> web/public/assets/trees/small/<card>.webp, trees.json small
//   sheet  every card on a grey and a dark backdrop, named        -> gen/trees/sheet.jpg
//   check  every mapped tree has a card (trees/assign/<S>.json); none within 6 m share a card, none within 15 m unmirrored
//          (both radii scale down for trees under 8 m tall; {"card": "kit"} = built as a kit model, no card)
// Each card is cached by a key over its prompt text, model, size and reference hashes (like tools/backdrop.mjs):
// a changed prompt draws only the cards it touches; going back to an old prompt reuses its image.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.join(ROOT, p);
const sharp = createRequire(r('tools/package.json'))('sharp');
sharp.cache(false);
const [step = 'status', ...rest] = process.argv.slice(2);
const flag = (f) => rest.includes(f);
const opt = (f, d) => (rest.includes(f) ? rest[rest.indexOf(f) + 1] : d);
const CFG = JSON.parse(fs.readFileSync(r('trees/cards.json'), 'utf8'));
const SCAN = 'reference/scroll/qingming_commons_38414x1800.jpg';
const GEN = 'gen/trees';
const ASSETS = 'web/public/assets/trees';
const KEYER = 7; // bump when the keyer changes, so every card is keyed again
const CARD_H = 768; // shipped card height, px (1024 until 2026-10-12: 7.1 MB for 31 cards; the user: "mind the sizings")
for (const d of ['refs', 'raw', 'keyed', 'check']) fs.mkdirSync(r(`${GEN}/${d}`), { recursive: true });

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const forms = Object.entries(CFG.forms).filter(([f]) => !opt('--form') || opt('--form').split(',').includes(f));
const refFile = (form, k) => `${GEN}/refs/${form}_${k + 1}.jpg`;

// the prompt of one form: its body, then [n] variant blocks
function formPrompt(form) {
  const text = fs.readFileSync(r(`prompts/tree_${form}.txt`), 'utf8');
  const parts = text.split(/^\[(\d+)\]\s*/m);
  const variants = {};
  for (let i = 1; i < parts.length; i += 2) variants[parts[i]] = parts[i + 1].trim();
  return { body: parts[0].trim(), variants };
}
// every card: { id, form, n, spec, prompt, refs, key }
function cards() {
  const frame = fs.readFileSync(r('prompts/tree_card.txt'), 'utf8').trim();
  const only = opt('--only') ? new Set(opt('--only').split(',')) : null;
  const out = [];
  for (const [form, f] of forms) {
    const fp = formPrompt(form);
    for (const [n, spec] of Object.entries(f.variants)) {
      const id = `${form}_${n}`;
      if (only && !only.has(id)) continue;
      if (!fp.variants[n]) throw new Error(`prompts/tree_${form}.txt has no [${n}] block`);
      const refs = [CFG.style, ...(spec.refs || f.refs.map((_, k) => k)).map((k) => refFile(form, k))];
      const nr = refs.length - 1;
      const REFS = nr === 1 ? 'Image 2 is a detail' : `Images ${Array.from({ length: nr }, (_, k) => k + 2).join(nr === 2 ? ' and ' : ', ')} are details`;
      const prompt = frame.replace('{REFS}', REFS).replace('{FORM}', fp.body).replace('{VARIANT}', fp.variants[n]);
      const have = refs.every((p) => fs.existsSync(r(p)));
      const key = have ? sha(JSON.stringify({ prompt, model: CFG.model, size: spec.size, background: 'opaque', retry: spec.retry || 0, refs: refs.map((p) => sha(fs.readFileSync(r(p)))) })).slice(0, 12) : null;
      out.push({ id, form, n, spec, prompt, refs, key });
    }
  }
  return out;
}
const rawOf = (c) => `${GEN}/raw/${c.id}/${c.key}_0.png`;
function state(c) {
  if (!c.key) return 'no refs';
  if (fs.existsSync(r(rawOf(c)))) return 'ok';
  return fs.existsSync(r(`${GEN}/raw/${c.id}`)) && fs.readdirSync(r(`${GEN}/raw/${c.id}`)).some((f) => f.endsWith('.png')) ? 'stale' : 'missing';
}

// ---------------------------------------------------------------- refs: plain crops of the scan
async function refs() {
  for (const [form, f] of forms) {
    for (const [k, ref] of f.refs.entries()) {
      const [u0, v0, u1, v1] = ref.scan;
      const w = u1 - u0, h = v1 - v0, long = Math.max(w, h);
      const s = Math.min(1024, Math.max(640, long)) / long; // small crops are enlarged so the strokes read
      await sharp(r(SCAN), { limitInputPixels: false }).extract({ left: u0, top: v0, width: w, height: h })
        .resize(Math.round(w * s), Math.round(h * s), { kernel: 'lanczos3' }).jpeg({ quality: 90 }).toFile(r(refFile(form, k)));
      console.log(`${refFile(form, k)}: ${ref.of}, scan u ${u0}-${u1}, v ${v0}-${v1}`);
    }
  }
}

// ---------------------------------------------------------------- gen: shyfai batch, opaque white background
// the API sometimes ignores background: opaque and cuts the tree out itself, with a soft matte that leaves a haze
// between the shoots; such a draw is set aside (<key>_cutout_<i>.png) and drawn again
async function cutOut(file) {
  const img = sharp(r(file));
  if (!(await img.metadata()).hasAlpha) return false;
  const a = await img.extractChannel(3).raw().toBuffer();
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] < 250) n++;
  return n > a.length * 0.01;
}
async function setAside(c) {
  const dir = r(`${GEN}/raw/${c.id}`), k = fs.readdirSync(dir).filter((f) => f.startsWith(`${c.key}_cutout_`)).length;
  fs.renameSync(r(rawOf(c)), `${dir}/${c.key}_cutout_${k}.png`);
  console.log(`${c.id}: came back cut out by the API; set aside, drawing again`);
}
async function gen() {
  for (const c of cards()) if (state(c) === 'ok' && (await cutOut(rawOf(c)))) await setAside(c);
  for (let round = 0; round < 3; round++) {
    const want = cards().filter((c) => c.key && ((flag('--force') && round === 0) || state(c) !== 'ok'));
    if (!want.length) { console.log('all cards up to date'); return; }
    const file = r(`${GEN}/jobs.jsonl`);
    fs.writeFileSync(file, want.map((c) => {
      fs.mkdirSync(r(`${GEN}/raw/${c.id}`), { recursive: true });
      fs.writeFileSync(r(`${GEN}/raw/${c.id}/${c.key}.prompt.txt`), c.prompt + '\n');
      return JSON.stringify({ out: `${GEN}/raw/${c.id}/${c.key}`, prompt: c.prompt, model: CFG.model, size: c.spec.size, ref: c.refs, extra: { background: 'opaque' } });
    }).join('\n') + '\n');
    console.log(`drawing ${want.length} cards: ${want.map((c) => c.id).join(' ')}`);
    const res = spawnSync('python3', ['-I', 'tools/shyfai_image.py', '--batch', file, '--jobs', opt('--jobs', '3'), '--timeout', '900'], { cwd: ROOT, stdio: 'inherit' });
    let again = 0;
    for (const c of want) {
      if (!fs.existsSync(r(rawOf(c))) || !(await cutOut(rawOf(c)))) continue;
      await setAside(c);
      again++;
    }
    if (!again && !res.status) return;
    if (!again) { console.log('some cards failed; drawing them again'); }
  }
}

// ---------------------------------------------------------------- key: white paper -> alpha
// float blur (three box passes ~ gaussian), per channel, in place on a copy
function blur(src, W, H, ch, sigma) {
  const rad = Math.max(1, Math.round(Math.sqrt((12 * sigma * sigma) / 3 + 1) / 2));
  let a = Float32Array.from(src), b = new Float32Array(src.length);
  for (let pass = 0; pass < 3; pass++) {
    for (const horiz of [true, false]) {
      const n = horiz ? W : H, m = horiz ? H : W;
      for (let j = 0; j < m; j++) for (let c = 0; c < ch; c++) {
        const at = (i) => (horiz ? (j * W + i) : (i * W + j)) * ch + c;
        let acc = 0;
        for (let i = -rad; i <= rad; i++) acc += a[at(Math.min(n - 1, Math.max(0, i)))];
        for (let i = 0; i < n; i++) {
          b[at(i)] = acc / (2 * rad + 1);
          acc += a[at(Math.min(n - 1, i + rad + 1))] - a[at(Math.max(0, i - rad))];
        }
      }
      [a, b] = [b, a];
    }
  }
  return a;
}
function dilate(mask, W, H, rad) { // max filter, square
  const t = new Uint8Array(mask.length), o = new Uint8Array(mask.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = 0; for (let i = Math.max(0, x - rad); i <= Math.min(W - 1, x + rad) && !v; i++) v = mask[y * W + i]; t[y * W + x] = v; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = 0; for (let i = Math.max(0, y - rad); i <= Math.min(H - 1, y + rad) && !v; i++) v = t[i * W + x]; o[y * W + x] = v; }
  return o;
}

// The tree is painted on white, and nothing in a tree is whiter than the paper, so d = how far a pixel lies below
// the paper (max over channels) says how much tree it holds. Away from the paper (more than 2 px from any clear
// pixel) every pixel deeper than `gap` is tree where the tree around it is dense (`dense`: the share of confident
// pixels within ~3 px, as on a trunk), so highlights stay; in a porous crown such pixels are paper between needles. In the 2 px band along the paper, a pixel's alpha is its
// projection on the line paper -> local tree colour (the mean of the confident tree pixels around it), and it takes
// that local colour, so the paper never tints an edge (no halo). Pale strokes with no dark core near them keep their
// own colour. Transparent pixels carry the nearby tree colour (for mipmaps), and alpha gets a mild coverage boost so
// one-pixel shoots survive alphaTest 0.5.
async function keyCard(c) {
  const kp = { conf: 0.42, bg: 0.035, gap: 0.1, dense: 0.7, band: 2, gamma: 0.8, ...(CFG.forms[c.form].key || {}), ...(c.spec.key || {}) };
  const raw = rawOf(c), out = `${GEN}/keyed/${c.id}.png`, meta = `${GEN}/keyed/${c.id}.json`;
  const st = fs.statSync(r(raw)), stamp = { raw, bytes: st.size, mtime: Math.round(st.mtimeMs), keyer: KEYER, kp };
  if (!flag('--force') && fs.existsSync(r(meta)) && fs.existsSync(r(out)) && JSON.stringify(JSON.parse(fs.readFileSync(r(meta), 'utf8')).stamp) === JSON.stringify(stamp)) return false;
  // the API sometimes ignores background: opaque and returns its own soft cut-out; laid on white, that is what it
  // would have painted on white, and it is keyed like the rest
  const { data, info } = await sharp(r(raw)).flatten({ background: '#ffffff' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const P = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) P[i] = data[i] / 255;
  // the paper: median of a border band
  const band = Math.round(Math.min(W, H) * 0.015), bs = [[], [], []];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < band || x >= W - band || y < band || y >= H - band) for (let k = 0; k < 3; k++) bs[k].push(P[(y * W + x) * 3 + k]);
  const B = bs.map((a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; });
  const spread = bs.map((a) => a[Math.floor(a.length * 0.95)] - a[Math.floor(a.length * 0.05)]);
  const d = new Float32Array(N), clear = new Uint8Array(N), core = new Float32Array(N * 4);
  for (let p = 0; p < N; p++) {
    d[p] = Math.max(0, B[0] - P[p * 3], B[1] - P[p * 3 + 1], B[2] - P[p * 3 + 2]);
    clear[p] = d[p] < kp.bg ? 1 : 0;
    if (d[p] >= kp.conf) { for (let k = 0; k < 3; k++) core[p * 4 + k] = P[p * 3 + k]; core[p * 4 + 3] = 1; }
  }
  const nearClear = dilate(clear, W, H, kp.band);
  const local1 = blur(core, W, H, 4, 1.2), local2 = blur(core, W, H, 4, 3.5);
  const A = new Float32Array(N), F = new Float32Array(N * 3);
  for (let p = 0; p < N; p++) {
    for (let k = 0; k < 3; k++) F[p * 3 + k] = P[p * 3 + k];
    if (clear[p]) { A[p] = 0; continue; }
    // inside a dense part of the tree (a trunk, a limb) a pale pixel is a highlight; in a porous crown it is paper
    // showing between needles or leaves, and nearly white pixels are paper anywhere
    if ((!nearClear[p] && d[p] >= kp.gap && local2[p * 4 + 3] >= kp.dense) || d[p] >= kp.conf) { A[p] = 1; continue; }
    const local = local1[p * 4 + 3] > 0.06 ? local1 : local2, w = local[p * 4 + 3];
    if (w > 0.015) { // a tree colour close by: project on paper -> that colour
      let num = 0, den = 0;
      for (let k = 0; k < 3; k++) { const f = local[p * 4 + k] / w, e = f - B[k]; num += (P[p * 3 + k] - B[k]) * e; den += e * e; F[p * 3 + k] = f; }
      A[p] = Math.max(0, Math.min(1, den > 1e-4 ? num / den : 0));
    } else { // a pale stroke on its own: its own colour, alpha rising with its depth below the paper
      const a = Math.min(1, (d[p] - kp.bg) / (0.2 - kp.bg));
      A[p] = a;
      for (let k = 0; k < 3; k++) F[p * 3 + k] = Math.max(0, Math.min(1, B[k] + (P[p * 3 + k] - B[k]) / Math.max(a, 0.35)));
    }
    A[p] *= Math.min(1, (d[p] - kp.bg) / kp.bg); // fade in over the paper's noise
  }
  for (let p = 0; p < N; p++) A[p] = Math.pow(A[p], kp.gamma);
  // colour under the clear: premultiplied blur / alpha blur, near then far
  const pm = new Float32Array(N * 4);
  for (let p = 0; p < N; p++) { for (let k = 0; k < 3; k++) pm[p * 4 + k] = F[p * 3 + k] * A[p]; pm[p * 4 + 3] = A[p]; }
  const near = blur(pm, W, H, 4, 3), far = blur(pm, W, H, 4, 24);
  const rgba = Buffer.alloc(N * 4);
  for (let p = 0; p < N; p++) {
    const a = A[p];
    for (let k = 0; k < 3; k++) {
      const src = near[p * 4 + 3] > 0.01 ? near : far;
      const bc = src[p * 4 + 3] > 1e-4 ? src[p * 4 + k] / src[p * 4 + 3] : 0.42;
      const t = Math.min(1, a * 2);
      rgba[p * 4 + k] = Math.round(255 * Math.max(0, Math.min(1, t * F[p * 3 + k] + (1 - t) * bc)));
    }
    rgba[p * 4 + 3] = Math.round(255 * a);
  }
  // the tree's box (columns and rows holding at least 3 solid pixels) and its foot
  const solid = (p) => rgba[p * 4 + 3] >= 128;
  const colN = new Int32Array(W), rowN = new Int32Array(H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (solid(y * W + x)) { colN[x]++; rowN[y]++; }
  const first = (arr) => arr.findIndex((v) => v >= 3), last = (arr) => arr.length - 1 - [...arr].reverse().findIndex((v) => v >= 3);
  const box = { x0: first(colN), x1: last(colN), y0: first(rowN), y1: last(rowN) };
  const footRows = Math.max(3, Math.round((box.y1 - box.y0) * 0.02));
  let sx = 0, sn = 0;
  for (let y = box.y1 - footRows + 1; y <= box.y1; y++) for (let x = box.x0; x <= box.x1; x++) if (solid(y * W + x)) { sx += x; sn++; }
  const foot = [sx / sn, box.y1];
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toFile(r(out));
  fs.writeFileSync(r(meta), JSON.stringify({ stamp, paper: B.map((v) => +v.toFixed(3)), paper_spread: spread.map((v) => +v.toFixed(3)), size: [W, H], box, foot }, null, 1));
  // review image: alpha-tested (0.5) on dark and on light, alpha-blended on grey, and a 1:1 crop of the crown on dark
  const comp = (bg, test) => {
    const o = Buffer.alloc(N * 3);
    for (let p = 0; p < N; p++) { const a = test ? (rgba[p * 4 + 3] >= 128 ? 1 : 0) : rgba[p * 4 + 3] / 255; for (let k = 0; k < 3; k++) o[p * 3 + k] = Math.round(rgba[p * 4 + k] * a + bg[k] * (1 - a)); }
    return sharp(o, { raw: { width: W, height: H, channels: 3 } });
  };
  const th = 600, tw = Math.round((W * th) / H);
  const tiles = await Promise.all([comp([28, 30, 34], true), comp([226, 224, 216], true), comp([128, 134, 140], false)].map((s) => s.resize(tw, th).png().toBuffer()));
  const zx = Math.max(0, Math.min(W - 300, Math.round((box.x0 + box.x1) / 2 - 150))), zy = Math.max(0, box.y0 + Math.round((box.y1 - box.y0) * 0.15));
  const zoom = await comp([28, 30, 34], true).extract({ left: zx, top: Math.min(H - 300, zy), width: 300, height: 300 }).resize(th, th, { kernel: 'nearest' }).png().toBuffer();
  await sharp({ create: { width: tw * 3 + th, height: th, channels: 3, background: '#000' } })
    .composite([...tiles.map((t, i) => ({ input: t, left: i * tw, top: 0 })), { input: zoom, left: tw * 3, top: 0 }]).jpeg({ quality: 85 }).toFile(r(`${GEN}/check/${c.id}.jpg`));
  return true;
}
async function key() {
  for (const c of cards()) {
    if (state(c) !== 'ok') { console.log(`${c.id}: no current image (${state(c)})`); continue; }
    const did = await keyCard(c);
    const m = JSON.parse(fs.readFileSync(r(`${GEN}/keyed/${c.id}.json`), 'utf8'));
    console.log(`${c.id}: ${did ? 'keyed' : 'up to date'}; paper ${m.paper.join(',')} (spread ${m.paper_spread.join(',')}), tree ${m.box.x1 - m.box.x0 + 1}x${m.box.y1 - m.box.y0 + 1} px`);
  }
}

// ---------------------------------------------------------------- ship: crop, scale, webp, trees.json
async function ship() {
  fs.mkdirSync(r(ASSETS), { recursive: true });
  const regPath = r(`${ASSETS}/trees.json`);
  const reg = fs.existsSync(regPath) ? JSON.parse(fs.readFileSync(regPath, 'utf8')) : {};
  for (const c of cards()) {
    const meta = r(`${GEN}/keyed/${c.id}.json`);
    if (!fs.existsSync(meta)) { console.log(`${c.id}: not keyed`); continue; }
    const m = JSON.parse(fs.readFileSync(meta, 'utf8'));
    if (m.stamp.raw !== rawOf(c)) { console.log(`${c.id}: keyed image is stale; run key`); continue; }
    const pad = 6, { x0, x1, y0, y1 } = m.box;
    const left = Math.max(0, x0 - pad), top = Math.max(0, y0 - pad), right = Math.min(m.size[0] - 1, x1 + pad), bottom = Math.min(m.size[1] - 1, y1 + 2);
    const cw = right - left + 1, ch = bottom - top + 1;
    // small trees (saplings, the hedge row) ship smaller: the form's or variant's ship_h in cards.json
    const s = Math.min(1, (c.spec.ship_h || CFG.forms[c.form].ship_h || CARD_H) / ch), w = Math.round(cw * s), h = Math.round(ch * s);
    const file = `${ASSETS}/${c.id}.webp`;
    const px = await sharp(r(`${GEN}/keyed/${c.id}.png`)).extract({ left, top, width: cw, height: ch }).resize(w, h, { kernel: 'lanczos3' }).raw().toBuffer();
    // budget: 160 KB a card (300 KB at 1024 px until 2026-10-12). Soft alpha (smooth edges under alpha-to-coverage and close up) while it fits; the dense
    // crowns step down to alpha cut at 0.5 (what alphaTest 0.5 shows anyway; mipmaps still average it into coverage)
    // and a lower colour quality. exact keeps the tree colour bled under the clear pixels, for mipmaps
    const hard = Buffer.from(px);
    for (let i = 3; i < hard.length; i += 4) hard[i] = hard[i] >= 128 ? 255 : 0;
    const tries = [['soft', 88], ['soft', 84], ['hard', 86], ['hard', 82], ['hard', 78], ['hard', 74]];
    let buf, used;
    for (const [alpha, q] of tries) {
      buf = await sharp(alpha === 'soft' ? px : hard, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: q, alphaQuality: 90, effort: 6, exact: true }).toBuffer();
      used = { alpha, q };
      if (buf.length <= 160 * 1024) break;
    }
    fs.writeFileSync(r(file), buf);
    // mean colour of the solid pixels (sRGB), for palette work
    const { data } = await sharp(r(file)).raw().toBuffer({ resolveWithObject: true });
    let rr = 0, gg = 0, bb = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i + 3] >= 128) { rr += data[i]; gg += data[i + 1]; bb += data[i + 2]; n++; }
    const hex = '#' + [rr, gg, bb].map((v) => Math.round(v / n).toString(16).padStart(2, '0')).join('');
    const treeH = c.spec.height_m, treePx = (y1 - y0 + 1) * s; // the tree, foot to crown top, is height_m tall
    const height_m = +((treeH * h) / treePx).toFixed(3);
    reg[c.id] = {
      file: `assets/trees/${c.id}.webp`, form: c.form,
      base_uv: [+(((m.foot[0] - left) * s) / w).toFixed(4), +((h - (m.foot[1] - top + 1) * s) / h).toFixed(4)],
      height_m, width_m: +((height_m * w) / h).toFixed(3), tree_m: treeH, px: [w, h],
      kb: Math.round(fs.statSync(r(file)).size / 1024), alpha: used.alpha, webp_q: used.q, mean: hex,
    };
    console.log(`${file}: ${w}x${h}, ${reg[c.id].kb} KB (${used.alpha} alpha, q${used.q}), base_uv ${reg[c.id].base_uv}, ${reg[c.id].width_m} x ${height_m} m`);
  }
  // a full ship (no --form/--only) drops cards that cards.json no longer lists, and their files
  if (!opt('--form') && !opt('--only')) {
    const live = new Set(Object.entries(CFG.forms).flatMap(([f, v]) => Object.keys(v.variants).map((n) => `${f}_${n}`)));
    for (const k of Object.keys(reg)) if (k !== 'about' && !live.has(k)) {
      fs.rmSync(r(`web/public/${reg[k].file}`), { force: true });
      delete reg[k];
      console.log(`${k}: retired (not in trees/cards.json); removed from trees.json and ${ASSETS}`);
    }
  }
  const ordered = { about: 'Tree cards (tools/tree_cards.mjs; trees/notes.md). Each card: file; form; base_uv = the trunk foot in the image (u from the left, v from the bottom, 0-1); height_m x width_m = the card plane at scale 1, so that the tree on it, foot to crown top, is tree_m tall (its real height); px; kb; alpha (soft: anti-aliased; hard: cut at 0.5, for the 300 KB budget) and webp_q; mean = mean sRGB of the solid pixels. Painted in true colours: the page should not retint them.' };
  for (const k of Object.keys(reg).filter((k) => k !== 'about').sort()) ordered[k] = reg[k];
  fs.writeFileSync(regPath, JSON.stringify(ordered, null, 1) + '\n');
}

// ---------------------------------------------------------------- small: a 256 px copy of every card, loaded first
// (perf batch 2, "First load"): the page puts these on the trees while the window streams in and swaps each for the
// full card once the stream has nothing else to load (web/src/world.js, sharpenCards). trees/small/<card>.webp, listed
// in trees.json as `small`; made again when the card's webp is newer. Not a KTX2 kind (tools/ktx2.mjs lists only
// trees/*.webp): a 256 px webp is 5-25 KB, and it is dropped from the GPU after the swap.
const SMALL_H = 256;
async function small() {
  const regPath = r(`${ASSETS}/trees.json`), dir = `${ASSETS}/small`;
  const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));
  fs.mkdirSync(r(dir), { recursive: true });
  let made = 0, kb = 0, n = 0;
  for (const [id, c] of Object.entries(reg)) {
    if (id === 'about') continue;
    const src = r(`web/public/${c.file}`), file = `${dir}/${id}.webp`;
    delete c.small;
    if (!fs.existsSync(src) || c.px[1] <= SMALL_H) continue;
    if (flag('--force') || !fs.existsSync(r(file)) || fs.statSync(r(file)).mtimeMs < fs.statSync(src).mtimeMs) {
      // the card's own aspect (its plane is width_m x height_m over the whole image); exact keeps the colour under the
      // clear pixels, as the full card's, for the mipmaps
      const w = Math.max(4, Math.round((c.px[0] * SMALL_H) / c.px[1]));
      await sharp(src).resize(w, SMALL_H, { kernel: 'lanczos3' }).webp({ quality: 82, alphaQuality: 90, effort: 6, exact: true }).toFile(r(file));
      made++;
    }
    c.small = `assets/trees/small/${id}.webp`;
    kb += fs.statSync(r(file)).size / 1024;
    n++;
  }
  for (const f of fs.readdirSync(r(dir))) if (!reg[f.replace(/\.webp$/, '')]?.small) fs.rmSync(r(`${dir}/${f}`)); // a retired card's copy
  fs.writeFileSync(regPath, JSON.stringify(reg, null, 1) + '\n');
  console.log(`small cards: ${n} (${made} made), ${Math.round(kb)} KB together, ${SMALL_H} px tall -> ${dir}/`);
}

// ---------------------------------------------------------------- sheet: every shipped card, named
async function sheet() {
  const reg = JSON.parse(fs.readFileSync(r(`${ASSETS}/trees.json`), 'utf8'));
  const order = Object.entries(CFG.forms).flatMap(([f, v]) => Object.keys(v.variants).map((n) => `${f}_${n}`));
  const ids = order.filter((k) => reg[k]);
  const TH = 300, LABEL = 22, tiles = [];
  for (const id of ids) {
    const c = reg[id];
    const { data, info } = await sharp(r(`web/public/${c.file}`)).resize({ height: TH }).raw().toBuffer({ resolveWithObject: true });
    const W = info.width, N = W * TH;
    const panel = (bg, test) => {
      const o = Buffer.alloc(N * 3);
      for (let p = 0; p < N; p++) { const a = test ? (data[p * 4 + 3] >= 128 ? 1 : 0) : data[p * 4 + 3] / 255; for (let k = 0; k < 3; k++) o[p * 3 + k] = Math.round(data[p * 4 + k] * a + bg[k] * (1 - a)); }
      return sharp(o, { raw: { width: W, height: TH, channels: 3 } }).png().toBuffer();
    };
    const fx = c.base_uv[0] * W, fy = (1 - c.base_uv[1]) * TH;
    const mark = Buffer.from(`<svg width="${W}" height="${TH}"><path d="M${fx - 6} ${fy}h12M${fx} ${fy - 6}v12" stroke="#ff3030" stroke-width="2"/></svg>`);
    const tw = W * 2 + 6;
    const label = Buffer.from(`<svg width="${tw}" height="${LABEL}"><text x="4" y="16" font-family="sans-serif" font-size="14" fill="#eee">${id}  ${c.tree_m} m  ${c.kb} KB</text></svg>`);
    tiles.push({ id, w: tw, buf: await sharp({ create: { width: tw, height: TH + LABEL, channels: 3, background: '#111' } })
      .composite([{ input: await panel([138, 142, 146], false), left: 0, top: 0 }, { input: mark, left: 0, top: 0 },
        { input: await panel([24, 26, 30], true), left: W + 6, top: 0 }, { input: mark, left: W + 6, top: 0 }, { input: label, left: 0, top: TH }]).png().toBuffer() });
  }
  // rows of at most 2400 px
  const rows = [[]];
  let x = 0;
  for (const t of tiles) { if (x + t.w > 2400 && rows.at(-1).length) { rows.push([]); x = 0; } rows.at(-1).push(t); x += t.w + 10; }
  const SW = Math.max(...rows.map((row) => row.reduce((s, t) => s + t.w + 10, 0))), SH = rows.length * (TH + LABEL + 10);
  const comps = [];
  rows.forEach((row, j) => { let xx = 0; for (const t of row) { comps.push({ input: t.buf, left: xx, top: j * (TH + LABEL + 10) }); xx += t.w + 10; } });
  await sharp({ create: { width: SW, height: SH, channels: 3, background: '#000' } }).composite(comps).jpeg({ quality: 86 }).toFile(r(`${GEN}/sheet.jpg`));
  console.log(`${GEN}/sheet.jpg: ${ids.length} cards`);
}

// ---------------------------------------------------------------- check: every mapped tree has a shipped card, and
// no two trees within 6 m share a card, and none within 15 m (across the seams: one world frame) show the same card
// the same way round.
// The two distances were set for full-size trees (8-11 m); a copy reads as a copy when the twins stand within about
// 0.75 and 1.9 of their own height of each other. So for small trees both radii shrink with the height the page shows
// (round 2, the lead, 2026-10-12, for S1's grove of 14 saplings 0.2-2 m apart): for a pair, the taller one's shown
// height H = its card's tree_m x the page's scale clamp(mapped height_m / card height_m, 0.7, 1.4) (web/src/world.js
// placeTrees), and both radii are multiplied by min(1, H / 8 m). Full-size trees (H >= 8 m) keep 6 m and 15 m; a pair
// of 2 m saplings gets 1.5 m and 3.75 m. A tree with no mapped height keeps the full radii. Shrinking only ever drops
// conflicts, so every assignment that passed before still passes.
// A tree built as a solid model in its section's kit (S4b's stump) is assigned {"card": "kit"}: it has no card and
// takes no part in the rule.
function check() {
  const reg = JSON.parse(fs.readFileSync(r(`${ASSETS}/trees.json`), 'utf8'));
  const NEAR = 15, CLOSE = 6, FULL = 8, all = [];
  let bad = 0, kit = 0;
  // every section with a folder whose map has been made (map/sections.json)
  const SECS = Object.entries(JSON.parse(fs.readFileSync(r('map/sections.json'), 'utf8'))).filter(([k, v]) => /^S\d[a-z]?$/.test(k) && v.folder && fs.existsSync(r(`map/world/${k}.json`))).map(([k]) => k);
  for (const S of SECS) {
    const ap = r(`trees/assign/${S}.json`);
    const assign = fs.existsSync(ap) ? JSON.parse(fs.readFileSync(ap, 'utf8')) : {};
    const ents = JSON.parse(fs.readFileSync(r(`map/world/${S}.json`), 'utf8')).entities.filter((e) => e.kind === 'tree');
    for (const e of ents) {
      const a = assign[e.id];
      if (!a) { console.log(`MISSING ${e.id}: no card in trees/assign/${S}.json`); bad++; continue; }
      if (a.card === 'kit') { kit++; continue; }
      const c = reg[a.card];
      if (!c) { console.log(`UNKNOWN ${e.id}: card ${a.card} is not in trees.json`); bad++; continue; }
      const shown = e.height_m ? c.tree_m * Math.min(1.4, Math.max(0.7, e.height_m / c.height_m)) : null;
      all.push({ id: e.id, pos: e.pos, card: a.card, flip: !!a.flip, shown });
    }
    for (const id of Object.keys(assign)) if (!ents.find((e) => e.id === id)) { console.log(`STALE ${id}: not a tree in map/world/${S}.json`); bad++; }
  }
  let mirrored = 0, scaled = 0;
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j], d = Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1]);
    if (d > NEAR || a.card !== b.card) continue;
    const f = a.shown && b.shown ? Math.min(1, Math.max(a.shown, b.shown) / FULL) : 1;
    const fails = (k) => d <= CLOSE * k || (d <= NEAR * k && a.flip === b.flip);
    if (fails(1) && !fails(f)) scaled++;
    const tag = f < 1 ? ` (small trees, ${(f * FULL).toFixed(1)} m tall: radii ${(CLOSE * f).toFixed(1)} / ${(NEAR * f).toFixed(1)} m)` : '';
    if (d <= CLOSE * f) { console.log(`CLOSE ${a.id} and ${b.id}: both ${a.card}, ${d.toFixed(1)} m apart${tag} (a mirrored twin this close reads as a copy)`); bad++; }
    else if (d <= NEAR * f && a.flip === b.flip) { console.log(`REPEAT ${a.id} and ${b.id}: both ${a.card}${a.flip ? ' mirrored' : ''}, ${d.toFixed(1)} m apart${tag}`); bad++; } else if (d <= NEAR * f) mirrored++;
  }
  const used = {};
  for (const t of all) used[t.card] = (used[t.card] || 0) + 1;
  console.log(`${all.length} trees on ${Object.keys(used).length} of ${Object.keys(reg).length - 1} cards${kit ? ` (+${kit} built as kit models)` : ''}; ${mirrored} pairs share a card mirrored inside the radii; ${scaled} pairs pass only because the radii scale with height; ${bad ? `${bad} problems: FAIL` : 'PASS'}`);
  if (bad) process.exitCode = 1;
}

if (step === 'status') for (const c of cards()) console.log(c.id.padEnd(16), state(c), c.key || '');
if (step === 'refs' || step === 'all') await refs();
if (step === 'gen' || step === 'all') await gen();
if (step === 'key' || step === 'all') await key();
if (step === 'ship' || step === 'all') await ship();
if (step === 'ship' || step === 'all' || step === 'small') await small(); // after every ship: ship rewrites trees.json
if (step === 'sheet' || step === 'all') await sheet();
if (step === 'check' || step === 'all') check();
