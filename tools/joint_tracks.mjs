#!/usr/bin/env node
// Joint tracks: where each contact site of a character's body is, at 10 Hz over every clip, in the root frame the page
// draws (metres at the size people.js gives the character; x = the figure's left, y up, z its forward; the root on the
// ground between the feet), from the SHIPPED GLB (web/public/assets/chars/<name>.glb, meshopt). The model is loaded
// and its clips corrected by the page's own code (web/src/people.js loadCharacters / prepareClip, with
// web/public/assets/clip_meta.json: locomotion drift removed, grounding k), so the numbers are what the page draws.
// gen/details/brief_contacts.md, plan.md "The method".
//   node tools/joint_tracks.mjs <character|all> [--force]     -> gen/details/joints/<name>.json
//   node tools/joint_tracks.mjs animals [type] [--force]      -> gen/details/joints/animal_<type>.json + .bin
// Cached by the GLB's bytes, its clip_meta entry, its registry size and this tool's version.
//
// Sites (a fixed point in a bone's frame, measured once on the rest-pose mesh, or measured on the skinned mesh at every
// sample):
//   palm_L/R      the middle of the hand's cross-section at 45% of its length from the wrist (in the hand bone's
//                 frame; 0.06-0.08 m from the joint)
//   shoulder_L/R  the top of the shoulder where a pole rests: the mesh top above lerp(neck, arm joint, 0.55) (in the
//                 shoulder bone's frame; char_props' 'shoulder' placement)
//   chest_front   the front of the chest at the top spine joint's height (in that bone's frame)
//   forearm_L/R   halfway between the forearm and hand joints; elbow_L/R the forearm joint
//   back          the rear of the chest at the top spine joint's height; belly the front at the hips joint's height
//   seat          the lowest skinned vertex of the hips and thighs within 0.2 m (3D) of the hips joint (the buttocks)
//   sole_L/R      the lowest skinned vertex of each foot and toe
//   head_top      the highest skinned vertex of the head
//   hips          the hips joint
// Animals: the posed body (and each tack part) at 2 Hz over every clip, as triangles in the animal's root frame
// (x its left, y up, z forward, origin between the hooves), for point-to-mesh distances (push_flank, bridle, lead).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { QM, THREE, loadModels } from './lib/three_node.mjs';

const VERSION = 5;
const HZ = 10, ANIMAL_HZ = 2;
const SEAT_R = 0.2; // the buttocks: hips and thigh vertices this close to the hips joint (the knees are further)
const OUT = path.join(QM, 'gen/details/joints');
const PUB = path.join(QM, 'web/public');
const args = process.argv.slice(2);
const force = args.includes('--force');
const pos = args.filter((a) => !a.startsWith('--'));
const reg = JSON.parse(fs.readFileSync(path.join(PUB, 'assets/chars/characters.json'), 'utf8'));
const beastReg = JSON.parse(fs.readFileSync(path.join(PUB, 'assets/animals/animals.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(PUB, 'assets/clip_meta.json'), 'utf8'));
fs.mkdirSync(OUT, { recursive: true });

const r3 = (x) => Math.round(x * 1000) / 1000;
const key = (file, info) => crypto.createHash('sha256').update(fs.readFileSync(path.join(PUB, file)))
  .update(JSON.stringify(meta[file] || {})).update(JSON.stringify([info.height_m, info.top_m, VERSION])).digest('hex').slice(0, 16);

function bodyMeshes(scene) {
  const out = [];
  scene.traverse((o) => { if (o.isSkinnedMesh && !/^(tack|prop)_/.test(o.name) && !/^(tack|prop)_/.test(o.parent?.name || '')) out.push(o); });
  return out;
}
function dominantBone(mesh, i) {
  const si = mesh.geometry.attributes.skinIndex, sw = mesh.geometry.attributes.skinWeight;
  let best = -1, bw = -1;
  for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
  return mesh.skeleton.bones[best]?.name;
}
const _v = new THREE.Vector3();
function skinned(mesh, i, out = new THREE.Vector3()) {
  mesh.getVertexPosition(i, out);
  return out.applyMatrix4(mesh.matrixWorld);
}
// a bone-fixed site: the bone and the point in its local frame
function fixedSite(bone, worldPoint) { return { bone, local: bone.worldToLocal(worldPoint.clone()) }; }

async function character(name) {
  const info = reg[name];
  const file = path.join(OUT, `${name}.json`);
  const k = key(info.file, info);
  if (!force && fs.existsSync(file)) {
    try { if (JSON.parse(fs.readFileSync(file, 'utf8')).key === k) return { name, cached: true }; } catch { /* redo */ }
  }
  const t0 = Date.now();
  const models = await loadModels([name], reg, meta);
  const m = models[name], scene = m.scene;
  scene.updateMatrixWorld(true);
  const B = (n) => scene.getObjectByName(n);
  const meshes = bodyMeshes(scene);
  // vertex sets by dominant bone (rest pose)
  const sets = {};
  for (const mesh of meshes) {
    const n = mesh.geometry.attributes.position.count;
    for (let i = 0; i < n; i++) { const b = dominantBone(mesh, i); (sets[b] ||= []).push([mesh, i]); }
  }
  const pick = (re) => Object.entries(sets).filter(([b]) => re.test(b)).flatMap(([, v]) => v);
  const restPts = (list) => list.map(([mesh, i]) => skinned(mesh, i));
  const defs = {}, fixed = {};
  for (const side of ['Left', 'Right']) {
    const s = side[0];
    // palm: the middle of the hand's cross-section at 45% of its length from the wrist joint (the hand's own vertices,
    // measured along the forearm -> hand axis), fixed in the hand bone
    const hv = restPts(sets[`${side}Hand`] || []);
    const hj = B(`${side}Hand`).getWorldPosition(new THREE.Vector3()), fj = B(`${side}ForeArm`).getWorldPosition(new THREE.Vector3());
    const ax = hj.clone().sub(fj).normalize();
    const hlen = Math.max(0.05, ...hv.map((p) => p.clone().sub(hj).dot(ax)));
    const sec = hv.filter((p) => Math.abs(p.clone().sub(hj).dot(ax) - 0.45 * hlen) < 0.015);
    const c = sec.length ? sec.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / sec.length) : hj.clone().addScaledVector(ax, 0.08);
    fixed[`palm_${s}`] = fixedSite(B(`${side}Hand`), c);
    defs[`palm_${s}`] = { bone: `${side}Hand`, offset_m: r3(c.distanceTo(hj)), hand_len_m: r3(hlen), from: `centre of the hand's cross-section at 45% of its length (${sec.length} of ${hv.length} hand vertices)` };
    // shoulder top: the mesh top above lerp(neck, arm, 0.55), fixed in the shoulder bone
    const neck = B('neck').getWorldPosition(new THREE.Vector3()), arm = B(`${side}Arm`).getWorldPosition(new THREE.Vector3());
    const p0 = neck.clone().lerp(arm, 0.55);
    let top = -Infinity;
    for (const mesh of meshes) for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
      if (!/Shoulder$|Arm$|^Spine|^neck$/.test(dominantBone(mesh, i))) continue; // not the head, a hat brim or a bun
      const p = skinned(mesh, i, _v);
      if (Math.hypot(p.x - p0.x, p.z - p0.z) < 0.04 && p.y > p0.y - 0.05 && p.y < p0.y + 0.15) top = Math.max(top, p.y);
    }
    const st = new THREE.Vector3(p0.x, Number.isFinite(top) ? top : p0.y + 0.07, p0.z);
    fixed[`shoulder_${s}`] = fixedSite(B(`${side}Shoulder`), st);
    defs[`shoulder_${s}`] = { bone: `${side}Shoulder`, above_line_m: r3(st.y - p0.y), from: 'mesh top above lerp(neck, arm, 0.55)' };
  }
  // chest front: the top spine bone (the one just below the neck), the front-most vertex within 5 cm of its height
  const spine = ['Spine', 'Spine01', 'Spine02'].map(B).filter(Boolean).sort((a, b) => b.getWorldPosition(new THREE.Vector3()).y - a.getWorldPosition(new THREE.Vector3()).y)[0];
  const sy = spine.getWorldPosition(new THREE.Vector3());
  let front = null;
  for (const mesh of meshes) for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
    const p = skinned(mesh, i, _v);
    if (Math.abs(p.y - sy.y) < 0.05 && Math.abs(p.x - sy.x) < 0.08 && (!front || p.z > front.z)) front = p.clone();
  }
  fixed.chest_front = fixedSite(spine, front || sy.clone().add(new THREE.Vector3(0, 0, 0.12)));
  defs.chest_front = { bone: spine.name, ahead_m: r3((front || sy).z - sy.z), from: 'front-most vertex at the top spine joint height' };
  // back: the rear-most vertex at the same height (a back leaning on a wall or post); belly: the front-most vertex at
  // the hips joint's height (the hips against a rail one bends over), fixed in the hips bone
  let back = null, belly = null;
  const hy0 = B('Hips').getWorldPosition(new THREE.Vector3());
  for (const mesh of meshes) for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
    const p = skinned(mesh, i, _v);
    if (Math.abs(p.y - sy.y) < 0.05 && Math.abs(p.x - sy.x) < 0.08 && (!back || p.z < back.z)) back = p.clone();
    if (Math.abs(p.y - hy0.y) < 0.04 && Math.abs(p.x - hy0.x) < 0.08 && (!belly || p.z > belly.z)) belly = p.clone();
  }
  fixed.back = fixedSite(spine, back || sy.clone().add(new THREE.Vector3(0, 0, -0.12)));
  defs.back = { bone: spine.name, behind_m: r3(sy.z - (back || sy).z), from: 'rear-most vertex at the top spine joint height' };
  fixed.belly = fixedSite(B('Hips'), belly || hy0.clone().add(new THREE.Vector3(0, 0, 0.12)));
  defs.belly = { bone: 'Hips', ahead_m: r3((belly || hy0).z - hy0.z), from: 'front-most vertex at the hips joint height' };
  // per-sample sets
  const seatSet = pick(/^(Hips|LeftUpLeg|RightUpLeg)$/), headSet = pick(/^(Head|head_end|headfront)$/);
  const footSet = { L: pick(/^Left(Foot|ToeBase)$/), R: pick(/^Right(Foot|ToeBase)$/) };
  defs.seat = { from: `lowest of ${seatSet.length} hips/thigh vertices within ${SEAT_R} m (3D) of the hips joint: the buttocks` };
  defs.sole_L = { from: `lowest of ${footSet.L.length} left foot/toe vertices` };
  defs.sole_R = { from: `lowest of ${footSet.R.length} right foot/toe vertices` };
  defs.head_top = { from: `highest of ${headSet.length} head vertices` };
  defs.forearm_L = { from: 'midpoint LeftForeArm - LeftHand joints' };
  defs.forearm_R = { from: 'midpoint RightForeArm - RightHand joints' };
  defs.hips = { from: 'Hips joint' };
  defs.elbow_L = { from: 'LeftForeArm joint' };
  defs.elbow_R = { from: 'RightForeArm joint' };
  const SITES = ['palm_L', 'palm_R', 'shoulder_L', 'shoulder_R', 'forearm_L', 'forearm_R', 'elbow_L', 'elbow_R', 'chest_front', 'back', 'belly', 'seat', 'sole_L', 'sole_R', 'head_top', 'hips'];
  const rest = { height_box: null };
  const mixer = new THREE.AnimationMixer(scene);
  const clips = {};
  const w = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  for (const clip of m.clips) {
    const action = mixer.clipAction(clip).play();
    const n = Math.max(1, Math.floor(clip.duration * HZ) + 1);
    const tr = Object.fromEntries(SITES.map((s) => [s, []]));
    const ts = [];
    for (let i = 0; i < n; i++) {
      const t = Math.min(i / HZ, clip.duration - 1e-4);
      action.time = t;
      mixer.update(0);
      scene.updateMatrixWorld(true);
      ts.push(r3(t));
      const put = (s, p) => tr[s].push(r3(p.x), r3(p.y), r3(p.z));
      for (const [s, f] of Object.entries(fixed)) put(s, w.copy(f.local).applyMatrix4(f.bone.matrixWorld));
      for (const s of ['L', 'R']) {
        const side = s === 'L' ? 'Left' : 'Right';
        put(`forearm_${s}`, B(`${side}ForeArm`).getWorldPosition(a).add(B(`${side}Hand`).getWorldPosition(b)).multiplyScalar(0.5));
        put(`elbow_${s}`, B(`${side}ForeArm`).getWorldPosition(a));
        let low = null;
        for (const [mesh, vi] of footSet[s]) { const p = skinned(mesh, vi, w); if (!low || p.y < low.y) low = p.clone(); }
        put(`sole_${s}`, low || B(`${side}Foot`).getWorldPosition(a));
      }
      const hips = B('Hips').getWorldPosition(new THREE.Vector3());
      let seat = null;
      for (const [mesh, vi] of seatSet) {
        const p = skinned(mesh, vi, w);
        if (p.distanceTo(hips) <= SEAT_R && (!seat || p.y < seat.y)) seat = p.clone();
      }
      put('seat', seat || hips.clone().add(new THREE.Vector3(0, -0.1, 0)));
      let top = null;
      for (const [mesh, vi] of headSet) { const p = skinned(mesh, vi, w); if (!top || p.y > top.y) top = p.clone(); }
      put('head_top', top || B('Head').getWorldPosition(a));
      put('hips', hips);
    }
    action.stop();
    mixer.uncacheAction(clip);
    const cm = meta[info.file]?.[clip.name] || {};
    clips[clip.name] = { duration: r3(clip.duration), n, k: cm.k ?? null, locomotion: !!clip.userData?.locomotion, hipsY: clip.userData?.hipsY ?? null, t: ts, sites: tr };
  }
  mixer.uncacheRoot(scene);
  const out = {
    about: 'tools/joint_tracks.mjs: contact sites per clip at 10 Hz in the root frame the page draws (x the figure\'s left, y up, z forward; metres at people.js size). sites.<site> is a flat [x, y, z, ...] per sample time t.',
    name, file: info.file, key: k, version: VERSION, height_m: info.height_m, scale: r3(scene.scale.x * 1000) / 1000, hz: HZ, site_defs: defs, sites: SITES,
    motion: info.motion || [], clips, seconds: (Date.now() - t0) / 1000,
  };
  fs.writeFileSync(file, JSON.stringify(out));
  return { name, cached: false, clips: Object.keys(clips).length, seconds: out.seconds, palm: defs.palm_R.offset_m, shoulder: defs.shoulder_R.above_line_m };
}

async function animal(type) {
  const info = beastReg[type];
  const file = path.join(OUT, `animal_${type}.json`), binFile = path.join(OUT, `animal_${type}.bin`);
  const k = key(info.file, info);
  if (!force && fs.existsSync(file) && fs.existsSync(binFile)) {
    try { if (JSON.parse(fs.readFileSync(file, 'utf8')).key === k) return { name: `animal_${type}`, cached: true }; } catch { /* redo */ }
  }
  const t0 = Date.now();
  const models = await loadModels([type], beastReg, meta);
  const m = models[type], scene = m.scene;
  scene.updateMatrixWorld(true);
  const parts = [];
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const nm = /^(tack)_/.test(o.name) ? o.name : /^(tack)_/.test(o.parent?.name || '') ? o.parent.name : 'body';
    const g = o.geometry, idx = g.index ? Array.from(g.index.array) : Array.from({ length: g.attributes.position.count }, (_, i) => i);
    parts.push({ name: nm, mesh: o, index: idx, verts: g.attributes.position.count });
  });
  const mixer = new THREE.AnimationMixer(scene);
  const chunks = [];
  let offset = 0;
  const clips = {};
  const p = new THREE.Vector3();
  for (const clip of m.clips) {
    const action = mixer.clipAction(clip).play();
    const n = Math.max(1, Math.floor(clip.duration * ANIMAL_HZ) + 1);
    const frames = [];
    for (let i = 0; i < n; i++) {
      const t = Math.min(i / ANIMAL_HZ, clip.duration - 1e-4);
      action.time = t; mixer.update(0); scene.updateMatrixWorld(true);
      const fr = { t: r3(t), parts: {} };
      for (const part of parts) {
        const arr = new Float32Array(part.verts * 3);
        for (let vi = 0; vi < part.verts; vi++) {
          if (part.mesh.isSkinnedMesh) skinned(part.mesh, vi, p); else p.fromBufferAttribute(part.mesh.geometry.attributes.position, vi).applyMatrix4(part.mesh.matrixWorld);
          arr[vi * 3] = p.x; arr[vi * 3 + 1] = p.y; arr[vi * 3 + 2] = p.z;
        }
        (fr.parts[part.name] ||= []).push(offset);
        chunks.push(Buffer.from(arr.buffer));
        offset += arr.length;
      }
      frames.push(fr);
    }
    action.stop(); mixer.uncacheAction(clip);
    clips[clip.name] = { duration: r3(clip.duration), frames };
  }
  fs.writeFileSync(binFile, Buffer.concat(chunks));
  const out = {
    about: 'tools/joint_tracks.mjs animals: the posed mesh at 2 Hz per clip in the animal\'s root frame (x its left, y up, z forward; metres at the page\'s size). animal_<type>.bin holds float32 vertex positions; frames[].parts[<part>] lists the float offsets of each mesh of that part (body or tack_<name>), in parts order; part_meshes[<part>] gives each mesh\'s triangle index list.',
    type, file: info.file, key: k, version: VERSION, scale: scene.scale.x, length_m: info.length_m, width_m: info.width_m,
    part_meshes: parts.reduce((o, pt) => { (o[pt.name] ||= []).push({ verts: pt.verts, index: pt.index }); return o; }, {}),
    clips, seconds: (Date.now() - t0) / 1000,
  };
  fs.writeFileSync(file, JSON.stringify(out));
  return { name: `animal_${type}`, cached: false, clips: Object.keys(clips).length, seconds: out.seconds, mb: +(offset * 4 / 1e6).toFixed(1) };
}

const t0 = Date.now();
const res = [];
if (pos[0] === 'animals') {
  const types = pos[1] ? [pos[1]] : Object.keys(beastReg).filter((t) => beastReg[t]?.file);
  for (const t of types) res.push(await animal(t));
} else {
  const names = !pos[0] || pos[0] === 'all' ? Object.keys(reg).filter((n) => reg[n]?.file) : pos;
  for (const n of names) res.push(await character(n));
}
for (const r of res) console.log(JSON.stringify(r));
console.log(`joint_tracks: ${res.length} done (${res.filter((r) => r.cached).length} cached) in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
