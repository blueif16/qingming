// Daylight for the scene pages: the real world's light at a given hour, not the scroll's aged-silk yellow (the
// painting is yellow because its silk browned over 900 years; the town it shows was not).
//  - the sun's path for Kaifeng (34.8 N) at Qingming (early April, declination about +6 degrees): it rises in the
//    east, stands at about 61 degrees in the south at noon and sets in the west. The section frame: +X is east (the
//    scroll is read from the countryside on the right into the city on the left), D (= -z) is north, into the
//    picture, so the noon sun lights the fronts the painter shows;
//  - colours by hour (keys below, interpolated): the sun's colour and strength, the sky's zenith and horizon, the
//    fill from the sky and the ground, and the haze (fog) that distance fades into;
//  - the night (the world follows the viewer's local clock, so it is often night): a dark blue sky fill to walk by,
//    stars, and the moon at its real phase for today's date, rising and setting about 50 minutes later each day;
//    it lights the town when it is up;
//  - Sky: a dome drawn behind everything with the zenith-to-horizon gradient, a soft glow round the sun, the stars
//    and the moon (its lit side faces the sun, so the phase comes out of the geometry).
import * as THREE from 'three';

const LAT = THREE.MathUtils.degToRad(34.8), DECL = THREE.MathUtils.degToRad(6);

// direction to the sun at local solar time `hour` (world: +x east, +z south), and its elevation in degrees
export function sunDirection(hour, out = new THREE.Vector3()) {
  const H = THREE.MathUtils.degToRad(15 * (hour - 12));
  const sinEl = Math.sin(LAT) * Math.sin(DECL) + Math.cos(LAT) * Math.cos(DECL) * Math.cos(H);
  const el = Math.asin(sinEl);
  // azimuth from north, clockwise (east = 90)
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(LAT) - Math.tan(DECL) * Math.cos(LAT)) + Math.PI;
  out.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  return { dir: out, elevation: THREE.MathUtils.radToDeg(el) };
}

// [hour, sun colour, sun strength, zenith, horizon, sky fill, ground fill, fill strength]; from the last key the night
// wraps round midnight to the first
const NIGHT = ['#ff7e4c', 0.0, '#0a1126', '#1b2643', '#5a6c9e', '#262833', 1.3]; // starlight: dark sky, a blue fill to walk by
const KEYS = [
  [4.2, ...NIGHT],
  [5.0, '#ff9a6a', 0.0, '#1f2a45', '#6d6478', '#5b6788', '#2e2a28', 0.9],
  [5.9, '#ffa878', 0.6, '#3d5a8a', '#d9a58c', '#7f8fb2', '#4d443a', 0.75],
  [6.6, '#ffbf8a', 1.7, '#5a84bd', '#f0cdb0', '#9fb0cc', '#6e624f', 0.72],
  [8.0, '#ffe0bc', 2.7, '#5f92d2', '#dfe6ea', '#b1c3dc', '#857660', 0.82],
  [10.0, '#fff0dc', 3.1, '#5a92d6', '#d4e3ef', '#b9cbe3', '#8c7d66', 0.85],
  [13.0, '#fff6ea', 3.25, '#5590d8', '#d6e5f1', '#bccde5', '#8e7f68', 0.86],
  [15.5, '#ffecd2', 3.05, '#5d94d4', '#dbe4e8', '#b9c8de', '#8a7a62', 0.84],
  [17.2, '#ffcf98', 2.5, '#6890c6', '#ead7bf', '#adb8d0', '#7d6b54', 0.78],
  [18.3, '#ff9e60', 1.4, '#4f6aa2', '#f0ab80', '#9d96b6', '#5f5144', 0.68],
  [19.0, '#ff7e4c', 0.4, '#34426e', '#b97d78', '#6c6c92', '#3f3936', 0.72],
  [19.8, '#ff7e4c', 0.0, '#1c2440', '#5d5470', '#56628c', '#2b2828', 0.9],
  [20.6, ...NIGHT],
];
const cA = new THREE.Color(), cB = new THREE.Color();
const mix = (a, b, t, out) => out.copy(cA.set(a)).lerp(cB.set(b), t);

// the moon: phase 0 = new, 0.5 = full (mean synodic month from the new moon of 2000-01-06 18:14 UT)
const SYNODIC = 29.530588853, NEW_MOON_2000 = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
export const moonPhase = (date = new Date()) => ((((date.getTime() / 86400000 - NEW_MOON_2000) / SYNODIC) % 1) + 1) % 1;
const MOON_COLOR = new THREE.Color('#aebfe6');

// the light at `hour` (0-24, wraps): colours as THREE.Color (linear), strengths as numbers; the moon for `date`
export function lightAt(hour, out = {}, date = new Date()) {
  hour = ((hour % 24) + 24) % 24;
  let a, b;
  if (hour < KEYS[0][0] || hour >= KEYS[KEYS.length - 1][0]) {
    a = KEYS[KEYS.length - 1]; b = KEYS[0]; // the night, across midnight
  } else {
    let i = 1;
    while (i < KEYS.length - 1 && KEYS[i][0] < hour) i++;
    a = KEYS[i - 1]; b = KEYS[i];
  }
  const span = (b[0] - a[0] + 24) % 24, t = THREE.MathUtils.smoothstep((hour - a[0] + 24) % 24, 0, span);
  out.sunColor = mix(a[1], b[1], t, out.sunColor || new THREE.Color());
  out.sunIntensity = THREE.MathUtils.lerp(a[2], b[2], t);
  out.zenith = mix(a[3], b[3], t, out.zenith || new THREE.Color());
  out.horizon = mix(a[4], b[4], t, out.horizon || new THREE.Color());
  out.hemiSky = mix(a[5], b[5], t, out.hemiSky || new THREE.Color());
  out.hemiGround = mix(a[6], b[6], t, out.hemiGround || new THREE.Color());
  out.hemiIntensity = THREE.MathUtils.lerp(a[7], b[7], t);
  const { dir, elevation } = sunDirection(hour, out.sunDir || new THREE.Vector3());
  out.sunDir = dir;
  out.elevation = elevation;
  // the sun fades out as it sinks into the haze at the horizon
  out.sunIntensity *= THREE.MathUtils.smoothstep(elevation, -1, 6);
  // the moon trails the sun by its phase (a full moon is opposite it); its light grows with the lit fraction
  const p = moonPhase(date), lit = (1 - Math.cos(2 * Math.PI * p)) / 2;
  const m = sunDirection(hour - p * 24, out.moonDir || new THREE.Vector3());
  out.moonDir = m.dir;
  out.moonElevation = m.elevation;
  out.moonPhase = p;
  out.moonLit = lit;
  out.night = 1 - THREE.MathUtils.smoothstep(elevation, -10, -2); // stars out, moon visible
  out.moonColor = (out.moonColor || new THREE.Color()).copy(MOON_COLOR);
  out.moonIntensity = (0.12 + 0.55 * lit) * THREE.MathUtils.smoothstep(m.elevation, -1, 8) * out.night;
  return out;
}

// the sky dome: zenith-to-horizon gradient, a little haze below the horizon, and a glow round the sun
// The default sky is the ink one (gen/ui/look/sky_design.md, Sky.ink below; the user made it the default on 2026-10-12);
// ?sky=plain gives back the plain gradient dome above.
export class Sky {
  constructor(radius = 260) {
    if (Sky.INK) { this.inkInit(radius); return; }
    this.uniforms = {
      zenith: { value: new THREE.Color() }, horizon: { value: new THREE.Color() },
      sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunColor: { value: new THREE.Color() }, glow: { value: 1 },
      moonDir: { value: new THREE.Vector3(0, -1, 0) }, night: { value: 0 },
    };
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww; // on the far plane
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 zenith, horizon, sunDir, sunColor, moonDir;
        uniform float glow, night;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = max(d.y, 0.0);
          vec3 c = mix(horizon, zenith, pow(h, 0.55));
          c = mix(c, horizon * 0.92, 1.0 - smoothstep(-0.12, 0.0, d.y)); // haze below the horizon line
          float s = max(dot(d, normalize(sunDir)), 0.0);
          c += sunColor * (pow(s, 600.0) * 1.5 + pow(s, 12.0) * 0.22 + pow(s, 3.0) * 0.06) * glow;
          if (night > 0.0) {
            // stars: one in a few hundred cells of a fine grid on the sphere, round, fading into the horizon haze
            vec3 g = d * 260.0, cell = floor(g);
            float r = fract(sin(dot(cell, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
            float star = step(0.9965, r) * (1.0 - smoothstep(0.12, 0.42, length(fract(g) - 0.5))) * smoothstep(0.02, 0.25, d.y);
            c += vec3(0.75, 0.8, 0.95) * star * (0.35 + 0.65 * fract(r * 97.0)) * night;
            // the moon, drawn larger than life (1.6 degrees) so it reads; its lit side faces the sun
            vec3 md = normalize(moonDir);
            float cosA = dot(d, md), R = 0.028;
            vec3 u = (d - md * cosA) / R; // offset on the disc, 0 at the centre, 1 at the limb
            float uu = dot(u, u);
            if (cosA > 0.0 && uu < 1.0) {
              vec3 n = u - md * sqrt(1.0 - uu);
              float lit = smoothstep(-0.06, 0.06, dot(n, normalize(sunDir)));
              vec3 face = vec3(0.92, 0.9, 0.82) * (0.88 + 0.12 * sin(u.x * 9.0 + u.y * 5.0)); // faint maria
              c = mix(c, mix(c * 1.15 + vec3(0.015, 0.02, 0.035), face, lit), (1.0 - smoothstep(0.86, 1.0, uu)) * night);
            }
            c += vec3(0.55, 0.62, 0.8) * pow(max(cosA, 0.0), 900.0) * 0.18 * night; // halo
          }
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1;
  }

  set(light, camera) {
    if (this.ink) { this.inkSet(light, camera); return; }
    const u = this.uniforms;
    u.zenith.value.copy(light.zenith);
    u.horizon.value.copy(light.horizon);
    u.sunDir.value.copy(light.sunDir);
    u.sunColor.value.copy(light.sunColor);
    u.glow.value = THREE.MathUtils.smoothstep(light.elevation, -4, 2);
    u.moonDir.value.copy(light.moonDir);
    u.night.value = light.night;
    if (camera) this.mesh.position.copy(camera.position);
  }

  // ---- ?sky=ink: the sky as ink washes (prototype v4, gen/ui/look/sky_design.md). Still the hour's true colours (a
  // blue day sky, never cream paper), laid as 江南百景图 lays its skies (reference/jiangnan/jn5, jn4):
  //  - day: three broad washes from the horizon up, then long streaky strokes of thin ink wash over them (jn5's "small
  //    blocks of ink"): flat, cut hard into two tones (a stroke and where strokes overlap), their edges combed by the
  //    dry brush's hairs, dense high up, thinning lower, and none in a band of blank sky above the horizon. No contour;
  //    the strokes are a greyed, slightly darker wash of the sky under them, so a blue sky stays blue;
  //  - dawn and dusk (jn4): the strokes turn to soft, wet pink washes with pooled edges, a blush lies along the horizon
  //    on the sun's side, and the sun is a flat vermilion disc with a watercolour bloom inside it;
  //  - night: indigo bands, darker ink streaks, star specks, the moon as a flat lead-white disc with its real phase.
  // No texture is downloaded: one 256 x 256 two-channel noise tile is made in idle time after the page starts (about
  // 30 ms at a 4x CPU throttle; until then a flat tile shows the washes without strokes). 128 KB on the GPU. The dome
  // draws after the opaque world, so the depth test skips every pixel the town covers.
  static INK = new URLSearchParams(globalThis.location?.search ?? '').get('sky') !== 'plain';
  static INK_COLORS = {
    blush: new THREE.Color('#e9a9a0'), // 胭脂, thinned (jn4's washes are #f9d2c5 on paper)
    vermilion: new THREE.Color('#d9603a'), // 朱砂 to 朱膘: between jn4's sun (#f09b6a) and a deeper wallpaper sun (#bd6944)
    paleSun: new THREE.Color('#fff4e2'),
    ink: new THREE.Color('#3d4a5a'), // 淡墨 with 花青: the moon's rim
  };

  // two tileable fbm value noises: r soft and broad (stroke bodies, wash edges), g finer (dry-brush hairs, streaks)
  static inkNoise(size = 256) {
    const fbm = (periods, seed) => {
      const out = new Float32Array(size * size);
      let amp = 1;
      for (const period of periods) {
        const L = new Float32Array(period * period);
        let s = seed + period * 7919;
        for (let i = 0; i < L.length; i++) { s = (s * 16807) % 2147483647; L[i] = s / 2147483647; }
        const cell = size / period;
        for (let y = 0; y < size; y++) {
          const fy = y / cell, iy = Math.floor(fy), y0 = (iy % period) * period, y1 = ((iy + 1) % period) * period;
          let uy = fy - iy; uy = uy * uy * (3 - 2 * uy);
          for (let x = 0; x < size; x++) {
            const fx = x / cell, ix = Math.floor(fx), x0 = ix % period, x1 = (ix + 1) % period;
            let ux = fx - ix; ux = ux * ux * (3 - 2 * ux);
            out[y * size + x] += ((L[y0 + x0] * (1 - ux) + L[y0 + x1] * ux) * (1 - uy) + (L[y1 + x0] * (1 - ux) + L[y1 + x1] * ux) * uy) * amp;
          }
        }
        amp *= 0.5;
      }
      let lo = Infinity, hi = -Infinity;
      for (const v of out) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
      for (let i = 0; i < out.length; i++) out[i] = (out[i] - lo) / (hi - lo);
      return out;
    };
    const a = fbm([4, 8, 16, 32], 11), b = fbm([16, 32, 64, 128], 23), data = new Uint8Array(size * size * 2);
    for (let i = 0; i < size * size; i++) { data[2 * i] = a[i] * 255; data[2 * i + 1] = b[i] * 255; }
    return Sky.inkTexture(data, size);
  }

  static inkTexture(data, size) {
    const tex = new THREE.DataTexture(data, size, size, THREE.RGFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = size > 1 ? THREE.LinearMipmapLinearFilter : THREE.NearestFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = size > 1;
    tex.needsUpdate = true;
    return tex;
  }

  inkInit(radius) {
    this.ink = true;
    const C = () => ({ value: new THREE.Color() });
    this.uniforms = {
      zenith: C(), horizon: C(), sunColor: C(), blushCol: C(), discCol: C(), inkCol: C(), strokeTint: C(),
      sunDir: { value: new THREE.Vector3(0, 1, 0) }, moonDir: { value: new THREE.Vector3(0, -1, 0) },
      glow: { value: 1 }, night: { value: 0 }, low: { value: 0 }, time: { value: 0 }, moonLit: { value: 0 },
      cover: { value: 0.5 }, // how much of the upper sky the strokes take (0-1); they thin toward the horizon
      strokeDark: { value: 0.9 }, strokeDesat: { value: 0.5 }, strokeTintAmt: { value: 0 }, wet: { value: 0 },
      // an empty tile (no strokes) until the real one is made in idle time
      tNoise: { value: Sky.inkTexture(new Uint8Array([0, 0]), 1) },
    };
    this.uniforms.inkCol.value.copy(Sky.INK_COLORS.ink);
    const make = () => { const old = this.uniforms.tNoise.value; this.uniforms.tNoise.value = Sky.inkNoise(); old.dispose(); };
    if (globalThis.requestIdleCallback) requestIdleCallback(make, { timeout: 2000 }); else setTimeout(make, 300);
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww; // on the far plane
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 zenith, horizon, sunDir, sunColor, moonDir, blushCol, discCol, inkCol, strokeTint;
        uniform float glow, night, low, time, moonLit, cover, strokeDark, strokeDesat, strokeTintAmt, wet;
        uniform sampler2D tNoise;
        varying vec3 vDir;
        float N(vec2 p) { return texture2D(tNoise, p).r; }
        float F(vec2 p) { return texture2D(tNoise, p).g; }
        void main() {
          vec3 d = normalize(vDir);
          float h = max(d.y, 0.0), rl = length(d.xz);
          vec2 ring = rl > 1e-4 ? d.xz / rl : vec2(1.0, 0.0); // the compass direction (no atan seam)
          float t = pow(h, 0.55);
          // 1. three broad washes from the horizon up; each ends in a wavering edge with a faint tide line
          float g = t * 3.0 + (N(d.xz * 0.22 + vec2(0.37, 0.61)) - 0.5) * 0.6;
          float f = fract(g), s = smoothstep(0.8, 1.0, f);
          vec3 c = mix(horizon, zenith, mix(t, clamp((floor(g) + s) / 3.0, 0.0, 1.0), 0.7));
          c *= 1.0 - 0.04 * s * (1.0 - s) * 4.0 * smoothstep(0.0, 0.05, h);
          // 2. at a low sun, a blush wash along the horizon on the sun's side, its top edge wavering (jn4)
          float sl = length(sunDir.xz);
          float side = sl > 1e-4 ? dot(ring, sunDir.xz / sl) * 0.5 + 0.5 : 0.5;
          float bl = low * side * side * (1.0 - smoothstep(0.0, 0.6, t + (N(ring * 0.5 + 0.13) - 0.5) * 0.3));
          c = mix(c, blushCol, smoothstep(0.14, 0.2, bl) * 0.45 + bl * 0.3);
          // 3. the sun: a faint soft wash, and a flat disc with an uneven rim; when low, vermilion with a watercolour
          //    bloom inside (lighter patches, a darker pooled rim)
          vec3 sd = normalize(sunDir);
          float cs = dot(d, sd);
          c += sunColor * (pow(max(cs, 0.0), 10.0) * 0.08) * glow * (1.0 - 0.6 * low);
          vec3 su = (d - sd * cs) / 0.03;
          float sr = dot(su, su) + (N(su.xy * 0.07 + 0.5) - 0.5) * 0.25;
          vec3 disc = discCol * mix(1.0, 0.9 + 0.2 * N(su.xy * 0.3 + 0.21), low) * (1.0 - 0.12 * low * smoothstep(0.55, 0.95, sr));
          c = mix(c, disc, (1.0 - smoothstep(0.86, 1.0, sr)) * step(0.0, cs) * glow);
          if (night > 0.0) {
            // stars: specks, one in a few hundred cells of a fine grid on the sphere
            vec3 gs = d * 230.0, cell = floor(gs);
            float r = fract(sin(dot(cell, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
            float star = step(0.9968, r) * (1.0 - smoothstep(0.15, 0.4, length(fract(gs) - 0.5))) * smoothstep(0.04, 0.25, d.y);
            c += vec3(0.78, 0.8, 0.86) * star * (0.4 + 0.6 * fract(r * 97.0)) * night;
            // the moon: a flat lead-white disc (its lit side faces the sun), a thin ink rim, a pale halo wash
            vec3 md = normalize(moonDir);
            float cosA = dot(d, md), R = 0.03;
            vec3 u = (d - md * cosA) / R;
            float uu = dot(u, u);
            c = mix(c, c * 1.25 + vec3(0.02, 0.025, 0.04), smoothstep(0.9975, 0.998, cosA) * 0.5 * night); // halo
            if (cosA > 0.0 && uu < 1.1) {
              vec3 n = u - md * sqrt(max(1.0 - uu, 0.0));
              float lit = smoothstep(-0.04, 0.04, dot(n, normalize(sunDir)));
              vec3 face = mix(c * 1.1 + vec3(0.01, 0.015, 0.03), vec3(0.9, 0.9, 0.86), lit);
              c = mix(c, face, (1.0 - smoothstep(0.92, 1.0, uu)) * night);
              c = mix(c, inkCol * 0.6, (smoothstep(0.84, 0.94, uu) - smoothstep(0.98, 1.08, uu)) * 0.7 * night);
            }
          }
          // 4. the strokes (jn5): noise on the compass circle and up the elevation, so they lie long and level
          //    whichever way you look, tilted here and there by a slow wave; cut hard into two tones whose edges the
          //    brush's hairs comb (fine level streaks move the cut), wet and soft at dawn and dusk; dense high up,
          //    thinner lower, none just above the horizon; one layer turns slowly round the sky, the other re-forms them
          float e = pow(h, 0.8), ang = time * 0.0012;
          vec2 rr = vec2(ring.x * cos(ang) - ring.y * sin(ang), ring.x * sin(ang) + ring.y * cos(ang));
          float tilt = (N(rr * 0.18 + vec2(0.63, 0.29)) - 0.5) * 0.25;
          vec2 q = rr * 0.32 + vec2((e + tilt * e) * 4.2, (e + tilt * e) * 1.4);
          float dens = N(q) * 0.58 + N(q * 2.2 + vec2(0.21, 0.47) + vec2(time * 0.0004, -time * 0.0003)) * 0.42;
          float hair = F(rr * 0.5 + vec2(e * 70.0, e * 26.0)) - 0.5; // level hairlines, about 1/70 of the sky high
          float th = 1.0 - cover * (0.55 + 0.45 * smoothstep(0.15, 0.75, e)) + hair * mix(0.16, 0.05, wet);
          float w = max(fwidth(dens), 1e-4) + wet * 0.035;
          float body = smoothstep(th - w, th + w, dens), core = smoothstep(th + 0.1 - w, th + 0.1 + w, dens);
          float fade = smoothstep(0.05, 0.2, d.y) * (1.0 - smoothstep(0.8, 0.96, h));
          float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
          vec3 sc = mix(mix(c, vec3(lum) * strokeTint, strokeDesat) * strokeDark, blushCol, strokeTintAmt);
          float pool = body * (1.0 - smoothstep(th, th + 0.05, dens)) * wet; // pigment pooled at a wet edge
          sc *= 1.0 - 0.06 * pool;
          c = mix(c, sc, body * fade);
          c = mix(c, sc * mix(strokeDark, 1.0, 0.4), core * fade * (1.0 - 0.5 * wet)); // overlapping strokes
          c = mix(c, horizon * 0.92, 1.0 - smoothstep(-0.12, 0.0, d.y)); // haze below the horizon line
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1000; // after the opaque world (early depth test), before the transparent cards and panels
    this.mesh.onBeforeRender = () => { this.uniforms.time.value = performance.now() / 1000; };
  }

  inkSet(light, camera) {
    const u = this.uniforms, K = Sky.INK_COLORS, ss = THREE.MathUtils.smoothstep, lerp = THREE.MathUtils.lerp;
    u.zenith.value.copy(light.zenith);
    u.horizon.value.copy(light.horizon);
    u.sunDir.value.copy(light.sunDir);
    u.sunColor.value.copy(light.sunColor);
    u.glow.value = ss(light.elevation, -4, 2);
    u.moonDir.value.copy(light.moonDir);
    u.night.value = light.night;
    u.moonLit.value = light.moonLit;
    const el = light.elevation, low = (1 - ss(el, 4, 18)) * ss(el, -11, -3), n = light.night;
    u.low.value = low;
    // the strokes: by day a deeper, slightly greyed wash of the sky under them (積染: a second wash, 淡墨 in it); soft
    // pink washes at a low sun; at night darker ink on the indigo
    u.strokeDesat.value = lerp(lerp(0.3, 0.2, low), 0.3, n);
    u.strokeDark.value = lerp(lerp(0.88, 1.0, low), 0.78, n);
    u.strokeTint.value.setRGB(0.97, 0.985, 1.0);
    u.strokeTintAmt.value = low * 0.5 * (1 - n);
    u.wet.value = low * (1 - n);
    u.blushCol.value.copy(light.sunColor).lerp(K.blush, 0.6);
    u.discCol.value.copy(K.paleSun).lerp(K.vermilion, ss(low, 0.05, 0.6));
    if (camera) this.mesh.position.copy(camera.position);
  }
}

// "9.5" -> "09:30"
export const clock = (hour) => {
  const m = Math.floor((((hour % 24) + 24) % 24) * 60 + 1e-6);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

// the viewer's local time of day, in hours
export function localHour(date = new Date()) {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}
