// GPU cost of the sky alone: the default dome, the ?sky=ink dome and a flat-colour dome (the floor: rasterising the
// dome at all), each drawn full screen K times per timer query into a target like the page's colour pass (half float,
// 4x MSAA, depth texture), alternating A/B over M rounds, at several hours and sizes. Then the CPU side under a 4x
// throttle: the noise tile made at start, and set() per light change. Loads web/src/daylight.js from the check server.
// tools/chrome_slot.sh node gen/ui/look/tools_skybench.mjs <out.json>
import fs from 'node:fs';
import { chromium } from '/home/ran/3d_director/qingming/tools/node_modules/playwright-core/index.mjs';
const outFile = process.argv[2];
const b = await chromium.connectOverCDP('http://127.0.0.1:' + process.env.CDP_PORT);
const p = await b.contexts()[0].newPage();
const cdp = await p.context().newCDPSession(p);
await p.goto('http://127.0.0.1:5190/src/daylight.js');
const SIZES = [[585, 1266, 'phone 390x844 @1.5'], [1920, 1080, '1080p'], [3840, 2160, '4K (weak-GPU proxy)']];
const result = { date: new Date().toISOString(), gpu: null, sizes: {} };
for (const [W, H, label] of SIZES) {
  result.sizes[label] = await p.evaluate(async ({ W, H, K, M, hours }) => {
    const txt = await (await fetch('/src/daylight.js?import')).text();
    const THREE = await import(txt.match(/from "([^"]*three[^"]*)"/)[1]);
    const D = await import('/src/daylight.js');
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setSize(64, 64, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const gl = renderer.getContext();
    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const gpuName = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '?';
    if (!ext) return { error: 'no timer query', gpuName };
    const rt = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(W, H) });
    const cam = new THREE.PerspectiveCamera(60, W / H, 0.1, 300);
    cam.position.set(0, 1.6, 0);
    cam.rotation.set(THREE.MathUtils.degToRad(25), 0, 0, 'YXZ');
    cam.updateMatrixWorld();
    const def = new D.Sky(), ink = Object.create(D.Sky.prototype);
    ink.inkInit(260);
    ink.uniforms.tNoise.value = D.Sky.inkNoise(); // the real tile (the page makes it in idle time)
    const flat = new THREE.Mesh(new THREE.SphereGeometry(260, 32, 16), new THREE.MeshBasicMaterial({ color: 0x8899aa, side: THREE.BackSide, depthWrite: false }));
    flat.frustumCulled = false;
    const scenes = { flat: new THREE.Scene(), default: new THREE.Scene(), ink: new THREE.Scene() };
    scenes.flat.add(flat); scenes.default.add(def.mesh); scenes.ink.add(ink.mesh);
    renderer.autoClear = false;
    const out = { gpuName };
    for (const hour of hours) {
      const L = D.lightAt(hour, {}, new Date('2026-10-24T12:00'));
      def.set(L, cam); ink.set(L, cam);
      renderer.setRenderTarget(rt);
      renderer.clear();
      for (const k of Object.keys(scenes)) renderer.render(scenes[k], cam);
      gl.finish();
      const qs = { flat: [], default: [], ink: [] };
      for (let m = 0; m < M; m++) {
        for (const k of m % 2 ? ['ink', 'default', 'flat'] : ['flat', 'default', 'ink']) {
          const q = gl.createQuery();
          gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
          for (let i = 0; i < K; i++) renderer.render(scenes[k], cam);
          gl.endQuery(ext.TIME_ELAPSED_EXT);
          qs[k].push(q);
        }
        await new Promise((r) => requestAnimationFrame(r));
      }
      const res = {};
      for (const [k, list] of Object.entries(qs)) {
        const v = [];
        for (const q of list) {
          for (let t = 0; t < 200 && !gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE); t++) await new Promise((r) => setTimeout(r, 10));
          if (gl.getParameter(ext.GPU_DISJOINT_EXT)) continue;
          v.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6 / K);
          gl.deleteQuery(q);
        }
        v.sort((a, b) => a - b);
        res[k] = { medianMs: +v[v.length >> 1].toFixed(4), p10: +v[Math.floor(v.length * 0.1)].toFixed(4), p90: +v[Math.floor(v.length * 0.9)].toFixed(4), n: v.length };
      }
      res.inkMinusDefaultMs = +(res.ink.medianMs - res.default.medianMs).toFixed(4);
      res.inkMinusFlatMs = +(res.ink.medianMs - res.flat.medianMs).toFixed(4);
      out['h' + hour] = res;
    }
    rt.dispose(); renderer.dispose(); canvas.remove();
    return out;
  }, { W, H, K: 10, M: 24, hours: [13, 6.67, 22] });
  console.log(label, JSON.stringify(result.sizes[label]));
}
// CPU side, 4x throttle
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
result.cpu4x = await p.evaluate(async () => {
  const txt = await (await fetch('/src/daylight.js?import')).text();
  const THREE = await import(txt.match(/from "([^"]*three[^"]*)"/)[1]);
  const D = await import('/src/daylight.js');
  const t0 = performance.now(); D.Sky.inkNoise(); const noiseMs = performance.now() - t0;
  const ink = Object.create(D.Sky.prototype); const ti = performance.now(); ink.inkInit(260); const inkInitMs = performance.now() - ti;
  const def = new D.Sky(), cam = new THREE.PerspectiveCamera();
  const L = D.lightAt(10, {});
  let t1 = performance.now(); for (let i = 0; i < 2000; i++) ink.set(L, cam); const inkSetUs = (performance.now() - t1) / 2;
  t1 = performance.now(); for (let i = 0; i < 2000; i++) def.set(L, cam); const defSetUs = (performance.now() - t1) / 2;
  return { inkInitMs: +inkInitMs.toFixed(2), noiseTileMs: +noiseMs.toFixed(1), inkSetUs: +inkSetUs.toFixed(2), defaultSetUs: +defSetUs.toFixed(2) };
});
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
console.log('cpu 4x', JSON.stringify(result.cpu4x));
fs.writeFileSync(outFile, JSON.stringify(result, null, 1));
await p.close(); await b.close();
