#!/usr/bin/env node
// Film a shot of the world page (skill `film`; page side web/src/film.js): a shot spec (shots/<name>.json) -> the page
// stepped one frame at a time on a film clock, each frame rendered whole, supersampled and optionally motion-blurred
// -> MP4 (H.264) and/or ProRes and/or PNG frames, the camera of every frame (JSON, for editing and compositing tools),
// a manifest, and a contact sheet. Slow captures never drop or stretch a frame: film time is not wall time.
//
// Runs inside a check-Chrome slot against the check server (5190):
//   tools/chrome_slot.sh node tools/film_shot.mjs shots/crown_orbit.json --mode check
//   tools/chrome_slot.sh node tools/film_shot.mjs shots/crown_orbit.json --mode preview
//   tools/chrome_slot.sh node tools/film_shot.mjs shots/crown_orbit.json            (final)
// Modes:
//   check    resolve the shot, test its path against the world (errors: through walls, ground, decks, trunks;
//            warnings: through roofs, crowns, awnings, the subject hidden, the lens too near), stills at 0/25/50/75/100%
//            -> <name>_check.jpg and <name>.check.json. Exit 2 on path errors. About a minute.
//   preview  the whole motion, small and quick (640x360, ss 1, 15 fps, no blur) -> <name>_preview.mp4: timing and framing
//   final    the spec's settings, overridden by flags -> <name>.mp4 (+ .mov, frames/), <name>.camera.json,
//            <name>.manifest.json, <name>_sheet.jpg
// Flags (override the spec): --fps N  --size WxH  --ss 1|2  --blur N  --shutter 0..1  --warm s  --from s  --to s
//   --formats mp4,prores,png  --crf N  --out dir (default gen/films/<name>)  --url <world page>
//   --capture png|jpeg (png: lossless, the default; jpeg: q95 before the Lanczos down, 2.5x faster, a mean 1.75/255
//   off png and invisible after H.264: for mp4-only deliveries, long shots and blur 4-8)
//   --allow-errors (render although the path check found errors)
//   --passes depth,line (also render each frame as a pass, for compositing; the spec's "passes"; preview only with
//   the flag): depth -> depth/<name>_depth_00000.png, 16-bit grey, linear view depth, metres = value / 65535 * far
//   (--depth-far m, the spec's depth_far, default 300 = the camera's far plane; sky = 65535); line ->
//   line/<name>_line_00000.png, the frame's own ink lines alone, black on white. Each pass costs one more capture.
//   --no-track (leave the people out of the camera JSON; the spec's "track": false | [ids])
// Exit: 0 done, 1 failed, 2 path errors (check, or final without --allow-errors).
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const has = (n) => args.includes(n);
const specFile = args.find((a) => a.endsWith('.json'));
if (has('--help') || has('-h')) { // the header above is the manual
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1).filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
  process.exit(0);
}
if (!specFile) { console.error('usage: film_shot.mjs <shot.json> [--mode check|preview|final] [flags]  (see the header)'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const name = spec.name || path.basename(specFile, '.json');
const mode = opt('--mode', 'final');
if (!['check', 'preview', 'final'].includes(mode)) { console.error(`unknown mode ${mode}`); process.exit(1); }
const out = path.resolve(opt('--out', path.join(ROOT, 'gen/films', name)));
fs.mkdirSync(out, { recursive: true });

// settings: flags over the spec over the defaults; preview has its own
const size = (opt('--size') || (spec.size ? spec.size.join('x') : '1920x1080')).split('x').map(Number);
const R = {
  fps: +opt('--fps', spec.fps ?? 30),
  W: size[0], H: size[1],
  ss: +opt('--ss', spec.ss ?? 2),
  blur: +opt('--blur', spec.blur ?? 1),
  shutter: +opt('--shutter', spec.shutter ?? 0.5),
  warm: +opt('--warm', spec.warm ?? 3),
  crf: +opt('--crf', spec.crf ?? 14),
  formats: (opt('--formats') || (spec.formats || ['mp4']).join(',')).split(','),
  capture: opt('--capture', spec.capture ?? 'png'),
  passes: (opt('--passes') ?? (spec.passes || []).join(',')).split(',').filter(Boolean),
  depthFar: +opt('--depth-far', spec.depth_far ?? 300),
};
if (R.passes.some((k) => !['depth', 'line'].includes(k))) { console.error(`unknown pass in ${R.passes} (depth, line)`); process.exit(1); }
if (mode === 'preview') Object.assign(R, { W: 640, H: 360, ss: 1, fps: +opt('--fps', 15), blur: 1, crf: 23, formats: ['mp4'], passes: has('--passes') ? R.passes : [] });
if (mode === 'check') Object.assign(R, { ss: 1, blur: 1 });
if (!(R.fps >= 10)) { console.error('fps must be 10 or more (the page clamps a step at 0.1 s)'); process.exit(1); }

// the page: the high tier, no adaptive resolution, no sound; started where the shot is when its centre is a named view
const base = opt('--url', 'http://127.0.0.1:5190/world.html');
const q = new URLSearchParams({ start: '0', tier: 'high', adapt: '0', sound: '0', hour: String(spec.hour ?? 10) });
const centre = spec.stand ?? spec.camera?.around ?? spec.camera?.keys?.[spec.camera.keys.length - 1]?.look;
if (typeof centre === 'string' && !/^S\w*\./.test(centre)) q.set('spawn', centre);
if (spec.window !== undefined) q.set('window', String(spec.window));
for (const [k, v] of Object.entries(spec.query || {})) q.set(k, String(v));
const url = `${base}?${q}`;

const log = (...a) => console.log(`[film ${name}]`, ...a);
// a 16-bit greyscale PNG (sharp 0.35 writes 16-bit raw input as 8-bit): rows filtered "up" for smooth depth
function png16(w, h, v) {
  const row = w * 2 + 1, raw = Buffer.alloc(row * h);
  for (let y = 0; y < h; y++) {
    raw[y * row] = 2;
    for (let x = 0; x < w; x++) {
      const a = v[y * w + x], b = y ? v[(y - 1) * w + x] : 0, o = y * row + 1 + x * 2;
      raw[o] = ((a >> 8) - (b >> 8)) & 255; raw[o + 1] = ((a & 255) - (b & 255)) & 255;
    }
  }
  const chunk = (type, body) => {
    const head = Buffer.alloc(4), crc = Buffer.alloc(4), tb = Buffer.concat([Buffer.from(type, 'latin1'), body]);
    head.writeUInt32BE(body.length); crc.writeUInt32BE(zlib.crc32(tb) >>> 0);
    return Buffer.concat([head, tb, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 16; // bit depth 16, colour type 0 (grey)
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
// the depth pass as captured (red = high byte, green = low byte, at the drawn size) -> 16 bits at W x H (a box average
// over the supersampled pixels)
async function depth16(png, W, H) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const cw = info.width, ch = info.height, fx = cw / W, fy = ch / H, out = new Uint16Array(W * H);
  const box = Number.isInteger(fx) && Number.isInteger(fy);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!box) { const o = (Math.min(ch - 1, Math.floor((y + 0.5) * fy)) * cw + Math.min(cw - 1, Math.floor((x + 0.5) * fx))) * 3; out[y * W + x] = data[o] * 256 + data[o + 1]; continue; }
    let sum = 0;
    for (let j = 0; j < fy; j++) for (let i = 0; i < fx; i++) { const o = ((y * fy + j) * cw + x * fx + i) * 3; sum += data[o] * 256 + data[o + 1]; }
    out[y * W + x] = Math.round(sum / (fx * fy));
  }
  return out;
}
const t0 = Date.now();
const secs = () => ((Date.now() - t0) / 1000).toFixed(1);
let browser, ctx, page, ff = null;
const errors = [];
const exit = async (code) => {
  try { ff?.stdin.end(); } catch { /* closed */ }
  try { await ctx?.close(); await browser?.close(); } catch { /* gone */ }
  process.exit(code);
};

try {
  browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
  ctx = await browser.newContext({ viewport: { width: R.W, height: R.H }, deviceScaleFactor: R.ss });
  page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[error] ${m.text()}`); });
  log(`${mode}: ${url}`);
  await page.goto(url);
  await page.waitForFunction(() => window.__test?.film, null, { timeout: 240000 });
  const loaded = await page.evaluate(async (spec) => window.__test.film.load(spec), spec);
  log(`loaded in ${secs()} s: ${loaded.about}, ${loaded.T} s${loaded.live ? ' (follows live things)' : ''}`);
  const T = loaded.T;
  const track = has('--no-track') ? false : spec.track ?? true;
  const prep = await page.evaluate(async ([ss, shadow, track]) => window.__test.film.prepare({ ss, shadow, track }), [R.ss, spec.shadow || null, track]);
  for (const p of prep.poses || []) log(`pose: ${p.id} (${p.character}) plays ${p.clip}${p.speed === 0 ? ` held at ${p.offset} s` : ''}`);
  if (loaded.painter) log(`painter's view: bearing ${loaded.painter.deg}, ${loaded.painter.el_deg} deg down; scan px per m X ${loaded.painter.px_per_m.X}, D ${loaded.painter.px_per_m.D}, H ${loaded.painter.px_per_m.H}`);
  log(`ready in ${secs()} s: centred at ${prep.stand.join(', ')}, drawn ${prep.buffer.join('x')} (pixel ratio ${prep.pixelRatio}), tier ${prep.tier}, sections ${prep.loaded.join(' ')}`);
  if (prep.tier !== 'high') log(`WARNING: tier is ${prep.tier}, not high`);
  const cdp = await ctx.newCDPSession(page);
  // a frame as the canvas drew it (the page's DOM is hidden), at W*ss x H*ss; PNG, encoded for speed (lossless)
  const shotFmt = R.capture === 'jpeg' && mode !== 'check' ? { format: 'jpeg', quality: 95 } : { format: 'png' };
  const grab = async () => Buffer.from((await cdp.send('Page.captureScreenshot', { ...shotFmt, optimizeForSpeed: true, captureBeyondViewport: false })).data, 'base64');
  const toRaw = (png) => sharp(png).removeAlpha().resize(R.W, R.H, { kernel: 'lanczos3', fit: 'fill' }).raw().toBuffer();

  // the path check (every mode reports it)
  await page.evaluate(([s, fps]) => window.__test.film.warm(s, fps), [Math.min(R.warm, 1), R.fps]); // shaders, first bakes
  const check =await page.evaluate(() => window.__test.film.check(10));
  for (const e of check.errors) log(`PATH ERROR ${e.from}-${e.to} s: ${e.what} at ${e.at.join(', ')}`);
  for (const w of check.warnings) log(`path warning ${w.from}-${w.to} s: ${w.what} at ${w.at.join(', ')}`);
  log(`path check: ${check.ok ? 'clear' : `${check.errors.length} error(s)`}, ${check.warnings.length} warning(s) (${check.samples} samples, ${check.ms} ms)`);
  fs.writeFileSync(path.join(out, `${name}.check.json`), JSON.stringify({ shot: name, T, ...check }, null, 1));

  if (mode === 'check') {
    const tw = 640, th = Math.round((640 * R.H) / R.W), stills = [];
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      const cam = await page.evaluate((t) => window.__test.film.step(t, 0), f * T);
      const img = await sharp(await grab()).resize(tw, th).toBuffer();
      stills.push(await sharp(img).composite([{ input: Buffer.from(`<svg width="${tw}" height="24"><rect width="100%" height="100%" fill="#000" opacity="0.55"/><text x="8" y="17" font-size="14" font-family="monospace" fill="#fff">${(f * T).toFixed(1)} s  cam ${cam.pos.join(', ')}  fov ${cam.fov.toFixed(0)}</text></svg>`), left: 0, top: th - 24 }]).toBuffer());
    }
    const sheet = path.join(out, `${name}_check.jpg`);
    await sharp({ create: { width: tw * 3, height: th * 2, channels: 3, background: '#fff' } })
      .composite(stills.map((b, i) => ({ input: b, left: (i % 3) * tw, top: Math.floor(i / 3) * th }))).jpeg({ quality: 85 }).toFile(sheet);
    log(`-> ${sheet}, ${name}.check.json`);
    if (errors.length) log(errors.join('\n'));
    await exit(check.ok ? 0 : 2);
  }
  if (!check.ok && !has('--allow-errors')) { log('path errors: fix the shot or pass --allow-errors'); await exit(2); }

  // the encoder: raw RGB frames on stdin, one process for every format asked
  const tFrom = +opt('--from', 0), tTo = Math.min(T, +opt('--to', T));
  const N = Math.max(1, Math.floor((tTo - tFrom) * R.fps + 1e-6));
  const suffix = mode === 'preview' ? '_preview' : '';
  const outs = [];
  const ffArgs = ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${R.W}x${R.H}`, '-r', String(R.fps), '-i', '-'];
  const tags = ['-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709'];
  if (R.formats.includes('mp4')) {
    const f = path.join(out, `${name}${suffix}.mp4`); outs.push(f);
    ffArgs.push('-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', mode === 'preview' ? 'veryfast' : 'slow',
      '-crf', String(R.crf), '-profile:v', 'high', ...tags, '-movflags', '+faststart', f);
  }
  if (R.formats.includes('prores')) {
    const f = path.join(out, `${name}.mov`); outs.push(f);
    // prores_ks (ffmpeg 4.4) tags colour only from the frames: setparams marks them BT.709
    ffArgs.push('-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv422p10le,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709', '-c:v', 'prores_ks', '-profile:v', '3', '-vendor', 'apl0', '-movflags', '+write_colr', f);
  }
  const pngDir = R.formats.includes('png') ? path.join(out, 'frames') : null;
  if (pngDir) { fs.rmSync(pngDir, { recursive: true, force: true }); fs.mkdirSync(pngDir, { recursive: true }); }
  const passDir = Object.fromEntries(R.passes.map((k) => [k, path.join(out, k)]));
  for (const d of Object.values(passDir)) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  const passK = Math.floor((R.blur - 1) / 2); // passes are drawn at the middle sample of a blurred frame (they are never blurred)
  let passMs = 0;
  if (outs.length) {
    ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
    ff.on('error', (e) => { console.error('ffmpeg:', e.message); });
  }
  const write = (buf) => new Promise((res) => { if (!ff) return res(); if (ff.stdin.write(buf)) res(); else ff.stdin.once('drain', res); });

  // the timeline: frame i opens its shutter at i/fps; its N sub-frames sit evenly inside the open part
  await page.evaluate(([s, fps]) => window.__test.film.warm(s, fps), [Math.max(0, R.warm - 1), R.fps]);
  let w = 0; // the world's time on the shot's clock
  const subT = (i, k) => tFrom + i / R.fps + (R.blur > 1 ? ((k + 0.5) / R.blur) * (R.shutter / R.fps) : 0);
  if (tFrom > 0) { // run the world up to the first frame without filming it
    const t1 = subT(0, 0);
    while (w < t1 - 1e-9) { const dt = Math.min(1 / R.fps, t1 - w); w += dt; await page.evaluate(([t, d]) => window.__test.film.step(t, d, true), [w, dt]); }
  }
  const cams = [], sheetPick = new Set(Array.from({ length: Math.min(12, N) }, (_, j) => Math.round((j * (N - 1)) / Math.max(1, Math.min(12, N) - 1))));
  const sheetTiles = [];
  const tr = Date.now();
  let capMs = 0, stepMs = 0;
  for (let i = 0; i < N; i++) {
    let acc = null, cam = null;
    for (let k = 0; k < R.blur; k++) {
      const t = subT(i, k), dt = Math.max(0, t - w);
      w = t;
      const a = Date.now();
      cam = await page.evaluate(([t, d, q]) => window.__test.film.step(t, d, q), [t, dt, k < R.blur - 1]);
      const b = Date.now();
      const raw = await toRaw(await grab());
      capMs += Date.now() - b; stepMs += b - a;
      if (k === passK) {
        const c = Date.now(), f = String(i).padStart(5, '0');
        for (const kind of R.passes) {
          await page.evaluate(([kind, far]) => window.__test.film.pass(kind, { far }), [kind, R.depthFar]);
          const png = Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, captureBeyondViewport: false })).data, 'base64');
          const file = path.join(passDir[kind], `${name}_${kind}_${f}.png`);
          if (kind === 'depth') fs.writeFileSync(file, png16(R.W, R.H, await depth16(png, R.W, R.H)));
          else await sharp(png).removeAlpha().resize(R.W, R.H, { kernel: 'lanczos3', fit: 'fill' }).greyscale().png().toFile(file);
        }
        passMs += Date.now() - c;
      }
      if (R.blur === 1) { acc = raw; break; }
      if (!acc) acc = new Float32Array(raw.length);
      for (let j = 0; j < raw.length; j++) acc[j] += raw[j];
    }
    let frame = acc;
    if (R.blur > 1) { frame = Buffer.alloc(acc.length); for (let j = 0; j < acc.length; j++) frame[j] = Math.round(acc[j] / R.blur); }
    cams.push({ frame: i, ...cam, t: +(tFrom + i / R.fps).toFixed(4) });
    await write(frame);
    if (pngDir) await sharp(frame, { raw: { width: R.W, height: R.H, channels: 3 } }).png().toFile(path.join(pngDir, `${name}_${String(i).padStart(5, '0')}.png`));
    if (sheetPick.has(i)) sheetTiles.push({ i, buf: await sharp(frame, { raw: { width: R.W, height: R.H, channels: 3 } }).resize(480, Math.round((480 * R.H) / R.W)).jpeg().toBuffer() });
    if ((i + 1) % 30 === 0 || i === N - 1) {
      const el = (Date.now() - tr) / 1000, rate = (i + 1) / el;
      log(`frame ${i + 1}/${N}  ${rate.toFixed(2)} frames/s  (step ${(stepMs / (i + 1) / R.blur).toFixed(0)} ms, capture ${(capMs / (i + 1) / R.blur).toFixed(0)} ms a sample${R.passes.length ? `, passes ${(passMs / (i + 1)).toFixed(0)} ms a frame` : ''})  ETA ${((N - i - 1) / rate).toFixed(0)} s`);
    }
  }
  const renderS = (Date.now() - tr) / 1000;
  if (ff) { ff.stdin.end(); await new Promise((r) => ff.on('close', r)); }
  await page.evaluate(() => window.__test.film.end());

  // the camera of every frame, the manifest, the contact sheet
  fs.writeFileSync(path.join(out, `${name}${suffix}.camera.json`), JSON.stringify({
    about: 'The camera of every frame. pos/look: map frame [X, D, H] metres (X along the scroll, D north, H up). quat: page frame (x = X, y = H, z = -D), three.js camera looking down its -z. fov: vertical, degrees. look_px: the look point in the frame, 0..1 from the top left. t: shot seconds at the frame\'s shutter open. people (unless track is off): everyone in frame within 150 m: id, clip, head (the middle of the head), top (of the head), foot (between the feet, on the ground) in frame pixels from the top left, d (metres from the lens), occ [head, foot] (1: a solid surface hides it). scan (painting cameras, or the spec\'s scan): M, the 2x3 affine from frame pixels to scan pixels of reference/scroll/qingming_commons_38414x1800.jpg, res_px its fit residual [mean, max] in scan px round the subject; for a painted figure, subject: painted head/foot/box (scan px), live head/foot carried onto the scan by M, and shift_px = painted - live (scan px = M . frame px + shift lays the living head or feet on the painted ones).',
    shot: name, fps: R.fps, size: [R.W, R.H], frames: cams,
  }));
  const th = Math.round((480 * R.H) / R.W);
  await sharp({ create: { width: 480 * 4, height: th * Math.ceil(sheetTiles.length / 4), channels: 3, background: '#fff' } })
    .composite(await Promise.all(sheetTiles.map(async ({ i, buf }, j) => ({ input: await sharp(buf).composite([{ input: Buffer.from(`<svg width="80" height="22"><rect width="100%" height="100%" fill="#000" opacity="0.6"/><text x="6" y="16" font-size="14" font-family="monospace" fill="#fff">${(tFrom + i / R.fps).toFixed(1)} s</text></svg>`), left: 0, top: th - 22 }]).toBuffer(), left: (j % 4) * 480, top: Math.floor(j / 4) * th }))))
    .jpeg({ quality: 82 }).toFile(path.join(out, `${name}${suffix}_sheet.jpg`));
  const manifest = {
    shot: name, spec: path.relative(ROOT, path.resolve(specFile)), mode, made: new Date().toISOString(), url,
    settings: { ...R, from: tFrom, to: tTo, frames: N, seconds: +(N / R.fps).toFixed(3) },
    passes: Object.fromEntries(R.passes.map((k) => [k, { dir: path.relative(ROOT, passDir[k]) + '/', about: k === 'depth'
      ? `16-bit grey PNG, linear view depth (metres along the camera's axis): metres = value / 65535 * ${R.depthFar}; ${R.depthFar} m and beyond (sky) = 65535; a box average over the supersampled pixels`
      : '8-bit grey PNG: the ink lines of the beauty frame alone (same weight, break-up, distance fade and mist), black on white' }])),
    poses: prep.poses, painter: loaded.painter || null,
    page: { stand: prep.stand, drawn: prep.buffer, pixelRatio: prep.pixelRatio, tier: prep.tier, sections: prep.loaded },
    check: { ok: check.ok, errors: check.errors, warnings: check.warnings },
    timing: { total_s: +secs(), render_s: +renderS.toFixed(1), frames_per_s: +(N / renderS).toFixed(2), step_ms: +(stepMs / N / R.blur).toFixed(1), capture_ms: +(capMs / N / R.blur).toFixed(1), passes_ms: +(passMs / N).toFixed(1) },
    outputs: [...outs.map((f) => path.relative(ROOT, f)), ...(pngDir ? [path.relative(ROOT, pngDir) + '/'] : []), ...Object.values(passDir).map((d) => path.relative(ROOT, d) + '/'), path.relative(ROOT, path.join(out, `${name}${suffix}.camera.json`)), path.relative(ROOT, path.join(out, `${name}${suffix}_sheet.jpg`))],
    page_errors: errors,
  };
  fs.writeFileSync(path.join(out, `${name}${suffix}.manifest.json`), JSON.stringify(manifest, null, 1));
  log(`${N} frames in ${renderS.toFixed(0)} s (${manifest.timing.frames_per_s} frames/s); total ${secs()} s`);
  for (const f of manifest.outputs) log(`-> ${f}`);
  if (errors.length) log(`page errors:\n${errors.join('\n')}`);
  await exit(0);
} catch (err) {
  console.error(`[film ${name}] FAILED:`, err.message);
  if (errors.length) console.error(errors.join('\n'));
  await exit(1);
}
