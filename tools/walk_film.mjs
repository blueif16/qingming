#!/usr/bin/env node
// A film of a walk (or of standing still) on a scene page, for the user's review: the walker is stepped at 60 Hz along
// its legs as tools/walk_page.mjs does (the boats step with it), and a frame is captured every `--every` steps. Writes
// frames into FRAMES_DIR (default: the system temp folder), <out>.jpg (a contact strip) and <out>.mp4 (ffmpeg, at 60/every fps, i.e. real walking speed).
// Usage: node walk_film.mjs <url> <out_base> '<json: {start:[X,D] | spot:[X,D,H,facing,pitch], legs:[[facing,secs],...], still:secs, set:{}, hour:10, pitch:deg}>' [--every 4]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const [url, outBase, specJson] = args;
const spec = JSON.parse(specJson);
const every = +opt('--every', 4);
const W = +opt('--w', 1280), Hh = +opt('--h', 720);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await browser.contexts()[0].newPage();
await page.setViewportSize({ width: W, height: Hh });
const logs = [];
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
try {
  await page.goto(url);
  await page.waitForFunction(() => window.__test, null, { timeout: 90000 });
  await page.evaluate(() => { document.querySelector('.lil-gui')?.remove(); document.getElementById('help')?.remove(); const st = document.getElementById('stats'); if (st) st.style.visibility = 'hidden'; });
  await page.evaluate((h) => window.__test.set('hour', h), spec.hour ?? 10);
  await page.evaluate(async (s) => {
    const t = window.__test, p = t.player, T = t.THREE, d = Math.PI / 180;
    for (const [k, v] of Object.entries(s.set || {})) t.set(k, v);
    if (s.spot) {
      const [X, D, H, f, pt] = s.spot;
      p.pos.set(X, H + 0.2, -D); p.vel.set(0, 0, 0); p.yaw = f * d - Math.PI / 2; p.pitch = pt * d;
      if (t.goto) await t.goto(X, D, H);
    } else {
      const [X, D] = s.start;
      if (t.goto) await t.goto(X, D);
      const hit = p.bvh.raycastFirst(new T.Ray(new T.Vector3(X, 40, -D), new T.Vector3(0, -1, 0)), T.DoubleSide);
      p.pos.set(X, (hit ? hit.point.y : 0) + 0.05, -D); p.vel.set(0, 0, 0); p.onGround = true;
      p.yaw = (s.legs?.[0]?.[0] ?? 0) * d - Math.PI / 2; p.pitch = (s.pitch ?? -6) * d;
      for (let i = 0; i < 30; i++) p.update(1 / 60);
    }
  }, spec);
  await page.waitForTimeout(2500);
  const dir = path.join(process.env.FRAMES_DIR || path.join(os.tmpdir(), 'qingming_walk_film'), path.basename(outBase));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  const snap = async () => { await page.screenshot({ path: path.join(dir, `f${String(n++).padStart(4, '0')}.png`) }); };
  // the plan: [facing, seconds] legs walked with W held, or a still hold of `still` seconds
  const steps = [];
  for (const [f, secs] of spec.legs || []) for (let i = 0; i < secs * 60; i++) steps.push(f);
  for (let i = 0; i < (spec.still || 0) * 60; i++) steps.push(null);
  for (let i = 0; i < steps.length; i += every) {
    await page.evaluate(([fs_, k]) => {
      const t = window.__test, p = t.player, d = Math.PI / 180;
      for (let j = 0; j < fs_.length; j++) {
        const f = fs_[j];
        if (f === null) { p.keys.delete('KeyW'); } else { p.yaw = f * d - Math.PI / 2; p.keys.add('KeyW'); }
        p.update(1 / 60);
      }
      p.keys.delete('KeyW');
    }, [steps.slice(i, i + every), i]);
    await snap();
  }
  const end = await page.evaluate(() => { const p = window.__test.player; return [p.pos.x, -p.pos.z, p.pos.y].map((v) => +v.toFixed(2)); });
  console.log(`frames ${n}, end X ${end[0]} D ${end[1]} H ${end[2]}`);
  const fps = Math.round(60 / every);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(dir, 'f%04d.png'), '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p', '-crf', '22', '-vf', 'scale=1280:-2', outBase + '.mp4']);
  // the contact strip: 12 frames evenly spread
  const pick = Array.from({ length: Math.min(12, n) }, (_, i) => Math.round(i * (n - 1) / Math.max(1, Math.min(12, n) - 1)));
  const tw = 480, th = 270;
  const tiles = await Promise.all(pick.map(async (i) => sharp(await sharp(path.join(dir, `f${String(i).padStart(4, '0')}.png`)).resize(tw, th).toBuffer())
    .composite([{ input: Buffer.from(`<svg width="80" height="24"><rect width="100%" height="100%" fill="#000" opacity="0.6"/><text x="6" y="17" font-size="15" font-family="monospace" fill="#fff">${(i * every / 60).toFixed(1)} s</text></svg>`), left: 0, top: th - 24 }]).toBuffer()));
  await sharp({ create: { width: tw * 4, height: th * Math.ceil(tiles.length / 4), channels: 3, background: '#fff' } })
    .composite(tiles.map((b, i) => ({ input: b, left: (i % 4) * tw, top: Math.floor(i / 4) * th }))).jpeg({ quality: 82 }).toFile(outBase + '.jpg');
  console.log(logs.length ? logs.join('\n') : 'no page errors');
  console.log(`-> ${outBase}.mp4, ${outBase}.jpg`);
} finally {
  await page.close(); await browser.close();
}
