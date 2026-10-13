// Surface shading for the world's painted materials: no swatch may read as copy-pasted tiles.
//  - 'wash'  : texture bombing (Inigo Quilez's "texture repetition" #3: two lookups at offsets chosen by a smooth
//              noise, blended) plus a broad world-space tone wash. For structure-free washes (earth, stone, plaster).
//  - 'blend' : the ground. The map holds two halves, ground | road; the mesh's second UV (uv1.x) says how bare a
//              vertex is (road, moat banks, the passage front: blender/gate_scene.py ground()). The two are
//              blended along a noisy edge with a faint darker bleed, like a wash drying, then bombed and toned.
//  - 'washU' : as 'wash', shifted along u only, for washes with level bands (rammed-earth layers).
//  - 'patch' : the map holds two halves, a structured painting | its plain wash (brick | brick wash); world-space
//              noise patches choose between them along a soft edge that dries darker, like render worn off in
//              places, so the structured half never shows as one repeating sheet. Its grid stays aligned.
//  - 'tone'  : the tone wash only, for swatches whose structure must stay aligned (brick, tiles, timber, atlases).
// patchSurface(material, kind) works on Lambert, Toon and Basic materials (they share map_fragment).
//  - 'current', 'ring': the water and the wet ring round each hull (water.js).
import { patchWater } from './water.js';

const common = /* glsl */ `
varying vec3 vQmWorld;
float qmHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float qmNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(qmHash(i), qmHash(i + vec2(1, 0)), u.x), mix(qmHash(i + vec2(0, 1)), qmHash(i + vec2(1, 1)), u.x), u.y);
}
// one tile of the sub-rectangle [lo, lo + sz] of the texture, sampled at two noise-chosen offsets
// alongU: shift only along u, so horizontal painted features (rammed-earth layers) stay level
vec4 qmNoTile(sampler2D t, vec2 uv, vec2 lo, vec2 sz, float alongU) {
  vec2 dx = dFdx(uv) * sz, dy = dFdy(uv) * sz;
  float l = qmNoise(uv * 0.7) * 8.0;
  float ia = floor(l), f = fract(l);
  vec2 keep = vec2(1.0, 1.0 - alongU);
  vec2 oa = sin(vec2(3.0, 7.0) * ia) * keep, ob = sin(vec2(3.0, 7.0) * (ia + 1.0)) * keep;
  vec4 a = textureGrad(t, lo + fract(uv + oa) * sz, dx, dy);
  vec4 b = textureGrad(t, lo + fract(uv + ob) * sz, dx, dy);
  return mix(a, b, smoothstep(0.2, 0.8, f - 0.1 * dot(a.rgb - b.rgb, vec3(1.0))));
}
// broad tone: a few percent lighter/darker and warmer/cooler over metres, so no two stretches match
vec3 qmTone(vec3 w) {
  vec2 p = vec2(w.x + 0.7 * w.y, w.z - 0.5 * w.y);
  float a = (qmNoise(p * 0.11) - 0.5) * 0.24 + (qmNoise(p * 0.47 + 13.0) - 0.5) * 0.1;
  float h = qmNoise(p * 0.07 + 41.0) - 0.5;
  return vec3(1.0 + a) * vec3(1.0 + h * 0.08, 1.0, 1.0 - h * 0.1);
}
`;

const fragments = {
  wash: /* glsl */ `
#ifdef USE_MAP
  vec4 qmC = qmNoTile(map, vMapUv, vec2(0.0), vec2(1.0), 0.0);
  diffuseColor *= qmC;
#endif
  diffuseColor.rgb *= qmTone(vQmWorld);`,
  blend: /* glsl */ `
#ifdef USE_MAP
  float qmN = qmNoise(vQmWorld.xz * 0.9) * 0.6 + qmNoise(vQmWorld.xz * 3.1) * 0.4;
  float qmW = smoothstep(0.4, 0.6, vQmBlend + (qmN - 0.5) * 0.6);
  vec4 qmG = qmNoTile(map, vMapUv, vec2(0.0), vec2(0.5, 1.0), 0.0);
  vec4 qmR = qmNoTile(map, vMapUv, vec2(0.5, 0.0), vec2(0.5, 1.0), 0.0);
  vec4 qmC = mix(qmG, qmR, qmW);
  qmC.rgb *= 1.0 - 0.1 * (1.0 - abs(qmW * 2.0 - 1.0)); // the wash's edge dries darker
  diffuseColor *= qmC;
#endif
  diffuseColor.rgb *= qmTone(vQmWorld);`,
  washU: /* glsl */ `
#ifdef USE_MAP
  diffuseColor *= qmNoTile(map, vMapUv, vec2(0.0), vec2(1.0), 1.0);
#endif
  diffuseColor.rgb *= qmTone(vQmWorld);`,
  patch: /* glsl */ `
#ifdef USE_MAP
  vec2 qmP = vec2(vQmWorld.x + vQmWorld.z, vQmWorld.y);
  float qmN = qmNoise(qmP * 0.3) * 0.55 + qmNoise(qmP * 1.2 + 7.0) * 0.3 + qmNoise(qmP * 4.5 + 3.0) * 0.15;
  float qmW = smoothstep(0.37, 0.39, qmN); // mostly brick; a narrow, ragged edge reads as chipped render
  vec2 qmSz = vec2(0.5, 1.0);
  vec4 qmS = textureGrad(map, fract(vMapUv) * qmSz, dFdx(vMapUv) * qmSz, dFdy(vMapUv) * qmSz);
  vec4 qmB = qmNoTile(map, vMapUv, vec2(0.5, 0.0), qmSz, 0.0);
  vec4 qmC = mix(qmB, qmS, qmW);
  qmC.rgb *= 1.0 - 0.2 * (1.0 - abs(qmW * 2.0 - 1.0)); // a darker edge where the render has worn away
  diffuseColor *= qmC;
#endif
  diffuseColor.rgb *= qmTone(vQmWorld);`,
  tone: /* glsl */ `
#include <map_fragment>
  diffuseColor.rgb *= qmTone(vQmWorld);`,
};

export function patchSurface(material, kind) {
  if (kind === 'current' || kind === 'ring') return patchWater(material, kind);
  if (!kind || !fragments[kind]) return material;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
varying vec3 vQmWorld;
${kind === 'blend' ? '#ifndef USE_UV1\nattribute vec2 uv1;\n#endif\nvarying float vQmBlend;' : ''}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vQmWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
${kind === 'blend' ? 'vQmBlend = uv1.x;' : ''}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
${common}
${kind === 'blend' ? 'varying float vQmBlend;' : ''}`)
      .replace('#include <map_fragment>', fragments[kind]);
  };
  material.customProgramCacheKey = () => `qm-surface-${kind}`;
  return material;
}

// which kind each world material gets (by its glTF material name)
export const SURFACE_KINDS = {
  ground: 'blend',
  rammed: 'washU', stone: 'wash', plaster: 'wash', earth: 'wash',
  water: 'current', water_ring: 'ring',
  brick: 'patch', roof: 'tone', timber: 'tone', redwood: 'tone', deck: 'tone', stone_face: 'tone', reed: 'tone',
};

