// Injected into web/world.html by gen/perf/probe.mjs (never shipped, never imported by the page). It wraps the page's
// own objects at runtime (window.__test) to split a frame into its parts, with no edit to web/src:
//   CPU per part: the walker, people (routines + the crowd's per-frame work + bakes), boats, each render pass, shadows
//   GPU per part: one EXT_disjoint_timer_query per segment (the page's own frame query is folded into ours, so
//                 __test.measure keeps working); segments in a CPU-bound frame include the GPU's idle gaps, so read
//                 them as an upper bound and trust A/B toggles for small items
//   draw calls and triangles per pass
// window.__perf.measure(secs) -> per-frame averages; window.__perf.exp.* switch the experiments.
(() => {
  if (window.__perf) return;
  const T = window.__test, THREE = T.THREE, r = T.renderer, gl = r.getContext(), scene = T.scene;
  const tq = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const ours = new WeakSet();
  const oBegin = gl.beginQuery.bind(gl), oEnd = gl.endQuery.bind(gl), oGQP = gl.getQueryParameter.bind(gl);
  const now = () => performance.now();

  // ---- frames and segments
  let segOn = false; // switched only at frame boundaries
  let want = false;
  let frame = null; // { segs: [{name, q}], pageQ, cpu: {}, calls: {}, tris: {} }
  let cur = null;
  const done = []; // finished frames waiting for their queries
  const pageQ = new Map(); // the page's query object -> its frame
  let acc = null; // the measurement in progress
  function seg(name) {
    if (!segOn || !tq) return;
    if (cur) { oEnd(tq.TIME_ELAPSED_EXT); frame.segs.push(cur); }
    const q = gl.createQuery(); ours.add(q);
    oBegin(tq.TIME_ELAPSED_EXT, q);
    cur = { name, q };
  }
  function segStop() { if (cur) { oEnd(tq.TIME_ELAPSED_EXT); frame.segs.push(cur); cur = null; } }
  gl.beginQuery = (t, q) => { if (segOn && !ours.has(q)) { pageQ.set(q, frame); return; } oBegin(t, q); };
  gl.endQuery = (t) => { if (segOn && t === tq?.TIME_ELAPSED_EXT) return; oEnd(t); }; // only the page calls this one
  // the page asks for its frame query: answer with the sum of our segments of that frame
  const frameReady = (f) => f.segs.every((s) => s.v !== undefined || (s.q && oGQP(s.q, gl.QUERY_RESULT_AVAILABLE)));
  // every frame timed with segments is read and its query objects deleted as soon as they resolve (an earlier version
  // kept the unmeasured frames' queries: thousands of live query objects slowed the page over a run)
  const live = [];
  function drain() {
    while (live.length) {
      const f = live[0];
      if (!f.done || !frameReady(f)) break;
      const disjoint = gl.getParameter(tq.GPU_DISJOINT_EXT);
      f.gpu = disjoint ? null : {};
      for (const s of f.segs) { if (s.v === undefined) s.v = oGQP(s.q, gl.QUERY_RESULT); if (f.gpu) add(f.gpu, s.name, s.v / 1e6); gl.deleteQuery(s.q); s.q = null; }
      f.read = true;
      live.shift();
    }
  }
  const frameNs = (f) => f.segs.filter((s) => s.name !== 'pre' && s.name !== 'gap').reduce((a, s) => a + (s.v ?? (s.v = oGQP(s.q, gl.QUERY_RESULT))), 0);
  gl.getQueryParameter = (q, p) => {
    const f = pageQ.get(q);
    if (!f) return oGQP(q, p);
    if (p === gl.QUERY_RESULT_AVAILABLE) return f.done && frameReady(f);
    if (p === gl.QUERY_RESULT) { pageQ.delete(q); return frameNs(f); }
    return null;
  };
  const add = (o, k, v) => { o[k] = (o[k] || 0) + v; };

  // bytes uploaded to the GPU per frame (textures, buffers): bake rebuilds, instance buffers, card matrices
  let upBytes = 0;
  const upWrap = (name, bytesOf) => { const o = gl[name]; if (typeof o !== 'function') return; gl[name] = function (...a) { try { upBytes += bytesOf(a) || 0; } catch { /* */ } return o.apply(gl, a); }; };
  const bpp = (fmt, type) => (type === gl.FLOAT ? 16 : type === gl.HALF_FLOAT ? 8 : 4);
  upWrap('texImage2D', (a) => (a.length >= 9 && a[8] ? a[8].byteLength : a.length >= 8 ? a[3] * a[4] * bpp(a[2], a[7]) : (a[5]?.width || 0) * (a[5]?.height || 0) * 4));
  upWrap('texSubImage2D', (a) => (a.length >= 9 && a[8] && a[8].byteLength ? a[8].byteLength : a.length >= 9 ? a[4] * a[5] * bpp(a[6], a[7]) : (a[6]?.width || 0) * (a[6]?.height || 0) * 4));
  upWrap('compressedTexImage2D', (a) => a[6]?.byteLength || 0);
  upWrap('compressedTexSubImage2D', (a) => a[7]?.byteLength || 0);
  upWrap('bufferData', (a) => (typeof a[1] === 'number' ? 0 : a[1]?.byteLength || 0));
  upWrap('bufferSubData', (a) => (a[4] ? a[4] * (a[2].BYTES_PER_ELEMENT || 1) : a[2]?.byteLength || 0));
  function frameStart() {
    if (tq) drain();
    upBytes = 0;
    segOn = want && !!tq;
    frame = { segs: [], cpu: {}, calls: {}, tris: {}, t0: now() };
    seg('pre');
  }
  function frameEnd() {
    segStop();
    const f = frame;
    f.cpu.frame = now() - f.t0;
    f.upKB = upBytes / 1024;
    f.bakeMs = T.people.crowd?.bakeMs || 0;
    f.done = true;
    if (segOn) live.push(f);
    if (acc) { acc.frames.push(f); if (segOn) done.push(f); }
    frame = null;
  }

  // ---- the tick: the page calls requestAnimationFrame(tick) every frame
  const oRAF = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => oRAF((ts) => {
    if (cb.name !== 'tick') return cb(ts);
    frameStart();
    try { return cb(ts); } finally { frameEnd(); }
  });

  // ---- CPU wrappers on the page's objects
  const wrapCpu = (obj, key, name) => {
    const orig = obj[key];
    obj[key] = function (...a) { const t = now(); try { return orig.apply(this, a); } finally { if (frame) add(frame.cpu, name, now() - t); } };
    return orig;
  };
  // frozen time for A/B: the routines, the crowd and the boats still do all their per-frame work, with dt = 0, so the
  // scene holds still (people and boats moving in and out of view made back-to-back runs differ by 10-30%)
  let frozen = false;
  for (const o of [T.people, T.boats]) { const u = o.update; o.update = function (dt, ...a) { return u.call(this, frozen ? 0 : dt, ...a); }; }
  wrapCpu(T.player, 'update', 'player');
  wrapCpu(T.people, 'update', 'people');
  if (T.people.crowd) wrapCpu(T.people.crowd, 'update', 'crowd');
  wrapCpu(T.boats, 'update', 'boats');

  // ---- passes: color (with the shadow map inside it), normal, overlay (the crowd's normals), post
  let lastTarget = null;
  let mrtState = null; // the MRT prototype's target while it is on (exp.mrt)
  const targets = { color: null, normal: null };
  const oSRT = r.setRenderTarget.bind(r);
  r.setRenderTarget = (t, ...a) => { lastTarget = t; if (mrtState && t && t === targets.color) t = mrtState.mrt; return oSRT(t, ...a); };
  const passOf = (sc) => (sc === scene ? (sc.overrideMaterial ? 'normal' : 'color') : sc.isMesh ? 'post' : sc.name === 'crowd' ? 'overlay' : 'other');
  const oRender = r.render.bind(r);
  // one named function per pass, so a CPU profile's stacks say which pass a cost belongs to
  const passFns = {
    color: function passColor(sc, cam) { return oRender(sc, cam); },
    normal: function passNormal(sc, cam) { return oRender(sc, cam); },
    overlay: function passCrowdNormals(sc, cam) { return oRender(sc, cam); },
    post: function passPost(sc, cam) { return oRender(sc, cam); },
    other: function passOther(sc, cam) { return oRender(sc, cam); },
  };
  let inShadow = 0;
  r.render = (sc, cam) => {
    const name = passOf(sc);
    if (mrtState && (name === 'normal' || name === 'overlay')) return; // the MRT prototype: normals came with the colour pass
    if (name === 'color') targets.color = lastTarget;
    if (name === 'normal') targets.normal = lastTarget;
    if (name === 'post') { window.__perf.postMesh = sc; }
    const i = r.info.render, c0 = i.calls, t0 = i.triangles, s0 = now();
    const sh0 = frame ? (frame.cpu.shadow || 0) : 0, shc0 = frame ? (frame.calls.shadow || 0) : 0, sht0 = frame ? (frame.tris.shadow || 0) : 0;
    seg(name);
    try { return (passFns[name] || passFns.other)(sc, cam); } finally {
      seg('gap');
      if (frame) {
        const shCpu = (frame.cpu.shadow || 0) - sh0, shC = (frame.calls.shadow || 0) - shc0, shT = (frame.tris.shadow || 0) - sht0;
        add(frame.cpu, name, now() - s0 - shCpu);
        add(frame.calls, name, i.calls - c0 - shC);
        add(frame.tris, name, i.triangles - t0 - shT);
      }
    }
  };
  const sm = r.shadowMap;
  const oShadow = sm.render;
  sm.render = function (lights, sc, cam) {
    const i = r.info.render, c0 = i.calls, t0 = i.triangles, s0 = now();
    seg('shadow');
    inShadow++;
    window.__perf?.onShadowBegin?.();
    try { return (function passShadow(t) { return oShadow.call(t, lights, sc, cam); })(this); } finally {
      window.__perf?.onShadowEnd?.();
      inShadow--;
      seg('color');
      if (frame) { add(frame.cpu, 'shadow', now() - s0); add(frame.calls, 'shadow', i.calls - c0); add(frame.tris, 'shadow', i.triangles - t0); }
    }
  };

  // ---- measuring
  function settleQueries() {
    return new Promise((resolve) => {
      const poll = () => { drain(); while (done.length && done[0].read) done.shift(); if (done.length) setTimeout(poll, 20); else resolve(); };
      poll();
    });
  }
  async function measure(secs = 2, { gpu = true } = {}) {
    want = gpu;
    await new Promise((res) => setTimeout(res, 300)); // let the switch reach a frame boundary
    acc = { frames: [], t0: now() };
    await new Promise((res) => setTimeout(res, secs * 1000));
    const a = acc;
    acc = null;
    a.t1 = now();
    want = false;
    await new Promise((res) => setTimeout(res, 100));
    if (gpu) await settleQueries();
    const fr = a.frames.filter((f) => f.done);
    const n = fr.length;
    const avg = (key) => {
      const o = {};
      for (const f of fr) for (const [k, v] of Object.entries(f[key] || {})) add(o, k, v);
      for (const k of Object.keys(o)) o[k] = +(o[k] / n).toFixed(3);
      return o;
    };
    const g = fr.filter((f) => f.gpu);
    const gpuAvg = {};
    for (const f of g) for (const [k, v] of Object.entries(f.gpu)) add(gpuAvg, k, v);
    for (const k of Object.keys(gpuAvg)) gpuAvg[k] = +(gpuAvg[k] / g.length).toFixed(3);
    const cpu = avg('cpu');
    cpu.other = +(cpu.frame - ['player', 'people', 'boats', 'color', 'shadow', 'normal', 'overlay', 'post'].reduce((s, k) => s + (cpu[k] || 0), 0)).toFixed(3);
    const sorted = fr.map((f) => f.cpu.frame).sort((x, y) => x - y);
    const up = fr.map((f) => f.upKB), bk = fr.map((f) => f.bakeMs);
    return { frames: n, fps: +(n / ((a.t1 - a.t0) / 1000)).toFixed(1), cpu, cpuP95: +(sorted[Math.floor(n * 0.95)] || 0).toFixed(2), cpuMax: +(sorted[n - 1] || 0).toFixed(2),
      uploadKB: { mean: +(up.reduce((x, y) => x + y, 0) / n).toFixed(1), max: +Math.max(...up).toFixed(0) }, bakeMs: { mean: +(bk.reduce((x, y) => x + y, 0) / n).toFixed(2), max: +Math.max(...bk).toFixed(1) }, gpu: gpuAvg,
      gpuFrame: +Object.entries(gpuAvg).filter(([k]) => k !== 'pre' && k !== 'gap').reduce((s, [, v]) => s + v, 0).toFixed(3),
      calls: avg('calls'), tris: avg('tris'), people: T.people.all.length };
  }

  // ---- inventory: what is drawn
  function inventory() {
    const cats = {};
    const cat = (o) => {
      for (let p = o; p; p = p.parent) {
        const n = p.name || '';
        if (n === 'crowd') return 'crowd';
        if (n.startsWith('boats_')) return 'boats';
        if (n.startsWith('trees_')) return 'trees';
        if (n.startsWith('backdrop')) return 'backdrop';
        if (n.startsWith('section_')) return /water/i.test(o.name + (o.material?.name || '')) ? 'water' : 'world';
      }
      return o === T.scene ? 'scene' : (o.material?.type === 'ShaderMaterial' ? 'sky' : 'other');
    };
    scene.traverseVisible((o) => {
      if (!o.isMesh) return;
      const c = cat(o), e = (cats[c] ||= { meshes: 0, tris: 0, instances: 0 });
      const g = o.geometry, tri = (g.index ? g.index.count : g.attributes.position.count) / 3;
      e.meshes++;
      const inst = o.isInstancedMesh ? o.count : o.isBatchedMesh ? (o._instanceInfo?.filter((x) => x.active && x.visible).length ?? 1) : 1;
      e.instances += inst;
      e.tris += o.isBatchedMesh ? tri : tri * inst;
    });
    // the people the camera sees, by distance (what a level of detail or a hide radius would touch)
    const cam = T.camera, fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const sph = new THREE.Sphere(new THREE.Vector3(), 1.4), bins = { '<15': 0, '15-25': 0, '25-40': 0, '40-60': 0, '>60': 0 };
    for (const p of T.people.all) {
      const q = p.root.position; sph.center.set(q.x, q.y + 0.9, q.z);
      if (!fr.intersectsSphere(sph)) continue;
      const d = Math.hypot(q.x - cam.position.x, q.z - cam.position.z);
      bins[d < 15 ? '<15' : d < 25 ? '15-25' : d < 40 ? '25-40' : d < 60 ? '40-60' : '>60']++;
    }
    cats.peopleInView = bins;
    return cats;
  }

  // ---- experiments: each returns a function that undoes it
  const exp = {};
  const worldMeshes = () => { const out = []; scene.traverse((o) => { if (o.isMesh && o.visible && /^section_/.test(sectionOf(o)?.name || '') && !/^boats_/.test(boatOf(o)?.name || '')) out.push(o); }); return out; };
  const sectionOf = (o) => { for (let p = o; p; p = p.parent) if (/^section_/.test(p.name)) return p; return null; };
  const boatOf = (o) => { for (let p = o; p; p = p.parent) if (/^boats_/.test(p.name)) return p; return null; };
  const sun = (() => { let s = null; scene.traverse((o) => { if (o.isDirectionalLight && !s) s = o; }); return s; })();
  // hide a category of things (all passes)
  exp.hide = (what) => {
    const list = [];
    scene.traverse((o) => {
      const n = o.name || '';
      const hit = what === 'crowd' ? n === 'crowd' : what === 'trees' ? /^trees_/.test(n) : what === 'boats' ? /^boats_/.test(n) && o.isGroup
        : what === 'backdrop' ? n === 'backdrop' : what === 'world' ? (o.isMesh && sectionOf(o) && !boatOf(o)) : false;
      if (hit && o.visible) list.push(o);
    });
    for (const o of list) o.visible = false;
    return () => { for (const o of list) o.visible = true; };
  };
  // the shadow map drawn once and then kept while the sun and its snapped centre stay put (the upper bound of caching:
  // people's shadows freeze too)
  exp.shadowCache = () => {
    let nu = false, last = '';
    const key = () => sun ? [...sun.position.toArray(), ...sun.target.position.toArray()].map((v) => v.toFixed(3)).join(',') : '';
    Object.defineProperty(sm, 'needsUpdate', { configurable: true, get: () => nu, set: (v) => { const k = key(); nu = !!v && k !== last; if (nu) last = k; } });
    return () => { delete sm.needsUpdate; sm.needsUpdate = true; };
  };
  // only the given category casts shadows (e.g. 'crowd': what a per-frame people-only shadow layer would cost)
  exp.castOnly = (what) => {
    const changed = [];
    scene.traverse((o) => {
      if (!o.isMesh || !o.castShadow) return;
      let keep = false;
      for (let p = o; p; p = p.parent) if ((what === 'crowd' && p.name === 'crowd') || (what === 'world' && /^section_/.test(p.name))) keep = true;
      if (!keep) { o.castShadow = false; changed.push(o); }
    });
    return () => { for (const o of changed) o.castShadow = true; };
  };
  // MSAA off on the colour target / an 8-bit colour target instead of half float
  exp.colorTarget = ({ samples, type } = {}) => {
    const t = targets.color;
    if (!t) return () => {};
    const was = { samples: t.samples, type: t.texture.type };
    if (samples !== undefined) t.samples = samples;
    if (type !== undefined) t.texture.type = type === 'u8' ? THREE.UnsignedByteType : THREE.HalfFloatType;
    t.dispose();
    return () => { t.samples = was.samples; t.texture.type = was.type; t.dispose(); };
  };
  // the crowd drawn with a quarter of its triangles (the cost of a ~1k-triangle level of detail; looks broken)
  exp.crowdTris = (frac = 0.25) => {
    const ms = T.people.crowd?.meshes() || [];
    for (const m of ms) { const n = m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count; m.geometry.setDrawRange(0, Math.floor((n * frac) / 3) * 3); }
    return () => { for (const m of ms) m.geometry.setDrawRange(0, Infinity); };
  };
  // cheaper baked skinning in the crowd's shaders: one bake row (no blend to the next frame, no cross-fade)
  exp.crowdCheapSkin = () => {
    const mats = [];
    for (const b of T.people.crowd?.batches.values() || []) for (const m of [b.mesh?.material, b.normalMat, b.depthMat]) if (m && !mats.includes(m)) mats.push(m);
    const saved = mats.map((m) => [m, m.onBeforeCompile, m.customProgramCacheKey]);
    for (const m of mats) {
      const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
      m.onBeforeCompile = (sh, rr) => { prev.call(m, sh, rr); sh.vertexShader = sh.vertexShader.replace('mat4 bkM = bkPose(instAnim.x);\n  if (instAnim.z > 0.001) bkM = bkM * (1.0 - instAnim.z) + bkPose(instAnim.y) * instAnim.z;', 'mat4 bkM = bkRow(int(instAnim.x));'); };
      m.customProgramCacheKey = () => 'cheap|' + key.call(m);
      m.needsUpdate = true;
    }
    return () => { for (const [m, ob, k] of saved) { m.onBeforeCompile = ob; m.customProgramCacheKey = k; m.needsUpdate = true; } };
  };
  // the world's triangles in cells: the colour and normal passes draw only cells in the camera's frustum, the shadow
  // pass only cells in the shadow camera's box (BatchedMesh with per-cell culling would do this every frame; here the
  // camera is still, so each mesh's index is sorted once into [camera only | both | shadow only | neither] and the
  // passes pick their range). Returns the triangle counts.
  exp.cellCull = (cell = 8) => {
    const cam = T.camera;
    cam.updateMatrixWorld();
    const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    sun.shadow.updateMatrices(sun);
    const sfr = sun.shadow.getFrustum ? sun.shadow.getFrustum() : new THREE.Frustum().setFromProjectionMatrix(sun.shadow.matrix.clone().premultiply(new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5).scale(new THREE.Vector3(2, 2, 2))));
    const stats = { total: 0, cam: 0, shadow: 0, meshes: 0 };
    const undo = [];
    const v = new THREE.Vector3(), box = new THREE.Box3();
    const ranges = [];
    for (const o of worldMeshes()) {
      const g = o.geometry, idx = g.index;
      if (!idx || o.isInstancedMesh || o.isBatchedMesh || o.isSkinnedMesh) continue;
      const pos = g.attributes.position, n = idx.count / 3, a = idx.array;
      o.updateMatrixWorld();
      const cells = new Map(); // key -> { box, tris: [] }
      for (let t = 0; t < n; t++) {
        let cx = 0, cy = 0, cz = 0;
        for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pos, a[t * 3 + k]).applyMatrix4(o.matrixWorld); cx += v.x; cy += v.y; cz += v.z; }
        const key = `${Math.floor(cx / 3 / cell)},${Math.floor(cz / 3 / cell)}`;
        let c = cells.get(key);
        if (!c) cells.set(key, (c = { box: new THREE.Box3(), tris: [] }));
        for (let k = 0; k < 3; k++) c.box.expandByPoint(v.fromBufferAttribute(pos, a[t * 3 + k]).applyMatrix4(o.matrixWorld));
        c.tris.push(t);
      }
      const A = [], B = [], C = [], D = [];
      for (const c of cells.values()) {
        const inCam = fr.intersectsBox(c.box), inSh = sfr.intersectsBox(c.box);
        (inCam && inSh ? B : inCam ? A : inSh ? C : D).push(...c.tris);
      }
      const order = [...A, ...B, ...C, ...D];
      const na = new a.constructor(a.length);
      order.forEach((t, i) => { na[i * 3] = a[t * 3]; na[i * 3 + 1] = a[t * 3 + 1]; na[i * 3 + 2] = a[t * 3 + 2]; });
      const old = idx;
      g.setIndex(new THREE.BufferAttribute(na, 1));
      undo.push(() => { g.index.array === na && g.setIndex(old); g.setDrawRange(0, Infinity); });
      const camR = [0, (A.length + B.length) * 3], shR = [A.length * 3, (B.length + C.length) * 3];
      ranges.push([g, camR, shR]);
      g.setDrawRange(...camR);
      stats.total += n; stats.cam += A.length + B.length; stats.shadow += B.length + C.length; stats.meshes++;
    }
    window.__perf.onShadowBegin = () => { for (const [g, , s] of ranges) g.setDrawRange(...s); };
    window.__perf.onShadowEnd = () => { for (const [g, c] of ranges) g.setDrawRange(...c); };
    return Object.assign(() => { window.__perf.onShadowBegin = window.__perf.onShadowEnd = null; for (const u of undo) u(); }, { stats });
  };
  // how many triangles of the drawn world lie in the camera's frustum (by triangle), at this spot
  exp.frustumShare = () => {
    const cam = T.camera;
    const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const v = new THREE.Vector3(), tri = new THREE.Box3();
    const out = { world: [0, 0], boats: [0, 0], crowdPeople: [0, 0] };
    for (const o of worldMeshes()) {
      const g = o.geometry, idx = g.index; if (!idx) continue;
      const pos = g.attributes.position, a = idx.array, n = idx.count / 3;
      for (let t = 0; t < n; t++) { tri.makeEmpty(); for (let k = 0; k < 3; k++) tri.expandByPoint(v.fromBufferAttribute(pos, a[t * 3 + k]).applyMatrix4(o.matrixWorld)); out.world[1]++; if (fr.intersectsBox(tri)) out.world[0]++; }
    }
    return out;
  };
  // people beyond r metres from the camera are not drawn at all (Messenger hides its NPCs past 15-30 m); their routines
  // still run, so they are where they should be when you come near
  exp.crowdRadius = (rad = 30) => {
    const c = T.people.crowd; if (!c) return () => {};
    const prev = c.update;
    c.update = function (cam) {
      const x = cam.position.x, z = cam.position.z;
      for (const p of T.people.all) if (p.root.visible && Math.hypot(p.root.position.x - x, p.root.position.z - z) > rad) p.root.visible = false;
      return prev.call(this, cam);
    };
    return () => { c.update = prev; };
  };
  // PROTOTYPE: the ink pass's normals written by the colour pass itself into a second attachment (multiple render
  // targets, as Messenger's gInfo), so the second geometry pass (normal pass + the crowd's normal overlay) is skipped.
  // Every material drawn in the colour pass gets `layout(location = 1) out` its view normal (lit materials) or the
  // empty-normal value the old pass cleared to (sky, cards, panels: they were left out of the normal pass). The post
  // shader is unchanged: its tNormal now samples attachment 1. opts.samples: MSAA of the MRT target (default: as now).
  exp.mrt = ({ samples } = {}) => {
    const t = targets.color, post = window.__perf.postMesh;
    if (!t || !post) return () => {};
    const w = t.width, h = t.height;
    const mrt = new THREE.WebGLRenderTarget(w, h, { count: 2, samples: samples ?? t.samples, type: t.texture.type, depthTexture: new THREE.DepthTexture(w, h) });
    mrt.textures[1].type = THREE.UnsignedByteType;
    const u = post.material.uniforms, was = { tColor: u.tColor.value, tDepth: u.tDepth.value, tNormal: u.tNormal.value };
    u.tColor.value = mrt.textures[0]; u.tDepth.value = mrt.depthTexture; u.tNormal.value = mrt.textures[1];
    // which materials write a real normal: lit ones on world, crowd, boats, water; neutral: sky, cards, backdrop, post
    const mats = new Map();
    scene.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      let neutral = false;
      for (let p = o; p; p = p.parent) if (/^trees_|^backdrop/.test(p.name)) neutral = true;
      for (const m of [].concat(o.material)) if (!mats.has(m)) mats.set(m, neutral || !(m.isMeshLambertMaterial || m.isMeshToonMaterial || m.isMeshStandardMaterial || m.isMeshPhongMaterial));
    });
    for (const b of T.people.crowd?.batches.values() || []) if (b.mesh) mats.set(b.mesh.material, false);
    const saved = [];
    for (const [m, neutral] of mats) {
      const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
      saved.push([m, prev, key, Object.prototype.hasOwnProperty.call(m, 'onBeforeCompile'), Object.prototype.hasOwnProperty.call(m, 'customProgramCacheKey')]);
      const write = neutral ? 'qmNormalOut = vec4(0.5, 0.5, 1.0, 0.0);' : 'qmNormalOut = vec4(normalize(normal) * 0.5 + 0.5, 1.0);';
      m.onBeforeCompile = function (sh, rr) {
        prev?.call(this, sh, rr);
        let fs = sh.fragmentShader;
        fs = 'layout(location = 1) out highp vec4 qmNormalOut;\n' + fs;
        if (fs.includes('#include <dithering_fragment>')) fs = fs.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n' + write);
        else { const i = fs.lastIndexOf('}'); fs = fs.slice(0, i) + write + '\n' + fs.slice(i); }
        sh.fragmentShader = fs;
      };
      m.customProgramCacheKey = function () { return 'mrt' + (neutral ? 'n' : 'l') + '|' + (key ? key.call(this) : ''); };
      m.needsUpdate = true;
    }
    const oClear = r.clear;
    r.clear = function (...a) { const res = oClear.apply(this, a); if (r.getRenderTarget() === mrt && (a.length === 0 || a[0] !== false)) gl.clearBufferfv(gl.COLOR, 1, [0.5, 0.5, 1.0, 0.0]); return res; };
    mrtState = { mrt };
    return Object.assign(() => {
      mrtState = null;
      r.clear = oClear;
      u.tColor.value = was.tColor; u.tDepth.value = was.tDepth; u.tNormal.value = was.tNormal;
      for (const [m, prev, key, ownP, ownK] of saved) {
        if (ownP) m.onBeforeCompile = prev; else delete m.onBeforeCompile;
        if (ownK) m.customProgramCacheKey = key; else delete m.customProgramCacheKey;
        m.needsUpdate = true;
      }
      mrt.dispose();
    }, { info: { materials: mats.size, samples: mrt.samples } });
  };
  // the boats' BatchedMeshes without per-instance culling and sorting: three then skips its per-pass instance loop and
  // the indirect-texture upload (it otherwise redoes both for every batch in every pass: colour, shadow, normals)
  exp.boatsPlain = ({ sort = false, cull = false } = {}) => {
    const list = [];
    scene.traverse((o) => { if (o.isBatchedMesh) list.push([o, o.sortObjects, o.perObjectFrustumCulled]); });
    for (const [o] of list) { o.sortObjects = sort; o.perObjectFrustumCulled = cull; o._visibilityChanged = true; }
    return Object.assign(() => { for (const [o, so, pc] of list) { o.sortObjects = so; o.perObjectFrustumCulled = pc; o._visibilityChanged = true; } }, { info: { batches: list.length } });
  };
  // what the page's shader programs use against WebGL2's guaranteed minimums (a phone may offer no more than these)
  exp.programs = () => {
    const out = [];
    for (const p of r.info.programs || []) {
      const prog = p.program; if (!prog) continue;
      const nu = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
      let vec = 0, samplers = 0;
      for (let i = 0; i < nu; i++) {
        const u = gl.getActiveUniform(prog, i);
        const rows = { [gl.FLOAT_MAT4]: 4, [gl.FLOAT_MAT3]: 3, [gl.FLOAT_MAT2]: 2 }[u.type] || 1;
        if ([gl.SAMPLER_2D, gl.SAMPLER_CUBE, gl.SAMPLER_2D_SHADOW, gl.SAMPLER_3D, gl.SAMPLER_2D_ARRAY, gl.INT_SAMPLER_2D, gl.UNSIGNED_INT_SAMPLER_2D].includes(u.type)) samplers += u.size;
        else vec += rows * u.size;
      }
      out.push({ name: p.name, cacheKey: (p.cacheKey || '').slice(0, 40), uniformVectors: vec, samplers, attributes: gl.getProgramParameter(prog, gl.ACTIVE_ATTRIBUTES) });
    }
    const lim = {};
    for (const k of ['MAX_TEXTURE_SIZE', 'MAX_VERTEX_UNIFORM_VECTORS', 'MAX_FRAGMENT_UNIFORM_VECTORS', 'MAX_VARYING_VECTORS', 'MAX_VERTEX_ATTRIBS', 'MAX_TEXTURE_IMAGE_UNITS', 'MAX_VERTEX_TEXTURE_IMAGE_UNITS', 'MAX_COMBINED_TEXTURE_IMAGE_UNITS', 'MAX_SAMPLES', 'MAX_DRAW_BUFFERS', 'MAX_COLOR_ATTACHMENTS', 'MAX_RENDERBUFFER_SIZE']) lim[k] = gl.getParameter(gl[k]);
    const ext = gl.getSupportedExtensions();
    return { limits: lim, extensions: ext, programs: out.sort((a, b) => b.uniformVectors - a.uniformVectors),
      maxUniformVectors: Math.max(...out.map((x) => x.uniformVectors)), maxSamplers: Math.max(...out.map((x) => x.samplers)), maxAttributes: Math.max(...out.map((x) => x.attributes)) };
  };
  // fragments shaded per pixel in the colour pass (depth-tested, as drawn) and the raw depth complexity
  exp.overdraw = () => {
    const w = 480, h = 270;
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.UnsignedByteType });
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1 / 255, 1 / 255, 1 / 255), blending: THREE.AdditiveBlending, depthWrite: true, depthTest: true, side: THREE.DoubleSide, transparent: false });
    const read = () => { const buf = new Uint8Array(w * h * 4); r.readRenderTargetPixels(rt, 0, 0, w, h, buf); let s = 0, mx = 0; for (let i = 0; i < buf.length; i += 4) { s += buf[i]; mx = Math.max(mx, buf[i]); } return [+(s / (w * h)).toFixed(2), mx]; };
    const bg = scene.background, fog = scene.fog, cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha();
    scene.background = null; scene.fog = null; r.setClearColor(0, 1);
    const oc = r.outputColorSpace;
    r.outputColorSpace = THREE.LinearSRGBColorSpace;
    scene.overrideMaterial = mat;
    oSRT(rt); r.clear(); oRender(scene, T.camera);
    const tested = read();
    mat.depthTest = false; mat.needsUpdate = true;
    oSRT(rt); r.clear(); oRender(scene, T.camera);
    const complexity = read();
    scene.overrideMaterial = null; scene.background = bg; scene.fog = fog; r.setClearColor(cc, ca); r.outputColorSpace = oc;
    oSRT(null); rt.dispose(); mat.dispose();
    return { shadedPerPixel: tested, depthComplexity: complexity };
  };

  window.__perf = { measure, inventory, exp, targets, sun, seg, freeze: (on) => { frozen = !!on; } };
})();
