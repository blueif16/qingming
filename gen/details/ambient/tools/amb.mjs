#!/usr/bin/env node
// The ambient agent's page tool (gen/details/ambient/): check, film, stills and an in-page A/B bench of web/src/ambient.js
// on world.html, through a Chrome slot (tools/chrome_slot.sh sets CDP_PORT) against the check server (5190).
// If the page hasn't made the ambient itself (before the world.js hook), it is injected: the dev server serves
// /src/ambient.js, so the page's own three.js, detail.js and wind.js are shared.
//   node amb.mjs check <url>                                   stats, sites, console errors
//   node amb.mjs film  <url> <out.jpg> X,D,H,facing,pitch [--frames 12] [--every 0.25] [--hour 10] [--force 1] [--set '{}'] [--first 1]
//   node amb.mjs stills <url> <out_dir> <spots.json> [--hour 10] [--force 1]      spots: [[name, X, D, H, facing, pitch, {set}?], ...]
//   node amb.mjs bench <url> <out.json> --views a,b [--secs 3] [--reps 3] [--throttle 4] [--viewport 390x844x3] [--warm 8]
//        A/B in one page: ambient off (disposed) and on (made again), interleaved, at each view; the page's own measure()
//   node amb.mjs sparrows <url> <out.jpg> <groupIndex>  walk toward a sparrow group and film the flush
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const req = createRequire(path.join(QM, 'tools/package.json'));
const { chromium } = req('playwright-core');
const sharp = req('sharp');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const [mode, url] = pos;
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const [VW, VH, VD] = opt('--viewport', mode === 'bench' ? '1920x1080x1' : '1280x720x1').split('x').map(Number);
if (VD !== 1 || VW < 800) await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: VD, mobile: VW < 800 });
else await page.setViewportSize({ width: VW, height: VH });
if (VW < 800) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 600)}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url);
await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 120000 }).catch(() => {});
if (!(await page.evaluate(() => !!window.__test))) { console.error('page failed', logs.join('\n')); await page.close(); process.exit(1); }
await page.evaluate(() => { document.querySelector('.lil-gui')?.remove(); document.getElementById('help')?.remove(); });

// make it if the page didn't (and remember how to make it again)
async function ensure() {
  return page.evaluate(async () => {
    const t = window.__test;
    if (!window.__ambMod) window.__ambMod = await import('/src/ambient.js');
    window.__ambMake = () => window.__ambMod.createAmbient({ scene: t.scene, camera: t.camera, player: t.player, sections: t.loaded, people: () => t.people, hour: () => t.s.hour, query: new URLSearchParams('ambient=1') });
    if (!window.__qmAmbient || window.__qmAmbient.disposed || window.__qmAmbient.off) { window.__qmAmbient?.dispose?.(); window.__ambMake(); }
    return !!window.__qmAmbient;
  });
}
const stats = () => page.evaluate(() => window.__qmAmbient?.stats());
const settle = async (ms = 1500) => { await page.waitForTimeout(ms); };
const place = async ([X, D, H, f, p, set = {}]) => page.evaluate(async ([X, D, H, f, p, set]) => {
  const t = window.__test, d = Math.PI / 180;
  for (const [k, v] of Object.entries(set)) t.set(k, v);
  t.player.pos.set(X, H + 0.2, -D); t.player.vel.set(0, 0, 0); t.player.yaw = f * d - Math.PI / 2; t.player.pitch = p * d;
  await t.goto?.(X, D, H);
  t.player.yaw = f * d - Math.PI / 2; t.player.pitch = p * d;
}, [X, D, H, f, p, set]);
const hour = +opt('--hour', 10);
if (!Number.isNaN(hour)) await page.evaluate((h) => window.__test.set('hour', h), hour);

async function strip(frames, every, out) {
  const raw = opt('--raw', null);
  if (raw) { fs.mkdirSync(raw, { recursive: true }); frames.forEach((b, i) => fs.writeFileSync(path.join(raw, `f${String(i).padStart(2, '0')}.png`), b)); }
  const W = 640, Hh = Math.round(640 * VH / VW), cols = 4;
  const tiles = await Promise.all(frames.map(async (b, i) => sharp(await sharp(b).resize(W, Hh).toBuffer())
    .composite([{ input: Buffer.from(`<svg width="90" height="26"><rect width="100%" height="100%" fill="#000" opacity="0.6"/><text x="8" y="19" font-size="16" font-family="monospace" fill="#fff">${(i * every).toFixed(2)} s</text></svg>`), left: 0, top: Hh - 26 }]).toBuffer()));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp({ create: { width: W * cols, height: Hh * Math.ceil(frames.length / cols), channels: 3, background: '#fff' } })
    .composite(tiles.map((b, i) => ({ input: b, left: (i % cols) * W, top: Math.floor(i / cols) * Hh }))).jpeg({ quality: 84 }).toFile(out);
}

try {
  if (mode === 'cloth') {
    await ensure();
    await settle(3000);
    console.log(JSON.stringify(await page.evaluate(() => window.__qmAmbient.cloth.map((c) => ({ mesh: c.mesh.name, sec: c.sec, dressed: c.mesh.material === c.clone, pieces: c.pieces, list: c.list }))), null, 1));
  } else if (mode === 'check') {
    const spot = opt('--spot', null);
    if (spot) await place(spot.split(',').map(Number));
    if (opt('--noinject', '0') !== '1') await ensure();
    await settle(3000);
    const r = await page.evaluate(() => ({ stats: window.__qmAmbient?.stats(), off: window.__qmAmbient?.off, ambientMeshes: window.__test.scene.getObjectByName('ambient') ? 1 : 0, calls: window.__test.renderer.info.render.calls, details: window.__test.details?.(), shadows: window.__test.shadowLayers && { worldDraws: window.__test.shadowLayers.worldDraws, moverDraws: window.__test.shadowLayers.moverDraws },
      sites: Object.fromEntries([...(window.__qmAmbient?.secs || [])].map(([n, S]) => [n, Object.fromEntries(Object.entries(S.sites).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length]))])) }));
    console.log(JSON.stringify(r, null, 1));
    if (opt('--eval', null)) console.log('eval:', JSON.stringify(await page.evaluate(opt('--eval')), null, 1));
  } else if (mode === 'film' || mode === 'sparrows') {
    const out = pos[2];
    const spot = (pos[3] || '').split(',').map(Number);
    const set = JSON.parse(opt('--set', '{}'));
    if (mode === 'film') await place([...spot, set]);
    await ensure();
    if (opt('--force', '0') === '1') await page.evaluate(() => { window.__qmAmbient.birdU.uForce.value = 1; });
    if (opt('--first', '0') === '1') await page.evaluate(() => window.__test.set('view', 'first'));
    if (opt('--js', null)) console.log('js:', JSON.stringify(await page.evaluate(opt('--js'))));
    await settle(+opt('--warm', 2) * 1000);
    if (mode === 'sparrows') {
      // stand 9 m from a sparrow group, looking at it, then walk in
      const gi = +(pos[3] || 0);
      const g = await page.evaluate((gi) => { const g = window.__qmAmbient.groups[gi]; return g && { x: g.centre.x, y: g.centre.y, z: g.centre.z, key: g.key }; }, gi);
      if (!g) throw new Error('no such group');
      console.log('group', g.key);
      await page.evaluate(async (g) => {
        const t = window.__test; t.set('view', 'third');
        const x = g.x - 9, z = g.z;
        t.player.pos.set(x, g.y + 0.3, z); t.player.vel.set(0, 0, 0);
        await t.goto(x, -z);
        t.player.yaw = Math.atan2(-(g.x - x), -(g.z - z)); t.player.pitch = -0.15;
      }, g);
      await settle(2500);
      // walk toward them for 3 s (hold W), filming
      const frames = [], every = +opt('--every', 0.25), N = +opt('--frames', 16);
      await page.keyboard.down('KeyW');
      for (let i = 0; i < N; i++) { const t0 = Date.now(); frames.push(await page.screenshot()); if (i === 8) await page.keyboard.up('KeyW'); await page.waitForTimeout(Math.max(0, every * 1000 - (Date.now() - t0))); }
      await page.keyboard.up('KeyW');
      await strip(frames, every, out);
      console.log(JSON.stringify(await page.evaluate(() => ({ flushes: window.__qmAmbient.events.slice(-3), group: window.__qmAmbient.groups.map((g) => g.state) }))));
    } else {
      const frames = [], every = +opt('--every', 0.25), N = +opt('--frames', 12);
      const aim = opt('--aim', null)?.split(',').map(Number); // keep looking at a world point (x, y, z)
      const look = () => aim && page.evaluate(([x, y, z]) => { const t = window.__test, p = t.camera.position; t.player.yaw = Math.atan2(-(x - p.x), -(z - p.z)); t.player.pitch = Math.atan2(y - p.y, Math.hypot(x - p.x, z - p.z)); }, aim);
      await look();
      for (let i = 0; i < N; i++) { const t0 = Date.now(); await look(); frames.push(await page.screenshot()); await page.waitForTimeout(Math.max(0, every * 1000 - (Date.now() - t0))); }
      await strip(frames, every, out);
    }
    console.log(JSON.stringify(await stats()));
    console.log(`-> ${out}`);
  } else if (mode === 'sparrows2') {
    // first person, zoomed, standing `--from` m off a group and looking at it; after `--wait` s step toward it
    const out = pos[2], gi = +(pos[3] || 0), from = +opt('--from', 7), N = +opt('--frames', 16), every = +opt('--every', 0.25);
    await ensure();
    await settle(2000);
    const g = await page.evaluate((gi) => { const g = window.__qmAmbient.groups[gi]; return g && { x: g.centre.x, y: g.centre.y, z: g.centre.z, key: g.key, n: g.birds.length }; }, gi);
    if (!g) throw new Error('no such group');
    console.log('group', g.key, g.n);
    const look = async (d) => page.evaluate(async ([g, d, first]) => {
      const t = window.__test; t.set('view', 'first'); t.set('fov', +first[0]);
      const ang = +first[1], x = g.x + Math.cos(ang) * d, z = g.z + Math.sin(ang) * d;
      t.player.pos.set(x, g.y + 0.2, z); t.player.vel.set(0, 0, 0);
      if (!window.__ambLooked) { await t.goto(x, -z); window.__ambLooked = 1; }
      t.player.yaw = Math.atan2(-(g.x - x), -(g.z - z)); t.player.pitch = -Math.atan2(1.6, d);
    }, [g, d, [opt('--fov', 30), opt('--ang', 1.57)]]);
    await look(from);
    await settle(2500);
    const frames = [];
    for (let i = 0; i < N; i++) {
      const t0 = Date.now();
      if (i >= N / 2) await look(Math.max(2.2, from - (i - N / 2 + 1) * 1.2));
      frames.push(await page.screenshot());
      await page.waitForTimeout(Math.max(0, every * 1000 - (Date.now() - t0)));
    }
    await strip(frames, every, out);
    console.log(JSON.stringify(await page.evaluate(() => ({ flushes: window.__qmAmbient.events.slice(-3), group: window.__qmAmbient.groups.map((g) => g.state) }))));
  } else if (mode === 'stream') {
    // walk the window along the world (goto spot to spot), then the shadow layers' counters and the GL warnings
    const out = pos[2], spots = (opt('--spots', '-90,8;-64,7;-20,4;15,5;40,9;70,8;120,4;134,19.6;180,22;260,12;300,8;360,11;300,8;200,20;134,19.6;70,8;15,5;-64,7')).split(';').map((x) => x.split(',').map(Number));
    const res = { url, steps: [] };
    for (const [X, D] of spots) {
      const t0 = Date.now();
      await page.evaluate(async ([X, D]) => { await window.__test.goto(X, D); }, [X, D]);
      await settle(+opt('--hold', 3) * 1000);
      const r = await page.evaluate(() => ({ L: [window.__test.shadowLayers.worldDraws, window.__test.shadowLayers.moverDraws], amb: window.__qmAmbient?.stats?.(), loaded: [...window.__test.loaded.keys()] }));
      res.steps.push({ X, D, ms: Date.now() - t0, worldDraws: r.L[0], moverDraws: r.L[1], amb: r.amb && { birds: r.amb.birds, particles: r.amb.particles, sparrows: r.amb.sparrows, cloth: r.amb.cloth, rebuilds: r.amb.rebuilds }, loaded: r.loaded, warnings: logs.length });
      console.log(X, D, JSON.stringify(res.steps[res.steps.length - 1]));
    }
    res.glWarnings = logs.filter((l) => /GL_INVALID|glGetProgramiv/.test(l)).length;
    res.logs = logs.slice(0, 50);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(res, null, 1));
    console.log('glWarnings', res.glWarnings, '->', out);
  } else if (mode === 'toggle') {
    // fast interleave at one view: the ambient's root shown and hidden in turns (its per-frame callback still runs, it
    // costs 0.02-0.1 ms by its own timer), `--pairs` windows of `--secs` each side; the difference is what drawing it costs
    const out = pos[2], views = opt('--views', 'storyteller,crown').split(','), secs = +opt('--secs', 2), pairs = +opt('--pairs', 8), thr = +opt('--throttle', 1);
    await ensure();
    const res = { url, viewport: [VW, VH, VD], throttle: thr, secs, pairs, views: {} };
    for (const v of views) {
      await page.evaluate((v) => window.__test.view(v), v);
      await page.waitForFunction(() => window.__test.stream.stats().baking === 0, null, { timeout: 60000 }).catch(() => {});
      await settle(+opt('--warm', 8) * 1000);
      if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
      await settle(2000);
      const rows = [];
      for (let i = 0; i < pairs; i++) for (const on of (i % 2 ? [true, false] : [false, true])) {
        await page.evaluate((on) => { window.__qmAmbient.root.visible = on; }, on);
        await settle(300);
        const m = await page.evaluate((s) => window.__test.measure(s), secs);
        rows.push({ on, fps: +m.fps.toFixed(1), cpuMs: +m.cpuMs.toFixed(3), gpuMs: m.gpuMs == null ? null : +m.gpuMs.toFixed(3), calls: m.calls });
      }
      await page.evaluate(() => { window.__qmAmbient.root.visible = true; });
      if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const med = (xs) => { const a = [...xs].sort((p, q) => p - q); return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2; };
      const pick = (on, k) => rows.filter((x) => x.on === on && x[k] != null).map((x) => x[k]);
      const diffs = (k) => { const d = []; for (let i = 0; i + 1 < rows.length; i += 2) { const a = rows[i], b = rows[i + 1]; const onr = a.on ? a : b, offr = a.on ? b : a; if (onr[k] != null && offr[k] != null) d.push(onr[k] - offr[k]); } return d; };
      res.views[v] = { rows, median: Object.fromEntries(['off', 'on'].map((sd) => [sd, Object.fromEntries(['fps', 'cpuMs', 'gpuMs', 'calls'].map((k) => [k, +med(pick(sd === 'on', k)).toFixed(3)]))])),
        pairedDiffMedian: Object.fromEntries(['fps', 'cpuMs', 'gpuMs', 'calls'].map((k) => [k, +med(diffs(k)).toFixed(3)])), amb: await stats() };
      console.log(v, JSON.stringify(res.views[v].median), 'paired on-off', JSON.stringify(res.views[v].pairedDiffMedian));
    }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(res, null, 1));
    console.log(`-> ${out}`);
  } else if (mode === 'stills') {
    const outDir = pos[2], spots = JSON.parse(fs.readFileSync(pos[3], 'utf8'));
    fs.mkdirSync(outDir, { recursive: true });
    await ensure();
    if (opt('--force', '0') === '1') await page.evaluate(() => { window.__qmAmbient.birdU.uForce.value = 1; });
    for (const s of spots) {
      await place(s.slice(1));
      await settle(+opt('--warm', 2.5) * 1000);
      await page.screenshot({ path: path.join(outDir, `${s[0]}.png`) });
      console.log(s[0]);
    }
  } else if (mode === 'bench') {
    const out = pos[2], views = opt('--views', 'storyteller,crown').split(','), secs = +opt('--secs', 3), reps = +opt('--reps', 3), thr = +opt('--throttle', 1);
    await ensure();
    const res = { url, viewport: [VW, VH, VD], throttle: thr, secs, reps, views: {} };
    for (const v of views) {
      await page.evaluate((v) => window.__test.view(v), v);
      await page.waitForFunction(() => window.__test.stream.stats().baking === 0, null, { timeout: 60000 }).catch(() => {});
      await settle(+opt('--warm', 8) * 1000);
      if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
      await settle(2000);
      const rows = [];
      for (let r = 0; r < reps; r++) {
        for (const side of ['off', 'on']) {
          await page.evaluate(([side, amp]) => {
            if (side === 'off') { window.__qmAmbient?.dispose(); window.__qmAmbient.disposed = true; return; }
            const a = window.__ambMake();
            if (amp) { const tc = window.__test.tiers.cfg; a.applyTier({ ...tc, detail: { ...tc.detail, ambient: JSON.parse(amp) } }); }
          }, [side, opt('--amp', '')]);
          await settle(1500);
          const m = await page.evaluate((s) => window.__test.measure(s), secs);
          const st = side === 'on' ? await stats() : null;
          const gm = await page.evaluate(() => { const g = window.__test.gpuMem?.(); return g ? +(+g.total).toFixed(2) : null; });
          const sl = await page.evaluate(() => window.__test.shadowLayers && [window.__test.shadowLayers.worldDraws, window.__test.shadowLayers.moverDraws]);
          rows.push({ side, rep: r, fps: +m.fps.toFixed(1), cpuMs: +m.cpuMs.toFixed(3), gpuMs: m.gpuMs == null ? null : +m.gpuMs.toFixed(3), calls: m.calls, tris: m.tris, gpuMB: gm, shadowDraws: sl, amb: st && { draws: st.draws, triangles: st.triangles, instances: st.instances, cpuMs: st.cpuMs } });
          console.log(v, side, r, JSON.stringify(rows[rows.length - 1]));
        }
      }
      if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const avg = (side, k) => { const xs = rows.filter((x) => x.side === side && x[k] != null).map((x) => x[k]); return xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(3) : null; };
      res.views[v] = { rows, mean: Object.fromEntries(['off', 'on'].map((s) => [s, Object.fromEntries(['fps', 'cpuMs', 'gpuMs', 'calls', 'tris', 'gpuMB'].map((k) => [k, avg(s, k)]))])) };
      console.log(v, 'mean', JSON.stringify(res.views[v].mean));
    }
    res.tiers = await page.evaluate(() => window.__test.tiers.stats().name);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(res, null, 1));
    console.log(`-> ${out}`);
  }
} finally {
  console.log(`console: ${logs.length} errors/warnings, ${logs.filter((l) => /glGetProgramiv/.test(l)).length} glGetProgramiv`);
  console.log(logs.length ? logs.slice(0, 30).join('\n') : 'no console errors/warnings');
  await page.close();
  await browser.close().catch(() => {});
}
