#!/usr/bin/env node
// What differs between two builds of a GLB, by content: nodes, meshes, accessors (decoded data), skins, animations,
// materials, textures, and the images (bytes and size) apart.
//   node tools/glb_diff.mjs <a.glb> <b.glb> [--json]
// Prints "same apart from image pixels" (or "identical") when nothing but the images' bytes differ; else every
// difference. A mesh whose accessors differ is compared triangle by triangle (order-free): when every triangle keeps
// its geometry and only uvs change, that is reported as "the uvs of N triangles". Exit code 0 when only images (and
// such uvs) differ, 1 otherwise.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import crypto from 'node:crypto';
import sharp from 'sharp';

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const h = (a) => (a ? crypto.createHash('sha1').update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)).digest('hex').slice(0, 12) : null);
const acc = (a) => (a ? `${a.getType()}/${a.getComponentType()}${a.getNormalized() ? 'n' : ''} x${a.getCount()} ${h(a.getArray())}` : null);

// a mesh as a multiset of triangles: each corner's position, normal, tangent, joints and weights (the geometry key, the corners
// turned so the smallest comes first, winding kept) and its uv apart; independent of vertex and triangle order
function triangles(mesh) {
  const out = [];
  for (const p of mesh.listPrimitives()) {
    const geo = ['POSITION', 'NORMAL', 'TANGENT', 'JOINTS_0', 'WEIGHTS_0'].map((q) => p.getAttribute(q)).filter(Boolean), uv = p.getAttribute('TEXCOORD_0');
    const ix = p.getIndices() ? p.getIndices().getArray() : Array.from({ length: geo[0].getCount() }, (_, i) => i);
    const key = (v) => geo.map((a) => a.getElement(v, []).map((x) => +x.toFixed(5)).join(',')).join('|'), uvk = (v) => (uv ? uv.getElement(v, []).map((x) => +x.toFixed(5)).join(',') : '');
    for (let f = 0; f < ix.length; f += 3) {
      const c = [0, 1, 2].map((k) => [key(ix[f + k]), uvk(ix[f + k])]);
      let r = 0; for (let k = 1; k < 3; k++) if (c[k][0] < c[r][0]) r = k;
      const rot = [c[r], c[(r + 1) % 3], c[(r + 2) % 3]];
      out.push([rot.map((q) => q[0]).join(' / '), rot.map((q) => q[1]).join(' / ')]);
    }
  }
  return out;
}
export function compareTriangles(ma, mb) {
  const A = triangles(ma), B = triangles(mb), byKey = new Map();
  for (const [k, u] of A) { if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(u); }
  let same = 0, uvOnly = 0, onlyB = 0;
  for (const [k, u] of B) {
    const l = byKey.get(k);
    if (!l || !l.length) { onlyB++; continue; }
    const i = l.indexOf(u);
    if (i >= 0) { l.splice(i, 1); same++; } else { l.pop(); uvOnly++; }
  }
  const onlyA = [...byKey.values()].reduce((t, l) => t + l.length, 0);
  return { triangles: [A.length, B.length], same, uv_changed: uvOnly, only_a: onlyA, only_b: onlyB };
}

async function describe(file) {
  const doc = await io.read(file), root = doc.getRoot();
  const d = { doc };
  d.extensions = root.listExtensionsUsed().map((e) => e.extensionName).sort();
  d.nodes = root.listNodes().map((n) => ({ name: n.getName(), t: n.getTranslation().map((x) => +x.toFixed(6)), r: n.getRotation().map((x) => +x.toFixed(6)), s: n.getScale().map((x) => +x.toFixed(6)),
    mesh: n.getMesh()?.getName() ?? null, skin: !!n.getSkin(), children: n.listChildren().map((c) => c.getName()) }));
  d.meshes = root.listMeshes().map((m) => ({ name: m.getName(), prims: m.listPrimitives().map((p) => ({ mode: p.getMode(), material: p.getMaterial()?.getName() ?? null, indices: acc(p.getIndices()),
    attributes: Object.fromEntries(p.listSemantics().map((s) => [s, acc(p.getAttribute(s))])) })) }));
  d.skins = root.listSkins().map((s) => ({ joints: s.listJoints().map((j) => j.getName()), ibm: acc(s.getInverseBindMatrices()), skeleton: s.getSkeleton()?.getName() ?? null }));
  d.animations = root.listAnimations().map((a) => ({ name: a.getName(), channels: a.listChannels().map((c) => `${c.getTargetNode()?.getName()}.${c.getTargetPath()} ${c.getSampler().getInterpolation()} in ${acc(c.getSampler().getInput())} out ${acc(c.getSampler().getOutput())}`) }));
  d.materials = root.listMaterials().map((m) => ({ name: m.getName(), base: m.getBaseColorFactor(), alpha: m.getAlphaMode(), double: m.getDoubleSided(), metal: m.getMetallicFactor(), rough: m.getRoughnessFactor(),
    tex: m.getBaseColorTexture() ? root.listTextures().indexOf(m.getBaseColorTexture()) : null }));
  d.textures = root.listTextures().map((t) => ({ name: t.getName(), mime: t.getMimeType(), size: t.getSize() }));
  d.images = await Promise.all(root.listTextures().map(async (t) => {
    const raw = await sharp(Buffer.from(t.getImage())).raw().toBuffer({ resolveWithObject: true });
    return { bytes: t.getImage().length, sha: h(t.getImage()), pixels: h(raw.data), raw };
  }));
  return d;
}

const [fa, fb] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [A, B] = await Promise.all([describe(fa), describe(fb)]);
const diffs = [];
const cmp = (path, a, b) => { const ja = JSON.stringify(a), jb = JSON.stringify(b); if (ja !== jb) diffs.push({ path, a: ja.length > 300 ? ja.slice(0, 300) + '...' : ja, b: jb.length > 300 ? jb.slice(0, 300) + '...' : jb }); };
cmp('extensions', A.extensions, B.extensions);
cmp('node names', A.nodes.map((n) => n.name), B.nodes.map((n) => n.name));
A.nodes.forEach((n, i) => B.nodes[i] && cmp(`node ${n.name}`, n, B.nodes[i]));
cmp('mesh names', A.meshes.map((m) => m.name), B.meshes.map((m) => m.name));
// a mesh whose accessors differ is compared triangle by triangle: if every triangle is still there with the same
// geometry, only some uvs changed (the eye fix's own islands), it is reported as that, not as a difference
const triDiffs = [];
A.meshes.forEach((m, i) => {
  if (!B.meshes[i] || JSON.stringify(m) === JSON.stringify(B.meshes[i])) return;
  const ma = A.doc.getRoot().listMeshes()[i], mb = B.doc.getRoot().listMeshes()[i], t = compareTriangles(ma, mb);
  if (t.only_a === 0 && t.only_b === 0 && JSON.stringify(m.prims.map((p) => [p.mode, p.material, Object.keys(p.attributes).sort()])) === JSON.stringify(B.meshes[i].prims.map((p) => [p.mode, p.material, Object.keys(p.attributes).sort()]))) triDiffs.push({ mesh: m.name, ...t });
  else { cmp(`mesh ${m.name}`, m, B.meshes[i]); diffs[diffs.length - 1].triangles = t; }
});
cmp('skins', A.skins, B.skins);
cmp('animation names', A.animations.map((a) => a.name), B.animations.map((a) => a.name));
A.animations.forEach((a, i) => B.animations[i] && cmp(`animation ${a.name}`, a, B.animations[i]));
cmp('materials', A.materials, B.materials);
cmp('textures', A.textures, B.textures);
const imgs = A.images.map((a, i) => {
  const b = B.images[i];
  if (!b) return null;
  let changed = 0, maxd = 0;
  const da = a.raw.data, db = b.raw.data, ch = a.raw.info.channels;
  if (da.length === db.length) for (let k = 0; k < da.length; k += ch) { let m = 0; for (let c = 0; c < Math.min(3, ch); c++) m = Math.max(m, Math.abs(da[k + c] - db[k + c])); if (m > 0) changed++; maxd = Math.max(maxd, m); }
  return { i, same_bytes: a.sha === b.sha, bytes: [a.bytes, b.bytes], changed_texels: changed, of: da.length / ch, max_diff: maxd };
}).filter(Boolean);
const out = { a: fa, b: fb, structure_same: !diffs.length, diffs, uv_only: triDiffs, images: imgs };
if (process.argv.includes('--json')) console.log(JSON.stringify(out, null, 1));
else {
  for (const d of diffs) console.log(`DIFF ${d.path}\n  a: ${d.a}\n  b: ${d.b}${d.triangles ? `\n  triangles: ${JSON.stringify(d.triangles)}` : ''}`);
  for (const t of triDiffs) console.log(`mesh ${t.mesh}: ${t.triangles[0]} -> ${t.triangles[1]} triangles, ${t.same} identical, ${t.uv_changed} with only their uv changed, none added or lost (vertices may be copied or reordered)`);
  for (const im of imgs) console.log(`image ${im.i}: ${im.same_bytes ? 'same bytes' : `bytes ${im.bytes[0]} -> ${im.bytes[1]}, ${im.changed_texels} of ${im.of} texels changed (max ${im.max_diff}/255)`}`);
  const uvNote = triDiffs.length ? ` and the uvs of ${triDiffs.reduce((t, q) => t + q.uv_changed, 0)} triangles` : '';
  console.log(diffs.length ? `${diffs.length} structural differences` : imgs.every((q) => q.same_bytes) && !triDiffs.length ? 'identical' : `same apart from image pixels${uvNote}`);
}
process.exit(diffs.length ? 1 : 0);
