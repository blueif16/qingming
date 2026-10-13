// The crowd in a few draws: everyone played by one character is drawn by one InstancedMesh, as Messenger draws all
// its characters in one batched skinned draw (reference/messenger_study/world_notes.md). Skinning without a
// skeleton per person:
//  - bake: at load, every clip of a character is sampled at FPS frames per second into a bone texture (one row per
//    frame, three RGBA texels per bone: the rows of the 3x4 matrix taking a bind-pose vertex to its posed place
//    relative to the character's root). The clips are already grounded and stripped of root drift (people.js
//    prepareClip), so the bake carries that too.
//  - play: per person the CPU keeps only the clip times (a current track and the one it fades from), and writes, per
//    frame, each visible instance's matrix and (row now, row of the fading clip, its weight). The vertex shader reads
//    the four bones' matrices at both rows (and the next frame, for smooth motion) and blends them.
// So a person costs a few float writes a frame instead of a mixer, a skeleton update and three draws; hundreds of
// people cost one draw per character per pass. The ink pass's normal buffer draws the batches with a normal
// material, near people only (normalPass); shadows use a baked depth material (customDepthMaterial).
// The player's own character stays an ordinary skinned mesh (people.js createPerson).
import * as THREE from 'three';

const FPS = 30;
const MAX_ROWS = 2048; // rows per texture column (WebGL2 guarantees 2048); longer bakes wrap into more columns

// ---------------------------------------------------------------- baking one character (or one of its parts)
const skinned = (root) => { const out = []; root.traverse((o) => { if (o.isSkinnedMesh) out.push(o); }); return out; };
// the body: the first skinned mesh that isn't a load (an animal's tack_* parts are switched on per animal)
const PART = /^(tack|prop)_/; // optional parts: an animal's tack_<name> loads, a character's prop_<name> carried things
const bodyOf = (root) => skinned(root).find((m) => !PART.test(m.name)) || skinned(root)[0];
// the clips of one mesh that people actually play, baked as they are asked for: a character carries up to two dozen
// clips (most of its file), but each section plays a few of them. A clip asked for is queued and baked a slice of
// frames at a time (Crowd.update gives all sets BAKE_BUDGET ms a frame), then appended to the texture; the clips
// already baked are copied, never baked again. Someone not drawn yet (a section that just streamed in) appears once
// their clip is in; someone already on screen who starts a new clip has it baked before the next frame (urgent).
// Columns are balanced: a bake of 2100 rows is two columns of 1050, not 2048 + 52 (half the memory).
const BAKE_BUDGET = 4;
class BakeSet {
  constructor(model, mesh) {
    this.model = model;
    this.mesh = mesh;
    this.stride = mesh.skeleton.bones.length * 3;
    this.names = new Set(); // asked for
    this.clips = {}; // baked: name -> { row0, frames, duration }
    this.rows = 0;
    this.arr = null; // the texture's data (W x H texels), kept to copy into the next layout
    this.W = 0; this.H = 0;
    this.data = null; // { tex, clips, rows: H, stride, kb } as the batches read it
    this.queue = []; // { clip, frames, f, buf }: clips being baked
    this.done = []; // baked since the texture was last built
    this.urgent = false;
    this.mixer = null;
  }

  want(name) {
    if (this.names.has(name)) return;
    const clip = this.model.clips.find((c) => c.name === name);
    if (!clip) return;
    this.names.add(name);
    const frames = Math.max(1, Math.round(clip.duration * FPS));
    this.queue.push({ clip, frames, f: 0, buf: new Float32Array((frames + 1) * this.stride * 4) });
  }

  // bake queued frames until the deadline; true when the texture changed
  work(deadline) {
    if (!this.queue.length) { this.urgent = false; return false; }
    const root = this.model.scene, mesh = this.mesh, bones = mesh.skeleton.bones, inv = mesh.skeleton.boneInverses, nb = bones.length;
    const mixer = this.mixer ||= new THREE.AnimationMixer(root);
    const rootInv = _bm.copy(root.matrixWorld).invert(), m = _bm2;
    while (this.queue.length && performance.now() < deadline) {
      const q = this.queue[0], c = q.clip;
      const action = mixer.clipAction(c);
      if (!action.isRunning()) { action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.play(); }
      // a few frames between clock checks
      for (let k = 0; k < 4 && q.f <= q.frames; k++, q.f++) {
        action.time = Math.min((q.f / q.frames) * c.duration, c.duration - 1e-4);
        mixer.update(0);
        root.updateMatrixWorld(true);
        const buf = q.buf, base = q.f * this.stride * 4;
        for (let b = 0; b < nb; b++) {
          // bind-pose vertex -> posed, relative to the root: root^-1 . bone . boneInverse . bindMatrix
          m.multiplyMatrices(rootInv, bones[b].matrixWorld).multiply(inv[b]).multiply(mesh.bindMatrix);
          const e = m.elements, o = base + b * 12;
          buf[o] = e[0]; buf[o + 1] = e[4]; buf[o + 2] = e[8]; buf[o + 3] = e[12];
          buf[o + 4] = e[1]; buf[o + 5] = e[5]; buf[o + 6] = e[9]; buf[o + 7] = e[13];
          buf[o + 8] = e[2]; buf[o + 9] = e[6]; buf[o + 10] = e[10]; buf[o + 11] = e[14];
        }
      }
      if (q.f > q.frames) { action.stop(); mixer.uncacheAction(c); this.done.push(this.queue.shift()); }
    }
    // a clip cut off by the deadline stops too: stopping restores the bones the mixer saved when it started (rest), so
    // clones of the model (the avatar) start from rest, and the next slice starts it again from there. (Setting the
    // bones back by hand instead breaks the bake: the mixer skips writing a value that hasn't changed since it last
    // wrote it, so a bone a clip holds still away from rest would stay at rest.)
    if (this.queue.length) { const a = mixer.existingAction(this.queue[0].clip); if (a?.isRunning()) a.stop(); }
    root.updateMatrixWorld(true);
    if (!this.queue.length) this.urgent = false;
    if (!this.done.length) return false;
    this.build();
    return true;
  }

  // a new texture: the rows already baked (from the old layout) and the clips just finished, in balanced columns
  build() {
    const stride = this.stride, rowLen = stride * 4;
    const rows = this.rows + this.done.reduce((a, q) => a + q.frames + 1, 0);
    const cols = Math.ceil(rows / MAX_ROWS), H = Math.ceil(rows / cols), W = stride * cols;
    const arr = new Float32Array(W * H * 4);
    const at = (r, h, w) => { const col = Math.floor(r / h); return ((r - col * h) * w + col * stride) * 4; };
    for (let r = 0; r < this.rows; r++) { const o = at(r, this.H, this.W); arr.set(this.arr.subarray(o, o + rowLen), at(r, H, W)); }
    let r = this.rows;
    for (const q of this.done) {
      this.clips[q.clip.name] = { row0: r, frames: q.frames, duration: q.clip.duration };
      for (let f = 0; f <= q.frames; f++, r++) arr.set(q.buf.subarray(f * rowLen, (f + 1) * rowLen), at(r, H, W));
    }
    this.done.length = 0;
    Object.assign(this, { rows, arr, W, H });
    this.data?.tex.dispose();
    const tex = new THREE.DataTexture(arr, W, H, THREE.RGBAFormat, THREE.FloatType);
    tex.minFilter = tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    this.data = { mesh: this.mesh, tex, clips: this.clips, rows: H, stride, kb: Math.round(arr.byteLength / 1024) };
  }

  dispose() {
    this.data?.tex.dispose();
    if (this.mixer) { this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.model.scene); }
    this.queue.length = 0;
  }
}
const _bm = new THREE.Matrix4(), _bm2 = new THREE.Matrix4();

// a part skinned to the body's bones with the same bind (an animal's load): it can share the body's bake, with its
// bone indices mapped onto the body's; returns that map, or null if it needs a bake of its own
function shareMap(part, body) {
  const pb = part.skeleton.bones, bb = body.skeleton.bones;
  const close = (a, b) => a.elements.every((x, i) => Math.abs(x - b.elements[i]) < 1e-4);
  if (!close(part.bindMatrix, body.bindMatrix)) return null;
  const map = pb.map((b) => bb.indexOf(b));
  if (map.some((j, i) => j < 0 || !close(part.skeleton.boneInverses[i], body.skeleton.boneInverses[j]))) return null;
  return map;
}

// a part on the body's bones and bind matrix, but bound at another pose (every carried prop and animal tack: their
// bone inverses differ): its skinning is the body's times K_b = BM^-1 . BI_b^-1 . BI'_b . BM for each bone b. When all
// the bones a vertex follows agree on K (a prop held by one bone; tack, whose K is one transform for every bone), the
// vertex moved by K once draws exactly as the part would with its own bake, so the part shares the body's bake.
// Returns { map: part bone -> body bone, K: [Matrix4 per part bone] }, or null.
function rigidFix(part, body) {
  const pb = part.skeleton.bones, bb = body.skeleton.bones;
  if (!part.bindMatrix.equals(body.bindMatrix)) return null;
  const map = pb.map((b) => bb.indexOf(b));
  if (map.some((j) => j < 0)) return null;
  const bmInv = new THREE.Matrix4().copy(body.bindMatrix).invert();
  const K = pb.map((b, i) => new THREE.Matrix4().copy(bmInv).multiply(new THREE.Matrix4().copy(body.skeleton.boneInverses[map[i]]).invert())
    .multiply(part.skeleton.boneInverses[i]).multiply(part.bindMatrix));
  const g = part.geometry, pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const v = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    let first = -1;
    v.fromBufferAttribute(pos, i);
    for (let c = 0; c < 4; c++) {
      if (sw.getComponent(i, c) < 1e-4) continue;
      const k = si.getComponent(i, c);
      if (first < 0) { first = k; a.copy(v).applyMatrix4(K[k]); } else if (b.copy(v).applyMatrix4(K[k]).distanceTo(a) > 1e-4) return null;
    }
  }
  return { map, K };
}

// ---------------------------------------------------------------- the shader patch (any built-in material)
const PARS = /* glsl */ `
#ifndef USE_SKINNING
attribute vec4 skinIndex;
attribute vec4 skinWeight;
#endif
attribute vec3 instAnim; // (row now, row of the clip fading out, its weight)
uniform highp sampler2D bakeTex;
uniform int bakeRows, bakeStride;
mat4 bkBone(int row, float bone) {
  int col = row / bakeRows, y = row - col * bakeRows, x = col * bakeStride + int(bone) * 3;
  vec4 a = texelFetch(bakeTex, ivec2(x, y), 0), b = texelFetch(bakeTex, ivec2(x + 1, y), 0), c = texelFetch(bakeTex, ivec2(x + 2, y), 0);
  return mat4(a.x, b.x, c.x, 0.0, a.y, b.y, c.y, 0.0, a.z, b.z, c.z, 0.0, a.w, b.w, c.w, 1.0);
}
mat4 bkRow(int r) {
  return bkBone(r, skinIndex.x) * skinWeight.x + bkBone(r, skinIndex.y) * skinWeight.y
       + bkBone(r, skinIndex.z) * skinWeight.z + bkBone(r, skinIndex.w) * skinWeight.w;
}
mat4 bkPose(float r) {
  int r0 = int(r);
  float f = r - float(r0);
  mat4 m = bkRow(r0);
  return f > 0.01 ? m * (1.0 - f) + bkRow(r0 + 1) * f : m;
}
`;
function patch(material, uniforms) {
  if (material.userData.baked) return material;
  material.userData.baked = true;
  const prev = material.onBeforeCompile, prevKey = material.customProgramCacheKey;
  material.onBeforeCompile = (shader, r) => {
    prev?.call(material, shader, r);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <skinning_pars_vertex>', PARS)
      .replace('#include <skinbase_vertex>', 'mat4 bkM = bkPose(instAnim.x);\n  if (instAnim.z > 0.001) bkM = bkM * (1.0 - instAnim.z) + bkPose(instAnim.y) * instAnim.z;')
      .replace('#include <skinnormal_vertex>', 'objectNormal = (bkM * vec4(objectNormal, 0.0)).xyz;')
      .replace('#include <skinning_vertex>', 'transformed = (bkM * vec4(transformed, 1.0)).xyz;');
  };
  material.customProgramCacheKey = () => 'baked-crowd|' + (prevKey ? prevKey.call(material) : '');
  material.needsUpdate = true;
  return material;
}

// ---------------------------------------------------------------- one character's batch
class Batch {
  constructor(model, crowd, part = null) {
    this.model = model;
    this.crowd = crowd;
    this.part = part;
    const body = crowd.bodySet(model);
    this.src = part ? skinned(model.scene).find((m) => m.name === part) : body.mesh;
    this.map = part ? shareMap(this.src, body.mesh) : null;
    this.fix = part && !this.map ? rigidFix(this.src, body.mesh) : null;
    // the body's bake, shared by its loads and props that bind like it (or are moved to: rigidFix); any other part
    // gets its own, on the same clips
    this.bs = !part || this.map || this.fix ? body : crowd.ownSet(model, this.src, body);
    this.uniforms = { bakeTex: { value: null }, bakeRows: { value: 1 }, bakeStride: { value: 3 } };
    this.people = [];
    this.mesh = null;
    this.cap = 0;
    this.nearCount = 0;
    // the material the page shades with: a copy of the character's own (so the player's avatar, an ordinary skinned
    // mesh of the same character, keeps the original), patched for baked skinning whatever variant the page makes
    this.std = this.src.material.clone();
    this.std.name = this.src.material.name;
    this.normalMat = patch(new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }), this.uniforms);
    this.depthMat = patch(new THREE.MeshDepthMaterial(), this.uniforms);
  }

  grow(n) {
    const cap = Math.max(16, 1 << Math.ceil(Math.log2(n)));
    if (this.mesh) { this.crowd.group.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.dispose(); this.crowd.hooks.forget?.(this.mesh); }
    const g = this.src.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'skinIndex', 'skinWeight'].includes(k)) g.deleteAttribute(k);
    if (this.map) { // a load sharing the body's bake: its bone indices become the body's
      const si = g.getAttribute('skinIndex'), a = new Float32Array(si.count * 4);
      for (let i = 0; i < si.count; i++) for (let c = 0; c < 4; c++) a[i * 4 + c] = this.map[si.getComponent(i, c)];
      g.setAttribute('skinIndex', new THREE.BufferAttribute(a, 4));
    }
    if (this.fix) { // a part bound at its own pose: each vertex moved by its bone's K, its bone indices the body's
      const { map, K } = this.fix, si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight'), pos = g.getAttribute('position'), nrm = g.getAttribute('normal');
      const P = new Float32Array(pos.count * 3), N = nrm ? new Float32Array(nrm.count * 3) : null, I = new Float32Array(si.count * 4);
      const v = new THREE.Vector3(), nm = new THREE.Matrix3();
      for (let i = 0; i < pos.count; i++) {
        let k = si.getComponent(i, 0);
        for (let c = 0; c < 4; c++) if (sw.getComponent(i, c) >= 1e-4) { k = si.getComponent(i, c); break; }
        v.fromBufferAttribute(pos, i).applyMatrix4(K[k]).toArray(P, i * 3);
        if (N) v.fromBufferAttribute(nrm, i).applyMatrix3(nm.getNormalMatrix(K[k])).normalize().toArray(N, i * 3);
        for (let c = 0; c < 4; c++) I[i * 4 + c] = map[si.getComponent(i, c)];
      }
      g.setAttribute('position', new THREE.BufferAttribute(P, 3));
      if (N) g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
      g.setAttribute('skinIndex', new THREE.BufferAttribute(I, 4));
      g.computeBoundingSphere();
    }
    this.anim = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
    this.anim.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('instAnim', this.anim);
    const mesh = new THREE.InstancedMesh(g, this.std, cap);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.name = `crowd_${this.model.name}${this.part ? '_' + this.part : ''}`;
    mesh.frustumCulled = false; // culled per person in update()
    mesh.customDepthMaterial = this.depthMat;
    mesh.count = 0;
    this.crowd.hooks.onMesh(mesh); // the page's shading (castShadow, its material variant)
    mesh.onBeforeRender = () => { if (!mesh.material.userData.baked) patch(mesh.material, this.uniforms); };
    this.crowd.group.add(mesh);
    this.mesh = mesh;
    this.cap = cap;
  }

  // free its GPU buffers and materials (the bake belongs to its BakeSet)
  dispose() {
    if (this.mesh) { this.crowd.group.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.dispose(); this.crowd.hooks.forget?.(this.mesh); this.mesh = null; }
    this.crowd.hooks.disposeMaterial?.(this.std);
    this.normalMat.dispose();
    this.depthMat.dispose();
  }

  sync() { const d = this.bs.data; this.uniforms.bakeTex.value = d.tex; this.uniforms.bakeRows.value = d.rows; this.uniforms.bakeStride.value = d.stride; }

  rowOf(t) {
    const c = this.bs.clips[t.clip.name];
    if (!c) return 0;
    return c.row0 + Math.min(c.frames - 1e-3, Math.max(0, (t.time / c.duration) * c.frames));
  }
}

// ---------------------------------------------------------------- the crowd
const _m = new THREE.Matrix4(), _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _sph = new THREE.Sphere(new THREE.Vector3(), 2.5);
export class Crowd {
  // hooks: { scene, onMesh(mesh), forget(mesh)? }; inkFar: metres beyond which people skip the normal pass
  constructor(hooks, { inkFar = 40 } = {}) {
    this.hooks = hooks;
    this.inkFar = inkFar;
    this.group = new THREE.Group();
    this.group.name = 'crowd';
    hooks.scene.add(this.group);
    this.batches = new Map();
    this.order = [];
  }

  bodySet(model) {
    this.sets ||= new Map();
    if (!this.sets.has(model.name)) this.sets.set(model.name, new BakeSet(model, bodyOf(model.scene)));
    return this.sets.get(model.name);
  }
  ownSet(model, mesh, body) {
    const s = new BakeSet(model, mesh);
    (body.followers ||= []).push(s); // asks for the same clips as the body
    for (const n of body.names) s.want(n);
    return s;
  }
  // a person asks for a clip: every mesh it is drawn with bakes it; for someone already on screen, before the next frame
  want(p, name) {
    for (const b of p.batches || []) {
      for (const s of [b.bs, ...(b.bs.followers || [])]) { s.want(name); if (p.drawn && !s.clips[name]) s.urgent = true; }
    }
  }

  batchOf(model, part = null) {
    const key = `${model.name}|${part || ''}`;
    let b = this.batches.get(key);
    if (!b) { b = new Batch(model, this, part); this.batches.set(key, b); }
    return b;
  }

  add(p) { const b = this.batchOf(p.model); b.people.push(p); p.batch = b; p.batches = [b]; }
  // optional parts switched on per person, each drawn by its own batch on the same body: an animal's loads (its
  // tack_<name> parts, people.json "load"), a figure's carried things (prop_<name>, people.json "props")
  setLoads(p, names, prefix = 'tack_') {
    for (const n of names) {
      if (!skinned(p.model.scene).some((m) => m.name === `${prefix}${n}`)) { console.warn(`${p.model.name} has no part "${prefix}${n}"`); continue; }
      const b = this.batchOf(p.model, `${prefix}${n}`);
      b.people.push(p);
      p.batches.push(b);
      for (const t of [p.cur, p.prev]) if (t) for (const s of [b.bs, ...(b.bs.followers || [])]) { s.want(t.clip.name); if (p.drawn && !s.clips[t.clip.name]) s.urgent = true; }
    }
  }
  remove(p) { for (const b of p.batches || []) { const i = b.people.indexOf(p); if (i >= 0) b.people.splice(i, 1); } }

  // after people leave (a section unloads): drop the batches nobody is drawn by and the bakes no batch reads, so a
  // character's memory follows the people who play it
  prune() {
    for (const [key, b] of this.batches) if (!b.people.length) { b.dispose(); this.batches.delete(key); }
    const live = new Set([...this.batches.values()].map((b) => b.bs));
    for (const [name, s] of this.sets || []) {
      s.followers = (s.followers || []).filter((f) => { if (live.has(f)) return true; f.dispose(); return false; });
      if (!live.has(s) && !s.followers.length) { s.dispose(); this.sets.delete(name); }
    }
  }

  // a character or animal is unloaded: everything drawn with it goes (its people were removed first)
  disposeModel(model) {
    for (const [key, b] of this.batches) if (b.model === model) { b.dispose(); this.batches.delete(key); }
    const s = this.sets?.get(model.name);
    if (s) { s.dispose(); for (const f of s.followers || []) f.dispose(); this.sets.delete(model.name); }
  }

  // per frame, after the routines: each visible person's matrix and rows, near ones first
  update(camera) {
    camera.updateMatrixWorld();
    _fr.setFromProjectionMatrix(_pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    const cx = camera.position.x, cz = camera.position.z;
    const tb = performance.now(), deadline = tb + BAKE_BUDGET;
    for (const s of this.sets?.values() || []) for (const x of [s, ...(s.followers || [])]) x.work(x.urgent ? Infinity : deadline);
    this.bakeMs = performance.now() - tb; // this frame's baking (the page counts it into a section load's stall)
    for (const b of this.batches.values()) {
      if (!b.people.length || !b.bs.data) { if (b.mesh) b.mesh.count = 0; continue; }
      b.sync();
      if (b.people.length > b.cap) b.grow(b.people.length);
      const order = this.order;
      order.length = 0;
      for (const p of b.people) {
        const q = p.root.position;
        if (!p.root.visible) continue;
        // not drawn until every mesh of theirs has their clip baked (someone a streamed-in section just added)
        if (!p.drawn && !p.batches.every((x) => x.bs.clips[p.cur.clip.name])) continue;
        p.drawn = true;
        _sph.center.set(q.x, q.y + 0.9, q.z);
        if (!_fr.intersectsSphere(_sph)) continue;
        p._d = Math.hypot(cx - q.x, cz - q.z);
        order.push(p);
      }
      let near = 0;
      for (let i = 0; i < order.length; i++) if (order[i]._d <= this.inkFar) { const t = order[near]; order[near] = order[i]; order[i] = t; near++; }
      const mat = b.mesh.instanceMatrix.array, an = b.anim.array;
      for (let i = 0; i < order.length; i++) {
        const p = order[i];
        _m.compose(p.root.position, p.root.quaternion, p.root.scale).toArray(mat, i * 16);
        an[i * 3] = b.rowOf(p.cur);
        const prev = p.prev && b.bs.clips[p.prev.clip.name] ? p.prev : null; // a fade from a clip not baked yet: none
        an[i * 3 + 1] = prev ? b.rowOf(prev) : 0;
        an[i * 3 + 2] = prev ? Math.max(0, prev.left / prev.fade) : 0;
      }
      b.mesh.count = order.length;
      b.nearCount = near;
      b.mesh.instanceMatrix.needsUpdate = true;
      b.anim.needsUpdate = true;
    }
  }

  meshes() { return [...this.batches.values()].map((b) => b.mesh).filter(Boolean); }

  // the ink pass's normal buffer: the batches with their baked normal material, near people only
  normalPass() {
    const saved = [];
    return {
      object: this.group,
      begin: () => { for (const b of this.batches.values()) if (b.mesh) { saved.push([b.mesh, b.mesh.material, b.mesh.count]); b.mesh.material = b.normalMat; b.mesh.count = b.nearCount; } },
      end: () => { for (const [m, mat, n] of saved) { m.material = mat; m.count = n; } saved.length = 0; },
    };
  }

  stats() { return [...this.batches.values()].map((b) => ({ name: b.model.name + (b.part ? ':' + b.part : ''), people: b.people.length, drawn: b.mesh?.count || 0, clips: [...b.bs.names], bakeKB: b.bs.data?.kb || 0, sharesBake: b.bs !== this.sets.get(b.model.name) ? false : !!b.part })); }
}

// ---------------------------------------------------------------- a person in the crowd
// Same interface as people.js Person (play, keepLooping, action.timeScale, clip, root, mixer.update), but no
// skeleton: the clip times live here and the batch draws the pose.
export class CrowdPerson {
  constructor(model, crowd, fade) {
    this.model = model;
    this.fadeDefault = fade;
    this.root = new THREE.Object3D(); // where the person stands (never rendered itself)
    this.root.scale.copy(model.scene.scale);
    this.cur = null;
    this.prev = null;
    this.action = null;
    this.clip = null;
    this.animDt = 0;
    this.phase = 0;
    this.mixer = { update: (dt) => this.advance(dt), stopAllAction() {}, uncacheRoot() {} };
    this.crowd = crowd;
    crowd.add(this);
  }

  has(name) { return this.model.clips.some((c) => c.name === name); }

  play(name, { fade = this.fadeDefault, timeScale = 1, offset = 0 } = {}) {
    if (!this.has(name)) name = this.has('idle') ? 'idle' : this.model.clips[0].name;
    const clip = this.model.clips.find((c) => c.name === name);
    this.crowd.want(this, name);
    const next = { clip, time: offset % clip.duration, timeScale, fade: 0, left: 0 };
    if (this.cur && fade > 0) { this.prev = this.cur; this.prev.fade = fade; this.prev.left = fade; } else this.prev = null;
    this.cur = next;
    this.action = next;
    this.clip = name;
  }

  keepLooping() {
    if (!this.cur || !this.model.motion.has(this.clip)) return;
    if (this.cur.time > this.cur.clip.duration - this.fadeDefault - 0.05) this.play(this.clip, { timeScale: this.cur.timeScale });
  }

  advance(dt) {
    for (const t of [this.cur, this.prev]) if (t) { t.time += dt * t.timeScale; const d = t.clip.duration; if (t.time >= d) t.time %= d; }
    if (this.prev) { this.prev.left -= dt; if (this.prev.left <= 0) this.prev = null; }
  }
}
