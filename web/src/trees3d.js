// The 3D trees (gen/details/trees/method.md; the user, 2026-10-13: the cards look "fake and just made with images").
// Every mapped tree keeps its painted card (world.js placeTrees) as its far level of detail; near you it is a real tree:
// its wood (a Meshy trunk with its limbs and heads, or wood built from the card's strokes) and a crown of painted clumps
// (assets/trees3d/<card>.glb, tools/trees3d.mjs), swaying in the one wind (wind.js).
// - One BatchedMesh for every 3D tree of the loaded sections, one material (vertex colours for the wood, the crown
//   atlas for the clumps): one draw a pass with WEBGL_multi_draw.
// - The colour pass draws only the trees within the tier's meshNear (+ the fade band), re-chosen 4 times a second; the
//   shadow pass draws every tree at rest (no wind, no fade), so the cached static shadow layer holds still.
// - The hand-over is a dithered cross-fade over `band` metres, computed in both shaders from the distance (no per-frame
//   work): the card's dither (cardPatch) is the exact complement of the tree's.
// - The tier (detail.js, tiers.js detail.trees): meshNear / meshNearRiver (m: 3D within, cards beyond; the river
//   sections' tight GPU window), clumpDensity (the share of each crown's clumps, most important first), strands (the
//   hanging whips' share), windFar (m: the sway fades out by then); counts scale with detailScale.
// - Wind: trunk bend (the whole tree, more toward its top), clump flutter about each head, strands swinging; every tree
//   and clump with its own phase from its position; gusts roll across the ground (wind.js qmGust).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { WIND, WIND_GLSL, windUniforms } from './wind.js';
import { register } from './detail.js';

const BAND = 6; // m: the cross-fade between the card and the tree
// the dither both sides share (interleaved gradient noise): the tree draws where it is under the fade, the card above
const DITHER = 'float qmTreeDither() { return fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))); }';
// the uniforms both sides share: x = meshNear, y = meshNearRiver, z/w = the river sections' x range (world x)
const LOD = { qmTreeLod: { value: new THREE.Vector4(45, 45, 1e9, -1e9) }, qmTreeBand: { value: BAND }, qmWindFar: { value: 30 } };
// the Meshy trunks' painted bark (assets/trees3d/bark.webp: one slot each, and a white slot for wood that keeps its
// vertex colours)
const BARK = { qmBark: { value: null } };
// GLSL: how much of the 3D tree shows at a world foot point (1 near, 0 beyond meshNear + band)
const FADE_GLSL = /* glsl */ `
uniform vec4 qmTreeLod;
uniform float qmTreeBand;
float qmTreeFade(vec3 foot) {
  float near = (foot.x >= qmTreeLod.z && foot.x <= qmTreeLod.w) ? qmTreeLod.y : qmTreeLod.x;
  if (near <= 0.0) return 0.0;
  return 1.0 - smoothstep(near, near + qmTreeBand, distance(cameraPosition.xz, foot.xz));
}
`;

// ------------------------------------------------------------------ the tree material's patch (onBeforeCompile)
function treePatch(shader) {
  Object.assign(shader.uniforms, windUniforms(), LOD, BARK);
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>
${WIND_GLSL}
${FADE_GLSL}
uniform float qmWindFar;
attribute vec4 qmWind;
attribute float qmBend;
varying float vQmFade;
varying float vQmClump;
varying float vQmRoot;`)
    // the wind, in the tree's own frame (before its instance matrix): the trunk's bend, then each clump about its head
    .replace('#include <begin_vertex>', `#include <begin_vertex>
{
  vec3 qmFoot = batchingMatrix[3].xyz;
  vQmFade = qmTreeFade(qmFoot);
  vQmClump = qmWind.w >= 0.0 ? 1.0 : 0.0;
  vQmRoot = qmWind.w >= 1.0 ? 1.0 : qmWind.w; // 0 at a fan's root .. 1 at its tips (a hanging whip: always 1)
#ifndef QM_REST
  float qmFar = 1.0 - smoothstep(qmWindFar * 0.7, qmWindFar, distance(cameraPosition.xz, qmFoot.xz));
  if (qmFar > 0.0) {
    mat3 qmM = mat3(batchingMatrix);
    float qmS2 = dot(qmM[1], qmM[1]);
    vec3 qmDir = (transpose(qmM) * vec3(qmWindDir.x, 0.0, qmWindDir.y)) / qmS2; // the wind in the tree's frame
    vec3 qmSide = normalize(cross(vec3(0.0, 1.0, 0.0), qmDir) + 1e-5);
    float qmPh = fract(sin(dot(qmFoot.xz, vec2(12.9898, 78.233))) * 43758.5453) * 6.2831;
    float qmShk = qmShakeAt(qmFoot.xz) * qmFar; // the drum's shake (wind.js): a shiver in the leaves, a little in the wood
    float qmW = qmWindAt(qmFoot.xz) * qmFar + 0.2 * qmShk;
    float qmT = qmWindTime;
    // the trunk: a slow lean with the wind plus a sway round it, more toward the top; a little across the wind too
    float qmSway = qmW * (0.55 + 0.45 * sin(qmT * 1.1 + qmPh)) + 0.12 * qmW * sin(qmT * 2.3 + qmPh * 1.7);
    float qmAcross = 0.25 * qmW * sin(qmT * 0.9 + qmPh * 2.1);
    transformed += (qmDir * qmSway + qmSide * qmAcross) * qmBend * 0.35;
    if (qmWind.w >= 0.0) {
      // a clump: its shoots flutter about its head, faster and with their own phase, more toward their tips; a
      // hanging whip (w = 1 + how far down it) swings wider and slower, like a pendulum, its free end the most
      vec3 qmRel = transformed - qmWind.xyz;
      float qmHang = step(1.0, qmWind.w), qmF = qmWind.w - qmHang;
      float qmCp = fract(sin(dot(qmWind.xyz, vec3(17.1, 31.7, 11.3))) * 43758.5453) * 6.2831;
      float qmSp = mix(1.0, 0.5, qmHang);
      float qmFl = qmW * qmF * (0.10 * sin(qmT * 2.9 * qmSp + qmCp) + 0.05 * sin(qmT * 5.3 * qmSp + qmCp * 1.3) + 0.08) * mix(1.0, 2.4, qmHang)
        + qmShk * qmF * 0.09 * sin(qmT * 17.0 + qmCp * 3.0) * mix(1.0, 1.8, qmHang);
      transformed += (qmDir * qmFl + qmSide * qmFl * 0.6 * sin(qmT * 1.7 * qmSp + qmCp)) * length(qmRel) * 0.6;
      transformed.y -= abs(qmFl) * qmF * length(qmRel) * mix(0.15, 0.05, qmHang);
    }
  }
#endif
}`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>
varying float vQmFade;
varying float vQmClump;
varying float vQmRoot;
uniform sampler2D qmBark;
${DITHER}`)
    // the cross-fade: the tree shows where the dither is under its fade (the card above it)
    .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
#ifndef QM_REST
if (qmTreeDither() >= vQmFade) discard;
#endif`)
    // the wood takes its vertex colour only; a clump its painted texel, with its alpha kept up as it shrinks (mips)
    .replace('#include <map_fragment>', `#ifdef USE_MAP
if (vQmClump > 0.5) {
  vec4 qmTex = texture2D(map, vMapUv);
  vec2 qmTs = vec2(textureSize(map, 0));
  float qmLod = log2(max(max(length(dFdx(vMapUv * qmTs)), length(dFdy(vMapUv * qmTs))), 1.0));
  qmTex.a *= 1.0 + qmLod * 0.3;
  // a fan's shoots all meet at its root: thin that knot out (the wood's head is there), so a head never reads as a blot
  qmTex.a *= smoothstep(0.0, 0.14, vQmRoot);
  diffuseColor *= qmTex;
} else {
  diffuseColor.rgb *= texture2D(qmBark, vMapUv).rgb;
}
#endif`)
    // the crown's normals are spherised and the wood is closed: never flipped for the back of a face
    .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize(vNormal); // never turned for the back of a face');
}

// the card's side of the cross-fade: the card shows where the dither is at or over the tree's fade; `has` (a uniform,
// set once the register is in) is 0 for a card with no 3D tree, so it never fades
function cardShader(shader, has) {
  Object.assign(shader.uniforms, LOD, { qmTreeHas: has });
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${FADE_GLSL}\nuniform float qmTreeHas;\nvarying float vQmFade;`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
vQmFade = qmTreeHas * qmTreeFade(instanceMatrix[3].xyz);
#else
vQmFade = 0.0;
#endif`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\nvarying float vQmFade;\n${DITHER}`)
    .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (qmTreeDither() < vQmFade) discard;');
}
// a material's own patch kept: ours runs after it
const chain = (m, fn, key) => {
  if (m.userData.qmChained === key) return m; // a material patched once (pbr hands the same one back)
  m.userData.qmChained = key;
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = prev && prev !== THREE.Material.prototype.onBeforeCompile ? (sh, r) => { prev.call(m, sh, r); fn(sh); } : fn;
  const pk = m.customProgramCacheKey.bind(m);
  m.customProgramCacheKey = () => `${pk()}|${key}`;
  return m;
};

// ------------------------------------------------------------------ the batch: the colour pass draws only the near trees
class TreeBatch extends THREE.BatchedMesh {
  constructor(owner, ...a) { super(...a); this.owner = owner; }
  onBeforeRender(renderer, scene, camera, geometry, material, group) {
    const info = this._instanceInfo;
    if (scene) { // the colour pass (the shadow pass calls this with no scene)
      WIND.sync(performance.now(), renderer.info.render.frame);
      this.owner.choose(camera);
      for (let i = 0; i < info.length; i++) info[i].visible = this.owner.near[i] === 1;
    } else for (let i = 0; i < info.length; i++) info[i].visible = true; // every tree casts, at rest
    super.onBeforeRender(renderer, scene, camera, geometry, material, group);
  }
}

// an attribute as plain floats: normalized integers scaled straight from their typed array (meshopt's quantized
// attributes; a loop of getComponent calls took ~0.2 s a section on the phone proxy), interleaved ones read through
function floats(a) {
  const n = a.count * a.itemSize, f = new Float32Array(n);
  if (a.isInterleavedBufferAttribute) {
    for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) f[i * a.itemSize + k] = a.getComponent(i, k);
    return f;
  }
  const src = a.array;
  if (!a.normalized) { for (let i = 0; i < n; i++) f[i] = src[i]; return f; }
  const max = src instanceof Int8Array ? 127 : src instanceof Uint8Array ? 255 : src instanceof Int16Array ? 32767 : src instanceof Uint16Array ? 65535 : 1;
  const signed = src instanceof Int8Array || src instanceof Int16Array;
  for (let i = 0; i < n; i++) f[i] = signed ? Math.max(src[i] / max, -1) : src[i] / max;
  return f;
}

// the sections by the rivers, where the tier's meshNearRiver applies (budget_check: S4b + S3 + S2 hold 198 of 200 MB)
export const RIVER_SECTIONS = new Set(['outer_road_2', 'rainbow_bridge', 'canal']);

// On by default since the user's sign-off (2026-10-13). ?trees=cards: the cards alone, as before (world.js then makes no
// Trees3D); an inert Trees3D (no fetch, nothing in the scene, card materials and shadows untouched) is left for a page
// that builds one without a location.
export const TREES3D_ON = typeof location !== 'undefined' && new URLSearchParams(location.search).get('trees') !== 'cards';

// a tree's matrix from its placement (card, x, y, z, s, flip): the painted front faces south (+z); a mirrored card is
// the tree mirrored; a little turn of its own from its position. The batch (build) and the trunk colliders
// (trunkColliders) share it, so a collider stands where its bole is drawn
const _q = new THREE.Quaternion(), _sc = new THREE.Vector3(), _p = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
export function treeMatrix(t, m = new THREE.Matrix4()) {
  const h = Math.sin(t.x * 12.9898 + t.z * 78.233) * 43758.5453;
  _q.setFromAxisAngle(_up, (h - Math.floor(h) - 0.5) * 0.5);
  return m.compose(_p.set(t.x, t.y, t.z), _q, _sc.set(t.flip ? -t.s : t.s, t.s, t.s));
}

// The trunk colliders (gen/details/trees/notes.md "Left" 2): the builders' trunk colliders are 0.3 m x scale cylinders,
// and a pollard's bole is 0.8-1.8 m in radius, so you walked into its edge. One open tube per tree at its bole
// (trees3d.json variants.<card>.trunk: the bole's centre x/z and median radius r at 0.3-1.6 m, scale 1, in the tree's
// frame), from 0.6 m under its foot to 2.6 m above, as one geometry for the section's collider (world.js placeTrees).
// No caps: the walker meets only the side, and the page's downward rays (people.js grounding through player.bvh, the
// walk tests' start) pass through, so a figure by a tree on a higher bank is never stood on a cap.
// The cards draw the same painted bole, so it holds with ?trees=cards too. Only boles wider than any builder cylinder
// (0.21-0.42 m) get one (MIN_R): a thinner trunk keeps the builder's, within a hand's width of what is drawn. The
// shrubs (leafy, whip clumps, the hedge: leaves to the ground, no bole) keep theirs too.
let trunkReg = null;
export async function trunkColliders(trees, base = 'assets/trees3d/') {
  trunkReg ||= fetch(`${base}trees3d.json`).then((r) => (r.ok ? r.json() : { variants: {} })).catch(() => ({ variants: {} }));
  const reg = await trunkReg, m = new THREE.Matrix4(), c = new THREE.Vector3(), pos = [], idx = [];
  const SEGS = 10, LO = -0.6, HI = 2.6, MIN_R = 0.45, SHRUBS = new Set(['leafy', 'whip_clump', 'hedge']);
  for (const t of trees) {
    const v = reg.variants?.[t.card], k = v?.trunk;
    if (!k || !(k.r * t.s > MIN_R) || SHRUBS.has(v.form)) continue;
    c.set(k.x, 0, k.z).applyMatrix4(treeMatrix(t, m)); // the bole's centre on the ground
    const r = k.r * t.s, v0 = pos.length / 3;
    for (let i = 0; i < SEGS; i++) {
      const a = (i / SEGS) * Math.PI * 2, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
      pos.push(x, t.y + LO, z, x, t.y + HI, z);
    }
    for (let i = 0; i < SEGS; i++) {
      const a = v0 + i * 2, b = v0 + ((i + 1) % SEGS) * 2;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  if (!idx.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

export class Trees3D {
  // scene: the batch is its own top-level object there (static in the shadow layers: world.js shadowLayers);
  // texture(url) -> Promise<Texture> (world.js texCache.image: the KTX2 copy when there is one); release(url);
  // shade(mesh, std, on): the page's shading (world.js materialFor; the variant takes std.userData.qmPatch), else the
  // material is patched as made; onChange(): the static shadow layer is due (a batch was rebuilt);
  // loader: a GLTFLoader (else one is made). Files are asked for by their plain asset paths: a built page's fetch
  // wrapper maps them to their hashed names (three's loaders and fetch alike)
  constructor({ scene, loader, texture, release, shade, onChange, base = 'assets/trees3d/' } = {}) {
    this.on = TREES3D_ON;
    if (!this.on) { // inert: the cards as before
      this.unregister = register('trees', { applyTier() {}, stats: () => ({ draws: 0, triangles: 0, instances: 0, cpuMs: 0, off: true }) });
      return;
    }
    this.scene = scene;
    this.loader = loader || new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    this.texture = texture || ((url) => new THREE.TextureLoader().loadAsync(url));
    this.release = release || (() => {});
    this.shade = shade || null;
    this.onChange = onChange || (() => {});
    this.root = new THREE.Group();
    this.root.name = 'trees3d';
    scene?.add(this.root);
    this.reg = new THREE.FileLoader().setResponseType('json').loadAsync(`${base}trees3d.json`).catch(() => ({ variants: {} }));
    this.reg.then((r) => { this.regData = r; this.cardsCast(); });
    this.regData = null;
    this.geos = new Map(); // card -> Promise<{ geo, extras } | null>
    this.secs = new Map(); // section -> { trees: [{ card, x, y, z, s, flip }], river }
    this.cardHas = new Map(); // card name -> the uniform { value: 0 | 1 } its material's fade reads
    this.cardMeshes = new Map(); // card InstancedMesh -> card name
    this.small = new Set(); // cards that stay at 256 px (keepsSmall)
    this.cfg = { meshNear: 45, meshNearRiver: 45, clumpDensity: 1, strands: 1, windFar: 30 };
    this.scale = 1;
    this.batch = null;
    this.near = new Uint8Array(0);
    this.trees = []; // in batch order
    this.lastChoose = -1e9;
    this.cpu = 0;
    this.std = new THREE.MeshStandardMaterial({ name: 'trees3d', vertexColors: true, side: THREE.DoubleSide, alphaTest: 0.5 });
    this.std.userData.qmPatch = (m) => this.patchVariant(m);
    this.depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaTest: 0.5, side: THREE.DoubleSide });
    this.depth.onBeforeCompile = treePatchDepth; // the shadow caster at rest: the clumps' alpha, no wind, no fade
    this.atlas = null;
    this.atlasP = null;
    this.rebuilding = null;
    this.again = false;
    this.unregister = register('trees', this); // detail.js: applyTier now and on every tier or scale change
  }

  // a shading variant of the tree material (toon, lambert, pbr): our patch, vertex colours, alpha
  patchVariant(m) {
    m.vertexColors = true;
    m.side = THREE.DoubleSide;
    m.alphaTest = 0.5;
    m.map = this.std.map;
    return chain(m, treePatch, 'trees3d');
  }
  // world.js cardKind: the patch a card's material (every shading variant of it) takes for the cross-fade
  cardPatch(name) {
    if (!this.on) return (m) => m;
    // 1 only while a batch holds this card's 3D tree (build): until then, and on a tier without it, the card shows
    if (!this.cardHas.has(name)) this.cardHas.set(name, { value: this.vs?.has(name) ? 1 : 0 });
    const has = this.cardHas.get(name);
    return (m) => chain(m, (sh) => cardShader(sh, has), 'qm-card3d');
  }
  // world.js buildCardMesh / dropCardMesh: a card's instanced mesh comes and goes; it casts shadows only where its
  // trees have no 3D tree casting for them (see cardsCast)
  card(mesh, name) { if (!this.on) return; this.cardMeshes.set(mesh, name); this.cardsCast(); }
  uncard(mesh) { if (!this.on) return; this.cardMeshes.delete(mesh); }
  cardsCast() {
    // the cards kept small: every tree on them is 3D within 40 m or more (read by the page's idle loop: a Set, no work)
    this.small.clear();
    const names = new Set([...this.secs.values()].flatMap((s) => s.trees.map((t) => t.card)));
    for (const name of names) if (this.regData?.variants?.[name] && [...this.secs.values()].every((s) => !s.trees.some((t) => t.card === name) || this.nearOf(s) >= 40)) this.small.add(name);
    for (const [mesh, name] of this.cardMeshes) {
      const has = !!(this.batch && this.vs?.has(name));
      // every tree of this card is in 3D (in a section the tier gives 3D trees): the 3D tree casts, at rest, in the
      // static layer; else the card casts as before (a card shared by a river section on the light tier: both may cast)
      const all = has && [...this.secs.values()].every((s) => !s.trees.some((t) => t.card === name) || this.nearOf(s) > 0);
      mesh.castShadow = !all;
    }
  }
  // world.js sharpenCards: a card whose trees are 3D within at least 40 m only ever shows beyond it, where its 256 px
  // copy is sharp enough; it is never swapped for the full card (the GPU MB by the rivers)
  keepsSmall(name) { if (!this.on) return false; return this.small.has(name); }
  nearOf(s) { return s.river ? LOD.qmTreeLod.value.y : LOD.qmTreeLod.value.x; }

  // ------------------------------------------------------------ data
  async variant(card) {
    if (!this.geos.has(card)) {
      this.geos.set(card, (async () => {
        const reg = await this.reg, v = reg.variants?.[card];
        if (!v) return null;
        const gltf = await this.loader.loadAsync(v.file);
        let mesh = null;
        gltf.scene.traverse((o) => { if (o.isMesh && !mesh) mesh = o; });
        // the GLB is meshopt-compressed with quantized attributes (tools/trees3d.mjs): back to plain floats, the node's
        // dequantising transform baked into the positions (the batch takes bare geometry)
        mesh.updateWorldMatrix(true, false);
        const src = mesh.geometry, geo = new THREE.BufferGeometry();
        for (const [name, a] of Object.entries(src.attributes)) geo.setAttribute(name, new THREE.BufferAttribute(floats(a), a.itemSize));
        geo.setIndex(new THREE.BufferAttribute(Uint32Array.from(src.index.array), 1));
        geo.attributes.position.applyMatrix4(mesh.matrixWorld);
        geo.attributes.normal?.applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld));
        geo.attributes.normal?.normalize?.();
        src.dispose();
        geo.setAttribute('qmWind', geo.getAttribute('_qmwind'));
        geo.setAttribute('qmBend', geo.getAttribute('_qmbend'));
        geo.deleteAttribute('_qmwind');
        geo.deleteAttribute('_qmbend');
        return { geo, extras: mesh.userData };
      })().catch((e) => { console.warn(`trees3d ${card}: ${e.message || e}`); return null; }));
    }
    return this.geos.get(card);
  }
  async ensureAtlas() {
    if (!this.atlasP) this.atlasP = (async () => {
      const reg = await this.reg;
      const t = await this.texture(reg.atlas);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      this.atlasUrl = reg.atlas;
      this.atlas = t;
      if (reg.bark) {
        const b = await this.texture(reg.bark);
        b.colorSpace = THREE.SRGBColorSpace;
        b.anisotropy = 4;
        this.barkUrl = reg.bark;
        this.bark = b;
        BARK.qmBark.value = b;
      }
      this.std.map = t;
      this.depth.map = t;
      if (this.batch?.material) { this.batch.material.map = t; this.batch.material.needsUpdate = true; }
      return t;
    })().catch((e) => { console.warn(`trees3d atlas: ${e.message || e}`); this.atlasP = null; return null; });
    return this.atlasP;
  }

  // world.js placeTrees: a section's trees (the list the cards get: card, x, y, z, s, flip); removeTrees: it goes
  place(sec, trees) {
    if (!this.on) return Promise.resolve();
    this.secs.set(sec, { trees: trees.map(({ card, x, y, z, s, flip }) => ({ card, x, y, z, s, flip, sec })), river: RIVER_SECTIONS.has(sec) });
    this.riverRange();
    this.cardsCast();
    return this.rebuild();
  }
  remove(sec) {
    if (!this.on) return;
    if (!this.secs.delete(sec)) return;
    this.riverRange();
    this.cardsCast();
    this.rebuild();
  }
  // the river sections' x span, from their trees (the sections lie side by side along x): meshNearRiver in the shaders
  riverRange() {
    let x0 = 1e9, x1 = -1e9;
    for (const s of this.secs.values()) if (s.river) for (const t of s.trees) { x0 = Math.min(x0, t.x - 1); x1 = Math.max(x1, t.x + 1); }
    const L = LOD.qmTreeLod.value;
    L.z = x0; L.w = x1;
  }

  // ------------------------------------------------------------ the batch: every 3D tree of the sections the tier gives 3D
  rebuild() {
    if (this.rebuilding) { this.again = true; return this.rebuilding; }
    this.rebuilding = (async () => {
      do {
        this.again = false;
        await this.reg;
        const all = [...this.secs.values()].filter((s) => this.nearOf(s) > 0).flatMap((s) => s.trees.map((t) => ({ ...t, river: s.river })));
        const cards = [...new Set(all.map((t) => t.card))].filter((c) => this.regData?.variants?.[c]);
        if (cards.length) await this.ensureAtlas();
        const vs = new Map();
        for (const c of cards) { const v = await this.variant(c); if (v) vs.set(c, v); }
        if (this.again) continue;
        this.build(all.filter((t) => vs.has(t.card)), vs);
      } while (this.again);
      this.rebuilding = null;
    })().catch((e) => { console.warn(`trees3d: ${e.message || e}`); this.rebuilding = null; });
    return this.rebuilding;
  }
  build(trees, vs) {
    this.dropBatch();
    this.trees = trees;
    for (const [name, u] of this.cardHas) u.value = vs.has(name) && trees.length ? 1 : 0; // the cards hand over only to a drawn tree
    if (!trees.length) { this.vs = new Map(); this.cardsCast(); this.onChange(); return; }
    let nv = 0, ni = 0;
    for (const v of vs.values()) { nv += v.geo.attributes.position.count; ni += v.geo.index.count; }
    const b = new TreeBatch(this, trees.length, nv, ni, this.std);
    b.name = 'trees3d';
    b.sortObjects = false; // the boats' lesson (perf batch 1): no per-pass sort; per-instance culling stays
    b.castShadow = true;
    b.receiveShadow = true;
    b.customDepthMaterial = this.depth;
    this.gid = new Map();
    for (const [c, v] of vs) this.gid.set(c, b.addGeometry(v.geo));
    this.vs = vs;
    const m = new THREE.Matrix4();
    for (const t of trees) {
      const id = b.addInstance(this.gid.get(t.card));
      b.setMatrixAt(id, treeMatrix(t, m));
    }
    this.near = new Uint8Array(trees.length);
    this.batch = b;
    this.applyDensity();
    if (this.shade) this.shade(b, this.std, true); else b.material = this.patchVariant(this.std.clone());
    this.root.add(b);
    this.lastChoose = -1e9;
    this.cardsCast();
    this.onChange();
  }
  dropBatch() {
    if (!this.batch) return;
    this.root.remove(this.batch);
    if (this.shade) this.shade(this.batch, this.std, false);
    this.batch.dispose();
    this.batch = null;
  }
  // clumpDensity: each geometry draws a prefix of its crown (its clumps are stored most important first)
  applyDensity() {
    const b = this.batch;
    if (!b) return;
    const d = Math.max(0.15, Math.min(1, this.cfg.clumpDensity * this.scale));
    // a crown of hanging whips takes the tier's `strands` share (never under 0.3: the painted tree's whips stay)
    const ds = Math.max(0.3, Math.min(1, (this.cfg.strands ?? 1) * this.scale));
    for (const [c, v] of this.vs) {
      const { trunkIndex, levels, strands } = v.extras;
      const info = b._geometryInfo[this.gid.get(c)];
      const k = levels.length * (strands ? ds : d);
      info.count = levels.length ? levels[Math.max(1, Math.round(k)) - 1] : trunkIndex;
    }
  }

  // which trees the colour pass draws: within their reach (+ the band, + a margin), 4 times a second
  choose(camera) {
    const now = performance.now();
    if (now - this.lastChoose < 250) return;
    const t0 = now;
    this.lastChoose = now;
    const cx = camera.position.x, cz = camera.position.z, L = LOD.qmTreeLod.value;
    for (let i = 0; i < this.trees.length; i++) {
      const t = this.trees[i], r = (t.river ? L.y : L.x) + BAND + 2;
      this.near[i] = (t.x - cx) ** 2 + (t.z - cz) ** 2 < r * r ? 1 : 0;
    }
    this.cpu = this.cpu * 0.9 + (performance.now() - t0) * 0.1;
  }

  // ------------------------------------------------------------ the tier (detail.js; tiers.js detail.trees)
  applyTier(cfg) {
    if (!this.on) return;
    const before = [...this.secs.values()].map((s) => this.nearOf(s) > 0).join();
    this.cfg = { ...this.cfg, ...(cfg?.detail?.trees || {}) };
    this.scale = cfg?.detailScale ?? 1;
    const L = LOD.qmTreeLod.value;
    // detailScale shortens the reach too (fewer trees in 3D), never under 15 m where the tier has any
    const reach = (m) => (m > 0 ? Math.max(15, m * (0.5 + 0.5 * this.scale)) : 0);
    L.x = reach(this.cfg.meshNear);
    L.y = reach(this.cfg.meshNearRiver);
    LOD.qmWindFar.value = this.cfg.windFar;
    this.applyDensity();
    this.lastChoose = -1e9;
    this.cardsCast();
    // a card's shadow may have switched to its 3D tree's or back: the cached world layer is redrawn (world.js
    // shadowState.dirty), whether or not the batch is rebuilt
    if ([...this.secs.values()].map((s) => this.nearOf(s) > 0).join() !== before) this.rebuild(); else this.onChange();
  }

  stats() {
    if (!this.on) return { draws: 0, triangles: 0, instances: 0, cpuMs: 0, off: true };
    const b = this.batch;
    let tris = 0, inst = 0;
    if (b) for (let i = 0; i < this.trees.length; i++) if (this.near[i]) { inst++; tris += b._geometryInfo[this.gid.get(this.trees[i].card)].count / 3; }
    let geoMB = 0;
    if (b) for (const a of Object.values(b.geometry.attributes)) geoMB += a.array.byteLength / 2 ** 20;
    if (b?.geometry.index) geoMB += b.geometry.index.array.byteLength / 2 ** 20;
    const mb = (t) => { const im = t?.image, px = im ? (im.width || 0) * (im.height || 0) : 0; return px ? (px * (t.isCompressedTexture ? 1 : 4) * 1.33) / 2 ** 20 : 0; };
    const texMB = mb(this.atlas) + mb(this.bark);
    return { draws: b && inst ? 1 : 0, triangles: Math.round(tris), instances: inst, trees: this.trees.length, textureMB: +texMB.toFixed(2), geometryMB: +geoMB.toFixed(2),
      cpuMs: +this.cpu.toFixed(3), near: LOD.qmTreeLod.value.x, nearRiver: LOD.qmTreeLod.value.y, density: +(this.cfg.clumpDensity * this.scale).toFixed(2), windFar: this.cfg.windFar };
  }
}

// the depth material's patch: the clumps' alpha from the atlas (three's depth shader samples the map for alpha); the
// wood is opaque whatever its texel, so the trunk's shadow never thins with the atlas's mips
function treePatchDepth(shader) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nattribute vec4 qmWind;\nvarying float vQmClump;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvQmClump = qmWind.w >= 0.0 ? 1.0 : 0.0;');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying float vQmClump;')
    .replace('#include <map_fragment>', '#ifdef USE_MAP\nif (vQmClump > 0.5) diffuseColor *= texture2D(map, vMapUv);\n#endif');
}
