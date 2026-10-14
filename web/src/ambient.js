// Ambient life (map/BUILDING.md "Ambient life"; gen/details/ambient/plan.md): the few things a real spring day in a
// Song river town adds to the painting, limited to motion and air, each placed from the map's own things
// (ambient_sites.js) and cut by the device tier (tiers.js TIERS.<tier>.detail.ambient, through detail.js):
//   - birds: crows wheeling round the tall trees and pigeons over the roofs now and then, swallows skimming the road
//     and the water, an egret along the river, bats at dusk, cabbage whites on the countryside's hedges, and sparrows
//     hopping and pecking by grain and tables that burst up to a tree or an eave when you (or a walker) come close;
//   - things in the air: willow catkins (柳絮), elm seeds (榆钱), the bamboo's old leaves (竹秋), kitchen smoke over the
//     painted eating places and steam at a painted steamer;
//   - cloth (banners, flags, curtains, table cloths) moving in the one wind (wind.js, shared with the 3D trees).
// How it stays cheap (gen/details/tier_contract.md):
//   - one draw for every bird of the loaded window: a procedural low-poly bird (47 triangles: body, two-part wings,
//     tail; each species' shape and colours are uniform tables), MeshToonMaterial (flat, stepped, fogged, inked like
//     the world); the flight paths, flap and glide are functions of time in the vertex shader. The sparrows are the
//     only CPU agents (at most `sparrows` of them, 10 Hz): they write a segment (from, to, start, end, mode) when the
//     last one ends, and the GPU plays it;
//   - one draw for every particle: an instanced quad, procedural shapes (no texture), blended, no depth write (so
//     no ink edges), each particle's path a function of time (emitter + wind drift + sink + turbulence, a new random
//     start each cycle); it writes the empty normal (post.js MRT);
//   - cloth: a per-vertex sway weight (metres below the piece's top, thin sheets only) computed once per loaded cloth
//     mesh; the meshes draw with a patched copy of their material that reads the wind;
//   - no texture, no download, no shadow casters; per frame one chained scene.onBeforeRender (uniforms), a 4 Hz poll
//     of the loaded sections and the hour, the sparrows at 10 Hz.
// The page makes it with one line: createAmbient({ scene, camera, player, sections, people, hour }). On by default since
// the user's sign-off (2026-10-13); ?ambient=0 turns it off (then nothing is added and no material is touched).
import * as THREE from 'three';
import { register } from './detail.js';
import { WIND, windUniforms, WIND_GLSL } from './wind.js';
import { sitesOf, hashOf } from './ambient_sites.js';

// ---------------------------------------------------------------- species (real sizes in metres, real plumage)
// shapeA: body length, body width, half span, wing chord at the root; shapeB: chord at the tip, sweep of the leading
// edge at the tip, tail length, tail fork (0 square .. 1 deep fork); flight: flaps a second, flap amplitude (rad),
// share of time gliding, dihedral (rad) in a glide; colours: back and wings, belly
const SPECIES = [
  /* 0 sparrow  麻雀 */ { A: [0.13, 0.06, 0.10, 0.05], B: [0.025, 0.02, 0.055, 0.1], F: [14, 1.0, 0.2, 0.1], a: '#6b5745', b: '#bcb2a2' },
  /* 1 crow     乌鸦 */ { A: [0.36, 0.11, 0.46, 0.17], B: [0.09, 0.04, 0.16, 0.0], F: [3.4, 0.8, 0.35, 0.12], a: '#1d1d21', b: '#2a2a2f' },
  /* 2 pigeon   鸽   */ { A: [0.26, 0.09, 0.32, 0.12], B: [0.05, 0.06, 0.10, 0.0], F: [5.5, 0.9, 0.3, 0.3], a: '#7d838e', b: '#a0a6ae' },
  /* 3 swallow  家燕 */ { A: [0.11, 0.04, 0.16, 0.06], B: [0.015, 0.07, 0.08, 0.75], F: [9, 0.9, 0.45, 0.0], a: '#1c2232', b: '#e6dac6' },
  /* 4 egret    白鹭 */ { A: [0.42, 0.09, 0.47, 0.20], B: [0.12, 0.0, 0.22, 0.0], F: [2.6, 0.7, 0.1, 0.05], a: '#f1efe8', b: '#e6e4dc' },
  /* 5 bat      蝙蝠 */ { A: [0.06, 0.03, 0.14, 0.09], B: [0.04, -0.02, 0.02, 0.0], F: [11, 1.1, 0.05, 0.0], a: '#3a2f2a', b: '#4a3d35' },
  /* 6 cabbage white 菜粉蝶 (drawn 1.6x life, like the painted figures' 1.3x: at real size it is lost beyond 3 m) */
  { A: [0.04, 0.009, 0.05, 0.055], B: [0.045, -0.008, 0.0, 0.0], F: [9, 1.3, 0.2, 0.3], a: '#f6f4ea', b: '#efe9cf' },
];
const SP = { sparrow: 0, crow: 1, pigeon: 2, swallow: 3, egret: 4, bat: 5, butterfly: 6 };
const PATH = { seg: 0, wheel: 1, skim: 2, pass: 3, flit: 4, burst: 5 };
// when each species is about, by the hour: [rise from, risen at, fall from, gone at] (bats: dusk and dawn)
const HOURS = [[5.3, 5.9, 18.7, 19.3], [5.8, 6.4, 18.4, 19.1], [5.8, 6.4, 18.4, 19.1], [5.6, 6.1, 18.9, 19.4], [6.0, 6.6, 18.2, 18.8], null, [8.8, 9.6, 16.8, 17.6]];
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function presence(sp, h) {
  if (sp === SP.bat) return Math.max(ss(18.3, 18.9, h) * (1 - ss(20.4, 21.0, h)), ss(4.2, 4.6, h) * (1 - ss(5.2, 5.7, h)));
  const [a0, a1, b0, b1] = HOURS[sp];
  return ss(a0, a1, h) * (1 - ss(b0, b1, h));
}
// cooking hours (kitchen smoke and steam): breakfast, the midday meal, supper, and a thin fire through the day
const cooking = (h) => Math.max(0.7 * ss(5.5, 6.5, h) * (1 - ss(20, 21, h)), ss(5.8, 6.5, h) * (1 - ss(8.5, 9.3, h)), ss(10.3, 11, h) * (1 - ss(12.8, 13.5, h)), ss(16.3, 17, h) * (1 - ss(19.5, 20.5, h)));

// ---------------------------------------------------------------- the bird template (47 triangles, non-indexed)
// aShape: body (0, x, y, z in body units); wing (1, u span 0..1, v chord 0 leading .. 1 trailing, side); tail (2, along, across)
function birdTemplate() {
  const tris = [];
  const P = (...v) => v;
  // body: the beak's tip, a head ring (raised: the crown stands above the back), a chest ring, a rump ring and the
  // tail's root; hexagonal rings, so a small bird reads plump, not as a spindle
  const nose = P(0, 0, 0.17, 0.52), end = P(0, 0, 0.0, -0.46);
  const ring = (z, r, dy) => [0, 1, 2, 3, 4, 5].map((k) => { const a = (k / 6) * Math.PI * 2; return P(0, Math.sin(a) * r * 0.5, dy + Math.cos(a) * r * 0.5, z); });
  const R = [ring(0.33, 0.74, 0.22), ring(0.06, 1.0, 0.0), ring(-0.24, 0.7, -0.02)];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    tris.push(nose, R[0][j], R[0][i]);
    for (let r = 0; r < 2; r++) tris.push(R[r][i], R[r][j], R[r + 1][j], R[r][i], R[r + 1][j], R[r + 1][i]);
    tris.push(R[2][i], R[2][j], end);
  }
  // wings: two quads each (root..wrist, wrist..tip)
  for (const side of [1, -1]) {
    const W = (u, v) => P(1, u, v, side);
    for (const [u0, u1] of [[0, 0.45], [0.45, 1]]) tris.push(W(u0, 0), W(u1, 0), W(u1, 1), W(u0, 0), W(u1, 1), W(u0, 1));
  }
  // tail: a fan with a notch in the middle (the fork)
  const T = (t, s) => P(2, t, s, 0);
  tris.push(T(0, -1), T(1, -1), T(1, 0), T(0, -1), T(1, 0), T(0, 1), T(0, 1), T(1, 0), T(1, 1));
  const g = new THREE.InstancedBufferGeometry();
  const n = tris.length;
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); // unused (the shader builds the bird)
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); // unused (flat shading)
  g.setAttribute('aShape', new THREE.BufferAttribute(new Float32Array(tris.flat()), 4));
  return g;
}

const BIRD_PARS = /* glsl */ `
attribute vec4 aShape;
attribute vec4 iA, iB, iC;
uniform float uT, uForce;
uniform float uPres[7];
uniform vec4 uShapeA[7], uShapeB[7], uFlight[7];
uniform vec3 uColA[7], uColB[7];
varying vec3 vBirdCol;
float qmBH(float n) { return fract(sin(n * 127.1 + 0.37) * 43758.5453); }
float qmAwayG = 0.0; // how far gone with the hour (set in main before the paths are read)
// a wheeling flock: iA centre (x, altitude, z), iB (radius, angular speed, phase, cycle), iC (share of the cycle about,
// cycle offset, radial offset, height offset); it spirals in from beyond the haze and out again
vec3 qmWheel(float t) {
  float P = iB.w, tl = mod(t + iC.y, P), tend = iC.x * P;
  float far = 150.0 * ((1.0 - smoothstep(0.0, 12.0, tl)) + smoothstep(tend - 12.0, tend, tl)) * (1.0 - uForce) + 160.0 * qmAwayG;
  float R = iB.x * (1.0 + 0.2 * sin(t * 0.071 + iC.y)) + iC.z * (1.0 + 0.3 * sin(t * 0.5 + iB.z * 7.0));
  float th = iB.y * t + iB.z;
  vec3 c = iA.xyz + vec3(7.0 * sin(t * 0.043 + iC.y), 1.6 * sin(t * 0.29 + iB.z * 3.0) + iC.w, 5.0 * cos(t * 0.037 + iC.y));
  return c + vec3(cos(th) * (R + far), far * 0.12, sin(th) * (R + far));
}
// a skim: a figure of eight along a straight run; iA its middle (y: the ground or water), iB (dir x, dir z, half length,
// half width), iC (angular speed, phase, height, -)
vec3 qmSkim(float t) {
  vec2 d = iB.xy, n = vec2(-d.y, d.x);
  float a = iC.x * t + iC.y;
  float lat = sin(2.0 * a + 0.8 * sin(0.23 * t + iC.y)) * iB.w;
  float h = iC.z * (0.55 + 0.45 * cos(2.0 * a + 0.5)) + 0.25 * sin(1.9 * t + iC.y * 2.0);
  vec2 xz = iA.xz + d * (sin(a) * iB.z) + n * lat + n * 70.0 * qmAwayG;
  return vec3(xz.x, iA.y + h + 35.0 * qmAwayG, xz.y);
}
// a pass: once a cycle along a line; iA its start, iB (dir x, dir z, length, speed), iC (cycle, offset, sway, -)
vec3 qmPass(float t) {
  float s = mod(t + iC.y, iC.x) * iB.w;
  vec2 d = iB.xy, n = vec2(-d.y, d.x);
  vec2 xz = iA.xz + d * s + n * (iC.z * sin(s * 0.08));
  return vec3(xz.x, iA.y + 0.6 * sin(s * 0.05 + 1.0), xz.y);
}
// a flit (bats, butterflies): loops of three incommensurate sines round a point; iB (radius, height swing, pace, phase),
// iC (jitter, -, -, -)
vec3 qmFlit(float t) {
  float k = iB.z, ph = iB.w;
  vec3 o = vec3(sin(t * 0.83 * k + ph) + 0.45 * sin(t * 2.17 * k + ph * 1.7), 0.0, cos(t * 0.71 * k + ph * 0.6) + 0.45 * cos(t * 1.93 * k + ph * 2.3)) * iB.x;
  o.y = iB.y * (sin(t * 1.31 * k + ph * 0.3) + 0.4 * sin(t * 3.7 * k + ph));
  return iA.xyz + o + iC.x * vec3(sin(t * 9.1 + ph), sin(t * 11.3 + ph * 2.0), cos(t * 8.3 + ph)) + vec3(0.0, 30.0 * qmAwayG, 0.0);
}
// a sparrow's segment (written by the CPU agent): iA from, iB (to, start), iC (end, mode, yaw, hops); mode 0 pecking
// at 'from', 1 hopping, 2 flying, 3 away (hidden), 4 perched
vec3 qmSeg(float t) {
  float mode = iC.y;
  if (mode < 0.5 || mode > 2.5) return iA.xyz;
  float s = clamp((t - iB.w) / max(iC.x - iB.w, 1e-3), 0.0, 1.0);
  if (mode < 1.5) {
    float k = max(iC.w, 1.0), hs = min(s * k, k - 1e-4), f = fract(hs);
    if (s >= 1.0) return iB.xyz;
    return mix(iA.xyz, iB.xyz, (floor(hs) + smoothstep(0.0, 1.0, f)) / k) + vec3(0.0, 0.05 * sin(3.14159 * f), 0.0);
  }
  float e = s * s * (3.0 - 2.0 * s);
  float up = iB.y > iA.y ? 1.0 : 0.25;
  return mix(iA.xyz, iB.xyz, e) + vec3(0.0, up * min(1.2, 0.25 * distance(iA.xyz, iB.xyz)) * sin(3.14159 * e), 0.0);
}
// a burst (startle(): the gate tower's drum, interact.js): out of a tree crown or off a roof and away (iC.w > 0), or
// (iC.w < 0) the same flight backwards, from far off home into it; iA the crown (x, y, z), iB (heading x, heading z,
// cruise speed m/s, start time s), iC (climb m, turn rad/s, seconds, way). From a standing start up to cruise speed,
// climbing fast then levelling; a hard wheel round the tree first, the turn easing off (2.2 s) as it heads away.
// The path is integrated in 10 steps (a few hundred vertices a frame, only while birds are out).
vec3 qmBurst(float t) {
  float e = clamp(t - iB.w, 0.0, iC.z), u = iC.w < 0.0 ? iC.z - e : e;
  float h0 = atan(iB.y, iB.x), du = u / 10.0;
  vec2 xz = vec2(0.0);
  for (int i = 0; i < 10; i++) {
    float s = (float(i) + 0.5) * du, hd = h0 + iC.y * 2.2 * (1.0 - exp(-s / 2.2));
    xz += iB.z * (1.0 - exp(-2.5 * s)) * du * vec2(cos(hd), sin(hd));
  }
  float h = iC.x * (1.0 - exp(-1.6 * u)) + 0.5 * sin(u * 2.3 + iB.w);
  return iA.xyz + vec3(xz.x, h, xz.y);
}
vec3 qmBirdAt(float path, float t) {
  vec3 p;
  if (path < 0.5) p = qmSeg(t);
  else if (path < 1.5) p = qmWheel(t);
  else if (path < 2.5) p = qmSkim(t);
  else if (path < 3.5) p = qmPass(t);
  else if (path < 4.5) p = qmFlit(t);
  else p = qmBurst(t);
  return p;
}
`;

const BIRD_MAIN = /* glsl */ `
  float qmCode = iA.w, qmPath = floor(qmCode / 16.0 + 0.001);
  int qmSp = int(qmCode - qmPath * 16.0 + 0.5);
  float qmSeed = qmBH(float(gl_InstanceID));
  float qmT = uT;
  // leaving with the hour (to roost, or out for the night): a bird whose turn it is flies off, it never blinks out
  float qmAway = uForce > 0.5 || qmPath > 4.5 ? 0.0 : 1.0 - smoothstep(qmSeed - 0.12, qmSeed, uPres[qmSp]); // a burst flies at any hour
  qmAwayG = qmAway;
  bool qmOn = qmAway < 0.999;
  if (qmPath > 0.5 && qmPath < 1.5) qmOn = qmOn && (mod(qmT + iC.y, iB.w) < iC.x * iB.w || uForce > 0.5);
  if (qmPath > 2.5 && qmPath < 3.5) qmOn = qmOn && (mod(qmT + iC.y, iC.x) * iB.w < iB.z);
  if (qmPath > 4.5) qmOn = qmT >= iB.w && qmT <= iB.w + iC.z; // a burst: only while it flies (hidden in its crown before and after)
  if (qmPath < 0.5 && iC.y > 2.5 && iC.y < 3.5) qmOn = false;
  float qmDt = 0.05;
  vec3 qmP = qmBirdAt(qmPath, qmT), qmPa = qmBirdAt(qmPath, qmT - qmDt), qmPb = qmBirdAt(qmPath, qmT + qmDt);
  vec3 qmV0 = qmP - qmPa, qmV1 = qmPb - qmP, qmVel = qmV0 + qmV1;
  bool qmFly = qmPath > 0.5 || (iC.y > 1.5 && iC.y < 2.5 && qmT < iC.x);
  bool qmMoving = qmFly || (iC.y > 0.5 && iC.y < 1.5 && qmT < iC.x);
  vec3 qmF = (qmMoving && length(qmVel) > 1e-5) ? normalize(qmVel) : vec3(sin(iC.z), 0.0, cos(iC.z));
  vec3 qmUp = vec3(0.0, 1.0, 0.0);
  if (!qmFly) qmF = normalize(vec3(qmF.x, 0.0, qmF.z) + vec3(1e-5, 0.0, 0.0));
  vec3 qmR = normalize(cross(qmF, qmUp) + vec3(0.0, 0.0, 1e-5));
  vec3 qmU = cross(qmR, qmF);
  if (qmFly) {
    // bank into the turn: tan(bank) = speed * turn rate / g
    float qmL0 = length(qmV0), qmL1 = length(qmV1);
    float qmTurn = (qmL0 > 1e-5 && qmL1 > 1e-5) ? cross(qmV0 / qmL0, qmV1 / qmL1).y : 0.0;
    float qmBank = clamp(atan(length(qmVel) / (2.0 * qmDt) * asin(clamp(qmTurn, -1.0, 1.0)) / qmDt / 9.8), -1.1, 1.1);
    vec3 r2 = qmR * cos(qmBank) + qmU * sin(qmBank);
    qmU = qmU * cos(qmBank) - qmR * sin(qmBank);
    qmR = r2;
  } else {
    // a ground bird pecks (mode 0), a perched one sits still
    float qmPitch = iC.y < 0.5 ? 0.6 * pow(max(0.0, sin(qmT * 4.0 + qmSeed * 30.0)), 6.0) : 0.0;
    vec3 f2 = qmF * cos(qmPitch) - qmUp * sin(qmPitch);
    qmU = qmUp * cos(qmPitch) + qmF * sin(qmPitch);
    qmF = f2;
  }
  vec4 qmA = uShapeA[qmSp], qmB = uShapeB[qmSp], qmFl = uFlight[qmSp];
  vec3 qmLp, qmCol;
  if (aShape.x < 0.5) {
    qmLp = vec3(aShape.y * qmA.y, aShape.z * qmA.y, aShape.w * qmA.x);
    qmCol = mix(uColB[qmSp], uColA[qmSp], smoothstep(-0.15, 0.15, aShape.z));
  } else if (aShape.x < 1.5) {
    float u = aShape.y, v = aShape.z, side = aShape.w, fold = qmFly ? 0.0 : 1.0;
    float ph = 6.2832 * qmFl.x * qmT + qmSeed * 40.0;
    float glide = smoothstep(0.0, 0.3, sin(qmT * 0.9 + qmSeed * 9.0) - (1.0 - 2.0 * qmFl.z));
    float a1 = mix(qmFl.w + qmFl.y * 0.55 * sin(ph), qmFl.w + 0.05, glide);
    float a2 = mix(qmFl.y * 0.45 * sin(ph - 0.7), 0.0, glide);
    float span = qmA.z, x0 = 0.4 * qmA.y;
    float lead = 0.18 * qmA.x - qmB.y * pow(u, 1.5);
    float cM = 0.85 * qmA.w;
    float ch = u <= 0.45 ? mix(qmA.w, cM, u / 0.45) : mix(cM, qmB.x, (u - 0.45) / 0.55);
    float z = lead - v * ch;
    float d = u * span, dw = 0.45 * span;
    vec2 xy = u <= 0.45 ? vec2(x0 + d * cos(a1), d * sin(a1)) : vec2(x0 + dw * cos(a1), dw * sin(a1)) + (d - dw) * vec2(cos(a1 + a2), sin(a1 + a2));
    // folded (on the ground, perched): the wing lies along the flank, from the shoulder back to the tail
    vec3 folded = vec3(side * (0.53 + 0.04 * v) * qmA.y, (0.2 - 0.38 * v) * qmA.y, (0.14 - 0.62 * u) * qmA.x);
    qmLp = mix(vec3(side * xy.x, xy.y, z), folded, fold);
    qmCol = uColA[qmSp] * (1.0 - 0.3 * u);
  } else {
    float tt = aShape.y, s = aShape.z;
    float L = qmB.z * (1.0 - qmB.w * (1.0 - abs(s)) * tt);
    float w = 0.32 * qmA.y * (0.5 + 1.2 * tt) * (1.0 + 0.6 * qmB.w);
    qmLp = vec3(s * w, 0.0, -0.45 * qmA.x - tt * L);
    qmCol = uColA[qmSp] * 0.85;
  }
  // far birds a little larger, so a crow at 80 m stays a few pixels and doesn't shimmer away
  float qmK = qmPath < 0.5 ? 1.0 : clamp(distance(qmP, cameraPosition) / 35.0, 1.0, 2.2);
  // a burst comes out of its crown and dwindles away at the far end (home again: the other way round), never blinks
  if (qmPath > 4.5) { float qmE = qmT - iB.w; qmK *= iC.w > 0.0 ? smoothstep(0.0, 0.25, qmE) * smoothstep(0.0, 1.5, iC.z - qmE) : smoothstep(0.0, 1.5, qmE) * smoothstep(0.0, 0.35, iC.z - qmE); }
  vec3 transformed = qmP + (qmR * qmLp.x + qmU * qmLp.y + qmF * qmLp.z) * qmK;
  if (!qmOn) transformed = vec3(0.0, -1.0e5, 0.0);
  vBirdCol = qmCol;
`;

// ---------------------------------------------------------------- particles (one quad each, no texture)
// kinds: 0 catkin, 1 elm seed, 2 bamboo leaf, 3 smoke, 4 steam
const PARTICLE_VS = /* glsl */ `
attribute vec2 corner;
attribute vec4 pA, pB, pC;
uniform float uT, uPxWorld, uSmoke;
${WIND_GLSL}
varying vec2 vUv;
varying float vAlpha, vKind, vDist, vSeed;
float qmH(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  float kind = pA.w, life = pB.z;
  float seed = float(gl_InstanceID) * 1.618 + 0.31;
  float P = kind > 2.5 ? life : life * (1.15 + 0.6 * qmH(seed * 3.1)); // smoke: puffs evenly spaced, an unbroken column
  float tt = uT + pB.w;
  float cyc = floor(tt / P), age = tt - cyc * P;
  float s1 = qmH(seed + cyc * 12.9898), s2 = qmH(seed * 1.7 + cyc * 78.233), s3 = qmH(seed * 2.3 + cyc * 37.719), s4 = qmH(seed * 3.7 + cyc * 11.13);
  vec3 st = pA.xyz + vec3((s1 * 2.0 - 1.0) * pB.x, (s2 * 2.0 - 1.0) * pB.y, (s3 * 2.0 - 1.0) * pB.x);
  float ground = pC.w, size = pC.x * (0.75 + 0.5 * s4), alpha = 1.0;
  float strength = qmWindStrength, gust = qmGust(st.xz);
  vec2 wd = qmWindDir;
  vec3 p = st;
  float flip = 1.0;
  if (kind < 0.5) {
    // catkin: carried along at the wind's mean, surging a little in a gust, sinking slowly, lifted by gusts
    float K = 2.6 * pC.z;
    p.xz += wd * (strength * 0.775 * K * age + strength * K * 1.2 * (gust - 0.5));
    p.xz += vec2(sin(age * 0.9 + s1 * 6.3), cos(age * 0.7 + s2 * 6.3)) * 0.35;
    // eddies: each tuft wanders its own way too (so some cross the street against the wind)
    float ea = s4 * 6.2832;
    p.xz += vec2(cos(ea), sin(ea)) * (0.15 + 0.3 * s2) * age;
    p.y += -pC.y * age + 0.45 * sin(age * 0.6 + s3 * 6.3) + 0.6 * strength * gust;
    alpha = smoothstep(0.0, 1.0, age) * (1.0 - smoothstep(life - 2.0, life, age));
  } else if (kind < 2.5) {
    // elm seed, bamboo leaf: spin or sway down, then lie and fade
    float fall = min(age, max(0.0, (st.y - ground - 0.02) / pC.y));
    float K = (kind < 1.5 ? 0.8 : 1.0) * pC.z;
    p.xz += wd * strength * 0.775 * K * fall;
    float sway = kind < 1.5 ? 0.18 : 0.55;
    p.xz += vec2(sin(fall * (kind < 1.5 ? 4.0 : 1.9) + s1 * 6.3), cos(fall * 1.3 + s2 * 6.3)) * sway * min(fall, 1.0);
    p.y -= pC.y * fall;
    flip = cos(age * (kind < 1.5 ? 11.0 : 3.0) + s3 * 6.3);
    alpha = smoothstep(0.0, 0.6, age) * (1.0 - smoothstep(life - 1.5, life, age));
  } else {
    // smoke, steam: rises, slows, widens, leans downwind as it climbs, curls, fades
    float steam = step(3.5, kind);
    float rise = mix(0.5, 0.65, steam);
    p.y += rise * age - mix(0.009, 0.05, steam) * age * age;
    p.xz += wd * strength * mix(1.7, 1.0, steam) * age * smoothstep(0.0, 3.0, age);
    p.xz += vec2(sin(age * 0.7 + s1 * 6.3), cos(age * 0.6 + s2 * 6.3)) * 0.25 * age / life;
    size *= mix(0.35, 0.25, steam) + mix(0.18, 0.35, steam) * age;
    vSeed = age / life;
    alpha = mix(0.6, 0.7, steam) * smoothstep(0.0, 0.8, age) * pow(max(0.0, 1.0 - age / life), 1.3) * uSmoke;
  }
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float dist = -mv.z;
  float minS = 1.6 * dist * uPxWorld, sz = max(size, minS);
  alpha *= size / sz;
  alpha *= kind < 2.5 ? 1.0 - smoothstep(24.0, 38.0, dist) : (1.0 - smoothstep(90.0, 140.0, dist)) * smoothstep(0.6, 2.5, dist);
  vec2 c = corner;
  if (kind > 0.5 && kind < 2.5) c.x *= flip;
  if (kind > 1.5 && kind < 2.5) c *= vec2(0.4, 1.0);
  mv.xy += c * sz;
  gl_Position = projectionMatrix * mv;
  if (alpha < 0.003) gl_Position = vec4(0.0, 0.0, -2.0, 1.0);
  vUv = corner + 0.5; vAlpha = alpha; vKind = kind; vDist = dist; if (kind < 2.5) vSeed = s4; else vSeed += floor(s4 * 8.0); // smoke: age share + a variant
}`;

const PARTICLE_FS = /* glsl */ `
layout(location = 1) out highp vec4 qmNormalOut;
uniform vec3 uLight, uFogColor;
uniform vec2 uFog;
varying vec2 vUv;
varying float vAlpha, vKind, vDist, vSeed;
float qmN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453), b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453), d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
void main() {
  vec2 q = vUv * 2.0 - 1.0;
  float r = length(q), a;
  vec3 col;
  if (vKind < 0.5) {
    // a cottony tuft: an irregular soft lump (no rays: rays read as snowflakes), a denser seed-heart off its centre
    vec2 qs = vec2(q.x * (0.8 + 0.4 * vSeed), q.y * (1.2 - 0.4 * vSeed));
    float n = qmN(qs * 1.8 + vSeed * 31.0) * 0.65 + qmN(qs * 4.6 + vSeed * 17.0) * 0.35;
    a = (1.0 - smoothstep(0.1, 0.95, length(qs) + 0.6 * (n - 0.5))) * 0.8;
    a += (1.0 - smoothstep(0.0, 0.28, length(q - (vec2(vSeed, 1.0 - vSeed) - 0.5) * 0.3))) * 0.35;
    col = vec3(0.96, 0.95, 0.9);
  } else if (vKind < 1.5) {
    a = 1.0 - smoothstep(0.7, 0.95, r);
    col = mix(vec3(0.55, 0.6, 0.33), vec3(0.8, 0.83, 0.56), smoothstep(0.15, 0.35, r));
  } else if (vKind < 2.5) {
    float w = 0.9 * (1.0 - q.y * q.y);
    a = 1.0 - smoothstep(w - 0.15, w, abs(q.x));
    col = mix(vec3(0.62, 0.52, 0.28), vec3(0.8, 0.7, 0.42), smoothstep(0.0, 0.25, abs(q.x)));
  } else {
    float age = fract(vSeed), var = floor(vSeed);
    vec2 qq = vec2(q.x, q.y * 0.8);
    float n = qmN(qq * 2.0 + var * 13.0 + age * 1.5) * 0.6 + qmN(qq * 4.5 + var * 7.0 - age * 2.0) * 0.4;
    a = (1.0 - smoothstep(0.05, 0.95, length(qq) + 0.6 * (n - 0.5))) * (0.75 + 0.25 * n) * 1.25;
    // wood smoke: a blue-grey, thinning and paling as it climbs; steam white
    col = vKind < 3.5 ? mix(vec3(0.34, 0.36, 0.42), vec3(0.62, 0.65, 0.72), age) : vec3(0.95, 0.96, 0.97);
  }
  a *= vAlpha;
  if (a < 0.01) discard;
  col *= uLight;
  col = mix(col, uFogColor, smoothstep(uFog.x, uFog.y, vDist));
  gl_FragColor = vec4(col, min(a, 1.0));
  qmNormalOut = vec4(0.5, 0.5, 1.0, 0.0); // the empty normal (post.js MRT): no ink, the normal under it stays
  #include <colorspace_fragment>
}`;

const CLOTH_PARS = /* glsl */ `
attribute float aQmSway;
uniform float uQmSwayFar, uQmSwayAmp;
${WIND_GLSL}
`;
const CLOTH_MAIN = /* glsl */ `
{
  vec3 qmW = (modelMatrix * vec4(transformed, 1.0)).xyz;
  float qmS = uQmSwayFar > 0.0 ? aQmSway * (1.0 - smoothstep(uQmSwayFar * 0.75, uQmSwayFar, distance(qmW, cameraPosition))) : 0.0;
  if (qmS > 0.0) {
    float qmA = qmWindAt(qmW.xz), qmPh = dot(qmW.xz, vec2(1.31, 1.97));
    vec2 qmPush = qmWindDir * qmA * qmS * uQmSwayAmp * (0.75 + 0.25 * sin(qmWindTime * 1.7 + qmPh));
    float qmFl = sin(qmWindTime * (4.0 + 3.0 * qmA) + qmPh - aQmSway * 5.0) * 0.05 * qmS * (0.25 + qmA);
    // world metres back into the mesh's own (quantized, scaled) frame
    mat3 qmM = mat3(modelMatrix);
    // the flutter goes along the cloth's normal turned to one side, so a two-layer banner (its plain back and its
    // lettered face, a centimetre apart, facing opposite ways) moves as one sheet and its letters never sink behind
    vec3 qmN = normalize(qmM * objectNormal);
    qmN *= sign(dot(qmN, vec3(qmWindDir.x + 0.13, 0.05, qmWindDir.y + 0.21)) + 1e-4);
    transformed += inverse(qmM) * (vec3(qmPush.x, 0.0, qmPush.y) + qmN * qmFl);
  }
}`;

// ---------------------------------------------------------------- cloth: which parts of a mesh sway, and how far
// Pieces: positions welded to a millimetre, triangles flood-filled. A piece sways when it is a sheet (its triangles'
// normals agree with its biggest one: banners, flags, curtains, table cloths, boards of cloth; not sacks, bales and
// heaps) and hangs (its weight is how far a vertex lies below the piece's top, to 2 m). Pieces by a painted banner
// sway a little more; on a sign atlas mesh only those do.
function clothPieces(mesh) {
  // in the world frame: a shipped GLB's positions are quantized, with the scale in the node's matrix
  const g = mesh.geometry, src = g.attributes.position, idx = g.index ? g.index.array : null;
  const n = src.count, tri = idx ? idx.length / 3 : n / 3;
  const W = new Float32Array(n * 3), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) v.fromBufferAttribute(src, i).applyMatrix4(mesh.matrixWorld).toArray(W, i * 3);
  const key = new Map(), weld = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    const k = `${Math.round(W[i * 3] * 1000)},${Math.round(W[i * 3 + 1] * 1000)},${Math.round(W[i * 3 + 2] * 1000)}`;
    let w = key.get(k);
    if (w === undefined) { w = key.size; key.set(k, w); }
    weld[i] = w;
  }
  const parent = new Int32Array(key.size).map((_, i) => i);
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const vi = (t, c) => (idx ? idx[t * 3 + c] : t * 3 + c);
  for (let t = 0; t < tri; t++) {
    const a = find(weld[vi(t, 0)]), b = find(weld[vi(t, 1)]), c = find(weld[vi(t, 2)]);
    parent[b] = a; parent[find(c)] = a;
  }
  // per piece: top, bottom, the normal of its biggest triangle, area-weighted normal agreement, centroid (world)
  const pieces = new Map();
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), N = new THREE.Vector3(), E = new THREE.Vector3();
  for (let t = 0; t < tri; t++) {
    const i0 = vi(t, 0), i1 = vi(t, 1), i2 = vi(t, 2), r = find(weld[i0]);
    A.fromArray(W, i0 * 3); B.fromArray(W, i1 * 3); C.fromArray(W, i2 * 3);
    N.subVectors(B, A).cross(E.subVectors(C, A));
    const ar = N.length() / 2;
    let p = pieces.get(r);
    if (!p) { p = { top: -Infinity, bottom: Infinity, tris: [], big: 0, n0: new THREE.Vector3(0, 0, 1), c: new THREE.Vector3(), area: 0 }; pieces.set(r, p); }
    p.tris.push([ar, N.clone().normalize()]);
    if (ar > p.big) { p.big = ar; p.n0.copy(N).normalize(); }
    p.top = Math.max(p.top, A.y, B.y, C.y); p.bottom = Math.min(p.bottom, A.y, B.y, C.y);
    p.c.addScaledVector(A.add(B).add(C), ar / 3); p.area += ar;
  }
  for (const p of pieces.values()) {
    let agree = 0;
    for (const [ar, nn] of p.tris) agree += ar * Math.abs(nn.dot(p.n0));
    p.agree = agree / Math.max(1e-9, p.area);
    p.c.multiplyScalar(1 / Math.max(1e-9, p.area));
    p.tris = null;
  }
  return { mesh, n, W, weld, find, pieces };
}

// which pieces sway, with every cloth piece of the section known (`all`): a sheet (its triangles' normals agree with its
// biggest one: banners, flags, curtains, table cloths, boards of cloth; not sacks, bales and heaps), not a face of a
// wrapped box (two flat pieces within 0.45 m turned across it), hanging at least 0.3 m (or by a painted banner); on a
// sign atlas only by a banner. A striped banner whose gaps hold no cloth (S4's white stripes between 'bark' ones,
// which can't sway with them) stays still rather than part.
function clothMark(info, all, banners, signs) {
  let swaying = 0;
  const own = [...info.pieces.values()];
  for (const p of own) {
    const c = p.c, hang = p.top - p.bottom, w = p.area / Math.max(0.05, hang);
    const byBanner = banners.some((b) => Math.hypot(b.x - c.x, b.z - c.z) < 2.5);
    const boxy = own.filter((q) => q !== p && q.c.distanceTo(c) < 0.45 && Math.abs(q.n0.dot(p.n0)) < 0.5).length >= 2;
    let striped = false;
    if (p.agree > 0.85 && hang >= 0.3 && w < 0.4) {
      for (const q of own) {
        if (q === p || Math.abs(q.n0.dot(p.n0)) < 0.95 || Math.abs(q.top - q.bottom - hang) > 0.4 * hang) continue;
        const d = q.c.distanceTo(c);
        if (d < 1.5 * w || d > 2.6 * w) continue;
        const mid = c.clone().add(q.c).multiplyScalar(0.5);
        if (!all.some((o) => o !== p && o !== q && o.c.distanceTo(mid) < 0.6 * w)) { striped = true; break; }
      }
    }
    p.k = p.agree > 0.85 && !boxy && !striped && (hang >= 0.3 || (byBanner && hang > 0.06)) && (!signs || byBanner) ? (byBanner ? 1.4 : 1) : 0;
    if (p.k) swaying++;
  }
  const out = new Float32Array(info.n);
  for (let i = 0; i < info.n; i++) {
    const p = info.pieces.get(info.find(info.weld[i]));
    out[i] = p.k ? Math.min(2, p.top - info.W[i * 3 + 1]) * p.k : 0;
  }
  const list = own.filter((p) => p.k).map((p) => ({ x: +p.c.x.toFixed(2), y: +p.c.y.toFixed(2), z: +p.c.z.toFixed(2), hang: +(p.top - p.bottom).toFixed(2), area: +p.area.toFixed(2), k: p.k }));
  return { weights: out, pieces: own.length, swaying, list };
}

// ---------------------------------------------------------------- the module
const CAP_BIRDS = 512, CAP_PARTICLES = 4096, BIRD_TRIS = 47;

export class Ambient {
  constructor({ scene, camera, player, sections, people = () => null, hour = () => 10, query = new URLSearchParams(location.search) }) {
    this.scene = scene; this.camera = camera; this.player = player; this.sectionsMap = sections;
    this.people = typeof people === 'function' ? people : () => people;
    this.hour = hour;
    // on by default (the user's sign-off, 2026-10-13); ?ambient=0: nothing is added, no material is touched, and the
    // page draws exactly what it drew before
    this.off = query.get('ambient') === '0';
    this.cfg = { birds: 0, particles: 0, sparrows: 0, smoke: false, bannerSway: 'off' };
    this.scale = 1;
    this.secs = new Map(); // name -> { sec, sites, ground resolved, cloth entries }
    this.cloth = []; // { mesh, variant, clone, sec }
    this.clones = new Map(); // variant material -> { mat, users }
    this.groups = []; // sparrow groups
    this.counts = { birds: 0, particles: 0, sparrows: 0, smoke: 0 };
    this.cpu = { ms: 0, n: 0, ema: 0, polls: 0, rebuilds: 0, lastRebuildMs: 0, clothMs: 0 };
    this.last = { frame: -1, poll: 0, agents: 0 };
    this.dirty = true;
    this.seen = new WeakMap(); // people near a sparrow group: where they were at the last tick
    this.events = []; // sparrow flushes (for a sound session to hook later; no sound here)
    this.bursts = []; // startle(): flights out of the crowns and home again, { sp, a, b, c, end } (kept across rebuilds)
    this.lights = null;
    if (this.off) {
      this.unregister = register('ambient', { applyTier: () => {}, stats: () => ({ draws: 0, triangles: 0, instances: 0, textureMB: 0, cpuMs: 0, off: true }) });
      return;
    }
    // one static child of the scene, added once and kept (the shadow pass's world layer redraws when the scene's static
    // children change; nothing here casts a shadow)
    this.root = new THREE.Group();
    this.root.name = 'ambient';
    this.scene.add(this.root);
    this.makeBirds();
    this.makeParticles();
    this.clothU = { uQmSwayFar: { value: 45 }, uQmSwayAmp: { value: 0.28 } };
    const prev = scene.onBeforeRender;
    this.prevBefore = prev;
    scene.onBeforeRender = (renderer, sc, cam, rt) => { prev?.call(sc, renderer, sc, cam, rt); this.frame(renderer, cam); };
    this.unregister = register('ambient', { applyTier: (cfg) => this.applyTier(cfg), stats: () => this.stats() });
  }

  // ---- the tier's numbers (detail.js): counts per loaded section, times detailScale
  applyTier(cfg) {
    const a = cfg?.detail?.ambient;
    this.cfg = a ? { ...a } : { birds: 0, particles: 0, sparrows: 0, smoke: false, bannerSway: 'off' };
    this.scale = cfg?.detailScale ?? 1;
    this.tier = cfg?.name;
    if (this.clothU) this.clothU.uQmSwayFar.value = this.cfg.bannerSway === 'all' ? 1e6 : this.cfg.bannerSway === 'near' ? 45 : 0;
    this.dirty = true;
  }

  stats() {
    const birds = this.birdGeo?.instanceCount || 0, parts = this.partGeo?.instanceCount || 0;
    return {
      draws: (birds ? 1 : 0) + (parts ? 1 : 0), triangles: birds * BIRD_TRIS + parts * 2, instances: birds + parts,
      textureMB: 0, cpuMs: +this.cpu.ema.toFixed(3), tier: this.tier, scale: this.scale, cfg: this.cfg,
      birds, particles: parts, sparrows: this.counts.sparrows, smoke: this.counts.smoke, cloth: this.cloth.length,
      swayingPieces: this.cloth.reduce((a, c) => a + (c.swaying || 0), 0), sections: [...this.secs.keys()],
      rebuilds: this.cpu.rebuilds, lastRebuildMs: +this.cpu.lastRebuildMs.toFixed(2), clothMs: +this.cpu.clothMs.toFixed(2),
      flushes: this.events.length,
    };
  }

  makeBirds() {
    const g = this.birdGeo = birdTemplate();
    for (const k of ['iA', 'iB', 'iC']) { const a = new THREE.InstancedBufferAttribute(new Float32Array(CAP_BIRDS * 4), 4); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(k, a); }
    g.instanceCount = 0;
    const ramp = new THREE.DataTexture(new Uint8Array([110, 185, 255]), 3, 1, THREE.RedFormat); // the world's toon steps
    ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
    ramp.needsUpdate = true;
    const m = this.birdMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: ramp, side: THREE.DoubleSide, name: 'ambient_birds' });
    m.flatShading = true; // facet normals from the screen derivatives (three reads it on any material; the shader builds the bird)
    const U = this.birdU = {
      uT: { value: 0 }, uForce: { value: 0 }, uPres: { value: new Array(7).fill(1) },
      uShapeA: { value: SPECIES.map((s) => new THREE.Vector4(...s.A)) }, uShapeB: { value: SPECIES.map((s) => new THREE.Vector4(...s.B)) },
      uFlight: { value: SPECIES.map((s) => new THREE.Vector4(...s.F)) },
      uColA: { value: SPECIES.map((s) => new THREE.Color(s.a)) }, uColB: { value: SPECIES.map((s) => new THREE.Color(s.b)) },
    };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${BIRD_PARS}`).replace('#include <begin_vertex>', BIRD_MAIN);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBirdCol;').replace('#include <color_fragment>', 'diffuseColor.rgb *= vBirdCol;');
    };
    m.customProgramCacheKey = () => 'qm-ambient-birds-v1';
    const mesh = this.birds = new THREE.Mesh(g, m);
    mesh.name = 'ambient_birds';
    mesh.frustumCulled = false;
    mesh.castShadow = mesh.receiveShadow = false;
    mesh.visible = false;
    this.root.add(mesh);
  }

  makeParticles() {
    const g = this.partGeo = new THREE.InstancedBufferGeometry();
    g.setAttribute('corner', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5]), 2));
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3));
    for (const k of ['pA', 'pB', 'pC']) g.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(CAP_PARTICLES * 4), 4));
    g.instanceCount = 0;
    this.partU = {
      uT: { value: 0 }, uPxWorld: { value: 0.001 }, uSmoke: { value: 1 }, uLight: { value: new THREE.Color(1, 1, 1) },
      uFogColor: { value: new THREE.Color() }, uFog: { value: new THREE.Vector2(45, 230) }, ...windUniforms(),
    };
    const m = this.partMat = new THREE.ShaderMaterial({
      name: 'ambient_particles', uniforms: this.partU, vertexShader: PARTICLE_VS, fragmentShader: PARTICLE_FS,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    });
    const mesh = this.particles = new THREE.Mesh(g, m);
    mesh.name = 'ambient_particles';
    mesh.frustumCulled = false;
    mesh.renderOrder = 1001; // after the sky (1000) and with the transparent things
    mesh.visible = false;
    this.root.add(mesh);
  }

  // ---- once a frame, from the scene's onBeforeRender (the page's render; never the shadow pass)
  frame(renderer, camera) {
    if (camera !== this.camera) return;
    const f = renderer.info.render.frame;
    if (f === this.last.frame) return;
    this.last.frame = f;
    const t0 = performance.now(), T = t0 / 1000;
    WIND.sync(t0, f);
    this.birdU.uT.value = T;
    this.partU.uT.value = T;
    if (t0 - this.last.poll > 250) { this.last.poll = t0; this.poll(renderer); }
    if (t0 - this.last.agents > 100 && this.groups.length) { const dt = (t0 - this.last.agents) / 1000; this.last.agents = t0; this.agents(T, Math.min(dt, 0.5)); }
    const ms = performance.now() - t0;
    this.cpu.ema = this.cpu.ema * 0.95 + ms * 0.05;
  }

  // ---- 4 Hz: sections in and out, the hour, the light, the cloth's materials
  poll(renderer) {
    this.cpu.polls++;
    const names = new Set(this.sectionsMap.keys());
    for (const n of [...this.secs.keys()]) if (!names.has(n) || this.secs.get(n).sec !== this.sectionsMap.get(n)) { this.dropSection(n); this.dirty = true; }
    // a section is in once its people are (world.js finishSection: after its collider and its trees)
    for (const [n, sec] of this.sectionsMap) if (!this.secs.has(n) && sec.layout && sec.persons && this.player.bvh) { this.addSection(sec); this.dirty = true; }
    if (this.dirty) { this.dirty = false; this.rebuild(); }
    // the hour: who is about
    const h = ((+this.hour() % 24) + 24) % 24;
    const pres = this.birdU.uPres.value;
    for (let i = 0; i < 7; i++) pres[i] = presence(i, h);
    this.partU.uSmoke.value = cooking(h);
    this.night = presence(SP.sparrow, h) < 0.5;
    // the light on the particles: the scene's own fill and sun
    if (!this.lights) {
      this.lights = { hemi: null, sun: null };
      this.scene.traverse((o) => { if (o.isHemisphereLight && !this.lights.hemi) this.lights.hemi = o; if (o.isDirectionalLight && !this.lights.sun) this.lights.sun = o; });
    }
    const L = this.partU.uLight.value.setRGB(0, 0, 0), { hemi, sun } = this.lights;
    if (hemi) L.r += hemi.color.r * hemi.intensity * 0.55, L.g += hemi.color.g * hemi.intensity * 0.55, L.b += hemi.color.b * hemi.intensity * 0.55;
    if (sun) L.r += sun.color.r * sun.intensity * 0.3, L.g += sun.color.g * sun.intensity * 0.3, L.b += sun.color.b * sun.intensity * 0.3;
    const fog = this.scene.fog;
    if (fog) { this.partU.uFogColor.value.copy(fog.color); this.partU.uFog.value.set(fog.near, fog.far); }
    const size = renderer.getDrawingBufferSize(_v2);
    this.partU.uPxWorld.value = (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2)) / Math.max(1, size.y);
    // cloth: a material the page re-assigned (a shading change, a section joining) gets its patched copy again
    if (this.clothU.uQmSwayFar.value > 0) for (const c of this.cloth) if (c.mesh.material !== c.clone) this.dressCloth(c, renderer);
    this.birds.visible = this.birdGeo.instanceCount > 0;
    this.particles.visible = this.partGeo.instanceCount > 0;
    if (this.bursts.length && this.bursts.every((x) => x.end < performance.now() / 1000)) this.dirty = true; // all home: compact
  }

  // ---- the gate tower's drum (interact.js): the birds living in the trees round `at` burst out of their crowns and
  // fly off, the sparrows on the ground go up to their perches, and `sources` (a roof: { x, y, z, sp, n }) send theirs
  // up too. Each startled bird then comes home on its own after `home` s, flying the same way back into its crown and
  // vanishing there. All of it is on the GPU (the burst path): two instances a bird, written once, nothing per frame.
  // The tier's bird count scales it (none on a tier without birds). Returns how many birds went up.
  startle(at, { radius = 60, trees = 9, perTree = [2, 4], sources = [], home = [24, 48] } = {}) {
    if (this.off || !(this.cfg.birds > 0)) return 0;
    const T = performance.now() / 1000, k = Math.min(1, this.cfg.birds / 30);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const out = [];
    const fly = (sp, x, y, z, away) => {
      const ang = Math.atan2(away[1], away[0]) + rnd(-0.7, 0.7);
      const fast = sp === SP.pigeon ? rnd(8, 10) : sp === SP.crow ? rnd(6.5, 8) : rnd(6, 7.5);
      const t0 = T + rnd(0.05, 0.9), secs = rnd(8, 11), climb = rnd(6, 14), turn = (Math.random() < 0.5 ? -1 : 1) * rnd(0.5, 1.3);
      const a = [x + rnd(-0.6, 0.6), y + rnd(-0.5, 0.5), z + rnd(-0.6, 0.6)];
      out.push({ sp, a, b: [Math.cos(ang), Math.sin(ang), fast, t0], c: [climb, turn, secs, 1], end: t0 + secs });
      // home again: a new heading, from far off back into the same crown
      const ang2 = ang + rnd(-1.2, 1.2), t1 = t0 + secs + rnd(...home), s2 = rnd(6, 8);
      out.push({ sp, a, b: [Math.cos(ang2), Math.sin(ang2), fast * 0.85, t1], c: [climb * 0.8, -turn, s2, -1], end: t1 + s2 });
    };
    // the crowns in reach, nearest first: a tall tree holds crows as well as sparrows
    const crowns = [];
    for (const [, S] of this.secs) for (const t of S.sec.layout?.trees || []) {
      if (!(t.height_m >= 3)) continue;
      const x = t.X, z = -t.D, d = Math.hypot(x - at.x, z - at.z);
      if (d < radius) crowns.push({ t, x, z, d });
    }
    crowns.sort((p, q) => p.d - q.d);
    for (const c of crowns.slice(0, Math.max(2, Math.round(trees * k)))) {
      const g = this.groundAt(c.x, c.z, (c.t.H || 0) + 2), y = g + c.t.height_m * 0.7;
      const away = [c.x - at.x, c.z - at.z];
      const n = Math.max(1, Math.round(rnd(...perTree) * k + (c.t.height_m > 9 ? 1 : 0)));
      for (let i = 0; i < n; i++) fly(c.t.height_m >= 8 && i < 2 ? SP.crow : SP.sparrow, c.x, y, c.z, away);
    }
    for (const s of sources) for (let i = 0; i < Math.max(1, Math.round((s.n || 4) * k)); i++) fly(SP[s.sp] ?? SP.pigeon, s.x, s.y, s.z, [rnd(-1, 1), rnd(-1, 1)]);
    // the sparrows pecking in reach go up to their perches (their own timers bring them down)
    let flushed = 0;
    for (const g of this.groups) if (g.state === 'ground' && Math.hypot(g.centre.x - at.x, g.centre.z - at.z) < radius) { this.flush(g, T, 0.5); flushed++; }
    // write the new flights after everything drawn now (a rebuild keeps them: this.bursts)
    const iA = this.birdGeo.attributes.iA, iB = this.birdGeo.attributes.iB, iC = this.birdGeo.attributes.iC;
    let nb = this.birdGeo.instanceCount;
    const from = nb;
    for (const x of out) {
      if (nb >= CAP_BIRDS) break;
      iA.array.set([...x.a, PATH.burst * 16 + x.sp], nb * 4); iB.array.set(x.b, nb * 4); iC.array.set(x.c, nb * 4);
      this.bursts.push(x);
      nb++;
    }
    if (nb > from) { this.birdGeo.instanceCount = nb; this.birds.visible = true; }
    if (nb > from || flushed) for (const a of [iA, iB, iC]) { a.clearUpdateRanges(); a.needsUpdate = true; } // the whole buffer (24 kB), once
    this.events.push({ t: T, at: 'startle', n: nb - from, flushed });
    if (this.events.length > 200) this.events.shift();
    return (nb - from) / 2;
  }

  // ---- a section joins: its sites (ambient_sites.js) on the ground, its cloth
  addSection(sec) {
    const sites = sitesOf(sec.layout, sec.people);
    const ground = (X, D, from = 3) => this.groundAt(X, -D, from);
    const S = { sec, sites, cloth: [] };
    // the ground under each site, once (the section's collider is in: the page rebuilt it before adding the section)
    for (const s of sites.sparrows) { s.y = ground(s.X, s.D, (s.H || 0) + 0.5); if (s.perch) s.perch.y = s.perch.H; }
    for (const list of [sites.catkins, sites.seeds, sites.leaves]) for (const e of list) e.y = ground(e.X, e.D, (e.H || 0) + 1.5);
    for (const s of sites.swallows) { const m = [(s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2]; s.y = s.over === 'water' ? s.water : ground(m[0], m[1], 2); }
    for (const b of sites.butterflies) b.y = ground(b.X, b.D, 2);
    this.secs.set(sec.name, S);
    // cloth
    const t0 = performance.now();
    const banners = sites.banners.map((b) => ({ x: b.X, z: -b.D }));
    const infos = [];
    sec.root.traverse((o) => {
      if (!o.isMesh || o.isBatchedMesh || !/^g_(cloth|signs)_/.test(o.name) || !o.geometry?.attributes?.position) return;
      if (/__col$/.test(o.name) || /hidden/.test(o.name)) return; // a collider stays put
      const signs = /^g_signs_/.test(o.name);
      if (signs && !banners.length) return;
      infos.push([clothPieces(o), signs]);
    });
    const all = infos.flatMap(([info]) => [...info.pieces.values()]);
    for (const [info, signs] of infos) {
      const w = clothMark(info, all, banners, signs);
      if (!w.swaying) continue;
      info.mesh.geometry.setAttribute('aQmSway', new THREE.BufferAttribute(w.weights, 1));
      const c = { mesh: info.mesh, variant: null, clone: null, sec: sec.name, swaying: w.swaying, pieces: w.pieces, list: w.list };
      this.cloth.push(c);
      S.cloth.push(c);
    }
    this.cpu.clothMs = performance.now() - t0;
  }

  dropSection(name) {
    const S = this.secs.get(name);
    this.secs.delete(name);
    if (!S) return;
    for (const c of S.cloth) {
      if (c.mesh.material === c.clone && c.variant) c.mesh.material = c.variant;
      this.releaseClone(c.variant);
      const i = this.cloth.indexOf(c); if (i >= 0) this.cloth.splice(i, 1);
    }
  }

  // the cloth mesh's patched copy of the material the page gave it (one copy per material, shared)
  dressCloth(c, renderer) {
    const variant = c.mesh.material;
    if (!variant || variant === c.clone) return;
    if (c.variant && c.variant !== variant) this.releaseClone(c.variant);
    let e = this.clones.get(variant);
    if (!e) {
      const mat = variant.clone();
      const prevCompile = variant.onBeforeCompile, prevKey = variant.customProgramCacheKey?.bind(variant);
      const U = { ...windUniforms(), ...this.clothU };
      mat.onBeforeCompile = (sh, r) => {
        if (prevCompile && prevCompile !== THREE.Material.prototype.onBeforeCompile) prevCompile.call(variant, sh, r);
        Object.assign(sh.uniforms, U);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${CLOTH_PARS}`).replace('#include <begin_vertex>', `#include <begin_vertex>\n${CLOTH_MAIN}`);
      };
      mat.customProgramCacheKey = () => `${prevKey ? prevKey() : ''}|qm-cloth-sway-v2`;
      e = { mat, users: 0, ready: false, compiling: true, gone: false };
      this.clones.set(variant, e);
      // compiled off the main path; the mesh keeps its plain material until then. A copy whose section left while it
      // compiled is disposed only once the compile is over (disposing a program the driver is still linking makes
      // Chrome warn GL_INVALID_VALUE on glGetProgramiv)
      const proxy = new THREE.Mesh(c.mesh.geometry, mat);
      proxy.matrixWorld.copy(c.mesh.matrixWorld);
      Promise.resolve(renderer.compileAsync ? renderer.compileAsync(proxy, this.camera, this.scene) : null).catch(() => {})
        .finally(() => { e.ready = true; e.compiling = false; if (e.gone) e.mat.dispose(); });
    }
    if (!e.ready) return; // next poll
    e.mat.color.copy(variant.color); // the palette's true colour (the page may change it)
    if (c.variant !== variant) { e.users++; c.variant = variant; }
    c.clone = e.mat;
    c.mesh.material = e.mat;
  }

  releaseClone(variant) {
    const e = variant && this.clones.get(variant);
    if (!e) return;
    if (--e.users > 0) return;
    this.clones.delete(variant);
    if (e.compiling) e.gone = true; else e.mat.dispose();
  }

  // the visible floor under (x, z): the first hit down from `fromY`
  groundAt(x, z, fromY = 3) {
    const bvh = this.player.bvh;
    if (!bvh) return fromY - 3;
    _ray.origin.set(x, fromY, z); _ray.direction.set(0, -1, 0);
    const hit = bvh.raycastFirst(_ray, THREE.DoubleSide);
    return hit ? hit.point.y : 0;
  }

  // ---- the instances for every loaded section, by the tier's counts
  rebuild() {
    const t0 = performance.now();
    this.cpu.rebuilds++;
    // the tier's counts are per section for the usual window of three; a wider window (?window=all) shares them
    const c = this.cfg, k = this.scale * Math.min(1, 3 / Math.max(1, this.secs.size));
    const B = Math.round((c.birds || 0) * k), Pn = Math.round((c.particles || 0) * k), Sn = Math.round((c.sparrows || 0) * k);
    const iA = this.birdGeo.attributes.iA.array, iB = this.birdGeo.attributes.iB.array, iC = this.birdGeo.attributes.iC.array;
    const pA = this.partGeo.attributes.pA.array, pB = this.partGeo.attributes.pB.array, pC = this.partGeo.attributes.pC.array;
    let nb = 0, np = 0;
    const bird = (sp, path, a, b, cc) => {
      if (nb >= CAP_BIRDS) return -1;
      iA.set([a[0], a[1], a[2], path * 16 + sp], nb * 4); iB.set(b, nb * 4); iC.set(cc, nb * 4);
      return nb++;
    };
    const part = (kind, a, b, cc) => {
      if (np >= CAP_PARTICLES) return;
      pA.set([a[0], a[1], a[2], kind], np * 4); pB.set(b, np * 4); pC.set(cc, np * 4);
      np++;
    };
    const oldGroups = new Map(this.groups.map((g) => [g.key, g]));
    this.groups = [];
    let smokeN = 0;
    for (const [, S] of this.secs) {
      const s = S.sites, R = (id) => hashOf(id);
      // the sky: the first flock gets most of the birds, a second (pigeons by a built-up section) from 16
      if (B >= 3 && s.flocks.length) {
        const flocks = s.flocks.filter((f) => !f.nest);
        const shares = flocks.length > 1 && B >= 16 ? [0.4, 0.22] : [0.5];
        flocks.slice(0, shares.length).forEach((f, fi) => {
          const n = Math.max(3, Math.min(12, Math.round(B * shares[fi]))), h = R(f.from.join());
          const sp = f.kind === 'pigeon' ? SP.pigeon : SP.crow, v = sp === SP.pigeon ? 12 : 10;
          const groundY = this.groundAt(f.X, -f.D, 4);
          const P = 150 + 70 * h, dir = h > 0.5 ? 1 : -1;
          for (let i = 0; i < n; i++) {
            const j = R(`${f.from[0]}:${i}`);
            bird(sp, PATH.wheel, [f.X, groundY + f.alt, -f.D], [f.R, (dir * v) / f.R, h * 6.28 + i * 0.13 + j * 0.08, P], [0.55, h * P, (j - 0.5) * 5, (R(`${i}h`) - 0.5) * 4]);
          }
        });
        // a pair of crows round each painted nest
        if (B >= 10) for (const f of s.flocks.filter((x) => x.nest).slice(0, 3)) {
          const h = R(f.from[0]), g = this.groundAt(f.X, -f.D, 15);
          for (let i = 0; i < 2; i++) bird(SP.crow, PATH.wheel, [f.X, g + f.alt, -f.D], [f.R, (h > 0.5 ? 1 : -1) * 7 / f.R, h * 6.28 + i * 0.5, 80 + 30 * h], [0.5, h * 80, i * 1.5, i * 0.8]);
        }
      }
      // swallows: one per run, round the runs, from 8
      if (B >= 8 && s.swallows.length) {
        const n = Math.min(s.swallows.length * 2, Math.max(2, Math.round(B * 0.2)));
        for (let i = 0; i < n; i++) {
          const r = s.swallows[i % s.swallows.length], h = R(`${r.from}:${i}`);
          const mx = (r.a[0] + r.b[0]) / 2, mz = -(r.a[1] + r.b[1]) / 2;
          let dx = r.b[0] - r.a[0], dz = -(r.b[1] - r.a[1]);
          const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
          const half = L / 2 - 1, w = (10 + 3 * h) / Math.max(4, half);
          bird(SP.swallow, PATH.skim, [mx, r.y, mz], [dx, dz, half, r.halfW], [w * (h > 0.3 ? 1 : -1), h * 6.28 + i * 2.1, r.over === 'water' ? 0.9 + 0.6 * h : r.h + 1.0 * h, 0]);
        }
      }
      // an egret along the river now and then, from 10
      if (B >= 10) for (const e of s.egrets.slice(0, B >= 24 ? 2 : 1)) {
        const h = R(e.from + e.a.join());
        let dx = e.b[0] - e.a[0], dz = -(e.b[1] - e.a[1]);
        const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
        const back = h > 0.5; // fly it either way
        const sx = back ? e.b[0] : e.a[0], sz = back ? -e.b[1] : -e.a[1], d = back ? [-dx, -dz] : [dx, dz];
        bird(SP.egret, PATH.pass, [sx - d[0] * 30, e.alt, sz - d[1] * 30], [d[0], d[1], L + 60, 6], [100 + 60 * h, h * 100, 2, 0]);
      }
      // bats at dusk, from 8
      if (B >= 8) {
        const n = Math.min(s.bats.length * 4, Math.round(B * 0.3)); // the day's flyers have left by then: bats take their share
        for (let i = 0; i < n; i++) {
          const b = s.bats[i % s.bats.length], h = R(`${b.from}:${i}`);
          const g = this.groundAt(b.X, -b.D, b.alt + 3);
          bird(SP.bat, PATH.flit, [b.X, Math.max(g + 3, b.alt), -b.D], [b.R * (0.7 + 0.6 * h), 1.4, 0.75 + 0.3 * h, h * 40], [0.12, 0, 0, 0]);
        }
      }
      // cabbage whites, from 12
      if (B >= 12) {
        const n = Math.min(s.butterflies.length, Math.round(B * 0.3));
        for (let i = 0; i < n; i++) {
          const b = s.butterflies[i], h = R(b.from);
          bird(SP.butterfly, PATH.flit, [b.X, (b.y ?? 0) + 0.8, -b.D], [b.R * 0.75, 0.35, 0.55 + 0.3 * h, h * 40], [0.07, 0, 0, 0]);
        }
      }
      // sparrows: groups of three or four at the best sites
      let left = Sn;
      for (const site of s.sparrows) {
        if (left < 2) break;
        const n = Math.min(left, Sn >= 10 ? 4 : 3);
        left -= n;
        const key = `${site.from}`, old = oldGroups.get(key);
        const g = { key, site, centre: new THREE.Vector3(site.X, site.y, -site.D), perch: site.perch ? new THREE.Vector3(site.perch.X, site.perch.y, -site.perch.D) : null, perchR: site.perch?.r || 1, state: old?.state || 'ground', until: old?.until || 0, birds: [] };
        for (let i = 0; i < n; i++) {
          const ob = old?.birds[i];
          const p = ob?.p || g.centre.clone().add(new THREE.Vector3((R(`${key}x${i}`) - 0.5) * 1.4, 0, (R(`${key}z${i}`) - 0.5) * 1.4));
          if (!ob) p.y = this.groundAt(p.x, p.z, site.y + 0.5);
          const b = { i: -1, p, q: ob?.q || p.clone(), t0: ob?.t0 || 0, t1: ob?.t1 || 0, mode: ob?.mode ?? 0, yaw: ob?.yaw ?? R(`${key}y${i}`) * 6.28, hops: ob?.hops || 1 };
          b.i = bird(SP.sparrow, PATH.seg, [b.p.x, b.p.y, b.p.z], [b.q.x, b.q.y, b.q.z, b.t0], [b.t1, b.mode, b.yaw, b.hops]);
          if (b.i >= 0) g.birds.push(b);
        }
        this.groups.push(g);
      }
      // falling things: catkins 60%, seeds 25%, leaves 15% of the particles (shares of absent kinds go to the others)
      const kinds = [[s.catkins, 0, 0.6], [s.seeds, 1, 0.25], [s.leaves, 2, 0.15]].filter(([l]) => l.length);
      const wsum = kinds.reduce((a, x) => a + x[2], 0);
      for (const [list, kind, share] of kinds) {
        const total = Math.round((Pn * share) / wsum), hsum = list.reduce((a, e) => a + e.top, 0);
        // one tree never gets more than its own share: about 5 a metre of height at high (a 10 m willow, 50 tufts)
        const cap = (e) => Math.max(4, Math.round((e.top * 5 * Pn) / 900));
        for (const e of list) {
          const n = Math.min(cap(e), Math.max(list.length > total ? 0 : 2, Math.round((total * e.top) / hsum)));
          const base = e.y ?? 0, cy = base + e.top * 0.72, h = R(e.from);
          for (let i = 0; i < n; i++) {
            if (kind === 0) part(0, [e.X, cy, -e.D], [e.crownR * 1.2, e.top * 0.18, 10 + 6 * h, i * 7.3 + h * 50], [0.06, 0.13, 1, base]);
            else if (kind === 1) part(1, [e.X, cy, -e.D], [e.crownR, e.top * 0.12, (e.top * 0.72) / 0.75 + 3, i * 5.1 + h * 40], [0.03, 0.75, 1, base]);
            else part(2, [e.X, base + e.top * 0.6, -e.D], [e.crownR, e.top * 0.15, (e.top * 0.6) / 0.45 + 3, i * 6.7 + h * 30], [0.13, 0.45, 1, base]);
          }
        }
      }
      // kitchen smoke and steam
      if (c.smoke) {
        for (const sm of s.smoke.slice(0, 3)) {
          const h = R(sm.from), g = this.groundAt(sm.X, -sm.D, sm.H + 4), y = Math.max(sm.H, g + 0.1); // under an open sky, the roof's own top
          const n = Math.max(10, Math.min(24, Math.round(Pn / 40))); // a denser column with more particles to spend
          for (let i = 0; i < n; i++) part(3, [sm.X, y, -sm.D], [0.15, 0.05, 9, (i * 9) / n + h * 20], [1.1, 0, 1, y]);
          smokeN++;
        }
        for (const st of s.steam.slice(0, 2)) {
          const h = R(st.from), g = this.groundAt(st.X, -st.D, st.H + 1);
          for (let i = 0; i < 6; i++) part(4, [st.X, g + 1.2, -st.D], [0.15, 0.03, 2.6, i * 0.5 + h * 10], [0.6, 0, 1, g]);
          smokeN++;
        }
      }
    }
    // the startled birds still out or on their way home (startle()), after everyone else
    const T = performance.now() / 1000;
    this.bursts = this.bursts.filter((x) => x.end > T);
    for (const x of this.bursts) bird(x.sp, PATH.burst, x.a, x.b, x.c);
    this.birdGeo.instanceCount = nb;
    this.partGeo.instanceCount = np;
    for (const k of ['iA', 'iB', 'iC']) { const a = this.birdGeo.attributes[k]; a.clearUpdateRanges(); a.addUpdateRange(0, Math.max(4, nb * 4)); a.needsUpdate = true; }
    for (const k of ['pA', 'pB', 'pC']) { const a = this.partGeo.attributes[k]; a.clearUpdateRanges(); a.addUpdateRange(0, Math.max(4, np * 4)); a.needsUpdate = true; }
    this.counts = { birds: nb, particles: np, sparrows: this.groups.reduce((a, g) => a + g.birds.length, 0), smoke: smokeN };
    this.birds.visible = nb > 0;
    this.particles.visible = np > 0;
    this.cpu.lastRebuildMs = performance.now() - t0;
  }

  // ---- the sparrows, 10 Hz: peck and hop; burst up to a perch when you or a walker come close; come back later
  agents(T, dt) {
    const pl = this.player.pos, running = !!this.player.running;
    const scare = running ? 5 : 3.5;
    const ppl = this.people()?.all || [];
    let wrote = false;
    for (const g of this.groups) {
      const dPl = Math.hypot(pl.x - g.centre.x, pl.z - g.centre.z);
      if (dPl > 45) continue; // far: they hold what they do
      if (this.night) {
        // dusk: up to the roost (the tree or eave they flee to), and there for the night
        if (g.state === 'ground') { this.flush(g, T, 0.6); g.until = Infinity; wrote = true; }
        else if (g.until !== Infinity) g.until = Infinity;
        for (const b of g.birds) if (b.after !== undefined && T >= b.t1) { this.setSeg(b, b.q, b.q, T, T + 1e4, b.after, b.yaw, 1); b.after = undefined; wrote = true; }
        continue;
      }
      if (g.until === Infinity) g.until = T + 3 * Math.random(); // morning: down they come
      let threat = dPl < scare && Math.abs(pl.y - g.centre.y) < 2.5;
      // a walker passing (someone who moved since the last tick); the painted figures standing by are left alone
      if (!threat) for (const p of ppl) {
        const q = p.root?.position;
        if (!q || Math.abs(q.x - g.centre.x) > 1.8 || Math.abs(q.z - g.centre.z) > 1.8) continue;
        const was = this.seen.get(p);
        this.seen.set(p, { x: q.x, z: q.z, T });
        if (was && T - was.T < 0.5 && Math.hypot(q.x - was.x, q.z - was.z) > 0.03 && Math.hypot(q.x - g.centre.x, q.z - g.centre.z) < 1.6) { threat = true; break; }
      }
      if (g.state === 'ground') {
        if (threat) { this.flush(g, T, 0.25); wrote = true; continue; }
        for (const b of g.birds) {
          if (T < b.t1) continue;
          const at = this.posOf(b, T);
          if (Math.random() < 0.62) this.setSeg(b, at, at, T, T + 0.8 + Math.random() * 1.8, 0, b.yaw + (Math.random() - 0.5) * 1.2, 1);
          else {
            const to = g.centre.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2 * g.site.r * 1.6, 0, (Math.random() - 0.5) * 2 * g.site.r * 1.6));
            to.y = at.y; // hops stay on the ground they started on
            const hops = 1 + Math.floor(Math.random() * 3);
            this.setSeg(b, at, to, T, T + hops * 0.24, 1, Math.atan2(to.x - at.x, to.z - at.z), hops);
          }
          wrote = true;
        }
      } else {
        // up: settle when the flight ends; come back once it is quiet
        for (const b of g.birds) if (b.after !== undefined && T >= b.t1) { this.setSeg(b, b.q, b.q, T, T + 1e4, b.after, b.yaw, 1); b.after = undefined; wrote = true; }
        if (T > g.until && !threat && dPl > scare + 3) {
          g.state = 'ground';
          for (const b of g.birds) {
            const from = b.mode === 3 ? g.centre.clone().add(new THREE.Vector3((Math.random() - 0.5) * 16, 8, (Math.random() - 0.5) * 16)) : this.posOf(b, T);
            const to = g.centre.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.6, 0, (Math.random() - 0.5) * 1.6));
            to.y = this.groundAt(to.x, to.z, g.centre.y + 0.5);
            const t0 = T + Math.random() * 1.5;
            this.setSeg(b, from, to, t0, t0 + Math.max(0.8, from.distanceTo(to) / 5.5), 2, b.yaw, 1);
          }
          wrote = true;
        }
      }
    }
    if (wrote) for (const k of ['iA', 'iB', 'iC']) this.birdGeo.attributes[k].needsUpdate = true;
  }

  // a group bursts up, a beat apart, to its perch (or away over the roofs)
  flush(g, T, spread) {
    g.state = 'up';
    g.until = T + 9 + 8 * Math.random();
    this.events.push({ t: T, at: g.key, n: g.birds.length });
    if (this.events.length > 200) this.events.shift();
    for (const b of g.birds) {
      const from = this.posOf(b, T);
      const to = g.perch ? g.perch.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2 * g.perchR, Math.random() * 0.6, (Math.random() - 0.5) * 2 * g.perchR))
        : from.clone().add(new THREE.Vector3((Math.random() - 0.5) * 16, 7 + Math.random() * 3, (Math.random() - 0.5) * 16));
      const t0 = T + Math.random() * spread;
      this.setSeg(b, from, to, t0, t0 + Math.max(0.6, from.distanceTo(to) / 6.5), 2, b.yaw, 1);
      b.after = g.perch ? 4 : 3; // then perched, or away
    }
  }

  // where a sparrow is at time T (the CPU twin of qmSeg)
  posOf(b, T) {
    if (b.mode === 0 || b.mode >= 3) return b.p.clone();
    const s = Math.min(1, Math.max(0, (T - b.t0) / Math.max(1e-3, b.t1 - b.t0)));
    if (b.mode === 1) { if (s >= 1) return b.q.clone(); const k = Math.max(1, b.hops), hs = Math.min(s * k, k - 1e-4), f = hs % 1; return b.p.clone().lerp(b.q, (Math.floor(hs) + f * f * (3 - 2 * f)) / k); }
    const e = s * s * (3 - 2 * s), up = b.q.y > b.p.y ? 1 : 0.25;
    return b.p.clone().lerp(b.q, e).add(new THREE.Vector3(0, up * Math.min(1.2, 0.25 * b.p.distanceTo(b.q)) * Math.sin(Math.PI * e), 0));
  }

  setSeg(b, from, to, t0, t1, mode, yaw, hops) {
    b.p = from.clone(); b.q = to.clone(); b.t0 = t0; b.t1 = t1; b.mode = mode; b.yaw = yaw; b.hops = hops;
    const iA = this.birdGeo.attributes.iA.array, iB = this.birdGeo.attributes.iB.array, iC = this.birdGeo.attributes.iC.array, o = b.i * 4;
    iA[o] = from.x; iA[o + 1] = from.y; iA[o + 2] = from.z;
    iB[o] = to.x; iB[o + 1] = to.y; iB[o + 2] = to.z; iB[o + 3] = t0;
    iC[o] = t1; iC[o + 1] = mode; iC[o + 2] = yaw; iC[o + 3] = hops;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.off) { this.unregister?.(); return; }
    this.unregister?.();
    if (this.scene.onBeforeRender !== this.prevBefore) this.scene.onBeforeRender = this.prevBefore || (() => {});
    for (const n of [...this.secs.keys()]) this.dropSection(n);
    for (const m of [this.birds, this.particles]) { m.geometry.dispose(); m.material.dispose(); }
    this.scene.remove(this.root);
  }
}

const _ray = new THREE.Ray(), _v2 = new THREE.Vector2();

export function createAmbient(o) {
  const a = new Ambient(o);
  globalThis.__qmAmbient = a; // for the checks (gen/details/ambient/tools)
  return a;
}
