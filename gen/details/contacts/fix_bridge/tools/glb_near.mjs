// The collide triangles of a section GLB near a map point (X, D): per mesh name (material__col), how many and their
// heights/extent, for comparing two builds of one section (fix-bridge: the S3 shore walk near the S4b seam).
//   node glb_near.mjs <glb> <X> <D> <r>
import fs from 'node:fs';
import { THREE, stripGlb } from '../../../../../tools/lib/three_node.mjs';
import path from 'node:path';
const [file, X, D, r] = process.argv.slice(2);
const W = path.resolve('web');
const { GLTFLoader } = await import(path.join(W, 'node_modules/three/examples/jsm/loaders/GLTFLoader.js'));
const { MeshoptDecoder } = await import(path.join(W, 'node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'));
await MeshoptDecoder.ready;
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const gltf = await new Promise((res, rej) => loader.parse(stripGlb(fs.readFileSync(file)), '', res, rej));
gltf.scene.updateMatrixWorld(true);
const out = {};
const v = new THREE.Vector3();
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  const name = o.material?.name || o.name;
  const g = o.geometry, pos = g.attributes.position, idx = g.index;
  const n = idx ? idx.count / 3 : pos.count / 3;
  for (let t = 0; t < n; t++) {
    const p = [];
    for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pos, idx ? idx.getX(t * 3 + k) : t * 3 + k).applyMatrix4(o.matrixWorld); p.push([v.x, -v.z, v.y]); }
    const cx = (p[0][0] + p[1][0] + p[2][0]) / 3, cd = (p[0][1] + p[1][1] + p[2][1]) / 3;
    if (Math.abs(cx - X) > +r || Math.abs(cd - D) > +r) continue;
    const key = `${o.name}|${name}`;
    const e = (out[key] ||= { n: 0, x: [1e9, -1e9], d: [1e9, -1e9], h: [1e9, -1e9] });
    e.n++;
    for (const q of p) { e.x[0] = Math.min(e.x[0], q[0]); e.x[1] = Math.max(e.x[1], q[0]); e.d[0] = Math.min(e.d[0], q[1]); e.d[1] = Math.max(e.d[1], q[1]); e.h[0] = Math.min(e.h[0], q[2]); e.h[1] = Math.max(e.h[1], q[2]); }
  }
});
for (const [k, e] of Object.entries(out).sort()) console.log(k.padEnd(50), String(e.n).padStart(5), 'X', e.x.map((x) => x.toFixed(2)).join('..'), 'D', e.d.map((x) => x.toFixed(2)).join('..'), 'H', e.h.map((x) => x.toFixed(2)).join('..'));
