// The water (map/BUILDING.md "Boats and water", gen/boats/water.md): one flat, opaque surface per river reach, lit by
// the hour like the ground, with no reflection, refraction, waves, extra pass or render target. Its only pattern is the
// scroll's own: the painted current lines (汴水悍激), one 512 px tile of ink lines for the whole world
// (assets/water/water_lines.webp, 22 KB), drifting downstream and darkening the water by at most 0.3 of its colour
// (ink is never lighter than the surface, as post.js's ink), fading out at the shores and far away (no shimmer at
// grazing angles), with a soft pale band where the water meets the bank.
//   - 'current' (material `water`): uv0 = (metres along the flow, metres across it), uv1 = (metres to the nearest
//     mapped shore, 1) on the strips kit_boats.water_strip() makes; the lines drift at 0.25 m/s (a second, sparser
//     layer at 0.15 m/s, shifted, so the tile never shows its repeat). Water without uv1 (the gate's moat quads) keeps
//     still lines in world space and no shore band.
//   - 'ring' (material `water_ring`, the kit's wet ring round each hull): a pale ribbon of disturbed water fading
//     outward (alpha 0.55 (1 - u)^1.5), blended over the water, its ripples the water's own lines in world space, so
//     a moving boat's ripples stream past it at its speed. Transparent, no depth write, no shadow.
// The tile is uploaded as one 8-bit channel (R8, mipmapped: 0.35 MB on the GPU), straight from the webp: as small as a
// KTX2 copy on a desktop (BC7, 8 bits a pixel) and exact, where block compression smears thin lines.
// surface.js hands these two kinds to patchWater (its SURFACE_KINDS: water -> current, water_ring -> ring).
import * as THREE from 'three';

const LINES_URL = 'assets/water/water_lines.webp';
export const WATER = {
  tileM: 8.0, // metres per tile along the flow
  drift: 0.25, // m/s downstream
  ink: 0.3, // how much of the water's colour the lines take away
  shoreM: 2.5, // the lines fade out over this much next to the bank
};

const blank = new THREE.DataTexture(new Uint8Array([255]), 1, 1, THREE.RedFormat);
blank.needsUpdate = true;
const uniforms = {
  qmLines: { value: blank },
  // the page's clock: read when the material uploads its uniforms (each frame), so no page has to tick it
  qmTime: { get value() { return performance.now() / 1000; } },
  qmRing: { value: new THREE.Color('#9fb7b4') }, // the water's colour (palette.js #6f8e8f), lightened: disturbed water
};

let loading = null;
function loadLines() {
  if (loading) return loading;
  loading = (async () => {
    try {
      const blob = await (await fetch(LINES_URL)).blob();
      const bmp = await createImageBitmap(blob);
      const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(bmp.width, bmp.height) : Object.assign(document.createElement('canvas'), { width: bmp.width, height: bmp.height });
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.drawImage(bmp, 0, 0);
      const px = g.getImageData(0, 0, bmp.width, bmp.height).data;
      const r = new Uint8Array(bmp.width * bmp.height);
      for (let i = 0; i < r.length; i++) r[i] = px[i * 4];
      bmp.close?.();
      const t = new THREE.DataTexture(r, cv.width, cv.height, THREE.RedFormat, THREE.UnsignedByteType);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.magFilter = THREE.LinearFilter;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = 4;
      t.unpackAlignment = 1;
      t.needsUpdate = true;
      uniforms.qmLines.value = t;
    } catch (e) { console.warn('water lines', e); }
  })();
  return loading;
}

const NOISE = /* glsl */ `
float qwHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float qwNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(qwHash(i), qwHash(i + vec2(1, 0)), u.x), mix(qwHash(i + vec2(0, 1)), qwHash(i + vec2(1, 1)), u.x), u.y);
}`;

const CURRENT = /* glsl */ `
{
  float qwF = step(0.5, vQwShore.y);                         // 1 on a strip (it carries shore data), 0 elsewhere
  vec2 qwSN = mix(vec2(vQwWorld.x, -vQwWorld.z), vQwS, qwF);
  float qwShore = mix(${WATER.shoreM.toFixed(2)}, vQwShore.x, qwF);
  float qwT = qmTime * qwF;
  float qwA = 1.0 - texture2D(qmLines, vec2(qwSN.x - qwT * ${WATER.drift.toFixed(3)}, qwSN.y) / ${WATER.tileM.toFixed(2)}).r;
  float qwB = 1.0 - texture2D(qmLines, vec2(qwSN.x - qwT * 0.15, qwSN.y + 3.0) / 12.8 + vec2(0.37, 0.61)).r;
  float qwInk = max(qwA, qwB * 0.7) * smoothstep(0.3, ${(WATER.shoreM - 0.2).toFixed(2)}, qwShore);
  qwInk *= 1.0 - smoothstep(45.0, 90.0, distance(vQwWorld, cameraPosition)); // mipmaps thin them; past 90 m none
  diffuseColor.rgb *= 1.0 - ${WATER.ink.toFixed(2)} * qwInk;
  // the soft shore line: a pale wet band along the bank
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.45 + vec3(0.03, 0.035, 0.03), 0.5 * (1.0 - smoothstep(0.0, 0.9, qwShore)) * qwF);
  // a broad tone wash, so no two stretches of water match (surface.js's qmTone, gentler)
  vec2 qwP = vec2(vQwWorld.x + 0.7 * vQwWorld.z, vQwWorld.z);
  diffuseColor.rgb *= 1.0 + (qwNoise(qwP * 0.06) - 0.5) * 0.12;
}`;

const RING = /* glsl */ `
{
  float qwU = clamp(vQwS.x, 0.0, 1.0);
  float qwA = 1.0 - texture2D(qmLines, vec2(vQwWorld.x - qmTime * ${WATER.drift.toFixed(3)}, -vQwWorld.z) / ${WATER.tileM.toFixed(2)}).r;
  diffuseColor.rgb = qmRing;
  diffuseColor.a = 0.55 * pow(1.0 - qwU, 1.5) * (0.7 + 0.3 * qwA);
}`;

// kind: 'current' | 'ring'; material: a Lambert, Toon or Basic material (they share map_fragment)
export function patchWater(material, kind) {
  loadLines();
  material.userData.water = { kind, uniforms }; // for the tools
  if (kind === 'ring') {
    material.transparent = true;
    material.depthWrite = false;
    material.polygonOffset = true;
    material.polygonOffsetFactor = -1;
    material.polygonOffsetUnits = -2;
  }
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
varying vec3 vQwWorld;
varying vec2 vQwS;
varying vec2 vQwShore;
#ifndef USE_UV1
attribute vec2 uv1;
#endif`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_BATCHING
vQwWorld = (modelMatrix * batchingMatrix * vec4(transformed, 1.0)).xyz; // the boats' rings are batched (boats.js)
#else
vQwWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
#endif
vQwS = uv;
vQwShore = uv1;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform sampler2D qmLines;
uniform float qmTime;
uniform vec3 qmRing;
varying vec3 vQwWorld;
varying vec2 vQwS;
varying vec2 vQwShore;
${NOISE}`)
      .replace('#include <map_fragment>', kind === 'ring' ? RING : CURRENT);
  };
  material.customProgramCacheKey = () => `qm-water-${kind}`;
  return material;
}

export const waterStats = () => ({ lines: uniforms.qmLines.value !== blank, px: uniforms.qmLines.value.image?.width || 0 });
