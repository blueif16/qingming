// Convert Messenger character .drc files (meshes + bones + clips) into a skinned, animated GLB
// for study in Blender. Usage:
//   node drc2glb.mjs <out.glb> <atlas.png> <bones.drc> --mesh a.drc [b.drc ...] --anim idle.drc [walk.drc ...]
import fs from 'node:fs';
import path from 'node:path';
import draco3d from 'draco3d';
import { Document, NodeIO } from '@gltf-transform/core';

const M = await draco3d.createDecoderModule({});

function decode(file) {
  const buf = new Uint8Array(fs.readFileSync(file));
  const dec = new M.Decoder();
  const db = new M.DecoderBuffer();
  db.Init(buf, buf.length);
  const isMesh = dec.GetEncodedGeometryType(db) === M.TRIANGULAR_MESH;
  const geo = isMesh ? new M.Mesh() : new M.PointCloud();
  const st = isMesh ? dec.DecodeBufferToMesh(db, geo) : dec.DecodeBufferToPointCloud(db, geo);
  if (!st.ok()) throw new Error(file + ': ' + st.error_msg());
  const q = new M.MetadataQuerier();
  const info = JSON.parse(q.GetStringEntry(dec.GetMetadata(geo), 'info'));
  const n = geo.num_points();
  const out = { n, info, attrs: {} };
  info.attributes.forEach(([name, t], i) => {
    const att = dec.GetAttribute(geo, i);
    const comps = att.num_components();
    const len = n * comps;
    // info type codes follow typed-array order: 4 = Uint16Array, 7 = Float32Array
    const [dt, Ctor] = t === 4 ? [M.DT_UINT16, Uint16Array] : [M.DT_FLOAT32, Float32Array];
    const bytes = len * Ctor.BYTES_PER_ELEMENT;
    const ptr = M._malloc(bytes);
    dec.GetAttributeDataArrayForAllPoints(geo, att, dt, bytes, ptr);
    const arr = new Ctor(M.HEAPF32.buffer, ptr, len).slice();
    M._free(ptr);
    out.attrs[name] = { arr, comps };
  });
  if (isMesh) {
    const nf = geo.num_faces();
    const idx = new Uint32Array(nf * 3);
    const ptr = M._malloc(idx.byteLength);
    dec.GetTrianglesUInt32Array(geo, idx.byteLength, ptr);
    idx.set(new Uint32Array(M.HEAPF32.buffer, ptr, nf * 3));
    M._free(ptr);
    out.index = idx;
  }
  M.destroy(geo); M.destroy(db); M.destroy(dec);
  return out;
}

const args = process.argv.slice(2);
const [outFile, atlasFile, bonesFile] = args;
const meshFiles = [], animFiles = [];
let mode = null;
for (const a of args.slice(3)) {
  if (a === '--mesh' || a === '--anim') { mode = a; continue; }
  (mode === '--mesh' ? meshFiles : animFiles).push(a);
}

const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene('scene');

// skeleton
const bones = decode(bonesFile);
const nb = bones.n;
const bpos = bones.attrs.position.arr, bquat = bones.attrs.quaternion.arr, bscl = bones.attrs.scale.arr;
// hierarchy stores parent index + 1 (0 = root)
const parent = Array.from(bones.attrs.hierarchy.arr, (h) => h - 1);
const joints = [];
for (let i = 0; i < nb; i++) {
  joints.push(doc.createNode('bone_' + i)
    .setTranslation([bpos[i * 3], bpos[i * 3 + 1], bpos[i * 3 + 2]])
    .setRotation([bquat[i * 4], bquat[i * 4 + 1], bquat[i * 4 + 2], bquat[i * 4 + 3]])
    .setScale([bscl[i * 3], bscl[i * 3 + 1], bscl[i * 3 + 2]]));
}
const roots = [];
for (let i = 0; i < nb; i++) {
  const p = parent[i];
  if (p < 0) roots.push(joints[i]); else joints[p].addChild(joints[i]);
}
const rig = doc.createNode('rig');
roots.forEach((r) => rig.addChild(r));
scene.addChild(rig);

// inverse bind matrices from the bind pose
function compose(t, q, s) {
  const [x, y, z, w] = q;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  return [
    (1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0,
    (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
    (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0,
    t[0], t[1], t[2], 1];
}
function mul(a, b) { // column-major a*b
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}
function invert(m) {
  const inv = new Array(16);
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m;
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  const det = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
  inv[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det; inv[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  inv[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det; inv[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  inv[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det; inv[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  inv[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det; inv[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  inv[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det; inv[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  inv[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det; inv[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  inv[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det; inv[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  inv[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det; inv[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return inv;
}
const world = new Array(nb);
function worldOf(i) {
  if (world[i]) return world[i];
  const local = compose(joints[i].getTranslation(), joints[i].getRotation(), joints[i].getScale());
  const p = parent[i];
  world[i] = p < 0 ? local : mul(worldOf(p), local);
  return world[i];
}
const ibm = new Float32Array(nb * 16);
for (let i = 0; i < nb; i++) ibm.set(invert(worldOf(i)), i * 16);
const skin = doc.createSkin('skin').setSkeleton(roots[0])
  .setInverseBindMatrices(doc.createAccessor().setType('MAT4').setArray(ibm).setBuffer(buffer));
joints.forEach((j) => skin.addJoint(j));

// material: flat palette atlas, nearest filtering
const tex = doc.createTexture('atlas').setImage(new Uint8Array(fs.readFileSync(atlasFile))).setMimeType('image/png');
const mat = doc.createMaterial('palette').setBaseColorTexture(tex).setRoughnessFactor(1).setMetallicFactor(0);
mat.getBaseColorTextureInfo().setMagFilter(9728).setMinFilter(9728);

for (const mf of meshFiles) {
  const g = decode(mf);
  const prim = doc.createPrimitive().setMaterial(mat)
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(g.index).setBuffer(buffer));
  const add = (sem, name, type) => g.attrs[name] && prim.setAttribute(sem,
    doc.createAccessor().setType(type).setArray(g.attrs[name].arr).setBuffer(buffer));
  add('POSITION', 'position', 'VEC3');
  add('NORMAL', 'normal', 'VEC3');
  // three.js UVs (origin bottom-left) -> glTF (origin top-left)
  if (g.attrs.uv) { const uv = g.attrs.uv.arr; for (let k = 1; k < uv.length; k += 2) uv[k] = 1 - uv[k]; }
  add('TEXCOORD_0', 'uv', 'VEC2');
  add('JOINTS_0', 'skinIndex', 'VEC4');
  // normalise weights so they sum to 1
  const w = g.attrs.skinWeight.arr;
  for (let v = 0; v < g.n; v++) { const s = w[v * 4] + w[v * 4 + 1] + w[v * 4 + 2] + w[v * 4 + 3] || 1; for (let k = 0; k < 4; k++) w[v * 4 + k] /= s; }
  add('WEIGHTS_0', 'skinWeight', 'VEC4');
  const name = path.basename(mf, '.drc').replace(/^.*_/, '');
  const node = doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)).setSkin(skin);
  scene.addChild(node);
  console.log(`mesh ${name}: ${g.n} verts, ${g.index.length / 3} tris`);
}

// clips: point clouds of per-bone TRS, frame-major (frame f, bone b) -> f * nb + b
for (const af of animFiles) {
  const a = decode(af);
  const { fps, frames } = a.info.userData;
  const name = path.basename(af, '.drc').replace(/^.*?-(?=[a-z]+(-[a-z0-9]+)?$)/, '');
  const anim = doc.createAnimation(name);
  const times = new Float32Array(frames).map((_, f) => f / fps);
  const input = doc.createAccessor().setType('SCALAR').setArray(times).setBuffer(buffer);
  for (let b = 0; b < nb; b++) {
    for (const [attr, comps, pathName] of [['position', 3, 'translation'], ['quaternion', 4, 'rotation'], ['scale', 3, 'scale']]) {
      const src = a.attrs[attr].arr, out = new Float32Array(frames * comps);
      for (let f = 0; f < frames; f++) for (let k = 0; k < comps; k++) out[f * comps + k] = src[(f * nb + b) * comps + k];
      const sampler = doc.createAnimationSampler().setInput(input).setInterpolation('LINEAR')
        .setOutput(doc.createAccessor().setType(comps === 4 ? 'VEC4' : 'VEC3').setArray(out).setBuffer(buffer));
      anim.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(joints[b]).setTargetPath(pathName).setSampler(sampler));
    }
  }
  console.log(`clip ${name}: ${frames} frames @ ${fps} fps, ${a.n / frames} bones`);
}

await new NodeIO().write(outFile, doc);
console.log('wrote', outFile);
