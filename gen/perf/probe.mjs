#!/usr/bin/env node
// The performance probe for web/world.html (gen/perf/, the perf research of 2026-10-12). Study tool: it changes no
// project file; everything it tries is done at runtime in the page through gen/perf/instrument.js.
//   tools/chrome_slot.sh node gen/perf/probe.mjs bench  <url> <out_dir> [--views crown,under_arch] [--secs 2] [--exps all|a,b] [--throttle 4]
//   tools/chrome_slot.sh node gen/perf/probe.mjs stream <url> <out_dir>      section loads, their stalls, the GL warnings traced
//   tools/chrome_slot.sh node gen/perf/probe.mjs memory <url> <out_dir> [--views crown] [--viewport 390x844x3]
// bench: per view, the frame split into parts (CPU, GPU, calls, triangles per pass), then each experiment A/B
// (instrument.js exp.*), the fragments shaded per pixel, and a CPU profile (by file and function), at 1x and throttled.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const [mode, url, outDir] = pos;
fs.mkdirSync(outDir, { recursive: true });
const secs = +opt('--secs', 2);
const [VW, VH, VDPR] = (opt('--viewport', '1920x1080x1')).split('x').map(Number);

const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) || m.text().startsWith('[perf]')) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const out = { mode, url, date: new Date().toISOString(), viewport: [VW, VH, VDPR] };
// which page code was measured: other sessions edit web/src during the round
{ const { createHash } = await import('node:crypto'); const src = path.join(HERE, '../../web/src'); out.src = Object.fromEntries(fs.readdirSync(src).filter((f) => f.endsWith('.js')).map((f) => [f, createHash('md5').update(fs.readFileSync(path.join(src, f))).digest('hex').slice(0, 8)])); }
const save = () => fs.writeFileSync(path.join(outDir, `${mode}.json`), JSON.stringify({ ...out, logs }, null, 1));

async function goView(v) {
  await page.evaluate((v) => window.__test.view(v), v);
  // the bakes of a newly streamed section are time-sliced: wait until nothing is baking
  await page.waitForFunction(() => window.__test.stream.stats().baking === 0, null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);
}
const M = (o = {}) => page.evaluate(([s, o]) => window.__perf.measure(s, o), [secs, o]);
const line = (label, r) => console.log(`${label.padEnd(28)} ${String(r.fps).padStart(6)} fps  cpu ${r.cpu.frame.toFixed(2)} (people ${(r.cpu.people || 0).toFixed(2)}, color ${(r.cpu.color || 0).toFixed(2)}, shadow ${(r.cpu.shadow || 0).toFixed(2)}, normal ${(r.cpu.normal || 0).toFixed(2)})  gpu ${r.gpuFrame}  calls ${Object.values(r.calls).reduce((a, b) => a + b, 0).toFixed(0)}  p95 ${r.cpuP95 ?? '-'} max ${r.cpuMax ?? '-'} up ${r.uploadKB?.mean ?? '-'}/${r.uploadKB?.max ?? '-'}KB bake ${r.bakeMs?.max ?? '-'}`);

const EXPS = {
  noop: ['0', '0'], // the noise floor: base against base
  ink_off: ["window.__test.set('ink', false)", "window.__test.set('ink', true)"],
  shadows_off: ["window.__test.set('shadows', false)", "window.__test.set('shadows', true)"],
  shadow_cache: ['window.__u = window.__perf.exp.shadowCache()', 'window.__u()'],
  shadow_people_only: ["window.__u = window.__perf.exp.castOnly('crowd')", 'window.__u()'],
  crowd_hidden: ["window.__u = window.__perf.exp.hide('crowd')", 'window.__u()'],
  crowd_quarter_tris: ['window.__u = window.__perf.exp.crowdTris(0.25)', 'window.__u()'],
  crowd_cheap_skin: ['window.__u = window.__perf.exp.crowdCheapSkin()', 'window.__u()'],
  trees_hidden: ["window.__u = window.__perf.exp.hide('trees')", 'window.__u()'],
  boats_hidden: ["window.__u = window.__perf.exp.hide('boats')", 'window.__u()'],
  world_hidden: ["window.__u = window.__perf.exp.hide('world')", 'window.__u()'],
  backdrop_hidden: ["window.__u = window.__perf.exp.hide('backdrop')", 'window.__u()'],
  crowd_radius_30: ['window.__u = window.__perf.exp.crowdRadius(30)', 'window.__u()'],
  crowd_radius_20: ['window.__u = window.__perf.exp.crowdRadius(20)', 'window.__u()'],
  res_100: ["window.__pr = window.__test.s.pixelRatioCap; window.__test.set('pixelRatioCap', 1.0)", "window.__test.set('pixelRatioCap', window.__pr)"],
  mrt: ['(window.__u = window.__perf.exp.mrt()).info', 'window.__u()'],
  mrt_nomsaa: ['(window.__u = window.__perf.exp.mrt({ samples: 0 })).info', 'window.__u()'],
  boats_plain: ['(window.__u = window.__perf.exp.boatsPlain()).info', 'window.__u()'],
  boats_nosort: ['(window.__u = window.__perf.exp.boatsPlain({ cull: true })).info', 'window.__u()'],
  cell_cull_8m: ['(window.__u = window.__perf.exp.cellCull(8)).stats', 'window.__u()'],
  msaa_off: ['window.__u = window.__perf.exp.colorTarget({ samples: 0 })', 'window.__u()'],
  color_u8: ["window.__u = window.__perf.exp.colorTarget({ type: 'u8' })", 'window.__u()'],
  res_075: ["window.__pr = window.__test.s.pixelRatioCap; window.__test.set('pixelRatioCap', 0.75)", "window.__test.set('pixelRatioCap', window.__pr)"],
  res_050: ["window.__pr = window.__test.s.pixelRatioCap; window.__test.set('pixelRatioCap', 0.5)", "window.__test.set('pixelRatioCap', window.__pr)"],
};

async function profile(ms) {
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await cdp.send('Profiler.start');
  await page.waitForTimeout(ms);
  const { profile: p } = await cdp.send('Profiler.stop');
  await cdp.send('Profiler.disable');
  const byId = new Map(p.nodes.map((n) => [n.id, n]));
  const self = new Map();
  for (let i = 0; i < p.samples.length; i++) self.set(p.samples[i], (self.get(p.samples[i]) || 0) + (p.timeDeltas[i] || 0) / 1000);
  const total = [...self.values()].reduce((a, b) => a + b, 0);
  const keyOf = (n) => { const f = n.callFrame, file = f.url ? f.url.split('?')[0].split('/').slice(-1)[0] : `(${f.functionName || 'native'})`; return [`${f.functionName || '(anon)'} ${file}:${f.lineNumber + 1}`, file]; };
  const byFile = {}, byFn = {}, incl = {};
  for (const [id, ms] of self) { const [k, file] = keyOf(byId.get(id)); byFile[file] = (byFile[file] || 0) + ms; byFn[k] = (byFn[k] || 0) + ms; }
  // inclusive time per function (counted once per stack)
  const parent = new Map();
  for (const n of p.nodes) for (const c of n.children || []) parent.set(c, n.id);
  for (const [id, ms] of self) {
    const seen = new Set();
    for (let x = id; x != null; x = parent.get(x)) { const [k] = keyOf(byId.get(x)); if (!seen.has(k)) { seen.add(k); incl[k] = (incl[k] || 0) + ms; } }
  }
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [k, +(v / (ms / 1000)).toFixed(0), +(100 * v / total).toFixed(1)]); // ms per second of wall time, % of samples
  // per pass (instrument.js names them): the pass's time, and how much of it re-resolves shader programs
  const byPass = {};
  for (const [id, t] of self) {
    let pass = null, prog = false;
    for (let x = id; x != null; x = parent.get(x)) {
      const f = byId.get(x).callFrame.functionName;
      if (!pass && /^pass[A-Z]/.test(f)) pass = f;
      if (f === 'getProgram') prog = true;
    }
    if (!pass) continue;
    const e = byPass[pass] ||= { ms: 0, getProgram: 0 };
    e.ms += t; if (prog) e.getProgram += t;
  }
  for (const e of Object.values(byPass)) { e.ms = +(e.ms / (ms / 1000)).toFixed(1); e.getProgram = +(e.getProgram / (ms / 1000)).toFixed(1); }
  return { wallMs: ms, sampledMs: Math.round(total), byPass, byFile: top(byFile, 25), selfTop: top(byFn, 40), inclusiveTop: top(incl, 60) };
}

async function bench() {
  const views = opt('--views', 'crown,under_arch,grain_wharf,moorings_bank,doctor').split(',');
  const exps = opt('--exps', 'all') === 'all' ? Object.keys(EXPS) : opt('--exps').split(',');
  const thr = +opt('--throttle', 1), warm = +opt('--warm', 25), every = +opt('--rebase', 6);
  out.throttle = thr;
  out.views = {};
  let progDone = false;
  const setThr = (t) => cdp.send('Emulation.setCPUThrottlingRate', { rate: t });
  for (const v of views) {
    await setThr(1);
    await goView(v);
    // steady state: people play through their routines, so every clip they use is baked before we measure (a newly
    // wanted clip rebuilds and re-uploads its character's whole bake texture: measured separately as uploads)
    const w0 = Date.now();
    rec0: {
      const warmRun = await M({ gpu: false });
      out.views[v] = { warmup: warmRun };
      console.log(`${v} warm-up first ${secs}s: cpu ${warmRun.cpu.frame} p95 ${warmRun.cpuP95} max ${warmRun.cpuMax} upload ${JSON.stringify(warmRun.uploadKB)} bake ${JSON.stringify(warmRun.bakeMs)}`);
    }
    await page.waitForTimeout(Math.max(0, warm * 1000 - (Date.now() - w0)));
    const rec = out.views[v];
    if (!progDone) { out.programs = await page.evaluate(() => window.__perf.exp.programs()); progDone = true; }
    rec.inventory = await page.evaluate(() => window.__perf.inventory());
    rec.runs = {};
    rec.quiet = await quiet();
    if (+opt('--freeze', 1)) { await page.evaluate(() => window.__perf.freeze(true)); rec.frozen = true; }
    if (thr > 1) { await setThr(thr); await page.waitForTimeout(1000); }
    rec.pageMeasure = await page.evaluate((s) => window.__test.measure(s), secs); // the page's own numbers, no segments
    rec.runs.base_nogpu = await M({ gpu: false });
    rec.runs.base = await M();
    line(`${v} base (page)`, { fps: rec.pageMeasure.fps.toFixed(0), cpu: { frame: rec.pageMeasure.cpuMs }, gpuFrame: rec.pageMeasure.gpuMs?.toFixed(2), calls: { all: rec.pageMeasure.calls } });
    line(`${v} base`, rec.runs.base);
    // A/B interleaved: base, exp, base, exp (reps times); each exp is read against the bases right beside it, so a
    // slow drift of the machine (clocks, other processes) cancels
    const reps = +opt('--reps', 2);
    rec.ab = {};
    for (const e of exps) {
      const [on, offc] = EXPS[e];
      const bs = [], xs = [];
      let info;
      for (let i = 0; i < reps; i++) {
        bs.push(await M());
        info = await page.evaluate(on);
        await page.waitForTimeout(+opt('--settle', 500)); // a toggle that swaps shaders compiles programs: let it finish
        xs.push(await M());
        await page.evaluate(offc);
        await page.waitForTimeout(+opt('--settle', 400));
      }
      bs.push(await M());
      const mean = (arr, f) => arr.reduce((a, x) => a + f(x), 0) / arr.length;
      const calls = (r) => Object.values(r.calls).reduce((a, b) => a + b, 0);
      const keys = { fps: (r) => r.fps, cpu: (r) => r.cpu.frame, gpu: (r) => r.gpuFrame, calls, color: (r) => r.cpu.color || 0, shadow: (r) => r.cpu.shadow || 0, normal: (r) => (r.cpu.normal || 0) + (r.cpu.overlay || 0), people: (r) => r.cpu.people || 0, p95: (r) => r.cpuP95 };
      const ab = {};
      for (const [k, f] of Object.entries(keys)) { const b = mean(bs, f), x = mean(xs, f); ab[k] = { base: +b.toFixed(3), exp: +x.toFixed(3), delta: +(x - b).toFixed(3), ratio: +(x / b).toFixed(3) }; }
      rec.ab[e] = { ...ab, info: info && typeof info === 'object' ? info : undefined, runs: xs, bases: bs };
      console.log(`${v} ${e.padEnd(20)} cpu ${ab.cpu.base}->${ab.cpu.exp} (${(100 * (ab.cpu.ratio - 1)).toFixed(0)}%)  gpu ${ab.gpu.base}->${ab.gpu.exp} (${(100 * (ab.gpu.ratio - 1)).toFixed(0)}%)  calls ${ab.calls.base.toFixed(0)}->${ab.calls.exp.toFixed(0)}  fps ${ab.fps.base.toFixed(0)}->${ab.fps.exp.toFixed(0)}`);
      save();
    }
    rec.runs.base_end = await M();
    line(`${v} base at end`, rec.runs.base_end);
    if (+opt('--overdraw', 1)) {
      rec.overdraw = await page.evaluate(() => window.__perf.exp.overdraw());
      rec.frustum = await page.evaluate(() => window.__perf.exp.frustumShare());
      console.log(v, 'overdraw', JSON.stringify(rec.overdraw), 'frustum', JSON.stringify(rec.frustum));
    }
    for (const t of String(opt('--extra-throttle', '')).split(',').filter(Boolean).map(Number)) {
      await setThr(t);
      await page.waitForTimeout(1000);
      rec.runs[`base_throttle${t}`] = await M();
      line(`${v} throttle ${t}`, rec.runs[`base_throttle${t}`]);
      await setThr(thr);
    }
    await page.evaluate(() => window.__perf.freeze(false));
    rec.runs.base_live = await M(); // time running again: the routines' real cost (walkers plan, clips change)
    line(`${v} base, time running`, rec.runs.base_live);
    if (+opt('--profile', 1)) rec[`profile_${thr}x`] = await profile(3000);
    rec.quietEnd = await quiet(0);
    save();
  }
  await setThr(1);
}

// wait until nothing else heavy runs (another check Chrome, a Blender), up to --quiet-max seconds; returns what it saw
async function quiet(maxS = +opt('--quiet-max', 900)) {
  const { execSync } = await import('node:child_process');
  const mine = +(process.env.CDP_PORT || 9223) - 9230;
  const t0 = Date.now();
  for (;;) {
    const st = execSync(path.join(HERE, '../../tools/machine.sh') + ' status', { encoding: 'utf8' });
    const others = st.split('\n').filter((l) => /slot\s+chrome \d taken/.test(l) && !l.includes(`chrome ${mine} taken`)).length;
    const blender = +(st.match(/blender\.exe\s+(\d+) running/) || [, 0])[1];
    const load = +(st.match(/load ([\d.]+)/) || [, 0])[1];
    const ok = !others && !blender && load < 6;
    if (ok || (Date.now() - t0) / 1000 >= maxS) return { quiet: ok, waitedS: Math.round((Date.now() - t0) / 1000), others, blender, load };
    console.log(`waiting for a quiet machine: ${others} other check Chromes, ${blender} Blenders, load ${load}`);
    await page.waitForTimeout(15000);
  }
}

// ---- streaming: walk the window across the river sections, recording each load's stall and the traced GL warnings
function traceGl() {
  window.__glTrace = [];
  const P = WebGL2RenderingContext.prototype;
  for (const fn of ['getProgramParameter', 'getProgramInfoLog', 'useProgram', 'getUniformLocation', 'getAttribLocation', 'deleteProgram', 'linkProgram']) {
    const orig = P[fn];
    P[fn] = function (prog, ...a) {
      if (prog && !this.isProgram(prog)) window.__glTrace.push({ fn, arg: a[0], stack: new Error().stack.split('\n').slice(2, 9).map((s) => s.trim()).join(' | ') });
      const r = orig.call(this, prog, ...a);
      if (fn === 'getProgramParameter') { const e = this.getError(); if (e) window.__glTrace.push({ fn, arg: a[0], err: e, deleted: !this.isProgram(prog), stack: new Error().stack.split('\n').slice(2, 9).map((s) => s.trim()).join(' | ') }); }
      return r;
    };
  }
}
async function stream() {
  const route = opt('--route', 'storyteller,crossroads,from_gate,carts,moorings_bank,crown,under_arch,grain_wharf,towed_boat,farmsteads,charcoal_train,crown,storyteller').split(',');
  out.steps = [];
  // peaks while the window streams (GPU bytes need ?gpumem=1)
  await page.evaluate(() => {
    window.__peak = { gpu: 0, heap: 0, samples: [] };
    setInterval(() => {
      const g = window.__test.gpuMem?.()?.total || 0, h = performance.memory ? performance.memory.usedJSHeapSize / 2 ** 20 : 0;
      window.__peak.gpu = Math.max(window.__peak.gpu, g); window.__peak.heap = Math.max(window.__peak.heap, h);
      window.__peak.samples.push([Math.round(performance.now()), +g.toFixed(1), +h.toFixed(1)]);
    }, 250);
  });
  const thrFrom = +opt('--throttle-from', -1), wait = +opt('--wait', 2500);
  let k = 0;
  for (const v of route) {
    if (k++ === thrFrom) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +opt('--throttle', 4) });
    const t = Date.now();
    await page.evaluate((v) => window.__test.view(v), v);
    await page.waitForTimeout(wait);
    const st = await page.evaluate(() => ({ s: window.__test.stream.stats(), trace: window.__glTrace.length }));
    out.steps.push({ view: v, ms: Date.now() - t, loaded: st.s.loaded, traced: st.trace });
    console.log(v, Date.now() - t, 'ms', st.s.loaded.join(','), 'gl traces', st.trace);
  }
  out.events = await page.evaluate(() => window.__test.stream.stats().events);
  out.peak = await page.evaluate(() => window.__peak);
  console.log('peak gpu MB', out.peak.gpu, 'peak heap MB', out.peak.heap.toFixed(0));
  const tr = await page.evaluate(() => window.__glTrace);
  const groups = {};
  for (const x of tr) { const k = `${x.fn} ${x.stack}`; groups[k] = (groups[k] || 0) + 1; }
  out.glTrace = Object.entries(groups).sort((a, b) => b[1] - a[1]);
}

// ---- memory: the GPU bytes at a spot, by kind, and the crowd's bakes
async function memory() {
  const views = opt('--views', 'crown').split(',');
  out.views = {};
  for (const v of views) {
    await goView(v);
    await page.waitForTimeout(4000);
    out.views[v] = await page.evaluate(() => {
      const T = window.__test, mem = T.gpuMem(), tex = T.gpuTextures() || [];
      const crowd = T.people.crowd?.stats() || [];
      const bakes = {};
      for (const s of T.people.crowd?.sets?.values() || []) for (const x of [s, ...(s.followers || [])]) if (x.data) bakes[x.model.name + (x === s ? '' : ':' + x.mesh.name)] = { kb: x.data.kb, W: x.W, H: x.H, clips: Object.keys(x.clips).length, bones: x.stride / 3 };
      return { loaded: [...T.loaded.keys()], mem, inView: window.__perf.inventory().peopleInView, info: T.renderer.info.memory, programs: T.renderer.info.programs?.length, textures: Array.isArray(tex) ? tex.slice(0, 60) : tex, bakes, crowd: crowd.length,
        people: T.people.all.length, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 2 ** 20) : null, dpr: T.renderer.getPixelRatio(),
        size: T.renderer.getDrawingBufferSize(new T.THREE.Vector2()).toArray() };
    });
    out.views[v].heapUsage = await cdp.send('Runtime.getHeapUsage').catch(() => null);
    console.log(v, JSON.stringify(out.views[v].heapUsage));
    console.log(v, JSON.stringify(out.views[v].mem), 'bakes', Object.values(out.views[v].bakes).reduce((a, b) => a + b.kb, 0), 'KB');
    save();
  }
}

try {
  if (VDPR !== 1) await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: VDPR, mobile: VW < 800 });
  else await page.setViewportSize({ width: VW, height: VH });
  if (VW < 800) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); // pointer: coarse, as a phone (1024 shadow map)
  if (mode === 'stream') await page.addInitScript(traceGl);
  if (mode === 'load') await loadRun();
  else {
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => window.__test || document.getElementById('loading')?.textContent.startsWith('Failed'), null, { timeout: 240000 });
  out.loadMs = Date.now() - t0;
  out.env = await page.evaluate(() => {
    const gl = window.__test.renderer.getContext(), d = gl.getExtension('WEBGL_debug_renderer_info');
    const res = performance.getEntriesByType('resource');
    const byType = {};
    for (const e of res) {
      const ext = (e.name.split('?')[0].match(/\.(\w+)$/) || [, 'other'])[1];
      const k = /\/chars\/|\/animals\//.test(e.name) ? `cast.${ext}` : /\/trees\//.test(e.name) ? `trees.${ext}` : /\/tex\//.test(e.name) ? `kit.${ext}` : /backdrop/.test(e.name) ? `panels.${ext}` : /\/assets\/[^/]+\.glb/.test(e.name) ? 'sections.glb' : /\/basis\//.test(e.name) ? 'transcoder' : /\/assets\//.test(e.name) ? `data.${ext}` : `code.${ext}`;
      const b = byType[k] ||= { n: 0, kb: 0 };
      b.n++; b.kb += (e.encodedBodySize || e.transferSize || 0) / 1024;
    }
    for (const v of Object.values(byType)) v.kb = Math.round(v.kb);
    return { gpu: d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : '', gpuTimer: window.__test.gpuTimer, loaded: [...window.__test.loaded.keys()], dpr: window.__test.renderer.getPixelRatio(),
      requests: res.length, totalKB: Math.round(res.reduce((a, e) => a + (e.encodedBodySize || e.transferSize || 0), 0) / 1024), byType };
  });
  console.log(out.env.gpu, `load ${out.loadMs} ms, ${out.env.totalKB} KB, loaded ${out.env.loaded}`);
  await page.evaluate((h) => window.__test.set('hour', h), 10);
  if (opt('--cap', null)) await page.evaluate((c) => window.__test.set('pixelRatioCap', c), +opt('--cap'));
  await page.evaluate(fs.readFileSync(path.join(HERE, 'instrument.js'), 'utf8'));

  if (mode === 'bench') await bench();
  if (mode === 'stream') await stream();
  if (mode === 'memory') await memory();
  if (mode === 'shots') await shots();
  if (mode === 'loadprofile') await loadProfile();
  }
} finally {
  save();
  console.log(logs.slice(0, 15).join('\n'));
  console.log('->', path.join(outDir, `${mode}.json`));
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
}

// ---- first load on a slow link: time until you can walk (the loading screen gone) and until the first window is in
//   --net slow4g|fast4g|none  --throttle 4  --warm 1 (a second visit with the cache)
async function loadRun() {
  const nets = { slow4g: { latency: 150, down: 1.6e6, up: 0.75e6 }, fast4g: { latency: 60, down: 9e6, up: 1.5e6 }, none: null };
  const net = nets[opt('--net', 'slow4g')];
  await cdp.send('Network.enable');
  if (net) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: net.latency, downloadThroughput: net.down / 8, uploadThroughput: net.up / 8 });
  const thr = +opt('--throttle', 4);
  if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
  out.net = opt('--net', 'slow4g'); out.throttle = thr;
  out.runs = [];
  const splitNow = () => page.evaluate(() => {
    const r = performance.getEntriesByType('resource'), o = {};
    for (const e of r) { const k = /\/chars\/|\/animals\//.test(e.name) ? 'cast' : /\/trees\//.test(e.name) ? 'trees' : /\/tex\/|ktx2\/emb/.test(e.name) ? 'kit+bodies' : /backdrop/.test(e.name) ? 'panels' : /\/assets\/[^/]+\.glb/.test(e.name) ? 'sections' : /\.js$/.test(e.name.split('?')[0]) ? 'code' : /\.(webm|ogg|opus|mp3)/.test(e.name) ? 'audio' : 'other'; o[k] = (o[k] || 0) + (e.transferSize || 0) / 1024; }
    for (const k of Object.keys(o)) o[k] = Math.round(o[k]);
    return o;
  });
  for (const visit of +opt('--warm', 0) ? ['cold', 'warm'] : ['cold']) {
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
    if (visit === 'cold') await cdp.send('Network.clearBrowserCache'); // the warm visit then reads what the cold one cached
    const t0 = Date.now();
    await page.goto(url, { waitUntil: 'commit', timeout: 600000 });
    const bytes = () => page.evaluate(() => { const r = performance.getEntriesByType('resource'); return { n: r.length, kb: Math.round(r.reduce((a, e) => a + (e.transferSize || 0), 0) / 1024), body: Math.round(r.reduce((a, e) => a + (e.encodedBodySize || 0), 0) / 1024) }; });
    await page.waitForFunction(() => document.readyState !== 'loading' && !document.getElementById('loading'), null, { timeout: 900000, polling: 200 });
    const walk = { ms: Date.now() - t0, ...(await bytes()), split: await splitNow() };
    console.log(visit, 'can walk after', walk.ms, 'ms', walk);
    await page.waitForFunction(() => window.__test, null, { timeout: 900000, polling: 250 });
    const window1 = { ms: Date.now() - t0, ...(await bytes()) };
    console.log(visit, 'first window in after', window1.ms, 'ms', window1);
    const split = await splitNow();
    void (() => {
      const r = performance.getEntriesByType('resource'), o = {};
      for (const e of r) { const k = /\/chars\/|\/animals\//.test(e.name) ? 'cast' : /\/trees\//.test(e.name) ? 'trees' : /\/tex\/|ktx2\/emb/.test(e.name) ? 'kit+bodies' : /backdrop/.test(e.name) ? 'panels' : /\/assets\/[^/]+\.glb/.test(e.name) ? 'sections' : /\.js$/.test(e.name.split('?')[0]) ? 'code' : /\.(webm|ogg|opus|mp3)/.test(e.name) ? 'audio' : 'other'; o[k] = (o[k] || 0) + (e.transferSize || 0) / 1024; }
      for (const k of Object.keys(o)) o[k] = Math.round(o[k]);
      return o;
    });
    out.runs.push({ visit, walk, window: window1, splitKB: split, loaded: await page.evaluate(() => [...window.__test.loaded.keys()]) });
    save();
  }
}

// ---- look: a screenshot per view with each experiment on, beside the base (does the prototype keep the look?)
async function shots() {
  const views = opt('--views', 'crown').split(','), exps = opt('--exps', 'mrt').split(',');
  out.shots = [];
  for (const v of views) {
    await goView(v);
    await page.evaluate(() => { window.__test.people.update = () => {}; }); // hold everyone still so the pair compares
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, `${v}_base.png`) });
    for (const e of exps) {
      const [on, offc] = EXPS[e];
      const info = await page.evaluate(on);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(outDir, `${v}_${e}.png`) });
      out.shots.push({ v, e, info });
      await page.evaluate(offc);
      await page.waitForTimeout(600);
    }
    await page.screenshot({ path: path.join(outDir, `${v}_base_after.png`) });
  }
}

// ---- where a section load's main-thread time goes, on a slow CPU: settle at --from, then profile the walk to --to
async function loadProfile() {
  const from = opt('--from', 'under_arch'), to = opt('--to', 'grain_wharf'), thr = +opt('--throttle', 4);
  await goView(from);
  await page.waitForTimeout(3000);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
  await cdp.send('Profiler.start');
  const t0 = Date.now();
  await page.evaluate((v) => window.__test.view(v), to);
  await page.waitForTimeout(4000);
  const { profile: pr } = await cdp.send('Profiler.stop');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  out.ms = Date.now() - t0;
  out.events = await page.evaluate(() => window.__test.stream.stats().events.slice(-4));
  const byId = new Map(pr.nodes.map((n) => [n.id, n])), parent = new Map();
  for (const n of pr.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const self = new Map();
  for (let i = 0; i < pr.samples.length; i++) self.set(pr.samples[i], (self.get(pr.samples[i]) || 0) + (pr.timeDeltas[i] || 0) / 1000);
  const keyOf = (n) => { const f = n.callFrame; return `${f.functionName || '(anon)'} ${f.url ? f.url.split('?')[0].split('/').pop() : ''}:${f.lineNumber + 1}`; };
  const incl = {}, selfBy = {};
  let total = 0;
  for (const [id, ms] of self) {
    total += ms;
    const k0 = keyOf(byId.get(id)); selfBy[k0] = (selfBy[k0] || 0) + ms;
    const seen = new Set();
    for (let x = id; x != null; x = parent.get(x)) { const k = keyOf(byId.get(x)); if (!seen.has(k)) { seen.add(k); incl[k] = (incl[k] || 0) + ms; } }
  }
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [k, Math.round(v), +(100 * v / total).toFixed(1)]);
  out.profile = { totalMs: Math.round(total), inclusive: top(incl, 70), self: top(selfBy, 40) };
  console.log('load', from, '->', to, out.ms, 'ms', JSON.stringify(out.events.map((e) => [e.kind, e.name, e.ms, e.stallMs, e.steps])));
}
