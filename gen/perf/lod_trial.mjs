// How far the characters' bodies simplify (meshoptimizer, index-only, the same vertices so the bake and skinning are
// unchanged): triangles kept and the error at a few targets. Study script for gen/perf/proposal.md.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const rows = [];
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f);
  const mesh = doc.getRoot().listMeshes().find((m) => !/^(prop|tack)_/.test(m.getName())) || doc.getRoot().listMeshes()[0];
  const prim = mesh.listPrimitives()[0];
  const pos = prim.getAttribute('POSITION'), idx = prim.getIndices();
  const n = pos.getCount(), P = new Float32Array(n * 3), e = [];
  for (let i = 0; i < n; i++) { pos.getElement(i, e); P.set(e, i * 3); }
  const I = new Uint32Array(idx.getArray());
  const tris = I.length / 3, out = { file: f.split('/').pop(), tris };
  for (const frac of [0.5, 0.25, 0.12]) {
    const [r, err] = MeshoptSimplifier.simplify(I, P, 3, Math.floor(I.length * frac / 3) * 3, 0.05, ['LockBorder']);
    // error is relative to the mesh extent; report it in centimetres of a 1.7 m figure
    out[`f${frac}`] = { tris: r.length / 3, errCm: +(err * 170).toFixed(1) };
  }
  rows.push(out);
}
console.log(JSON.stringify(rows, null, 0));
