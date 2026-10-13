// A film of the boat flow for the user: stand at a spot, let the river run `warm` seconds first (fast, the walker and
// the boats stepped at 60 Hz with a frame drawn now and then), then capture a frame every `every` steps for `secs`
// seconds of real time (tools/walk_film.mjs's way: mp4 at real speed via ffmpeg, plus a contact strip).
//   tools/chrome_slot.sh node gen/boats/flow/tools/flow_film.mjs <url> <out_base> X,D,H,facing,pitch secs [--warm 120] [--every 4] [--view third|first] [--pan deg] [--cam metres] [--from X,D,facing]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '/home/ran/3d_director/qingming/tools/node_modules/playwright-core/index.mjs';
import sharp from '/home/ran/3d_director/qingming/tools/node_modules/sharp/dist/index.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const [url, outBase, spotS, secsS] = args;
const [X, D, H, face, pitch] = spotS.split(',').map(Number);
const from = opt('--from', null);
const secs = +secsS, warm = +opt('--warm', 120), every = +opt('--every', 4), pan = +opt('--pan', 0), view = opt('--view', 'third'), camd = +opt('--cam', 0);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await browser.contexts()[0].newPage();
await page.setViewportSize({ width: 1280, height: 720 });
const logs = [];
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
try {
  await page.goto(url);
  await page.waitForFunction(() => window.__test?.goto, null, { timeout: 90000 });
  await page.evaluate(() => { document.querySelector('.lil-gui')?.remove(); document.getElementById('help')?.remove(); const st = document.getElementById('stats'); if (st) st.style.visibility = 'hidden'; });
  await page.evaluate(async ([X, D, H, face, pitch, view, camd]) => {
    const t = window.__test, p = t.player, d = Math.PI / 180;
    t.set('hour', 10);
    if (view === 'first') t.set('view', 'first');
    if (camd) t.set('camDistance', camd);
    await t.goto(X, D, H > 0 ? H : undefined);
    p.yaw = face * d - Math.PI / 2; p.pitch = pitch * d;
  }, [X, D, H, face, pitch, view, camd]);
  await page.waitForTimeout(2000);
  // the river runs a while first (with --from: standing elsewhere, looking away, then walked in by a teleport that
  // leaves the boats where they are)
  if (from) await page.evaluate(async ([fx, fd, ff]) => { const t = window.__test, p = t.player; await t.goto(fx, fd); p.yaw = ff * Math.PI / 180 - Math.PI / 2; }, from.split(',').map(Number));
  for (let k = 0; k < warm; k += 5) {
    await page.evaluate(() => { const p = window.__test.player; for (let i = 0; i < 300; i++) p.update(1 / 60); });
    await page.waitForTimeout(30);
  }
  if (from) await page.evaluate(async ([X, D, H, face, pitch]) => { const t = window.__test, p = t.player, d = Math.PI / 180; if (t.boats.flow) t.boats.flow.snap = false; await t.goto(X, D, H > 0 ? H : undefined); p.yaw = face * d - Math.PI / 2; p.pitch = pitch * d; }, [X, D, H, face, pitch]);
  await page.waitForTimeout(1500);
  const dir = path.join(process.env.FRAMES_DIR || path.join(os.tmpdir(), 'qingming_flow_film'), path.basename(outBase));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  const steps = secs * 60;
  for (let i = 0; i < steps; i += every) {
    await page.evaluate(([k, panStep]) => { const p = window.__test.player; for (let j = 0; j < k; j++) { p.yaw += panStep; p.update(1 / 60); } }, [every, (pan * Math.PI / 180) / steps]);
    await page.screenshot({ path: path.join(dir, `f${String(n++).padStart(4, '0')}.png`) });
  }
  const report = await page.evaluate(() => window.__test.boats.flow?.report());
  fs.writeFileSync(outBase + '.flow.json', JSON.stringify(report, null, 1));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(Math.round(60 / every)), '-i', path.join(dir, 'f%04d.png'), '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p', '-crf', '23', '-vf', 'scale=1280:-2', outBase + '.mp4']);
  const pick = Array.from({ length: Math.min(12, n) }, (_, i) => Math.round(i * (n - 1) / Math.max(1, Math.min(12, n) - 1)));
  const tw = 480, th = 270;
  const tiles = await Promise.all(pick.map(async (i) => sharp(await sharp(path.join(dir, `f${String(i).padStart(4, '0')}.png`)).resize(tw, th).toBuffer())
    .composite([{ input: Buffer.from(`<svg width="80" height="24"><rect width="100%" height="100%" fill="#000" opacity="0.6"/><text x="6" y="17" font-size="15" font-family="monospace" fill="#fff">${(i * every / 60).toFixed(1)} s</text></svg>`), left: 0, top: th - 24 }]).toBuffer()));
  await sharp({ create: { width: tw * 4, height: th * Math.ceil(tiles.length / 4), channels: 3, background: '#fff' } })
    .composite(tiles.map((b, i) => ({ input: b, left: (i % 4) * tw, top: Math.floor(i / 4) * th }))).jpeg({ quality: 82 }).toFile(outBase + '.jpg');
  console.log(`frames ${n}; ${logs.length ? logs.join('\n') : 'no page errors'}`);
  console.log(`-> ${outBase}.mp4, ${outBase}.jpg`);
} finally {
  await page.close(); await browser.close();
}
