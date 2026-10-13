#!/usr/bin/env node
// GPU-compressed copies of the world page's textures: a KTX2 (Basis Universal) file next to every webp the page
// loads by URL, so the GPU holds 4-8 bits a pixel instead of 32 (web/src/assets.js loads the KTX2 when the manifest
// lists it and its kind is adopted; the webp stays the source and the fallback, never deleted or overwritten).
//   kit    web/public/assets/tex/*.webp            the kit's swatches and atlases (tiled; no alpha)
//   tree   web/public/assets/trees/*.webp, willow_card.webp   tree cards (alpha-tested; flipped like TextureLoader's)
//   panel  web/public/assets/<section>/backdrop_*.webp        the painted backdrop panels (alpha; flipped)
//   chars  the body textures embedded in the characters' and animals' GLBs (assets/chars|animals/*.glb, read only):
//          copies in assets/ktx2/emb/, keyed emb:<bytes>:<FNV-1a of the bytes> so the page knows them without the
//          file name (the palettes, nearest-filtered colour cells, stay as they are)
// Encoder: KTX-Software v4.4.2 `ktx create` (one install: ~/.local/opt/KTX-Software-4.4.2-Linux-x86_64, or $KTX).
// Mode per kind (MODES below): UASTC (+zstd) where quality needs it, ETC1S (BasisLZ) where it holds up. Mipmaps are
// made here with a box filter (as the GPU's own generateMipmap), wrapping for tiled swatches, clamped for cards.
// The manifest, web/public/assets/ktx2.json, lists every encoded file: its webp's sha1 (a rerun re-encodes only new
// or changed webps and drops copies whose webp is gone), sizes, and the image's mean colour exactly as palette.js
// takes it in Chrome (the page can't read pixels back from a compressed texture). `adopt` there says which kinds the
// page uses, set only after the side-by-side review (gen/expand/ktx2_review/).
// Usage: node tools/ktx2.mjs [status|encode|check] [--kind kit|tree|panel] [--only <text>] [--force]
//        node tools/ktx2.mjs review [--spots spots.json] [--url http://127.0.0.1:5180/world.html] [--out dir] [--cdp 9223]
//        node tools/ktx2.mjs adopt <kind> yes|no ["why"]
//   status  what is missing or stale;  encode  (default) encode what is;  check  FAIL if anything is stale/missing
//   review  side by side in the page on the real GPU (tools/win_chrome.sh start): each spot [name, X, D, H, facing,
//           pitch] in first person with the people hidden, as webp (?ktx2=0) and as KTX2 (?ktx2=all), whole frames
//           and 1:1 crops of the three places where they differ most -> gen/expand/ktx2_review/<name>.jpg
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { chromium } from 'playwright-core';

const Q = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ASSETS = path.join(Q, 'web/public/assets');
const MANIFEST = path.join(ASSETS, 'ktx2.json');
const KTX = process.env.KTX || path.join(os.homedir(), '.local/opt/KTX-Software-4.4.2-Linux-x86_64/bin/ktx');
const args = process.argv.slice(2);
const opt = (k, d = null) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const cmd = args[0] && !args[0].startsWith('--') ? args[0] : 'encode';

// the Basis mode of each kind (and of files matching a pattern within it): see gen/expand/engine_lessons.md
const UASTC = ['--encode', 'uastc', '--uastc-quality', '3', '--zstd', '18'];
const ETC1S = ['--encode', 'basis-lz', '--clevel', '4', '--qlevel', '255'];
const MODES = {
  kit: { files: () => list('tex', /\.webp$/), mode: 'etc1s', wrap: 'wrap', flip: false,
    // the sign and script atlases: lettering, kept in UASTC
    per: [[/^(signs_|script_sheet)/, 'uastc']] },
  tree: { files: () => [...list('trees', /\.webp$/), ...(fs.existsSync(path.join(ASSETS, 'willow_card.webp')) ? ['willow_card.webp'] : [])], mode: 'uastc', wrap: 'clamp', flip: true },
  panel: { files: () => fs.readdirSync(ASSETS).filter((d) => fs.statSync(path.join(ASSETS, d)).isDirectory()).flatMap((d) => list(d, /^backdrop_.*\.webp$/)), mode: 'etc1s', wrap: 'clamp', flip: true },
  chars: { files: () => [...embedded().keys()], mode: 'etc1s', wrap: 'clamp', flip: false },
};
// the embedded body textures: key -> { bytes, label }; the page computes the same key (web/src/assets.js embKey)
const fnv = (buf) => { let h = 0x811c9dc5; for (let i = 0; i < buf.length; i++) { h ^= buf[i]; h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, '0'); };
let EMB = null;
function embedded() {
  if (EMB) return EMB;
  EMB = new Map();
  for (const dir of ['chars', 'animals']) for (const f of list(dir, /\.glb$/)) {
    const b = fs.readFileSync(path.join(ASSETS, f)), len = b.readUInt32LE(12), json = JSON.parse(b.slice(20, 20 + len).toString()), bin = b.slice(20 + len + 8);
    for (const im of json.images || []) {
      const bv = json.bufferViews[im.bufferView];
      if (!bv || /palette/.test(im.name || '')) continue;
      const bytes = bin.slice(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
      EMB.set(`emb:${bytes.length}:${fnv(bytes)}`, { bytes, label: `${f}#${im.name}` });
    }
  }
  return EMB;
}
const isEmb = (key) => key.startsWith('emb:');
const bytesOf = (key) => (isEmb(key) ? embedded().get(key)?.bytes : fs.readFileSync(path.join(ASSETS, key)));
const srcExists = (key) => (isEmb(key) ? embedded().has(key) : fs.existsSync(path.join(ASSETS, key)));
const labelOf = (key) => (isEmb(key) ? embedded().get(key)?.label || key : key);
function list(dir, re) { const d = path.join(ASSETS, dir); return fs.existsSync(d) ? fs.readdirSync(d).filter((f) => re.test(f)).sort().map((f) => `${dir}/${f}`) : []; }
const modeOf = (kind, rel) => (MODES[kind].per || []).find(([re]) => re.test(path.basename(rel)))?.[1] || MODES[kind].mode;
const OPTS_VERSION = 2; // bump when the encoding options change: every file is re-encoded (2: sizes made multiples of 4)

const readManifest = () => (fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : null) || {
  about: 'KTX2 copies of the page\'s textures (tools/ktx2.mjs). files: webp path under assets/, or emb:<bytes>:<FNV-1a> for a body texture inside a GLB -> its KTX2 copy, kind, Basis mode, the source\'s sha1, sizes (src_px, px), flipped, mean (palette.js). kinds: which kinds the page loads as KTX2 (adopt), decided by the side-by-side review.',
  encoder: '', kinds: {}, files: {},
};
const writeManifest = (m) => fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 1) + '\n');
const sha1 = (key) => crypto.createHash('sha1').update(bytesOf(key)).digest('hex');
const ktxOf = (key) => (isEmb(key) ? `ktx2/emb/${key.slice(4).replace(':', '-')}.ktx2` : key.replace(/\.webp$/, '.ktx2'));
const kindsWanted = () => (opt('--kind') ? [opt('--kind')] : Object.keys(MODES));

// what needs encoding: [{ kind, rel, reason }]
function plan(m) {
  const out = [];
  for (const kind of kindsWanted()) {
    for (const rel of MODES[kind].files()) {
      if (opt('--only') && !labelOf(rel).includes(opt('--only'))) continue;
      const e = m.files[rel], src = sha1(rel), mode = modeOf(kind, rel);
      const reason = !e ? 'new' : !fs.existsSync(path.join(ASSETS, e.ktx2)) ? 'missing ktx2' : e.src_sha1 !== src ? 'webp changed'
        : e.mode !== mode || e.opts !== OPTS_VERSION ? 'options changed' : args.includes('--force') ? 'forced' : null;
      if (reason) out.push({ kind, rel, reason, src, mode });
    }
  }
  return out;
}
// copies whose webp is gone
function orphans(m) { return Object.keys(m.files).filter((rel) => !srcExists(rel)); }

// the mean colour palette.js takes from a texture's image, computed by the same code in Chrome: the webp decoded as
// the page decodes it (createImageBitmap, straight alpha, no colour conversion; flipped for TextureLoader kinds),
// drawn to 32 x 32, the opaque pixels averaged
async function means(items) {
  if (!items.length) return {};
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--headless=new'] });
  const page = await browser.newPage();
  await page.goto('about:blank');
  const out = {};
  for (const it of items) {
    const b64 = bytesOf(it.rel).toString('base64');
    out[it.rel] = await page.evaluate(async ([b64, flip]) => {
      const blob = await (await fetch(`data:image/webp;base64,${b64}`)).blob();
      const img = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none', ...(flip ? { imageOrientation: 'flipY' } : {}) });
      const N = 32, cv = new OffscreenCanvas(N, N), g = cv.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0, N, N);
      const d = g.getImageData(0, 0, N, N).data;
      let r = 0, gg = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
      return n ? [r / n / 255, gg / n / 255, b / n / 255] : null;
    }, [b64, MODES[it.kind].flip]);
  }
  await browser.close();
  return out;
}

async function encode(it, tmp) {
  const k = MODES[it.kind], src = bytesOf(it.rel), dst = path.join(ASSETS, ktxOf(it.rel));
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  const meta = await sharp(src).metadata();
  const st = await sharp(src).stats();
  const alpha = meta.hasAlpha && st.channels[3].min < 255;
  // ktx reads PNG: the webp's pixels, losslessly (opaque images as RGB, so ETC1S/UASTC store no alpha). The GPU's block
  // formats (BC1/BC3/BC7 on desktops, through ANGLE) refuse a base level that isn't a multiple of 4 on each side, so
  // such an image is resampled to the nearest multiple of 4 (at most 2 px either way: under 1% for the cards' 200-1200
  // px; its UVs, and so where it lies on the card, are unchanged; panels keep the webp's aspect from src_px)
  const W4 = Math.max(4, Math.round(meta.width / 4) * 4), H4 = Math.max(4, Math.round(meta.height / 4) * 4);
  const png = path.join(tmp, `${path.basename(ktxOf(it.rel), '.ktx2')}.png`);
  let img = alpha ? sharp(src).ensureAlpha() : sharp(src).removeAlpha();
  if (W4 !== meta.width || H4 !== meta.height) img = sharp(await img.raw().toBuffer(), { raw: { width: meta.width, height: meta.height, channels: alpha ? 4 : 3 } }).resize(W4, H4, { fit: 'fill', kernel: 'lanczos3' });
  await img.png({ compressionLevel: 1 }).toFile(png);
  const mode = it.mode === 'uastc' ? UASTC : ETC1S;
  const a = ['create', '--format', alpha ? 'R8G8B8A8_SRGB' : 'R8G8B8_SRGB', '--assign-tf', 'srgb', '--assign-primaries', 'srgb',
    '--generate-mipmap', '--mipmap-filter', 'box', '--mipmap-wrap', k.wrap, ...mode,
    ...(k.flip ? ['--convert-texcoord-origin', 'bottom-left'] : []), png, dst];
  execFileSync(KTX, a, { stdio: ['ignore', 'ignore', 'pipe'] });
  return { kind: it.kind, ktx2: ktxOf(it.rel), mode: it.mode, opts: OPTS_VERSION, src_sha1: it.src, src_px: [meta.width, meta.height], px: [W4, H4], alpha, flipped: k.flip,
    webp_kb: +(src.length / 1024).toFixed(1), ktx2_kb: +(fs.statSync(dst).size / 1024).toFixed(1), ...(isEmb(it.rel) ? { from: labelOf(it.rel) } : {}) };
}

// spots for the review: tree cards, panels and kit surfaces at walking distance in the three built sections
const SPOTS = [
  ['trees_s4_road', 30, 5.4, 0, 0, 4], ['trees_gate_street', -30, 6.6, 0, 180, 4], ['trees_temple', 12, 21, 0, 80, 6], ['trees_well', -84, 9, 0, 150, 6],
  ['panel_west_s7', -82, 7, 0, 180, 2], ['panel_east_s4b', 45, 6, 0, 0, 2], ['panel_gate_east', -40, 6.5, 0, 0, 3], ['panel_gate_west', 22, 5.4, 0, 180, 3],
  ['kit_zhengdian', -50, 7.5, 0, 120, 6], ['kit_storyteller', -62, 9.5, 0, 90, 4], ['kit_temple', 12, 21, 0, 80, 6], ['kit_courier', 36, 9, 0, 75, 6],
  ['kit_ground', -20, 5, 0, 0, -35], ['kit_tower_wall', -15.6, 1.4, 12.07, 175, -12],
  // characters: your own avatar seen from the front at 1.8 m, held still
  ['char_woman', -71, 8, 0, 0, -5, { avatar: 'woman' }], ['char_porter', -71, 8, 0, 0, -5, { avatar: 'porter' }],
  ['char_official', -71, 8, 0, 0, -5, { avatar: 'official' }], ['char_scholar', -71, 8, 0, 0, -5, { avatar: 'scholar' }],
  ['char_monk', -71, 8, 0, 0, -5, { avatar: 'monk' }],
];
async function review() {
  const spots = opt('--spots') ? JSON.parse(fs.readFileSync(opt('--spots'), 'utf8')) : SPOTS;
  const url = opt('--url', 'http://127.0.0.1:5180/world.html'), out = path.resolve(opt('--out', path.join(Q, 'gen/expand/ktx2_review')));
  fs.mkdirSync(out, { recursive: true });
  let browser;
  const cdp = opt('--cdp', '9223'); // the bench Chrome by default
  try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdp}`); } catch { console.error('Run tools/win_chrome.sh start first.'); process.exit(1); }
  const W = 1920, H = 1080, shots = {};
  for (const mode of ['0', 'all']) {
    const page = await browser.contexts()[0].newPage();
    await page.routeWebSocket(/:5180/, () => {}); // the dev server's reloads (other agents' edits) must not hit a review
    await page.setViewportSize({ width: W, height: H });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto(`${url}${url.includes('?') ? '&' : '?'}hour=10&ktx2=${mode}`, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => window.__test, null, { timeout: 180000 });
    // overlays hidden, not removed (the page writes to #stats every frame)
    await page.evaluate(() => { for (const el of [document.querySelector('.lil-gui'), ...['help', 'stats', 'dial'].map((id) => document.getElementById(id))]) if (el) el.style.display = 'none'; });
    for (const [name, X, D, Hh, f, p, extra] of spots) {
      await page.evaluate(async ([X, D, Hh, f, p, extra]) => {
        const t = window.__test, d = Math.PI / 180;
        if (extra?.avatar) {
          t.set('view', 'third'); t.set('avatar', extra.avatar); t.followCam.distance = 1.8;
          t.player.pos.set(X, Hh + 0.2, -D); t.player.yaw = f * d - Math.PI / 2; t.player.pitch = p * d;
          await t.goto?.(X, D, Hh);
          await new Promise((r) => setTimeout(r, 2000)); // the avatar loads and stands; then the camera goes round to its front
          t.player.yaw += Math.PI; t.player.pitch = p * d;
          await new Promise((r) => setTimeout(r, 1500));
          t.avatar.mixer.update = () => {};
          t.people.update = () => {};
          for (const p2 of t.people.all) p2.root.visible = false;
          if (t.people.crowd) t.people.crowd.group.visible = false;
          return;
        }
        t.set('view', 'first');
        t.player.pos.set(X, Hh + 0.2, -D); t.player.yaw = f * d - Math.PI / 2; t.player.pitch = p * d;
        await t.goto?.(X, D, Hh);
        t.player.yaw = f * d - Math.PI / 2; t.player.pitch = p * d;
        // the textures, not the people: everyone hidden and held still
        t.people.update = () => {};
        for (const p2 of t.people.all) p2.root.visible = false;
        if (t.people.crowd) t.people.crowd.group.visible = false;
        if (t.avatar) t.avatar.root.visible = false;
      }, [X, D, Hh, f, p, extra]);
      await page.waitForTimeout(2500); // cards and panels load after the section
      (shots[name] ||= {})[mode] = await page.screenshot();
    }
    if (errors.length) console.log(`?ktx2=${mode}: ${errors.slice(0, 5).join(' | ')}`);
    await page.close();
  }
  await browser.close();
  const label = (t, w) => Buffer.from(`<svg width="${w}" height="26"><rect width="100%" height="100%" fill="#000" opacity="0.6"/><text x="8" y="19" font-size="16" font-family="monospace" fill="#fff">${t}</text></svg>`);
  const report = [];
  for (const [name] of spots) {
    const [A, B] = await Promise.all(['0', 'all'].map((k) => sharp(shots[name][k]).removeAlpha().raw().toBuffer()));
    // where they differ most: mean |diff| in 240 x 135 cells; the three worst cells, cropped 1:1 at 480 x 270 round them
    const cw = 240, ch = 135, cells = [];
    let tot = 0;
    for (let cy = 0; cy < H / ch; cy++) for (let cx = 0; cx < W / cw; cx++) {
      let s = 0;
      for (let y = cy * ch; y < (cy + 1) * ch; y += 2) for (let x = cx * cw; x < (cx + 1) * cw; x += 2) { const o = (y * W + x) * 3; s += Math.abs(A[o] - B[o]) + Math.abs(A[o + 1] - B[o + 1]) + Math.abs(A[o + 2] - B[o + 2]); }
      const v = s / ((cw / 2) * (ch / 2) * 3); tot += v; cells.push([v, cx, cy]);
    }
    cells.sort((a, b) => b[0] - a[0]);
    const mean = tot / cells.length;
    const crops = cells.slice(0, 3).map(([v, cx, cy]) => ({ v, left: Math.min(W - 480, Math.max(0, cx * cw - 120)), top: Math.min(H - 270, Math.max(0, cy * ch - 67)) }));
    const half = (buf) => sharp(buf, { raw: { width: W, height: H, channels: 3 } }).resize(W / 2, H / 2).png().toBuffer();
    const crop = (buf, c) => sharp(buf, { raw: { width: W, height: H, channels: 3 } }).extract({ left: c.left, top: c.top, width: 480, height: 270 }).png().toBuffer();
    const comp = [{ input: await half(A), left: 0, top: 0 }, { input: await half(B), left: W / 2, top: 0 },
      { input: label(`${name}: webp`, 400), left: 0, top: 0 }, { input: label(`KTX2 (mean |diff| ${mean.toFixed(2)})`, 400), left: W / 2, top: 0 }];
    for (const [i, c] of crops.entries()) {
      comp.push({ input: await crop(A, c), left: 0, top: H / 2 + i * 270 }, { input: await crop(B, c), left: 480, top: H / 2 + i * 270 },
        { input: label(`1:1 webp | KTX2 at ${c.left},${c.top} (|diff| ${c.v.toFixed(1)})`, 960), left: 0, top: H / 2 + i * 270 });
    }
    // to the right of the crops: the same crops' difference, x4
    for (const [i, c] of crops.entries()) {
      const a = await sharp(A, { raw: { width: W, height: H, channels: 3 } }).extract({ left: c.left, top: c.top, width: 480, height: 270 }).raw().toBuffer();
      const b = await sharp(B, { raw: { width: W, height: H, channels: 3 } }).extract({ left: c.left, top: c.top, width: 480, height: 270 }).raw().toBuffer();
      const d = Buffer.alloc(a.length); for (let k = 0; k < a.length; k++) d[k] = Math.min(255, Math.abs(a[k] - b[k]) * 4);
      comp.push({ input: await sharp(d, { raw: { width: 480, height: 270, channels: 3 } }).png().toBuffer(), left: 960, top: H / 2 + i * 270 },
        { input: label('difference x4', 480), left: 960, top: H / 2 + i * 270 });
    }
    await sharp({ create: { width: W, height: H / 2 + 3 * 270, channels: 3, background: '#fff' } }).composite(comp).jpeg({ quality: 88 }).toFile(path.join(out, `${name}.jpg`));
    report.push([name, mean, cells[0][0]]);
    console.log(`${name.padEnd(20)} mean |diff| ${mean.toFixed(2)}, worst cell ${cells[0][0].toFixed(1)} -> ${path.relative(Q, path.join(out, name + '.jpg'))}`);
  }
  fs.writeFileSync(path.join(out, 'review.json'), JSON.stringify({ url, spots, report: report.map(([n, m, w]) => ({ spot: n, meanDiff: +m.toFixed(3), worstCell: +w.toFixed(2) })),
    manifest: Object.fromEntries(Object.entries(readManifest().files).map(([k, e]) => [k, e.mode])) }, null, 1));
}

const m = readManifest();
if (cmd === 'review') { await review(); process.exit(0); }
if (cmd === 'adopt') {
  const [kind, yes, why] = args.slice(1);
  if (!MODES[kind] || !['yes', 'no'].includes(yes)) { console.log('usage: node tools/ktx2.mjs adopt <kind> yes|no ["why"]'); process.exit(2); }
  m.kinds[kind] = { ...(m.kinds[kind] || {}), mode: MODES[kind].mode, adopt: yes === 'yes', ...(why ? { why } : {}) };
  writeManifest(m);
  console.log(`${kind}: adopt ${yes}`);
  process.exit(0);
}
const todo = plan(m), gone = orphans(m);
if (cmd === 'status' || cmd === 'check') {
  for (const t of todo) console.log(`${t.reason.padEnd(16)} ${t.kind.padEnd(6)} ${labelOf(t.rel)} (${t.mode})`);
  for (const rel of gone) console.log(`webp gone        ${rel}`);
  const kinds = Object.entries(m.kinds).map(([k, v]) => `${k} ${v.adopt ? 'adopted' : 'not adopted'}`).join(', ');
  console.log(`${Object.keys(m.files).length} encoded, ${todo.length} to encode, ${gone.length} orphaned; ${kinds || 'no kind adopted yet'}`);
  if (cmd === 'check') { console.log(todo.length || gone.length ? 'FAIL: run node tools/ktx2.mjs encode' : 'PASS'); process.exit(todo.length || gone.length ? 1 : 0); }
  process.exit(0);
}
if (!fs.existsSync(KTX)) { console.error(`no ktx at ${KTX} (KTX-Software v4.4.2; or set $KTX)`); process.exit(1); }
m.encoder = execFileSync(KTX, ['--version']).toString().trim();
for (const rel of gone) { const e = m.files[rel]; if (e && fs.existsSync(path.join(ASSETS, e.ktx2))) fs.unlinkSync(path.join(ASSETS, e.ktx2)); delete m.files[rel]; console.log(`dropped ${rel} (webp gone)`); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ktx2-'));
try {
  const mean = await means(todo);
  for (const it of todo) {
    const t0 = Date.now();
    const e = await encode(it, tmp);
    e.mean = mean[it.rel] && mean[it.rel].map((x) => +x.toFixed(6));
    m.files[it.rel] = e;
    writeManifest(m); // after every file: an interrupted run keeps what it made
    console.log(`${it.kind.padEnd(6)} ${labelOf(it.rel).padEnd(44)} ${it.mode.padEnd(6)} ${String(e.webp_kb).padStart(6)} KB webp -> ${String(e.ktx2_kb).padStart(6)} KB ktx2  (${it.reason}, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  }
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
for (const kind of Object.keys(MODES)) m.kinds[kind] ||= { mode: MODES[kind].mode, adopt: false };
writeManifest(m);
const tot = (k) => Object.values(m.files).filter((e) => e.kind === k).reduce((a, e) => [a[0] + 1, a[1] + e.webp_kb, a[2] + e.ktx2_kb], [0, 0, 0]);
for (const k of Object.keys(MODES)) { const [n, w, x] = tot(k); if (n) console.log(`${k}: ${n} files, webp ${(w / 1024).toFixed(2)} MB, ktx2 ${(x / 1024).toFixed(2)} MB`); }
console.log(`${todo.length} encoded, ${gone.length} dropped -> ${path.relative(Q, MANIFEST)}`);
