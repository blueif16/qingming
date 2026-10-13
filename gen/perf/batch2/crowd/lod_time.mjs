// How long meshopt's simplifier takes on the character bodies (to judge doing it at load time) and what it keeps.
//   node gen/perf/batch2/crowd/lod_time.mjs <glb>...
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
await MeshoptDecoder.ready;
const t0 = performance.now();
await MeshoptSimplifier.ready;
console.log('simplifier ready', (performance.now() - t0).toFixed(1), 'ms');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f);
  const mesh = doc.getRoot().listMeshes().find((m) => !/^(prop|tack)_/.test(m.getName()));
  const prim = mesh.listPrimitives()[0];
  const pos = prim.getAttribute('POSITION'), idx = prim.getIndices();
  const n = pos.getCount(), P = new Float32Array(n * 3), e = [];
  for (let i = 0; i < n; i++) { pos.getElement(i, e); P.set(e, i * 3); }
  const I = new Uint32Array(idx.getArray());
  const times = [];
  let r, err;
  for (let k = 0; k < 5; k++) { const t = performance.now(); [r, err] = MeshoptSimplifier.simplify(I, P, 3, Math.floor(I.length * 0.25 / 3) * 3, 0.05, ['LockBorder']); times.push(performance.now() - t); }
  const used = new Set(r).size;
  console.log(f.split('/').pop(), 'tris', I.length / 3, '->', r.length / 3, 'verts used', used, '/', n, 'err', (err * 170).toFixed(1), 'cm', 'ms', times.map((t) => t.toFixed(2)).join(' '));
}
