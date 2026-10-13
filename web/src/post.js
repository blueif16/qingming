// Ink-on-silk post-processing: one full-screen shader over the scene's colour, depth and view normals: ink edges from
// the inverse-depth Laplacian and a normal Sobel, the mist outside the painted area, colour grade, silk grain, stains
// and vignette.
// The normals (the perf batch, gen/perf/batch1/notes.md; Messenger's gInfo): every built-in mesh material writes its view
// normal into a second attachment of the colour target while it draws its colour (multiple render targets), so the
// scene is drawn once. Lit materials (Lambert, Toon, Phong, Standard) write their normal; unlit ones, and any material
// with the define QM_INK_NEUTRAL (the tree cards), write the empty normal the target is cleared to; a ShaderMaterial
// drawn in the scene must write `qmNormalOut` itself (the sky, daylight.js). Transparent ones write alpha 0 when
// neutral, so they leave the normal under them (the backdrop panels). Before: a second geometry pass drew the scene
// again with a normal material, plus the crowd's own normal draws (still there as { mrt: false }, the A/B: ?mrt=0).
// The target per device tier (tiers.js): 4x MSAA on a half-float colour (high), or no MSAA on an 8-bit sRGB colour
// with FXAA in this pass (low, mid).
// Mist (map/BUILDING.md; web/src/backdrop.js sets it up): each pixel's world position is rebuilt from depth; the
// further it lies outside the walkable area, the more it turns to mist, ink and all, like the scroll's blank silk.
// The walkable area is the sections' painted area (up to four edge lines) plus boxes past the silk's top and bottom
// edges where recorded moves and edge walls carry it further (a far bank moved north, boats moored past the edge).
// The sky (depth 1) and the backdrop ring (an ellipse round the centre) are left alone.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

// the most boxes of walkable area past the painted edges the mist takes (backdrop.js fills them, largest first)
export const MIST_BOXES = 24;

// MRT normals: every built-in mesh material (they all end in the dithering chunks) declares and writes attachment 1.
// Drawing into a target without a second attachment, the write goes nowhere.
const NEUTRAL = [0.5, 0.5, 1.0, 0.0]; // the empty normal: facing the camera, alpha 0
if (!THREE.ShaderChunk.dithering_pars_fragment.includes('qmNormalOut')) {
  THREE.ShaderChunk.dithering_pars_fragment += `
layout(location = 1) out highp vec4 qmNormalOut;`;
  THREE.ShaderChunk.dithering_fragment += `
#if defined(QM_INK_NEUTRAL) || !(defined(LAMBERT) || defined(TOON) || defined(PHONG) || defined(STANDARD))
qmNormalOut = vec4(0.5, 0.5, 1.0, 0.0);
#else
qmNormalOut = vec4(normalize(normal) * 0.5 + 0.5, 1.0);
#endif`;
}
// for a ShaderMaterial drawn in the scene: declare at the top of its fragment shader, write in main()
export const NORMAL_OUT = { declare: 'layout(location = 1) out highp vec4 qmNormalOut;', neutral: 'qmNormalOut = vec4(0.5, 0.5, 1.0, 0.0);' };

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

#if FXAA
// FXAA (the classic one, after Timothy Lottes): on low and mid tiers, in place of 4x MSAA. Luma is judged on a
// gamma-like curve (the target holds linear colour); flat areas (painted strokes, no geometric edge) are left alone.
float fxLuma(vec3 c) { return sqrt(dot(c, vec3(0.299, 0.587, 0.114))); }
vec3 fxaa(vec2 uv) {
  vec2 rp = 1.0 / resolution;
  vec3 cM = texture2D(tColor, uv).rgb;
  float lNW = fxLuma(texture2D(tColor, uv + vec2(-1.0, -1.0) * rp).rgb), lNE = fxLuma(texture2D(tColor, uv + vec2(1.0, -1.0) * rp).rgb);
  float lSW = fxLuma(texture2D(tColor, uv + vec2(-1.0, 1.0) * rp).rgb), lSE = fxLuma(texture2D(tColor, uv + vec2(1.0, 1.0) * rp).rgb);
  float lM = fxLuma(cM);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  if (lMax - lMin < max(0.0312, lMax * 0.125)) return cM;
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
  float reduce = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);
  dir = clamp(dir / (min(abs(dir.x), abs(dir.y)) + reduce), vec2(-8.0), vec2(8.0)) * rp;
  vec3 a = 0.5 * (texture2D(tColor, uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture2D(tColor, uv + dir * (2.0 / 3.0 - 0.5)).rgb);
  vec3 b = a * 0.5 + 0.25 * (texture2D(tColor, uv - dir * 0.5).rgb + texture2D(tColor, uv + dir * 0.5).rgb);
  float lB = fxLuma(b);
  return (lB < lMin || lB > lMax) ? a : b;
}
#endif

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
#if FXAA
  vec3 col = fxaa(vUv);
#else
  vec3 col = texture2D(tColor, vUv).rgb;
#endif
  float dc = viewZ(vUv);
  // never on the sky (depth 1: the dome on the far plane, and the backdrop panels over it): rebuilt from the far plane,
  // a pixel looked at upward lands just above you, inside the ring, and painted a lens of mist on the sky
  float mist = mistOn > 0.5 && texture2D(tDepth, vUv).x < 1.0 ? mistAt(vUv, dc) : 0.0;
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

const _cc = new THREE.Color();

export class InkPost {
  // opts: { mrt (normals from the colour pass; false: the separate normal pass, as before), samples (MSAA), hdr (a
  // half-float colour target; false: 8-bit sRGB), fxaa }. Pages other than the world keep the old defaults.
  constructor(renderer, opts = {}) {
    this.renderer = renderer;
    this.opts = { mrt: false, samples: 4, hdr: true, fxaa: false, ...opts };
    this.shadowUpdate = true; // the page's shadow policy may hold the shadow map (world.js); other pages redraw it every frame
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
      defines: { MIST_BOXES, FXAA: this.opts.fxaa ? 1 : 0 },
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.material);
    this.size = [1, 1];
    this.setSize(1, 1);
  }

  // a new target layout (a tier change): { mrt, samples, hdr, fxaa }
  configure(opts) {
    Object.assign(this.opts, opts);
    const fx = this.opts.fxaa ? 1 : 0;
    if (this.material.defines.FXAA !== fx) { this.material.defines.FXAA = fx; this.material.needsUpdate = true; }
    this.setSize(...this.size);
  }

  setSize(w, h) {
    this.size = [w, h];
    this.rtColor?.dispose(); this.rtNormal?.dispose();
    this.rtNormal = null;
    const { mrt, samples, hdr } = this.opts;
    const depthTexture = new THREE.DepthTexture(w, h);
    const type = hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
    if (mrt) {
      // colour and normals in one target; the normals are 8-bit, the colour half float or 8-bit sRGB (stored with the
      // sRGB curve, read back linear: the same precision where it shows, in the darks)
      this.rtColor = new THREE.WebGLRenderTarget(w, h, { count: 2, samples, type, depthTexture });
      this.rtColor.textures[1].type = THREE.UnsignedByteType;
      if (!hdr) this.rtColor.textures[0].colorSpace = THREE.SRGBColorSpace;
    } else {
      this.rtColor = new THREE.WebGLRenderTarget(w, h, { samples, type, depthTexture });
      if (!hdr) this.rtColor.texture.colorSpace = THREE.SRGBColorSpace;
      this.rtNormal = new THREE.WebGLRenderTarget(w, h);
    }
    const u = this.material.uniforms;
    u.tColor.value = this.rtColor.textures[0];
    u.tDepth.value = depthTexture;
    u.tNormal.value = mrt ? this.rtColor.textures[1] : this.rtNormal.texture;
    u.resolution.value.set(w, h);
  }

  // overlay: { object, begin(), end() } drawn into the normal buffer after the scene with its own materials (the
  // batched crowd, whose skinning the scene-wide override material can't do; crowd.js normalPass)
  render(scene, camera, s, hideInNormalPass = [], hideToo = [], overlay = null) {
    const r = this.renderer;
    if (this.shadowUpdate) r.shadowMap.needsUpdate = true; // shadow map updates once per frame at most, not once per pass
    r.setRenderTarget(this.rtColor);
    if (this.opts.mrt) {
      // the background colour as the clear (three would clear both attachments to it), and the empty normal
      const bg = scene.background?.isColor ? scene.background : null;
      if (bg) { r.getClearColor(_cc); this._ca = r.getClearAlpha(); r.setClearColor(bg, 1); scene.background = null; }
      r.clear();
      r.getContext().clearBufferfv(r.getContext().COLOR, 1, NEUTRAL);
      const ac = r.autoClear;
      r.autoClear = false;
      r.render(scene, camera);
      r.autoClear = ac;
      if (bg) { scene.background = bg; r.setClearColor(_cc, this._ca); }
    } else {
      r.clear();
      r.render(scene, camera);
    }

    if (s.ink && !this.opts.mrt) {
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
