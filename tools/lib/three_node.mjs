// three.js in node, for numbers only (no GPU, no browser): the web page's own three build and loaders, and the page's own
// people.js loadCharacters / prepareClip, so a model is sized and its clips corrected exactly as the page does it.
// Used by tools/joint_tracks.mjs. Textures are stripped from the GLB before parsing (node has no image decoder).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const W = path.join(QM, 'web');
export const THREE = await import(path.join(W, 'node_modules/three/build/three.module.js'));
const { GLTFLoader } = await import(path.join(W, 'node_modules/three/examples/jsm/loaders/GLTFLoader.js'));
const { MeshoptDecoder } = await import(path.join(W, 'node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'));
export const { loadCharacters } = await import(path.join(W, 'src/people.js'));
await MeshoptDecoder.ready;

// a GLB without its images, textures and samplers (the geometry, skins and animations untouched)
export function stripGlb(buf) {
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binHdr = 20 + jsonLen;
  const bin = binHdr + 8 <= buf.length ? buf.subarray(binHdr + 8, binHdr + 8 + buf.readUInt32LE(binHdr)) : Buffer.alloc(0);
  delete json.images; delete json.textures; delete json.samplers;
  for (const m of json.materials || []) {
    const p = m.pbrMetallicRoughness;
    if (p) { delete p.baseColorTexture; delete p.metallicRoughnessTexture; }
    delete m.normalTexture; delete m.emissiveTexture; delete m.occlusionTexture;
    if (m.extensions) for (const k of Object.keys(m.extensions)) if (/texture/i.test(JSON.stringify(m.extensions[k]))) delete m.extensions[k];
  }
  json.extensionsUsed = (json.extensionsUsed || []).filter((e) => !/texture|KTX|webp/i.test(e));
  json.extensionsRequired = (json.extensionsRequired || []).filter((e) => !/texture|KTX|webp/i.test(e));
  let js = Buffer.from(JSON.stringify(json), 'utf8');
  js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
  const binPad = (4 - (bin.length % 4)) % 4;
  const out = Buffer.alloc(12 + 8 + js.length + (bin.length ? 8 + bin.length + binPad : 0));
  out.writeUInt32LE(0x46546c67, 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(js.length, 12); out.writeUInt32LE(0x4e4f534a, 16); js.copy(out, 20);
  if (bin.length) {
    const b0 = 20 + js.length;
    out.writeUInt32LE(bin.length + binPad, b0); out.writeUInt32LE(0x004e4942, b0 + 4); bin.copy(out, b0 + 8);
  }
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.length);
}

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
// a stand-in for the page's GLTFLoader: loadAsync('assets/...') reads web/public/assets/... from disk
export const diskLoader = {
  loadAsync: (file) => new Promise((res, rej) => loader.parse(stripGlb(fs.readFileSync(path.join(W, 'public', file))), '', res, rej)),
};

// load characters or animals exactly as the page does (sizes, clip drift and grounding from clip_meta.json)
// opts.engine 'proposed': also what the details pass's engine patch would do (gen/details/contacts/fix_s4/engine_patches.md)
// while people.js doesn't do it yet: a clip's clip_meta sole_m lifts it so its ground contact sits on the ground, and a
// ride clip's seat_m becomes clip.userData.seatY
export const PAGE_APPLIES_SOLE = /sole_m/.test(fs.readFileSync(path.join(W, 'src/people.js'), 'utf8'));
export async function loadModels(names, registry, meta, opts = {}) {
  const models = await loadCharacters(diskLoader, null, names, registry, null, meta);
  if (opts.engine === 'proposed' && meta) {
    // a clip clip_meta.json doesn't list yet (built after the last people_precompute) takes tools/clip_ground.mjs's value
    const gf = path.join(QM, 'gen/details/contacts/clip_ground.json');
    const ground = fs.existsSync(gf) ? JSON.parse(fs.readFileSync(gf, 'utf8')).files : {};
    for (const [name, m] of Object.entries(models)) applyProposed(m, meta[registry[name].file] || {}, ground[registry[name].file]?.clips || {});
  }
  return models;
}
// a hips track's values array can be shared by two clips (gltf-transform's dedup merges identical accessors: an IK
// variant that leaves the hips alone shares its base's), so each array is lifted once
const LIFTED = new WeakSet();
export function applyProposed(m, known, ground = {}) {
  for (const clip of m.clips) {
    const e = known[clip.name]?.sole_m !== undefined || known[clip.name]?.seat_m !== undefined ? known[clip.name] : ground[clip.name];
    if (!e) continue;
    if (e.seat_m !== undefined) clip.userData = { ...(clip.userData || {}), seatY: e.seat_m };
    if (!e.sole_m || PAGE_APPLIES_SOLE) continue;
    const tr = clip.tracks.find((t) => /Hips\.position$/.test(t.name));
    if (!tr) continue;
    const hips = m.scene.getObjectByName(tr.name.split('.')[0]);
    const ws = new THREE.Vector3();
    hips.parent.getWorldScale(ws);
    if (!LIFTED.has(tr.values)) { for (let i = 1; i < tr.values.length; i += 3) tr.values[i] += e.sole_m / ws.y; LIFTED.add(tr.values); }
    clip.userData = { ...(clip.userData || {}), soleApplied: e.sole_m };
  }
}

// a loader for GLBs anywhere on disk (absolute paths as the registry's `file`): tools/ik_clip.mjs loads a rig with one
// base clip merged in, sized and grounded by the page's own loadCharacters
export const absLoader = {
  loadAsync: (file) => new Promise((res, rej) => loader.parse(stripGlb(fs.readFileSync(file)), '', res, rej)),
};
