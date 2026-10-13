#!/usr/bin/env node
// The painted backdrop of a scene (map/BUILDING.md: beyond the walkable area the world is painting, not models).
// sections/<name>/backdrop.json lists the panels. Each one restyles the scroll strip that lies past that edge (scan:
// one rect [u0, v0, u1, v1], or a list of rects joined side by side, to leave out what is built in 3D or a seal)
// with prompts/backdrop_panel.txt + its content prompt (prompts/backdrop_<name>_<side>.txt) and the style image,
// seen from eye level on a plain white ground. ship keys the white out, takes the white out of every edge
// (decontamination), fades the ends, measures the painted horizon and writes the panel for web/src/backdrop.js,
// which stands it on the ring at its true aspect with that horizon at eye level.
//   node tools/backdrop.mjs <name> [status|cut|gen|ship|sheet|all] [--only east,north] [--force] [--review]
// ship --review keys every panel and writes the review sheets without touching the page's panels.
// gen is cached per panel by a key over its prompt text, model, size, candidates and reference hashes (like
// scroll_pipeline.mjs); a panel with `candidates` > 1 makes that many images and ships the one named by `pick`.
// Panel fields (backdrop.json): side, angle, width (degrees on the ring), scan, content, why, and optionally
//   candidates (default 1), pick (default 0), horizon / foot (fractions of the raw image height from its top, to
//   override the measured ones), ground (a cap on the ground strip, a fraction of the width: a trial, see key()),
//   fade (the ends' fade, a fraction of the width, default 0.12), hold (a reason: the
//   panel is not shipped, so the page shows mist there, until its painting passes the side-by-side review).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => path.join(ROOT, p);
const sharp = createRequire(r('tools/package.json'))('sharp');
const [name, step = 'status', ...rest] = process.argv.slice(2);
const flag = (f) => rest.includes(f);
const opt = (f, d) => (rest.includes(f) ? rest[rest.indexOf(f) + 1] : d);
const cfg = JSON.parse(fs.readFileSync(r(`sections/${name}/backdrop.json`), 'utf8'));
const OUT = `gen/sections/${name}/backdrop`;
const ASSETS = `web/public/assets/${name}`;
const SCAN = 'reference/scroll/qingming_commons_38414x1800.jpg';
const STYLE = 'prompts/style_B1.png';
const MODEL = cfg.model || 'gpt-image-2.5';
const SIZE = cfg.size || '3584x1280'; // the model's widest: it answers about 2.8:1 whatever is asked
const SHIP_W = 2048;
fs.mkdirSync(r(OUT), { recursive: true });
const only = opt('--only') ? new Set(opt('--only').split(',')) : null;
const panels = cfg.panels.filter((p) => !only || only.has(p.side));

function prompt(pname, seen = new Set(), vars = {}) {
  if (seen.has(pname)) throw new Error(`prompt loop at ${pname}`);
  const text = fs.readFileSync(r(`prompts/${pname}.txt`), 'utf8').trim();
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : fs.existsSync(r(`prompts/${k}.txt`)) ? prompt(k, new Set([...seen, pname])) : m));
}
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const src = (p) => `${OUT}/${p.side}_scroll.jpg`;
const raw = (p, i = p.pick || 0) => `${OUT}/${p.side}_${i}.png`;
const keyFile = (p) => `${OUT}/${p.side}.key`;
const rects = (p) => (Array.isArray(p.scan[0]) ? p.scan : [p.scan]);
function job(p) {
  const body = { prompt: prompt('backdrop_panel', new Set(), { content: prompt(p.content) }), model: MODEL, size: SIZE, quality: 'auto', n: p.candidates || 1 };
  const refs = [STYLE, src(p)];
  const key = refs.every((f) => fs.existsSync(r(f))) ? sha(JSON.stringify({ ...body, refs: refs.map((f) => sha(fs.readFileSync(r(f)))) })) : null;
  return { p, body, refs, key };
}
const state = (p) => {
  if (!fs.existsSync(r(raw(p, 0)))) return 'missing';
  const k = job(p).key;
  return fs.existsSync(r(keyFile(p))) && fs.readFileSync(r(keyFile(p)), 'utf8') === k ? 'ok' : 'stale';
};

// the scan strip: one rect, or several joined side by side (all scaled to the first one's height)
async function cut() {
  for (const p of panels) {
    const rs = rects(p), h = Math.min(1790, rs[0][3] - rs[0][1]);
    const pieces = await Promise.all(rs.map(([u0, v0, u1, v1]) => sharp(r(SCAN)).extract({ left: u0, top: v0, width: u1 - u0, height: v1 - v0 }).resize({ height: h }).toBuffer({ resolveWithObject: true })));
    const W = pieces.reduce((a, q) => a + q.info.width, 0);
    let x = 0;
    const comp = pieces.map((q) => { const o = { input: q.data, left: x, top: 0 }; x += q.info.width; return o; });
    const img = sharp({ create: { width: W, height: h, channels: 3, background: '#ffffff' } }).composite(comp);
    const buf = await img.jpeg().toBuffer();
    await sharp(buf).resize({ width: Math.min(2048, W) }).jpeg({ quality: 90 }).toFile(r(src(p)));
    console.log(`${src(p)}: scan ${rs.map((q) => `u ${q[0]}-${q[2]} v ${q[1]}-${q[3]}`).join(' + ')}`);
  }
}

function gen() {
  const want = panels.filter((p) => flag('--force') || state(p) !== 'ok');
  if (!want.length) { console.log('all panels up to date'); return; }
  const jobs = want.map(job);
  const file = r(`${OUT}/jobs.jsonl`);
  fs.writeFileSync(file, jobs.map((j) => JSON.stringify({ out: `${OUT}/${j.p.side}`, prompt: j.body.prompt, model: j.body.model, size: j.body.size, n: j.body.n, ref: j.refs })).join('\n') + '\n');
  const res = spawnSync('python3', ['-I', 'tools/shyfai_image.py', '--batch', file, '--jobs', '3', '--timeout', '900'], { cwd: ROOT, stdio: 'inherit' });
  for (const j of jobs) if (fs.existsSync(r(raw(j.p, 0))) && fs.statSync(r(raw(j.p, 0))).mtimeMs > Date.now() - 3600e3) fs.writeFileSync(r(keyFile(j.p)), j.key);
  if (res.status) console.log('some panels failed; rerun gen to retry only those');
}

// ---- image helpers (Float32 RGB 0-1, row-major) ----
const ss = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const dist3 = (a, i, b, j) => Math.hypot(a[i] - b[j], a[i + 1] - b[j + 1], a[i + 2] - b[j + 2]);
const med = (xs) => { const t = Float32Array.from(xs).sort(); return t[t.length >> 1]; };
async function loadRGB(file, w) {
  const { data, info } = await sharp(r(file)).removeAlpha().resize({ width: w }).raw().toBuffer({ resolveWithObject: true });
  return { W: info.width, H: info.height, c: Float32Array.from(data, (v) => v / 255) };
}
// push-pull fill: every pixel gets a colour; where the weight is low it comes from the nearest weighted pixels
function pushPull(c, w, W, H) {
  const lv = [{ W, H, s: Float32Array.from(c, (v, i) => v * w[(i / 3) | 0]), w: Float32Array.from(w) }];
  while (lv.at(-1).W > 1 || lv.at(-1).H > 1) {
    const a = lv.at(-1), nW = Math.ceil(a.W / 2), nH = Math.ceil(a.H / 2);
    const s = new Float32Array(nW * nH * 3), ww = new Float32Array(nW * nH);
    for (let y = 0; y < a.H; y++) for (let x = 0; x < a.W; x++) {
      const i = y * a.W + x, j = (y >> 1) * nW + (x >> 1);
      ww[j] += a.w[i]; s[j * 3] += a.s[i * 3]; s[j * 3 + 1] += a.s[i * 3 + 1]; s[j * 3 + 2] += a.s[i * 3 + 2];
    }
    lv.push({ W: nW, H: nH, s, w: ww });
  }
  let up = null;
  for (let L = lv.length - 1; L >= 0; L--) {
    const a = lv[L], out = new Float32Array(a.W * a.H * 3);
    for (let y = 0; y < a.H; y++) for (let x = 0; x < a.W; x++) {
      const i = y * a.W + x, k = Math.max(0, 1 - a.w[i]);
      for (let ch = 0; ch < 3; ch++) {
        const par = up ? up.c[((y >> 1) * up.W + (x >> 1)) * 3 + ch] : 0;
        out[i * 3 + ch] = a.w[i] + k > 0 ? (a.s[i * 3 + ch] + k * par) / (a.w[i] + k) : par;
      }
    }
    up = { W: a.W, H: a.H, c: out };
  }
  return up.c;
}
// float blur of an n-channel image (three sliding box passes ~ a Gaussian of sigma px), as in tools/tree_cards.mjs
function blurN(src, W, H, ch, sigma) {
  const rad = Math.max(1, Math.round(Math.sqrt((12 * sigma * sigma) / 3 + 1) / 2));
  let a = Float32Array.from(src), b = new Float32Array(src.length);
  for (let pass = 0; pass < 3; pass++) {
    for (const horiz of [true, false]) {
      const n = horiz ? W : H, m = horiz ? H : W;
      for (let j = 0; j < m; j++) for (let k = 0; k < ch; k++) {
        const at = (i) => (horiz ? j * W + i : i * W + j) * ch + k;
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
function blur3(c, W, H, rad) { // box blur twice (about a Gaussian), radius in px
  let a = c, b = new Float32Array(c.length);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let ch = 0; ch < 3; ch++) {
      let s = 0, n = 0; for (let d = -rad; d <= rad; d++) { const xx = x + d; if (xx >= 0 && xx < W) { s += a[(y * W + xx) * 3 + ch]; n++; } } b[(y * W + x) * 3 + ch] = s / n;
    }
    const t = new Float32Array(c.length);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let ch = 0; ch < 3; ch++) {
      let s = 0, n = 0; for (let d = -rad; d <= rad; d++) { const yy = y + d; if (yy >= 0 && yy < H) { s += b[(yy * W + x) * 3 + ch]; n++; } } t[(y * W + x) * 3 + ch] = s / n;
    }
    a = t;
  }
  return a;
}

// The paper of the panel (the white sky above the painted things and the white mist below them) as a smooth colour
// field. Follow the sky's colour down from the top row by row while it shows in at least 4% of the row and stays
// paper-pale: the row where it stops showing is where the painted ground closes, the horizon (skyEnd). Follow the
// mist up from the bottom row the same way: where it stops is the front of the painted ground (mistStart). Between
// them is the strip of ground, never keyed. The pixels close to their row's paper colour above and below are filled
// across the rest (behind trees, roofs and the ground strip).
function paperField(c, W, H) {
  const lum = (s) => 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  const rowMed = (y) => [0, 1, 2].map((ch) => med(Array.from({ length: W }, (_, x) => c[(y * W + x) * 3 + ch])));
  const sky0 = rowMed(0);
  const paper = (s) => lum(s) > 0.7 && Math.hypot(s[0] - sky0[0], s[1] - sky0[1], s[2] - sky0[2]) < 0.12;
  const track = (rows, first) => {
    const out = new Array(H).fill(null);
    let sky = first, last = rows[0];
    if (!paper(sky)) return { out, end: rows[0] };
    for (const y of rows) {
      const near = [];
      for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; if (Math.hypot(c[i] - sky[0], c[i + 1] - sky[1], c[i + 2] - sky[2]) < 0.06) near.push(i); }
      if (near.length < W * 0.04) break;
      const next = [0, 1, 2].map((ch) => med(near.map((i) => c[i + ch])));
      if (!paper(next)) break;
      sky = next; out[y] = sky; last = y;
    }
    return { out, end: last };
  };
  const top = track([...Array(H).keys()], sky0);
  const bot = track([...Array(H).keys()].reverse(), rowMed(H - 1));
  const skyEnd = top.end + 1, mistStart = bot.out[H - 1] ? bot.end - 1 : H - 1;
  const w = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    const s = y < skyEnd ? top.out[y] : y > mistStart ? bot.out[y] : null;
    if (s) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; if (Math.hypot(c[i] - s[0], c[i + 1] - s[1], c[i + 2] - s[2]) < 0.045) w[y * W + x] = 1; }
  }
  return { B: pushPull(c, w, W, H), skyEnd: skyEnd / H, mistStart: (mistStart + 1) / H };
}

// key one panel: alpha from the distance to the paper colour, and the colour of every part-transparent pixel moved
// away from the paper by the same amount (so the panel over the paper gives back the painting exactly, and over the
// sky or the night shows no paper fringe). In the ground strip between the horizon and the mist everything that is
// not paper is opaque (pale walls and dust stay solid; only paper-white haze goes).
// The edge matte (2026-10-12, after tools/tree_cards.mjs; trees/notes.md, Keying). A fine twig covers only part of a
// pixel, so its pixel is a mix of paper and ink. Unmixed toward a colour DREF from the paper, as above, it came out
// pale, and a crown of fine twigs became a pale cloud: white blossom by day, a glow at night (37% of the gate north
// panel's visible pixels near-white). So in the sky and the mist, where the
// paper shows close by (the porous parts: crowns, twigs, every outline against the sky; weight z, from the share of
// clear paper, e < CLR with e the distance to the paper, within ~2 px: Z0 none, Z1 all):
// - a pixel at least CONF from the paper is solid;
// - any other takes its colour from the confident ink near it (the mean of the pixels at least CONF from the paper
//   within ~1.2 px, else ~3.5 px, else ~10 px: a fine twig's own branch), and its alpha from where it lies on the line
//   paper -> that colour: thin twigs stay dark, and the paper between them goes;
// - a pale stroke whose colour leaves that line (a pale-green shoot by a brown twig: cos < COS), or with no ink near,
//   is a wash: its own hue, unmixed toward DWASH from the paper (more transparent and deeper than DREF makes it).
// The pale washes inside a crown, away from the paper and from any ink but textured (e varies by TEX within 2 px) or
// open (at least OPEN of the pixels within ~6 px are clear paper), go the same way: the painter's haze of new shoots.
// Everything else, wall faces and pale cloth away from the paper, flat or beside an outline, is unmixed as before; the
// weight z blends the two, so a speck of paper inside a crown or a wall leaves no hole. The ground strip keeps its
// rule, except that a pixel of paper among things (z, e < 2 CLR) goes: the white between far heads and carts where the
// road meets the horizon, which the blur of d had made into opaque paper halos. The keying stays at the ship width:
// keying the painting at its own width and averaging down was tried and left more pale fringe on the gate north
// panel (11% near-white against 8%).
const D0 = 0.03, DREF = 0.14; // below about 2*D0 a pixel is paper (haze wisps go); from DREF on it is opaque
const CLR = 0.03, CONF = 0.35, COS = 0.85, DWASH = 0.3, TEX = 0.1, OPEN = 0.1, Z0 = 0.02, Z1 = 0.1; // the model's white is clean: noise e < 0.015
function minMax(v, W, H, rad) { // per pixel [min, max] of v over a (2 rad + 1)^2 square
  const run = (src, horiz, f) => {
    const out = new Float32Array(src.length);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let m = src[y * W + x];
      for (let k = -rad; k <= rad; k++) { const xx = horiz ? x + k : x, yy = horiz ? y : y + k; if (xx >= 0 && xx < W && yy >= 0 && yy < H) m = f(m, src[yy * W + xx]); }
      out[y * W + x] = m;
    }
    return out;
  };
  return [run(run(v, true, Math.min), false, Math.min), run(run(v, true, Math.max), false, Math.max)];
}
async function key(p) {
  const { W, H, c } = await loadRGB(raw(p), SHIP_W);
  const q = await loadRGB(raw(p), Math.round(W / 4));
  const pf = paperField(blur3(q.c, q.W, q.H, 1), q.W, q.H);
  // ground (trial, 2026-10-12): a cap on the painted ground strip, a fraction of the width. A street painted as a deep
  // wedge has its foot far under the horizon, so the page lifts it (horizon ~5 deg over the eye); with the foot moved
  // up to horizon + ground the page stands the horizon at the eye, and what lies below (the near road, the legs of
  // the near figures) fades into the ground mist. The page lifts nothing whose strip is under ~0.036 of the width.
  const horizon = p.horizon ?? pf.skyEnd, foot0 = p.foot ?? pf.mistStart;
  const foot = p.ground != null ? Math.min(foot0, horizon + (p.ground * W) / H) : foot0;
  const Bs = await sharp(Buffer.from(pf.B.map((v) => Math.round(v * 255))), { raw: { width: q.W, height: q.H, channels: 3 } }).resize(W, H, { kernel: 'cubic' }).raw().toBuffer();
  const B = Float32Array.from(Bs, (v) => v / 255);
  const cb = blur3(c, W, H, 1);
  const N = W * H, e = new Float32Array(N), clear = new Float32Array(N), core = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    e[i] = dist3(c, i * 3, B, i * 3);
    clear[i] = e[i] < CLR ? 1 : 0;
    if (e[i] >= CONF) { for (let ch = 0; ch < 3; ch++) core[i * 4 + ch] = c[i * 3 + ch]; core[i * 4 + 3] = 1; }
  }
  const near = blurN(clear, W, H, 1, 1.5), open = blurN(clear, W, H, 1, 6), [eMin, eMax] = minMax(e, W, H, 2);
  const local1 = blurN(core, W, H, 4, 1.2), local2 = blurN(core, W, H, 4, 3.5), local3 = blurN(core, W, H, 4, 10);
  const a = new Float32Array(N), F = new Float32Array(N * 3), Fn = [0, 0, 0];
  const m = 0.008 * H;
  for (let y = 0; y < H; y++) {
    const band = foot > horizon ? ss(horizon * H - m, horizon * H + m, y) * ss(foot * H + m, foot * H - m, y) : 0;
    for (let x = 0; x < W; x++) {
      const i = y * W + x, I = i * 3;
      const d = dist3(cb, I, B, I), knee = ss(D0, 2 * D0, d);
      const ao = knee * Math.min(1, d / DREF); let ab = band * knee; // as before: the sky's alpha, and the ground strip's
      // the edge treatment and its weight z
      let z = ss(Z0, Z1, near[i]), an = 0;
      if (z < 1 && e[i] < CONF && local2[i * 4 + 3] < 0.02 && (eMax[i] - eMin[i] >= TEX || open[i] >= OPEN)) z = 1;
      if (z > 0) {
        const fade = ss(CLR, 2 * CLR, e[i]);
        let wash = e[i] < CONF;
        if (!wash) { an = 1; for (let ch = 0; ch < 3; ch++) Fn[ch] = c[I + ch]; }
        else {
          const L = local1[i * 4 + 3] > 0.06 ? local1 : local2[i * 4 + 3] > 0.015 ? local2 : local3, w = L[i * 4 + 3];
          if (w > 0.005) {
            let vu = 0, uu = 0, vv = 0;
            for (let ch = 0; ch < 3; ch++) { const f = L[i * 4 + ch] / w, u = f - B[I + ch], v = c[I + ch] - B[I + ch]; Fn[ch] = f; vu += v * u; uu += u * u; vv += v * v; }
            // a pixel too close to the paper for its hue to say anything (paper beside a twig, a hair whiter than
            // the field B) goes through the matte too, which gives it nothing
            if (uu > 1e-4 && (e[i] < 2 * CLR || vu >= COS * Math.sqrt(uu * vv))) { an = Math.max(0, Math.min(1, vu / uu)) * fade; wash = false; }
          }
          if (wash) { // own hue, as a wash of DWASH, alpha raised where the deeper colour would leave the gamut
            let need = 0;
            for (let ch = 0; ch < 3; ch++) { const v = c[I + ch] - B[I + ch]; need = Math.max(need, v < 0 ? -v / Math.max(1e-3, B[I + ch]) : v / Math.max(1e-3, 1 - B[I + ch])); }
            an = Math.min(1, Math.max(e[i] / DWASH, need)) * fade;
            const g = an > 1e-3 ? fade / an : 0;
            for (let ch = 0; ch < 3; ch++) Fn[ch] = Math.max(0, Math.min(1, B[I + ch] + (c[I + ch] - B[I + ch]) * g));
          }
        }
      }
      const as = z * an + (1 - z) * ao;
      // the ground strip keeps its rule, except for a pixel of paper among things (z): the white between far heads
      // and carts where the road meets the horizon, which the blur of d made into opaque paper halos
      if (z > 0) ab *= 1 - z * (1 - ss(CLR, 2 * CLR, e[i]));
      if (ab >= as || z === 0) { // the ground strip, or as before
        const al = Math.max(ab, ao), g = al > 1e-3 ? knee / al : 0;
        a[i] = ab >= as ? ab : al;
        const gg = ab >= as ? (ab > 1e-3 ? knee / ab : 0) : g;
        for (let ch = 0; ch < 3; ch++) F[I + ch] = Math.max(0, Math.min(1, B[I + ch] + (c[I + ch] - B[I + ch]) * gg));
      } else { // the blend, premultiplied: the old colour weighs 1 - z, the edge's z
        a[i] = as;
        const go = ao > 1e-3 ? knee / ao : 0;
        for (let ch = 0; ch < 3; ch++) {
          const fo = Math.max(0, Math.min(1, B[I + ch] + (c[I + ch] - B[I + ch]) * go));
          F[I + ch] = as > 1e-4 ? (z * an * Fn[ch] + (1 - z) * ao * fo) / as : fo;
        }
      }
    }
  }
  return { W, H, a, F, horizon: Math.round(horizon * H), foot: Math.round(foot * H), measured: pf, capped: foot < foot0 ? foot0 : null };
}

async function ship() {
  fs.mkdirSync(r(ASSETS), { recursive: true });
  const shipped = JSON.parse(JSON.stringify(cfg));
  // panels not shipped this time keep their measured fields
  const before = fs.existsSync(r(`${ASSETS}/backdrop.json`)) ? JSON.parse(fs.readFileSync(r(`${ASSETS}/backdrop.json`), 'utf8')) : { panels: [] };
  for (const sp of shipped.panels) {
    const b = before.panels.find((q) => q.side === sp.side);
    if (b && !panels.includes(cfg.panels.find((q) => q.side === sp.side))) for (const k of ['horizon', 'foot', 'aspect']) if (b[k] != null && sp[k] == null) sp[k] = b[k];
  }
  for (const p of panels) {
    const keyed = `${OUT}/${p.side}_keyed.webp`, shippedFile = `${ASSETS}/backdrop_${p.side}.webp`;
    if (p.hold) fs.rmSync(r(shippedFile), { force: true }); // not shown until its painting passes review: mist there
    if (!fs.existsSync(r(raw(p)))) { console.log(`${p.side}: no image yet`); continue; }
    const { W, H, a, F, horizon, foot, measured, capped } = await key(p);
    let top = 0;
    while (top < horizon && Math.max(...a.subarray(top * W, top * W + W)) < 0.1) top++;
    // fade the ends into the mist, and below the foot. A painting that reaches the bottom edge (foot on the last row)
    // has no rows to fade below it: the fade would run backwards and zero every row above (that emptied a candidate)
    const fade = p.fade ?? 0.12, fEnd = Math.min(H - 1, foot + 0.06 * H);
    const below = (y) => (fEnd > foot + 1 ? ss(fEnd, foot, y) : 1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = x / (W - 1);
      a[y * W + x] *= ss(0, fade, u) * ss(1, 1 - fade, u) * below(y);
    }
    // trim the empty rows above and below, keeping a few
    let y0 = 0, y1 = H - 1;
    const rowMax = (y) => { let mx = 0; for (let x = 0; x < W; x++) mx = Math.max(mx, a[y * W + x]); return mx; };
    while (y0 < horizon && rowMax(y0) < 2 / 255) y0++;
    while (y1 > foot && rowMax(y1) < 2 / 255) y1--;
    y0 = Math.max(0, y0 - 4); y1 = Math.min(H - 1, y1 + 4);
    const h = y1 - y0 + 1;
    // colours bleed out into the transparent pixels from the opaque ones, so filtering and mipmaps never mix in paper
    const wgt = Float32Array.from(a, (v) => v * v);
    const filled = pushPull(F, wgt, W, H);
    const rgba = Buffer.alloc(W * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) {
      const i = (y + y0) * W + x, o = (y * W + x) * 4;
      const t = Math.min(1, a[i] * 4);
      for (let ch = 0; ch < 3; ch++) rgba[o + ch] = Math.round(255 * (F[i * 3 + ch] * t + filled[i * 3 + ch] * (1 - t)));
      rgba[o + 3] = Math.round(255 * a[i]);
    }
    await sharp(rgba, { raw: { width: W, height: h, channels: 4 } }).webp({ quality: 86, alphaQuality: 90, exact: true }).toFile(r(keyed));
    // frost: the share of the visible pixels (alpha >= 0.5) that are near-white (min RGB > 200), pale walls and ground
    // included; bare crowns keyed to white once made 37% (gen/expand/backdrop_lessons.md)
    let vis = 0, pale = 0;
    for (let i = 0; i < W * h; i++) if (rgba[i * 4 + 3] >= 128) { vis++; if (Math.min(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]) > 200) pale++; }
    const meas = { horizon: +((horizon - y0) / h).toFixed(4), foot: +((foot - y0) / h).toFixed(4), aspect: +(W / h).toFixed(4) };
    fs.writeFileSync(r(`${OUT}/${p.side}_keyed.json`), JSON.stringify(meas) + '\n');
    const sp = shipped.panels.find((q) => q.side === p.side);
    const off = p.hold || flag('--review');
    if (p.hold) console.log(`${p.side}: held back (${p.hold}); mist on the page, keyed for review in ${keyed}`);
    else if (off) console.log(`${p.side}: --review: keyed in ${keyed}, the page keeps its current panel`);
    else { fs.copyFileSync(r(keyed), r(shippedFile)); Object.assign(sp, meas); }
    console.log(`${off ? keyed : shippedFile}: ${W}x${h} (raw rows ${y0}-${y1} of ${H}); top of paint ${(top / H).toFixed(3)}, horizon ${(horizon / H).toFixed(3)}${p.horizon != null ? ` (set; measured ${measured.skyEnd.toFixed(3)})` : ''}, foot ${(foot / H).toFixed(3)}${p.foot != null ? ` (set; measured ${measured.mistStart.toFixed(3)})` : ''}${capped != null ? ` (ground cap ${p.ground}; painted ${capped.toFixed(3)})` : ''} of the raw height; ground strip ${((foot - horizon) / W).toFixed(4)} of the width; near-white ${((100 * pale) / Math.max(1, vis)).toFixed(1)}% of the visible pixels`);
  }
  if (!flag('--review')) fs.writeFileSync(r(`${ASSETS}/backdrop.json`), JSON.stringify(shipped, null, 1) + '\n');
  await sheet();
}

// review sheet per panel: the scan strip, every candidate painting (the picked one framed red, its number top left),
// and the keyed panel (shipped unless held) over a dark night, a pale day sky (with its measured horizon red and foot
// blue) and paper
async function sheet() {
  const SW = 1600;
  for (const p of panels) {
    const file = r(`${OUT}/${p.side}_keyed.webp`), mf = r(`${OUT}/${p.side}_keyed.json`);
    if (!fs.existsSync(file) || !fs.existsSync(mf) || !fs.existsSync(r(raw(p)))) continue;
    const sp = JSON.parse(fs.readFileSync(mf, 'utf8'));
    const rows = [];
    const add = async (buf) => { const { data, info } = await sharp(buf).resize({ width: SW }).png().toBuffer({ resolveWithObject: true }); rows.push({ data, h: info.height }); };
    if (fs.existsSync(r(src(p)))) await add(await sharp(r(src(p))).toBuffer());
    // every candidate, the picked one framed in red
    for (let i = 0; fs.existsSync(r(raw(p, i))); i++) {
      const im = await sharp(r(raw(p, i))).resize({ width: SW }).png().toBuffer({ resolveWithObject: true });
      const tag = Buffer.from(`<svg width="${SW}" height="${im.info.height}"><rect x="2" y="2" width="${SW - 4}" height="${im.info.height - 4}" fill="none" stroke="${i === (p.pick || 0) ? '#d02020' : 'none'}" stroke-width="5"/><text x="14" y="40" font-size="32" font-family="sans-serif" fill="#d02020">${i}</text></svg>`);
      rows.push({ data: await sharp(im.data).composite([{ input: tag }]).png().toBuffer(), h: im.info.height });
    }
    const meta = await sharp(file).metadata(), ph = Math.round((meta.height * SW) / meta.width);
    const panel = await sharp(file).resize(SW, ph).png().toBuffer();
    const lines = Buffer.from(`<svg width="${SW}" height="${ph}"><line x1="0" x2="${SW}" y1="${sp.horizon * ph}" y2="${sp.horizon * ph}" stroke="#d02020" stroke-width="2" stroke-dasharray="12 8"/><line x1="0" x2="${SW}" y1="${sp.foot * ph}" y2="${sp.foot * ph}" stroke="#2050d0" stroke-width="2" stroke-dasharray="12 8"/></svg>`);
    for (const bg of ['#1d2430', '#a9c3dd', '#e9e4d8']) {
      rows.push({ data: await sharp({ create: { width: SW, height: ph, channels: 3, background: bg } }).composite([{ input: panel }, ...(bg === '#a9c3dd' ? [{ input: lines }] : [])]).png().toBuffer(), h: ph });
    }
    const H = rows.reduce((s, q) => s + q.h + 8, 0);
    let y = 0;
    const comp = rows.map((q) => { const o = { input: q.data, left: 0, top: y }; y += q.h + 8; return o; });
    const out = `${OUT}/review_${p.side}.jpg`;
    await sharp({ create: { width: SW, height: H, channels: 3, background: '#808080' } }).composite(comp).jpeg({ quality: 85 }).toFile(r(out));
    console.log(`-> ${out}`);
  }
}

if (step === 'status') for (const p of cfg.panels) console.log(p.side.padEnd(6), state(p));
if (step === 'cut' || step === 'all') await cut();
if (step === 'gen' || step === 'all') gen();
if (step === 'ship' || step === 'all') await ship();
if (step === 'sheet') await sheet();
