// One wind for the whole world (the trees and ambient agents, 2026-10-13; gen/details/trees/method.md "Wind"): the 3D
// trees' trunks, limbs, shoot fans and hanging whips, the catkins and leaves in the air, banners and smoke all read the
// same few uniforms, so a gust that bends a willow also lifts its catkins. The wind lives on the GPU: the page only
// advances its clock (sync, once a frame from whoever draws first; calling it again in the same frame does nothing).
//   import { WIND, WIND_GLSL, windUniforms } from './wind.js';
//   material.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, windUniforms()); sh.vertexShader = WIND_GLSL + ... };
//   WIND.sync(); // in an onBeforeRender, or the page's tick
// GLSL it gives (world space, metres, seconds):
//   qmWindTime      the wind clock (s; performance.now based, so it stops when a look check freezes the page's time)
//   qmWindDir       the direction the air moves, unit, on the ground (x, z)
//   qmWindStrength  0 calm .. 1 a strong spring breeze (the setting; default a light breeze)
//   qmGust(xz)      0..1, the gusts at a point: broad fronts that roll across the ground along the wind (8 m/s),
//                   so neighbouring trees bend one after another, never in lockstep
//   qmWindAt(xz)    qmWindStrength * (0.55 + 0.45 * qmGust(xz)): how hard the air pushes there now
//   qmShakeAt(xz)   0..1.4, a sudden shake that runs out from a point and dies in a few seconds (the gate tower's drum,
//                   interact.js: WIND.shake(x, z, radius)); the trees' leaves shiver with it
import * as THREE from 'three';

export const WIND = {
  uniforms: {
    qmWindTime: { value: 0 },
    qmWindDir: { value: new THREE.Vector2(0.94, -0.34) }, // the spring wind: from the west, a little from the north (down the scroll)
    qmWindStrength: { value: 0.45 },
    qmShake: { value: new THREE.Vector4(0, 0, 0, -1e4) }, // x, z, radius (m), start (the wind clock's s)
  },
  _frame: -1,
  // advance the clock (idempotent within a frame: renderer.info.render.frame, or the time itself)
  sync(now = performance.now(), frame = null) {
    if (frame !== null && frame === this._frame) return;
    this._frame = frame;
    this.uniforms.qmWindTime.value = now / 1000;
  },
  // a shake from (x, z) out to radius m, starting now (the drum: the boom shivers the leaves round it)
  shake(x, z, radius = 40) { this.uniforms.qmShake.value.set(x, z, radius, this.uniforms.qmWindTime.value); },
  set({ strength, dirDeg } = {}) {
    if (strength !== undefined) this.uniforms.qmWindStrength.value = Math.max(0, Math.min(1, strength));
    if (dirDeg !== undefined) { const a = THREE.MathUtils.degToRad(dirDeg); this.uniforms.qmWindDir.value.set(Math.cos(a), Math.sin(a)); }
  },
};

// the uniforms to put into a shader (the same objects, so one sync moves every material)
export const windUniforms = () => ({ ...WIND.uniforms });

export const WIND_GLSL = /* glsl */ `
uniform float qmWindTime;
uniform vec2 qmWindDir;
uniform float qmWindStrength;
float qmWHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float qmWNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(qmWHash(i), qmWHash(i + vec2(1.0, 0.0)), u.x), mix(qmWHash(i + vec2(0.0, 1.0)), qmWHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float qmGust(vec2 xz) {
  float along = dot(xz, qmWindDir), across = dot(xz, vec2(-qmWindDir.y, qmWindDir.x));
  vec2 p = vec2(along - qmWindTime * 8.0, across * 0.6) * 0.035;
  float g = qmWNoise(p) * 0.65 + qmWNoise(p * 2.7 + 17.0) * 0.35;
  return smoothstep(0.25, 0.85, g);
}
float qmWindAt(vec2 xz) { return qmWindStrength * (0.55 + 0.45 * qmGust(xz)); }
uniform vec4 qmShake;
float qmShakeAt(vec2 xz) {
  float d = distance(xz, qmShake.xy), t = qmWindTime - qmShake.w - d / 340.0; // the boom reaches it at the speed of sound
  if (t < 0.0 || t > 4.0) return 0.0;
  return (1.0 - smoothstep(qmShake.z * 0.5, qmShake.z, d)) * exp(-t * 1.3) * (0.65 + 0.35 * sin(t * 23.0)) * 1.4;
}
`;
