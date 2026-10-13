// Ink-on-silk post-processing: scene colour + depth (one multisampled pass), view normals (second pass),
// then one full-screen shader: ink edges from inverse-depth Laplacian and normal Sobel, the mist outside the
// painted area, colour grade, silk grain, stains and vignette.
// Mist (map/BUILDING.md; web/src/backdrop.js sets it up): each pixel's world position is rebuilt from depth; the
// further it lies outside the walkable area, the more it turns to mist, ink and all, like the scroll's blank silk.
// The walkable area is the sections' painted area (up to four edge lines) plus boxes past the silk's top and bottom
// edges where recorded moves and edge walls carry it further (a far bank moved north, boats moored past the edge).
// The sky and the backdrop ring (an ellipse round the centre) are left alone.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

// the most boxes of walkable area past the painted edges the mist takes (backdrop.js fills them, largest first)
export const MIST_BOXES = 24;

const fragmentShader = /* glsl */ `
uniform sampler2D tColor, tDepth, tNormal;
uniform vec2 resolution;
uniform float cameraNear, cameraFar;
uniform vec3 inkColor;
uniform float inkOn, thickness, depthSens, normalSens, threshold, strength, fadeStart, fadeEnd;
uniform float grain, stains, vignette, exposure, saturation, warmth;
uniform float mistOn, mistStart, mistFull;
uniform vec2 mistRingAB; // the backdrop ring's semi-axes (an ellipse round the painted area; a circle for one section)
uniform vec3 mistEdges[4];
uniform vec4 mistBoxes[MIST_BOXES]; // x0, x1, z0, z1 in world x and z: the walkable area past the painted one
uniform int mistBoxN;
uniform vec2 mistCentre;
uniform vec3 mistColor;
uniform mat4 projInv, camWorld;
varying vec2 vUv;

float viewZ(vec2 uv) {
  float z = texture2D(tDepth, uv).x * 2.0 - 1.0;
  return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
}
vec3 nrm(vec2 uv) { return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

float mistAt(vec2 uv, float vz) {
  vec4 f = projInv * vec4(uv * 2.0 - 1.0, 1.0, 1.0);
  vec3 dir = f.xyz / f.w;
  vec3 w = (camWorld * vec4(dir / -dir.z * vz, 1.0)).xyz;
  float o = -1e9;
  for (int i = 0; i < 4; i++) o = max(o, dot(mistEdges[i].xy, w.xz) + mistEdges[i].z);
  for (int i = 0; i < MIST_BOXES; i++) {
    if (i >= mistBoxN) break;
    vec4 b = mistBoxes[i];
    o = min(o, max(max(b.x - w.x, w.x - b.y), max(b.z - w.z, w.z - b.w)));
  }
  // like real mist it thins near the viewer, so you always see yourself and the ground at your feet
  float near = smoothstep(3.0, 14.0, length(w - camWorld[3].xyz));
  float ring = length((w.xz - mistCentre) / mistRingAB); // 1 on the ring
  return smoothstep(mistStart, mistFull, o) * near * (1.0 - smoothstep(1.0 - 8.0 / mistRingAB.y, 1.0 - 2.0 / mistRingAB.y, ring));
}

void main() {
  vec3 col = texture2D(tColor, vUv).rgb;
  float dc = viewZ(vUv);
  float mist = mistOn > 0.5 ? mistAt(vUv, dc) : 0.0;
  col = mix(col, mistColor, mist);
  float edge = 0.0;
  if (inkOn > 0.5) {
    vec2 px = thickness / resolution;
    float lap = 0.0;
    vec3 gx = vec3(0.0), gy = vec3(0.0);
    float ic = 1.0 / dc;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        if (x == 0 && y == 0) continue;
        vec2 uv = vUv + vec2(float(x), float(y)) * px;
        lap += 1.0 / viewZ(uv) - ic;
        vec3 n = nrm(uv);
        float wx = float(x) * (y == 0 ? 2.0 : 1.0);
        float wy = float(y) * (x == 0 ? 2.0 : 1.0);
        gx += n * wx;
        gy += n * wy;
      }
    }
    // inverse depth is linear across flat surfaces, so its Laplacian only fires at creases and silhouettes
    float de = abs(lap) / ic * depthSens * 0.5;
    float ne = sqrt(dot(gx, gx) + dot(gy, gy)) * normalSens * 0.25;
    edge = smoothstep(threshold, threshold * 1.6 + 0.05, max(de, ne));
    edge *= mix(1.0, smoothstep(0.2, 0.65, noise(vUv * resolution / 6.0)), 0.3); // hand-drawn break-up
    edge *= (1.0 - smoothstep(fadeStart, fadeEnd, dc)) * strength * (1.0 - mist);
  }
  col *= exposure;
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, saturation);
  col *= vec3(1.0 + warmth * 0.08, 1.0 + warmth * 0.01, 1.0 - warmth * 0.1);
  col = mix(col, min(inkColor, col * 0.35), edge); // ink is never lighter than the surface under it (night)
  vec4 o = linearToOutputTexel(vec4(col, 1.0));
  float g = (hash(floor(vUv * resolution)) - 0.5) * grain;
  float st = (noise(vUv * vec2(3.0, 2.0)) - 0.5) * stains + (noise(vUv * vec2(17.0, 11.0)) - 0.5) * stains * 0.5;
  o.rgb += g + st * vec3(0.9, 0.78, 0.55);
  vec2 q = vUv - 0.5;
  o.rgb *= 1.0 - vignette * dot(q, q) * 1.6;
  gl_FragColor = o;
}`;

export class InkPost {
  constructor(renderer) {
    this.renderer = renderer;
    this.normalMat = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: null }, tDepth: { value: null }, tNormal: { value: null },
        resolution: { value: new THREE.Vector2() }, cameraNear: { value: 0.1 }, cameraFar: { value: 300 },
        inkColor: { value: new THREE.Color() }, inkOn: { value: 1 }, thickness: { value: 1 },
        depthSens: { value: 1 }, normalSens: { value: 1 }, threshold: { value: 0.3 }, strength: { value: 0.85 },
        fadeStart: { value: 20 }, fadeEnd: { value: 70 },
        grain: { value: 0 }, stains: { value: 0 }, vignette: { value: 0 },
        exposure: { value: 1 }, saturation: { value: 1 }, warmth: { value: 0 },
        mistOn: { value: 0 }, mistStart: { value: 0.6 }, mistFull: { value: 9 }, mistRingAB: { value: new THREE.Vector2(1e6, 1e6) },
        mistEdges: { value: [0, 1, 2, 3].map(() => new THREE.Vector3()) }, mistCentre: { value: new THREE.Vector2() },
        mistBoxes: { value: Array.from({ length: MIST_BOXES }, () => new THREE.Vector4()) }, mistBoxN: { value: 0 },
        mistColor: { value: new THREE.Color() }, projInv: { value: new THREE.Matrix4() }, camWorld: { value: new THREE.Matrix4() },
      },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader,
      defines: { MIST_BOXES },
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.material);
    this.setSize(1, 1);
  }

  setSize(w, h) {
    this.rtColor?.dispose(); this.rtNormal?.dispose();
    const depthTexture = new THREE.DepthTexture(w, h);
    this.rtColor = new THREE.WebGLRenderTarget(w, h, { samples: 4, type: THREE.HalfFloatType, depthTexture });
    this.rtNormal = new THREE.WebGLRenderTarget(w, h);
    const u = this.material.uniforms;
    u.tColor.value = this.rtColor.texture;
    u.tDepth.value = depthTexture;
    u.tNormal.value = this.rtNormal.texture;
    u.resolution.value.set(w, h);
  }

  // overlay: { object, begin(), end() } drawn into the normal buffer after the scene with its own materials (the
  // batched crowd, whose skinning the scene-wide override material can't do; crowd.js normalPass)
  render(scene, camera, s, hideInNormalPass = [], hideToo = [], overlay = null) {
    const r = this.renderer;
    r.shadowMap.needsUpdate = true; // shadow map updates once per frame, not once per pass
    r.setRenderTarget(this.rtColor);
    r.clear();
    r.render(scene, camera);

    if (s.ink) {
      const bg = scene.background, fog = scene.fog;
      const clear = r.getClearColor(new THREE.Color()), alpha = r.getClearAlpha();
      scene.background = null; scene.fog = null; scene.overrideMaterial = this.normalMat;
      for (const m of hideInNormalPass) m.visible = false;
      for (const m of hideToo) m.visible = false;
      r.setClearColor(0x8080ff, 1);
      r.setRenderTarget(this.rtNormal);
      r.clear();
      // world matrices (every bone of every person) were updated by the colour pass; don't redo them
      const auto = scene.matrixWorldAutoUpdate;
      scene.matrixWorldAutoUpdate = false;
      r.render(scene, camera);
      if (overlay) {
        scene.overrideMaterial = null;
        for (const m of hideToo) m.visible = true;
        const ac = r.autoClear;
        r.autoClear = false;
        overlay.begin();
        r.render(overlay.object, camera);
        overlay.end();
        r.autoClear = ac;
        for (const m of hideToo) m.visible = false;
      }
      scene.matrixWorldAutoUpdate = auto;
      scene.overrideMaterial = null; scene.background = bg; scene.fog = fog;
      for (const m of hideInNormalPass) m.visible = true;
      for (const m of hideToo) m.visible = true;
      r.setClearColor(clear, alpha);
    }

    const u = this.material.uniforms;
    u.cameraNear.value = camera.near; u.cameraFar.value = camera.far;
    u.inkColor.value.set(s.inkColor);
    u.inkOn.value = s.ink ? 1 : 0;
    u.thickness.value = s.inkThickness; u.depthSens.value = s.inkDepth; u.normalSens.value = s.inkNormal;
    u.threshold.value = s.inkThreshold; u.strength.value = s.inkStrength;
    u.fadeStart.value = s.inkFadeStart; u.fadeEnd.value = s.inkFadeEnd;
    u.grain.value = s.grain; u.stains.value = s.stains; u.vignette.value = s.vignette;
    u.exposure.value = s.exposure; u.saturation.value = s.saturation; u.warmth.value = s.warmth;
    u.projInv.value.copy(camera.projectionMatrixInverse); u.camWorld.value.copy(camera.matrixWorld);
    r.setRenderTarget(null);
    this.quad.render(r);
  }
}
