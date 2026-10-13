#!/usr/bin/env node
// The 3D trees' pilot harness (gen/details/trees/notes.md): loads world.html, then puts web/src/trees3d.js into the page
// through __test (no world.js hook yet: the cards' cross-fade patch and the tree batch are set up from outside), and
// compares cards (A) with 3D trees (B) in the same page:
//   shots  <spots.json>   per spot a still with cards and one with 3D trees (and a 1:1 crop of the middle)
//   bench  <spots.json>   per spot A B A B, each __test.measure(secs) (fps, CPU/GPU ms, calls, triangles), + trees3d.stats()
//   film   <spot>         frames over time with the 3D trees, for the wind
//   mem                   GPU MB (needs ?gpumem=1) with cards only, then with the 3D trees
// Run in a Chrome slot:  tools/chrome_slot.sh node gen/details/trees/tools/pilot.mjs <mode> <url> <out_dir> [arg]
//   [--viewport 390x844x3] [--throttle 4] [--secs 3] [--frames 12] [--every 0.25] [--hour 10] [--no3d]
// Spots: [[name, X, D, H, facing_deg, pitch_deg, {settings}?], ...] as shots_page.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const sharp = createRequire(path.join(ROOT, 'tools/package.json'))('sharp');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const flag = (n) => args.includes(n);
const [mode, url, out, arg] = args;
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const page = await (browser.contexts()[0] || await browser.newContext()).newPage();
const cdp = await page.context().newCDPSession(page);
const [W, H, VDPR] = opt('--viewport', '1280x720x1').split('x').map(Number);
if (VDPR !== 1 || W < 800) await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: VDPR, mobile: W < 800 });
else await page.setViewportSize({ width: W, height: H });
if (W < 800) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const done = async (code = 0) => { fs.writeFileSync(path.join(out, `${mode}_log.txt`), logs.join('\n')); await page.close().catch(() => {}); await browser.close().catch(() => {}); process.exit(code); };
try {
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 180000 });
  if (!(await page.evaluate(() => !!window.__test))) { console.error(await page.evaluate(() => document.getElementById('loading')?.textContent)); await done(1); }
  await page.evaluate(() => { document.querySelector('.lil-gui')?.remove(); document.getElementById('help')?.remove(); });
  await page.evaluate((h) => window.__test.set('hour', h), +opt('--hour', '10'));
  // a slot's Chrome keeps the page's saved settings from other agents' runs (localStorage): pin what the numbers need
  await page.evaluate(() => { const t = window.__test; if (!t.s.shadows) t.set('shadows', true); if (t.s.shading !== 'toon') t.set('shading', 'toon'); });
  await page.evaluate(() => window.__test.stream.settle?.(true));
  // ---------------------------------------------------------------- the module, put in from outside
  const setup = async () => {
    const t = window.__test, I = t.stream.internals, THREE = t.THREE;
    if (t.trees3d?.on) { // the page's own (the world.js hook, on with ?trees=3d): toggle its tier numbers
      const trees3d = t.trees3d, tierCfg = () => ({ ...t.tiers.cfg, detailScale: t.tiers.detailScale ?? 1 });
      window.__trees3d = trees3d;
      window.__trees3dOn = (on) => {
        const c = tierCfg();
        trees3d.applyTier(on ? c : { ...c, detail: { ...c.detail, trees: { ...c.detail.trees, meshNear: 0, meshNearRiver: 0 } } });
        t.shadowLayers.world = true;
        return trees3d.rebuilding;
      };
      await trees3d.rebuilding;
      return { hooked: true, stats: trees3d.stats(), tier: t.tiers.name, cfg: trees3d.cfg };
    }
    const mod = await import('/src/trees3d.js');
    const ramp = [...I.variants.values()].map((v) => v.mat.gradientMap).find(Boolean) || null;
    const trees3d = new mod.Trees3D({
      scene: t.scene, texture: (u) => I.texCache.image(u), release: (u) => I.texCache.release(u),
      shade: (mesh, std, on) => {
        if (!on) return;
        const m = t.s.shading === 'toon' ? new THREE.MeshToonMaterial({ map: std.map, name: 'trees3d', gradientMap: ramp }) : new THREE.MeshLambertMaterial({ map: std.map, name: 'trees3d' });
        trees3d.patchVariant(m);
        mesh.material = m;
      },
    });
    const tierCfg = () => ({ ...t.tiers.cfg, detailScale: 1 });
    trees3d.applyTier(tierCfg());
    const reg = await (await fetch('assets/trees3d/trees3d.json')).json();
    const kinds = (await Promise.all([...I.cardKinds.values()])).filter((k) => k.mesh && reg.variants[k.name]); // only cards with a 3D tree hand over
    const bySec = new Map();
    for (const k of kinds) for (const tr of k.trees) {
      if (!bySec.has(tr.sec)) bySec.set(tr.sec, []);
      bySec.get(tr.sec).push({ card: k.name, x: tr.x, y: tr.y, z: tr.z, s: tr.s, flip: tr.flip });
    }
    for (const [sec, list] of bySec) await trees3d.place(sec, list);
    await new Promise((r) => setTimeout(r, 100));
    const cards = (on) => { for (const k of kinds) { k.mesh.castShadow = !on; const m = k.mesh.material; if (!m.userData.qmCard) { m.onBeforeCompile = mod.cardPatch; m.userData.qmCard = 1; m.needsUpdate = true; } } };
    cards(true);
    window.__trees3d = trees3d;
    window.__trees3dOn = (on) => {
      const c = tierCfg();
      trees3d.applyTier(on ? c : { ...c, detail: { ...c.detail, trees: { ...c.detail.trees, meshNear: 0, meshNearRiver: 0 } } });
      trees3d.root.visible = on;
      cards(on);
      t.shadowLayers.world = true;
    };
    return { stats: trees3d.stats(), placed: [...bySec].map(([s, l]) => `${s}: ${l.length}`), tier: t.tiers.name, cfg: trees3d.cfg };
  };
  if (flag('--gltrace')) { // glGetProgramiv on a deleted program: who deleted it, and who asks
    await page.evaluate(() => {
      const gl = window.__test.renderer.getContext(), dead = new Map(), del = gl.deleteProgram.bind(gl), gp = gl.getProgramParameter.bind(gl);
      window.__glDead = [];
      gl.deleteProgram = (p) => { dead.set(p, new Error().stack.split('\n').slice(1, 9).join(' | ')); return del(p); };
      gl.getProgramParameter = (p, n) => { if (dead.has(p) && window.__glDead.length < 20) window.__glDead.push({ deleted: dead.get(p), asked: new Error().stack.split('\n').slice(1, 9).join(' | ') }); return gp(p, n); };
    });
  }
  if (!flag('--no3d')) console.log('trees3d:', JSON.stringify(await page.evaluate(setup)));
  const place = ([X, D, Hh, f, p, set]) => {
    const t = window.__test, d = Math.PI / 180;
    for (const [k, v] of Object.entries(set || {})) t.set(k, v);
    t.player.pos.set(X, Hh + 0.2, -D); t.player.vel.set(0, 0, 0); t.player.yaw = f * d - Math.PI / 2; t.player.pitch = p * d;
    return t.goto?.(X, D, Hh);
  };
  const on = (v) => page.evaluate(async (v) => { await window.__trees3dOn?.(v); }, v);
  const spots = () => JSON.parse(fs.readFileSync(arg, 'utf8'));
  if (opt('--throttle')) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +opt('--throttle') });

  if (mode === 'shots') {
    for (const s of spots()) {
      await page.evaluate(place, s.slice(1));
      for (const [tag, v] of [['cards', false], ['3d', true]]) {
        await on(v);
        await page.waitForTimeout(1500);
        const f = path.join(out, `${s[0]}_${tag}.png`);
        await page.screenshot({ path: f });
        console.log(f);
      }
    }
    // a sheet: cards | 3d per spot
    const rows = [];
    for (const s of spots()) for (const tag of ['cards', '3d']) rows.push(path.join(out, `${s[0]}_${tag}.png`));
    const tw = 960, th = Math.round((tw * H) / W);
    const tiles = await Promise.all(rows.map((f) => sharp(f).resize(tw, th).toBuffer()));
    await sharp({ create: { width: tw * 2, height: th * (rows.length / 2), channels: 3, background: '#fff' } })
      .composite(tiles.map((b, i) => ({ input: b, left: (i % 2) * tw, top: Math.floor(i / 2) * th }))).jpeg({ quality: 84 }).toFile(path.join(out, 'sheet.jpg'));
  }
  if (mode === 'bench') {
    const secs = +opt('--secs', 3), res = [];
    for (const s of spots()) {
      await page.evaluate(place, s.slice(1));
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      await on(true); await page.waitForTimeout(2500); await on(false); await page.waitForTimeout(1500);
      if (opt('--throttle')) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +opt('--throttle') });
      for (let rep = 0; rep < 2; rep++) for (const [tag, v] of [['cards', false], ['3d', true]]) {
        await on(v);
        await page.waitForTimeout(1200);
        const sl0 = await page.evaluate(() => ({ w: window.__test.shadowLayers?.worldDraws, m: window.__test.shadowLayers?.moverDraws }));
        const m = await page.evaluate((x) => window.__test.measure(x), secs);
        const sl1 = await page.evaluate(() => ({ w: window.__test.shadowLayers?.worldDraws, m: window.__test.shadowLayers?.moverDraws }));
        m.shadowWorldDraws = sl1.w - sl0.w; m.shadowMoverDraws = sl1.m - sl0.m;
        const st = await page.evaluate(() => window.__trees3d?.stats() ?? null);
        res.push({ spot: s[0], tag, rep, ...m, trees3d: v ? st : null });
        console.log(`${s[0].padEnd(12)} ${tag.padEnd(5)} rep ${rep}: ${m.fps.toFixed(1)} fps, cpu ${m.cpuMs.toFixed(2)} ms, gpu ${m.gpuMs?.toFixed(2) ?? '-'} ms, ${m.calls} calls, ${(m.tris / 1000).toFixed(1)}k tris, shadow world/mover redraws ${m.shadowWorldDraws}/${m.shadowMoverDraws}${v ? `; 3D ${st.instances} trees ${st.triangles} tris, choose ${st.cpuMs} ms` : ''}`);
      }
    }
    fs.writeFileSync(path.join(out, 'bench.json'), JSON.stringify(res, null, 1));
  }
  if (mode === 'film') {
    const s = JSON.parse(arg);
    await page.evaluate(place, s);
    await on(true);
    await page.waitForTimeout(1500);
    const N = +opt('--frames', 12), every = +opt('--every', 0.25), frames = [];
    for (let i = 0; i < N; i++) { const t0 = Date.now(); frames.push(await page.screenshot()); await page.waitForTimeout(Math.max(0, every * 1000 - (Date.now() - t0))); }
    frames.forEach((b, i) => fs.writeFileSync(path.join(out, `film_${String(i).padStart(3, '0')}.png`), b));
    const tw = 640, th = Math.round((tw * H) / W), cols = 4;
    const tiles = await Promise.all(frames.map((b) => sharp(b).resize(tw, th).toBuffer()));
    await sharp({ create: { width: tw * cols, height: th * Math.ceil(N / cols), channels: 3, background: '#fff' } })
      .composite(tiles.map((b, i) => ({ input: b, left: (i % cols) * tw, top: Math.floor(i / cols) * th }))).jpeg({ quality: 82 }).toFile(path.join(out, 'film.jpg'));
    console.log(path.join(out, 'film.jpg'));
  }
  if (mode === 'eval') { // arg: a JS function body (async), run in the page after setup; its return printed as JSON
    const r = await page.evaluate(async (src) => { const f = new Function(`return (async () => { ${src} })()`); return f(); }, arg);
    console.log(JSON.stringify(r, null, 1));
    fs.writeFileSync(path.join(out, 'eval.json'), JSON.stringify(r, null, 1));
  }
  if (mode === 'mem') {
    const r = {};
    await on(false); await page.waitForTimeout(1500);
    r.cards = await page.evaluate(() => window.__test.gpuMem());
    await on(true); await page.waitForTimeout(2500);
    r.trees3d = await page.evaluate(() => window.__test.gpuMem());
    r.stats = await page.evaluate(() => window.__trees3d?.stats());
    fs.writeFileSync(path.join(out, 'mem.json'), JSON.stringify(r, null, 1));
    console.log(JSON.stringify(r).slice(0, 2000));
  }
  if (flag('--gltrace')) { const d = await page.evaluate(() => window.__glDead); fs.writeFileSync(path.join(out, 'gltrace.json'), JSON.stringify(d, null, 1)); console.log(`gltrace: ${d.length} queries of deleted programs`); }
} catch (e) { console.error(e); logs.push(String(e.stack || e)); await done(1); }
console.log(logs.length ? `${logs.length} console lines (${mode}_log.txt)` : 'no page errors');
await done(0);
