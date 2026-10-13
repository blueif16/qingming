// The body's contact sites (tools/joint_tracks.mjs, gen/details/contacts/notes.md "Stage 2"), shared by the joint
// tracks and by tools/ik_clip.mjs, which pins the same sites: defineSites() measures them once on the rest pose of a
// model loaded by the page's code (tools/lib/three_node.mjs loadModels); sampleSites() evaluates every site in the
// current pose (matrices updated) and hands each to put(name, Vector3) in the model's root frame (page metres).
import { THREE } from './three_node.mjs';

export const SEAT_R = 0.2; // the buttocks: hips and thigh vertices this close to the hips joint (the knees are further)

export function bodyMeshes(scene) {
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
export function skinned(mesh, i, out = new THREE.Vector3()) {
  mesh.getVertexPosition(i, out);
  return out.applyMatrix4(mesh.matrixWorld);
}
// a bone-fixed site: the bone and the point in its local frame
function fixedSite(bone, worldPoint) { return { bone, local: bone.worldToLocal(worldPoint.clone()) }; }


const r3 = (x) => Math.round(x * 1000) / 1000;

// the sites of a model whose scene is at its rest pose (matrices updated)
export function defineSites(scene) {
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
  return { scene, B, fixed, defs, SITES, seatSet, headSet, footSet, meshes };
}

const a = new THREE.Vector3(), b = new THREE.Vector3(), w = new THREE.Vector3();
// every site in the current pose (scene.updateMatrixWorld(true) first): put(name, Vector3), the vector reused
export function sampleSites(S, put) {
  const { B, fixed, footSet, seatSet, headSet } = S;
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
