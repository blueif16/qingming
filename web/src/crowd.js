// The crowd in a few draws: everyone played by one character is drawn by one InstancedMesh, as Messenger draws all
// its characters in one batched skinned draw (reference/messenger_study/world_notes.md). Skinning without a
// skeleton per person:
//  - bake: every clip people play is sampled at FPS frames per second into a bone texture (one row per frame, two
//    half-float RGBA texels per bone: the rotation, translation and scale taking a bind-pose vertex to its posed
//    place relative to the character's root). The clips are already grounded and stripped of root drift (people.js
//    prepareClip), so the bake carries that too.
//  - play: per person the CPU keeps only the clip times (a current track and the one it fades from), and writes, per
//    frame, each visible instance's matrix and (row now, row of the fading clip, its weight). The vertex shader reads
//    the four bones' matrices at both rows (and the next frame, for smooth motion) and blends them.
// So a person costs a few float writes a frame instead of a mixer, a skeleton update and three draws; hundreds of
// people cost one draw per character per pass. The ink pass's normal buffer draws the batches with a normal
// material, near people only (normalPass); shadows use a baked depth material (customDepthMaterial).
// The player's own character stays an ordinary skinned mesh (people.js createPerson).
import * as THREE from 'three';
import { settlePending } from './cast_clips.js';

const FPS = 30;
const MAX_ROWS = 2048; // rows per texture column (WebGL2 guarantees 2048); longer bakes wrap into more columns

// ---------------------------------------------------------------- baking one character (or one of its parts)
const skinned = (root) => { const out = []; root.traverse((o) => { if (o.isSkinnedMesh) out.push(o); }); return out; };
// the body: the first skinned mesh that isn't a load (an animal's tack_* parts are switched on per animal)
const PART = /^(tack|prop)_/; // optional parts: an animal's tack_<name> loads, a character's prop_<name> carried things
const bodyOf = (root) => skinned(root).find((m) => !PART.test(m.name)) || skinned(root)[0];
// the clips of one mesh that people play, baked as they are asked for: a character carries up to two dozen clips (most
// of its file), but each section plays a few of them. A section's people ask for every clip their routines list while
// it loads (People: expect), the clip each starts with first; a clip asked for is queued and baked a slice of frames at
// a time (Crowd.update gives all sets BAKE_BUDGET ms a frame). Someone not drawn yet (a section that just streamed in)
// appears once their clip is in; someone already on screen who starts a clip nobody asked for has it baked before the
// next frame (urgent).
// The texture (the perf batch, gen/perf/batch1/notes.md): half floats, two texels a bone a frame (a rotation as a
// quaternion, the translation and the uniform scale; every bone matrix here is a rotation times a uniform scale, to
// 1e-4), 16 bytes where it was 48 (three Float32 texels). It is laid out for every row asked for so far (baked and
// queued) in balanced columns (2100 rows: two columns of 1050, not 2048 + 52), and a finished clip is copied into its
// rows and uploaded alone (texSubImage2D of its rows), not the whole texture again. When the people who asked for a
// clip are gone (their section unloaded), prune() lays it out again without it.
const BAKE_BUDGET = 4;
const TEXELS = 2; // texels a bone
const half = THREE.DataUtils.toHalfFloat;
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _sc = new THREE.Vector3();
let warnedShape = false;
class BakeSet {
  constructor(model, mesh) {
    this.model = model;
    this.mesh = mesh;
    this.stride = mesh.skeleton.bones.length * TEXELS; // texels a row
    this.names = new Set(); // asked for
    this.clips = {}; // baked: name -> { row0, frames, duration }
    this.rows = 0; // rows baked into the texture
    this.cap = 0; // rows the texture is laid out for
    this.arr = null; // the texture's data (W x H texels, half floats), kept to copy into the next layout
    this.W = 0; this.H = 0;
    this.data = null; // { tex, clips, rows: H, stride, kb } as the batches read it
    this.queue = []; // { clip, frames, f: 0, buf }: clips being baked
    this.done = []; // baked since the texture was last written
    this.urgentLeft = 0; // clips at the queue's front that someone on screen is waiting for: baked before the next frame
    this.urgentNames = new Set();
    this.mixer = null;
    this.uploaded = false; // the current texture has been on the GPU once (later writes upload only their rows)
    this.stats = { relayouts: 0, appends: 0, appendedKB: 0, pruned: 0 };
  }

  // later: a clip a routine will play some time (expect), queued behind the clips people start with now
  want(name, later = false) {
    const lowAt = () => { const i = this.queue.findIndex((q, k) => k >= this.urgentLeft && q.later); return i < 0 ? this.queue.length : i; };
    if (this.names.has(name)) {
      // asked for now that was queued for later: moved up
      const i = later ? -1 : this.queue.findIndex((q) => q.later && q.clip.name === name);
      if (i >= 0) { const [q] = this.queue.splice(i, 1); q.later = false; this.queue.splice(lowAt(), 0, q); }
      return;
    }
    const clip = this.model.clips.find((c) => c.name === name);
    if (!clip) return;
    this.names.add(name);
    const frames = Math.max(1, Math.round(clip.duration * FPS));
    const q = { clip, frames, f: 0, later, buf: new Uint16Array((frames + 1) * this.stride * 4) };
    if (later) this.queue.push(q); else this.queue.splice(lowAt(), 0, q);
  }

  // someone on screen starts this clip: it goes to the front of the queue and is baked before the next frame (the
  // rest of the queue keeps its time slices)
  wantNow(name) {
    if (this.clips[name] || this.urgentNames.has(name)) return;
    this.want(name);
    const i = this.queue.findIndex((q) => q.clip.name === name);
    if (i < 0) return;
    const [q] = this.queue.splice(i, 1);
    this.queue.splice(this.urgentLeft, 0, q);
    this.urgentLeft++;
    this.urgentNames.add(name);
  }

  // bake queued frames until the deadline; true when the texture changed
  work(deadline) {
    if (!this.queue.length) return false;
    const root = this.model.scene, mesh = this.mesh, bones = mesh.skeleton.bones, inv = mesh.skeleton.boneInverses, nb = bones.length;
    const mixer = this.mixer ||= new THREE.AnimationMixer(root);
    const rootInv = _bm.copy(root.matrixWorld).invert(), m = _bm2;
    while (this.queue.length && (this.urgentLeft > 0 || performance.now() < deadline)) {
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
          // bind-pose vertex -> posed, relative to the root: root^-1 . bone . boneInverse . bindMatrix, kept as
          // rotation (quaternion), translation and one scale
          m.multiplyMatrices(rootInv, bones[b].matrixWorld).multiply(inv[b]).multiply(mesh.bindMatrix);
          m.decompose(_p, _q, _sc);
          const sc = (_sc.x + _sc.y + _sc.z) / 3;
          if (!warnedShape && Math.max(Math.abs(_sc.x - sc), Math.abs(_sc.y - sc), Math.abs(_sc.z - sc)) > 1e-3 * sc) {
            warnedShape = true;
            console.warn(`crowd: ${this.model.name} has a bone scaled unevenly; its bake (rotation and one scale) will be off`);
          }
          const o = base + b * 8;
          buf[o] = half(_q.x); buf[o + 1] = half(_q.y); buf[o + 2] = half(_q.z); buf[o + 3] = half(_q.w);
          buf[o + 4] = half(_p.x); buf[o + 5] = half(_p.y); buf[o + 6] = half(_p.z); buf[o + 7] = half(sc);
        }
      }
      if (q.f > q.frames) {
        action.stop(); mixer.uncacheAction(c); this.done.push(this.queue.shift());
        if (this.urgentLeft > 0) { this.urgentLeft--; this.urgentNames.delete(c.name); }
      }
    }
    // a clip cut off by the deadline stops too: stopping restores the bones the mixer saved when it started (rest), so
    // clones of the model (the avatar) start from rest, and the next slice starts it again from there. (Setting the
    // bones back by hand instead breaks the bake: the mixer skips writing a value that hasn't changed since it last
    // wrote it, so a bone a clip holds still away from rest would stay at rest.)
    if (this.queue.length) { const a = mixer.existingAction(this.queue[0].clip); if (a?.isRunning()) a.stop(); }
    root.updateMatrixWorld(true);
    if (!this.done.length) return false;
    this.write();
    return true;
  }

  // the clips just baked into their rows: appended (only their rows uploaded) when the layout has room, else a new layout
  write() {
    const add = this.done.reduce((a, q) => a + q.frames + 1, 0);
    if (!this.data || this.rows + add > this.cap) {
      // room for everything asked for so far: what is baked, what just finished and what is still queued
      const want = this.rows + add + this.queue.reduce((a, q) => a + q.frames + 1, 0);
      this.layout(want, Object.keys(this.clips));
    }
    const tex = this.data.tex, rowLen = this.stride * 4;
    let r = this.rows;
    for (const q of this.done) {
      this.clips[q.clip.name] = { row0: r, frames: q.frames, duration: q.clip.duration };
      for (let f = 0; f <= q.frames; f++, r++) {
        const o = this.at(r);
        this.arr.set(q.buf.subarray(f * rowLen, (f + 1) * rowLen), o);
        if (this.uploaded) tex.addUpdateRange(o, rowLen);
      }
    }
    if (this.uploaded) { this.stats.appends++; this.stats.appendedKB += Math.round((add * rowLen * 2) / 1024); }
    this.rows = r;
    this.done.length = 0;
    tex.needsUpdate = true;
  }

  // the texel offset (in the array) of row r in the current layout
  at(r, H = this.H, W = this.W) { const col = Math.floor(r / H); return ((r - col * H) * W + col * this.stride) * 4; }

  // a new texture laid out for `cap` rows, holding the baked clips listed in `keep` (rows packed in their order)
  layout(cap, keep) {
    const stride = this.stride, rowLen = stride * 4;
    cap = Math.max(1, cap);
    const cols = Math.ceil(cap / MAX_ROWS), H = Math.ceil(cap / cols), W = stride * cols;
    const arr = new Uint16Array(W * H * 4);
    const clips = {};
    let r = 0;
    for (const name of keep) {
      const c = this.clips[name];
      for (let f = 0; f <= c.frames; f++) { const o = this.at(c.row0 + f); arr.set(this.arr.subarray(o, o + rowLen), this.at(r + f, H, W)); }
      clips[name] = { ...c, row0: r };
      r += c.frames + 1;
    }
    this.data?.tex.dispose();
    const tex = new THREE.DataTexture(arr, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
    tex.minFilter = tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    this.uploaded = false;
    tex.onUpdate = () => { this.uploaded = true; };
    Object.assign(this, { arr, W, H, cap, rows: r, clips });
    this.data = { mesh: this.mesh, tex, clips, rows: H, stride, kb: Math.round(arr.byteLength / 1024) };
    this.stats.relayouts++;
  }

  // keep only the clips in `keep` (the ones the people still here may play): a smaller texture without the rest
  prune(keep) {
    // queued clips nobody here asks for any more are dropped too (the queue's head stopped at its slice's end)
    const U = this.urgentLeft;
    this.queue = this.queue.filter((q, i) => {
      if (keep.has(q.clip.name)) return true;
      this.names.delete(q.clip.name);
      if (i < U) { this.urgentLeft--; this.urgentNames.delete(q.clip.name); }
      return false;
    });
    const drop = Object.keys(this.clips).filter((n) => !keep.has(n));
    if (!drop.length) return false;
    for (const n of drop) this.names.delete(n);
    this.layout(Object.keys(this.clips).filter((n) => keep.has(n)).reduce((a, n) => a + this.clips[n].frames + 1, 0) + this.queue.reduce((a, q) => a + q.frames + 1, 0),
      Object.keys(this.clips).filter((n) => keep.has(n)));
    this.stats.pruned += drop.length;
    return true;
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
// a bone's matrix from its two texels: a quaternion, then the translation and the uniform scale
mat4 bkBone(int row, float bone) {
  int col = row / bakeRows, y = row - col * bakeRows, x = col * bakeStride + int(bone) * 2;
  vec4 q = normalize(texelFetch(bakeTex, ivec2(x, y), 0)), t = texelFetch(bakeTex, ivec2(x + 1, y), 0);
  vec3 q2 = q.xyz * 2.0;
  float xx = q.x * q2.x, yy = q.y * q2.y, zz = q.z * q2.z, xy = q.x * q2.y, xz = q.x * q2.z, yz = q.y * q2.z;
  float wx = q.w * q2.x, wy = q.w * q2.y, wz = q.w * q2.z, s = t.w;
  return mat4((1.0 - yy - zz) * s, (xy + wz) * s, (xz - wy) * s, 0.0,
              (xy - wz) * s, (1.0 - xx - zz) * s, (yz + wx) * s, 0.0,
              (xz + wy) * s, (yz - wx) * s, (1.0 - xx - yy) * s, 0.0,
              t.x, t.y, t.z, 1.0);
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
    this.shadowCount = 0;
    // the far body (tools/char_lod.mjs; people.js loadCharacters): the same vertices drawn with a simplified index, for
    // the people past the tier's LOD distance (Crowd.lodFar). { mesh, anim, nearCount, shadowCount } once grown
    this.lodIndex = this.src.geometry.userData.lodIndex || null;
    this.far = null;
    // the material the page shades with: a copy of the character's own (so the player's avatar, an ordinary skinned
    // mesh of the same character, keeps the original), patched for baked skinning whatever variant the page makes
    this.std = this.src.material.clone();
    this.std.name = this.src.material.name;
    this.normalMat = patch(new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }), this.uniforms);
    this.depthMat = patch(new THREE.MeshDepthMaterial(), this.uniforms);
  }

  grow(n) {
    const cap = Math.max(16, 1 << Math.ceil(Math.log2(n)));
    this.drop();
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
    ({ mesh: this.mesh, anim: this.anim } = this.instanced(g, cap, '', this));
    // the far body shares the vertex buffers (the same attribute objects: uploaded once) and the material, so its draw
    // follows the full one's with no program or material switch
    if (this.lodIndex) {
      const gf = new THREE.BufferGeometry();
      for (const k of ['position', 'normal', 'uv', 'skinIndex', 'skinWeight']) if (g.attributes[k]) gf.setAttribute(k, g.attributes[k]);
      gf.setIndex(this.lodIndex);
      this.far = { nearCount: 0, shadowCount: 0 };
      Object.assign(this.far, this.instanced(gf, cap, '_far', this.far));
    }
    this.cap = cap;
  }

  // one instanced mesh of this batch on geometry g, with its per-person rows (instAnim): { mesh, anim }. `lane` holds
  // the count of its people within the shadow distance (the batch itself, or its far body)
  instanced(g, cap, suffix, lane) {
    const anim = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
    anim.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('instAnim', anim);
    const mesh = new THREE.InstancedMesh(g, this.std, cap);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.name = `crowd_${this.model.name}${this.part ? '_' + this.part : ''}${suffix}`;
    mesh.frustumCulled = false; // culled per person in update()
    mesh.customDepthMaterial = this.depthMat;
    mesh.count = 0;
    this.crowd.hooks.onMesh(mesh); // the page's shading (castShadow, its material variant)
    mesh.onBeforeRender = () => { if (!mesh.material.userData.baked) patch(mesh.material, this.uniforms); };
    // the shadow pass draws only the people within the tier's shadow distance (they come first: Crowd.update)
    let drawn = 0;
    mesh.onBeforeShadow = () => { drawn = mesh.count; mesh.count = Math.min(drawn, lane.shadowCount); };
    mesh.onAfterShadow = () => { mesh.count = drawn; };
    this.crowd.group.add(mesh);
    return { mesh, anim };
  }

  // its instanced meshes out of the scene, their GPU buffers freed (the far geometry's shared attributes go with the
  // full one's; the LOD index stays the model's)
  drop() {
    for (const m of [this.mesh, this.far?.mesh]) if (m) { this.crowd.group.remove(m); m.geometry.dispose(); m.dispose(); this.crowd.hooks.forget?.(m); }
    this.mesh = null;
    this.far = null;
  }

  // the people of `list` into one of its meshes (lane: the batch's full body, or its far one): near ones first (within
  // lim), each one's matrix and rows; only the rows in use are uploaded
  fill(lane, list, lim, crowd) {
    let near = 0;
    for (let i = 0; i < list.length; i++) if (list[i]._d <= lim) { const t = list[near]; list[near] = list[i]; list[i] = t; near++; }
    const mesh = lane.mesh, anim = lane.anim, mat = mesh.instanceMatrix.array, an = anim.array;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      _m.compose(p.root.position, p.root.quaternion, p.root.scale).toArray(mat, i * 16);
      an[i * 3] = this.rowOf(p.cur);
      const prev = p.prev && this.bs.clips[p.prev.clip.name] ? p.prev : null; // a fade from a clip not baked yet: none
      an[i * 3 + 1] = prev ? this.rowOf(prev) : 0;
      an[i * 3 + 2] = prev ? Math.max(0, prev.left / prev.fade) : 0;
    }
    mesh.count = list.length;
    lane.nearCount = near;
    lane.shadowCount = Number.isFinite(crowd.shadowFar) ? near : list.length;
    // a mesh with nobody to draw is left out of the pass altogether (an empty instanced draw still costs its state
    // changes): out of every pass when nobody is in view, out of the shadow pass when nobody is within shadowFar
    mesh.visible = list.length > 0 || !crowd.skipEmpty;
    mesh.castShadow = lane.shadowCount > 0 || !crowd.skipEmpty;
    if (list.length) {
      mesh.instanceMatrix.clearUpdateRanges(); mesh.instanceMatrix.addUpdateRange(0, list.length * 16); mesh.instanceMatrix.needsUpdate = true;
      anim.clearUpdateRanges(); anim.addUpdateRange(0, list.length * 3); anim.needsUpdate = true;
    }
  }

  // free its GPU buffers and materials (the bake belongs to its BakeSet)
  dispose() {
    this.drop();
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
    this.shadowFar = Infinity; // metres: people further off cast no shadow (the tier's, tiers.js)
    this.skipEmpty = true; // a batch with nobody to draw leaves the pass (update; false: drawn empty, as before, for A/B)
    this.lodFar = Infinity; // metres: people further off are drawn with their far body, where it has one (tiers.js peopleLod)
    // By default a character is drawn with its far body only when all its people in view are past lodFar: no draw is
    // added, so no CPU is spent (the phone proxy, a 4x-throttled CPU on a desktop GPU, showed no frame-time gain from
    // the split; gen/perf/batch2/crowd.md). lodSplit (off; for a test on real phones, whose GPUs are vertex-bound): a
    // character with people near too draws its far ones apart, in a draw of its own (about 0.05 ms of CPU at 4x), when
    // there are lodMin or more of them
    this.lodSplit = false;
    this.lodMin = 3;
    this.group = new THREE.Group();
    this.group.name = 'crowd';
    this.group.userData.shadowMover = true; // its shadows are redrawn every people's turn (world.js shadowLayers)
    hooks.scene.add(this.group);
    this.batches = new Map();
    this.order = [];
    this.farOrder = [];
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
  // (now = false: a clip their routine will play later, baked in turn)
  want(p, name, now = true) {
    for (const b of p.batches || []) {
      for (const s of [b.bs, ...(b.bs.followers || [])]) { if (now && p.drawn) s.wantNow(name); else s.want(name, !now); }
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
      for (const n of [p.cur?.clip.name, p.prev?.clip.name, ...(p.clips || [])]) if (n) for (const s of [b.bs, ...(b.bs.followers || [])]) {
        const playing = n === p.cur?.clip.name || n === p.prev?.clip.name;
        if (p.drawn && playing) s.wantNow(n); else s.want(n, !playing);
      }
    }
  }
  remove(p) { for (const b of p.batches || []) { const i = b.people.indexOf(p); if (i >= 0) b.people.splice(i, 1); } }

  // after people leave (a section unloads): drop the batches nobody is drawn by and the bakes no batch reads, so a
  // character's memory follows the people who play it
  prune() {
    for (const [key, b] of this.batches) if (!b.people.length) { b.dispose(); this.batches.delete(key); }
    const live = new Set([...this.batches.values()].map((b) => b.bs));
    // the clips the people still here may play (their routines' and what they played), per character
    const keepOf = new Map();
    for (const b of this.batches.values()) {
      let k = keepOf.get(b.model.name);
      if (!k) keepOf.set(b.model.name, (k = new Set()));
      for (const p of b.people) { for (const n of p.clips || []) k.add(n); for (const t of [p.cur, p.prev]) if (t) k.add(t.clip.name); }
    }
    for (const [name, s] of this.sets || []) {
      s.followers = (s.followers || []).filter((f) => { if (live.has(f)) return true; f.dispose(); return false; });
      if (!live.has(s) && !s.followers.length) { s.dispose(); this.sets.delete(name); continue; }
      const k = keepOf.get(name) || new Set();
      for (const x of [s, ...s.followers]) x.prune(k);
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
    for (const s of this.sets?.values() || []) for (const x of [s, ...(s.followers || [])]) x.work(deadline); // urgent clips: whatever the deadline
    this.bakeMs = performance.now() - tb; // this frame's baking (the page counts it into a section load's stall)
    for (const b of this.batches.values()) {
      if (!b.people.length || !b.bs.data) { for (const m of [b.mesh, b.far?.mesh]) if (m) { m.count = 0; m.visible = !this.skipEmpty; } continue; }
      b.sync();
      if (b.people.length > b.cap) b.grow(b.people.length);
      const order = this.order, farOrder = this.farOrder, lod = b.far ? this.lodFar : Infinity;
      order.length = 0;
      farOrder.length = 0;
      for (const p of b.people) {
        const q = p.root.position;
        if (!p.root.visible) continue;
        // not drawn until every mesh of theirs has their clip baked (someone a streamed-in section just added)
        if (!p.drawn && !p.batches.every((x) => x.bs.clips[p.cur.clip.name])) continue;
        if (!p.drawn && p.pending) continue; // its first clip still on its way (per-clip files: cast_clips.js settlePending)
        p.drawn = true;
        _sph.center.set(q.x, q.y + 0.9, q.z);
        if (!_fr.intersectsSphere(_sph)) continue;
        p._d = Math.hypot(cx - q.x, cz - q.z);
        (p._d > lod ? farOrder : order).push(p); // past the LOD distance: the far body
      }
      if (order.length && (!this.lodSplit || farOrder.length < this.lodMin)) { for (const p of farOrder) order.push(p); farOrder.length = 0; }
      // near ones first: within the shadow distance when the tier sets one (else within inkFar, for the separate normal pass)
      const lim = Number.isFinite(this.shadowFar) ? this.shadowFar : this.inkFar;
      b.fill(b, order, lim, this);
      if (b.far) b.fill(b.far, farOrder, lim, this);
    }
  }

  meshes() { return [...this.batches.values()].flatMap((b) => [b.mesh, b.far?.mesh]).filter(Boolean); }

  // the ink pass's normal buffer: the batches with their baked normal material, near people only
  normalPass() {
    const saved = [];
    return {
      object: this.group,
      begin: () => {
        for (const b of this.batches.values()) for (const l of [b, b.far]) if (l?.mesh) { saved.push([l.mesh, l.mesh.material, l.mesh.count]); l.mesh.material = b.normalMat; l.mesh.count = l.nearCount; }
      },
      end: () => { for (const [m, mat, n] of saved) { m.material = mat; m.count = n; } saved.length = 0; },
    };
  }

  stats() { return [...this.batches.values()].map((b) => ({ name: b.model.name + (b.part ? ':' + b.part : ''), people: b.people.length, drawn: b.mesh?.count || 0, far: b.far?.mesh.count || 0, clips: [...b.bs.names], bakeKB: b.bs.data?.kb || 0, sharesBake: b.bs !== this.sets.get(b.model.name) ? false : !!b.part })); }
  // the bakes: per set its size, rows used and laid out, clips, and how it was written (relayouts, appends, prunes)
  bakeStats() {
    const out = [];
    for (const s of this.sets?.values() || []) for (const x of [s, ...(s.followers || [])]) out.push({ name: x.model.name + (x === s ? '' : ':' + x.mesh.name), kb: x.data?.kb || 0, rows: x.rows, cap: x.cap, clips: Object.keys(x.clips).length, queued: x.queue.length, ...x.stats });
    return { kb: out.reduce((a, x) => a + x.kb, 0), sets: out };
  }
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
    this.clips = new Set(); // every clip this person's routine lists or played (kept in the bake while they are here)
    crowd.add(this);
  }

  // the clips this person's routine will play: baked while their section loads, so none is baked in a hurry later
  expect(names) {
    for (const n of names) {
      if (!n || !this.has(n) || this.clips.has(n)) continue;
      this.clips.add(n);
      this.crowd.want(this, n, false);
    }
  }

  has(name) { return this.model.clips.some((c) => c.name === name); }

  play(name, opts = {}) {
    const { fade = this.fadeDefault, timeScale = 1, offset = 0 } = opts;
    if (!opts.looping) settlePending(this, name, opts); // a clip still on its way: idle until it is in (playPending)
    if (!this.has(name)) name = this.has('idle') ? 'idle' : this.model.clips[0].name;
    const clip = this.model.clips.find((c) => c.name === name);
    this.clips.add(name);
    this.crowd.want(this, name);
    const next = { clip, time: offset % clip.duration, timeScale, fade: 0, left: 0 };
    if (this.cur && fade > 0) { this.prev = this.cur; this.prev.fade = fade; this.prev.left = fade; } else this.prev = null;
    this.cur = next;
    this.action = next;
    this.clip = name;
  }

  keepLooping() {
    if (!this.cur || !this.model.motion.has(this.clip)) return;
    if (this.cur.time > this.cur.clip.duration - this.fadeDefault - 0.05) this.play(this.clip, { timeScale: this.cur.timeScale, looping: true });
  }

  // the clip it waited for (settlePending) is in: play it now (straight in when nobody has seen it yet)
  playPending() { const { name, opts } = this.pending; this.play(name, this.drawn ? opts : { ...opts, fade: 0 }); }

  advance(dt) {
    for (const t of [this.cur, this.prev]) if (t) { t.time += dt * t.timeScale; const d = t.clip.duration; if (t.time >= d) t.time %= d; }
    if (this.prev) { this.prev.left -= dt; if (this.prev.left <= 0) this.prev = null; }
  }
}
