// Checks a GLB written by tools/char_lod.mjs against its source: every byte of the source's BIN chunk unchanged, the
// LOD accessor decodes (gltf-transform, meshopt) to a valid index over the body's vertices, the JSON otherwise equal.
//   node gen/perf/batch2/crowd/lod_verify.mjs <src.glb> <lod.glb>
import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const [src, dst] = process.argv.slice(2);
const rd = (f) => { const b = fs.readFileSync(f), jl = b.readUInt32LE(12); return { j: JSON.parse(b.subarray(20, 20 + jl)), bin: b.subarray(28 + jl) }; };
const A = rd(src), B = rd(dst);
const same = Buffer.compare(A.bin.subarray(0, A.j.buffers[0].byteLength), B.bin.subarray(0, A.j.buffers[0].byteLength)) === 0;
const lods = B.j.meshes.map((m, i) => [i, m.extras?.lod]).filter(([, l]) => l);
const jsonSame = JSON.stringify({ ...A.j, buffers: 0, bufferViews: A.j.bufferViews, accessors: A.j.accessors, meshes: A.j.meshes.map((m) => ({ ...m, extras: undefined })) })
  === JSON.stringify({ ...B.j, buffers: 0, bufferViews: B.j.bufferViews.slice(0, A.j.bufferViews.length), accessors: B.j.accessors.slice(0, A.j.accessors.length), meshes: B.j.meshes.map((m) => ({ ...m, extras: m.extras?.lod ? (Object.keys(m.extras).length > 1 ? { ...m.extras, lod: undefined } : undefined) : m.extras })) });
const doc = await io.read(dst);
const accs = doc.getRoot().listAccessors();
for (const [i, l] of lods) {
  const a = accs[l.accessor].getArray(), prim = doc.getRoot().listMeshes()[i].listPrimitives()[0];
  const n = prim.getAttribute('POSITION').getCount(), full = prim.getIndices().getCount();
  let max = 0; for (const x of a) max = Math.max(max, x);
  let degenerate = 0; for (let k = 0; k < a.length; k += 3) if (a[k] === a[k + 1] || a[k] === a[k + 2] || a[k + 1] === a[k + 2]) degenerate++;
  console.log(`${dst.split('/').pop()} mesh ${i}: lod ${a.length} indices (${l.count}), max ${max} < ${n} verts (${l.verts}), full ${full} (${l.of}), degenerate ${degenerate}`, a.length === l.count && max < n && n === l.verts && full === l.of ? 'OK' : 'BAD');
}
console.log('bin prefix unchanged:', same, '| json otherwise unchanged:', jsonSame, '| size', fs.statSync(src).size, '->', fs.statSync(dst).size);
