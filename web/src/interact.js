// Interactions (the user, 2026-10-13: "a couple of places where we can place some interactions with objects ... a
// little bit more interaction with the surroundings"): three things to do beside walking and talking. Data:
// assets/interact.json (places are map IDs, scene views or the clip round's slots, gen/interact/slots.json).
//  - 擊鼓, the gate tower's drum (S5.prop.tower_drum_6898): up in the tower hall, facing the drum, E (a tap on the seal on a
//    touch screen) and you beat it. The drum booms (its own sound, the skin's swell, ink rings, a jolt of the camera)
//    and the town answers: the birds living in the trees round the tower burst out of their crowns and the pigeons
//    off its roof (ambient.js startle), the leaves shiver (wind.js shake) with the rush of wings, and the watchman
//    calls out. The birds come home on their own after half a minute or so; till then another stroke only booms.
//  - 觀景, viewpoints: a few soft glowing spots on the ground at the scroll's best places. Stand on one and E (the user,
//    2026-10-13: an interaction, not a trigger underfoot; a walk across the Rainbow Bridge's crown must not take the
//    camera) and the camera cranes up and circles that place (birdseye.js vista()) with its name in brush; a fresh
//    walk, C, V or Esc bring you down. E again on the spot shows it again, as often as you like.
//  - 同姿, joining the painted people's pose: at the moat bridge's railings, at the Rainbow Bridge's crown and in the
//    storyteller's ring, E puts you among them doing what they do (leaning on the rail over the water, craning to
//    listen), and the camera draws back to show you there; E, Esc or a walk stand you up again.
// The prompt looks like the talk's (an E keycap, a seal to tap), held steady by ui/steady.js; when a painted person's
// talk prompt is up, E is theirs. The first time you do each of them its seal is stamped into the 圖志 (ui.stamp:
// prefs.discovered x:drum, x:vista:<id>, x:join:<id>; the journal's 印譜 leaf shows the eight, stamped or blank).
// The page calls update(dt) after its cameras (world.js tick), drive(avatar, dt) from
// updateAvatar (true: the pose drove the avatar this frame) and reads state() in the checks.
// Cost: a scan every SCAN_S; one draw for every glowing thing (the spots and the drum's rings), no texture.
import * as THREE from 'three';
import { h, seal } from './ui/components.js';
import { Steady } from './ui/steady.js';
import { prefs } from './ui/prefs.js';
import { headOf, personsOf, readSecs } from './ui/bubbles.js';
import { WIND } from './wind.js';
import { NORMAL_OUT } from './post.js';
import './interact.css';

const DEFAULT_ON = true;
const SCAN_S = 0.12;
const DRUM = { reach: 2.6, keep: 3.4, face: 55, faceKeep: 80, cool: 0.55, birdsAgain: 40 };
const SPOT = { r: 1.2, dy: 1.3 }; // a viewpoint's E is offered within r m of it (and dy of height)
const JOIN = { reach: 1.7, keep: 2.3, face: 75, faceKeep: 95 };
const GLIDE_S = 0.55, CAM_IN = 0.9, CAM_OUT = 0.7;
const CAP = 64; // glow instances
const deg = THREE.MathUtils.degToRad;
const ease = (x) => x * x * x * (x * (x * 6 - 15) + 10);
const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
const lerpK = (k, dt) => 1 - Math.pow(1 - k, dt * 60);
const typing = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
const bi = () => prefs.get('lang') === 'zh_en';
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// map bearings (facing_deg: 0 = +X, 90 = +D) and the page: a facing as the avatar's rotation.y (its model looks down
// its +z), and as birdseye's az (the camera's side of its target: (sin az, cos az) on the page's x, z)
const yawOfFacing = (f) => Math.atan2(Math.cos(deg(f)), -Math.sin(deg(f)));
const azOfBearing = (b) => Math.atan2(Math.cos(deg(b)), -Math.sin(deg(b)));

// ---------------------------------------------------------------- the glow (spots, the drum's rings)
// one instanced quad: gA (x, y, z, kind), gB (size, seed, start s, life s); kinds 0 the orb (faces you, bobs), 1 its
// ring on the ground, 2 a faint shaft of light over it (seen from afar, gone when near), 3 a drum ring (grows, fades)
const GLOW_VS = /* glsl */ `
attribute vec2 corner;
attribute vec4 gA, gB;
uniform float uT;
varying vec2 vUv;
varying float vKind, vSeed, vLife, vDist;
void main() {
  vec3 c = gA.xyz;
  float kind = gA.w, size = gB.x;
  vUv = corner; vKind = kind; vSeed = gB.y;
  vLife = gB.w > 0.0 ? clamp((uT - gB.z) / gB.w, 0.0, 1.0) : 0.0;
  vec3 camR = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 camU = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 p;
  if (kind < 0.5) {
    c.y += 0.07 * sin(uT * 1.6 + gB.y * 6.28);
    p = c + (camR * corner.x + camU * corner.y) * size;
  } else if (kind < 1.5) {
    p = c + vec3(corner.x, 0.0, corner.y) * size;
  } else if (kind < 2.5) {
    vec3 to = cameraPosition - c; to.y = 0.0;
    vec3 side = normalize(vec3(-to.z, 0.0, to.x) + vec3(1e-5, 0.0, 0.0));
    p = c + side * corner.x * size * 0.12 + vec3(0.0, (corner.y * 0.5 + 0.5) * size, 0.0);
  } else {
    p = c + (camR * corner.x + camU * corner.y) * size * (0.35 + 1.4 * sqrt(vLife));
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const GLOW_FS = /* glsl */ `
${NORMAL_OUT.declare}
uniform float uT, uDay;
uniform vec3 uFogColor;
uniform vec2 uFog;
varying vec2 vUv;
varying float vKind, vSeed, vLife, vDist;
void main() {
  float r = length(vUv), a;
  vec3 col;
  float breath = 0.5 + 0.5 * sin(uT * 1.5 + vSeed * 6.28);
  if (vKind < 0.5) {
    // a warm white heart in a gold halo; by day a thin amber rim keeps it from washing out on pale ground
    float core = 1.0 - smoothstep(0.12, 0.3, r);
    float halo = 1.0 - smoothstep(0.18, 1.0, r); halo *= halo;
    float rim = smoothstep(0.24, 0.3, r) * (1.0 - smoothstep(0.3, 0.4, r));
    col = mix(vec3(1.0, 0.74, 0.32), vec3(1.0, 0.97, 0.88), core);
    col = mix(col, vec3(0.78, 0.45, 0.12), rim * uDay);
    a = max(core, halo * mix(0.75, 0.5, uDay) * (0.8 + 0.2 * breath)) + rim * 0.45 * uDay;
  } else if (vKind < 1.5) {
    // a cinnabar brush circle on the ground, breathing, a warm glow inside it
    float th = atan(vUv.y, vUv.x);
    float rr = 0.8 + 0.025 * sin(th * 5.0 + vSeed * 9.0) + 0.015 * sin(th * 11.0 + vSeed * 3.0);
    float w = 0.05 + 0.03 * (0.5 + 0.5 * sin(th * 3.0 + vSeed * 5.0));
    float ring = (1.0 - smoothstep(0.0, w, abs(r - rr))) * (0.75 + 0.25 * sin(th * 2.0 + uT * 0.6));
    float glow = (1.0 - smoothstep(0.0, rr, r)) * (1.0 - smoothstep(0.0, rr, r));
    col = mix(vec3(1.0, 0.86, 0.55), vec3(0.71, 0.2, 0.12), smoothstep(0.0, 0.6, ring));
    a = ring * (0.6 + 0.25 * breath) + glow * (0.18 + 0.2 * breath) * mix(1.6, 1.0, uDay);
  } else if (vKind < 2.5) {
    float y = vUv.y * 0.5 + 0.5, x = 1.0 - abs(vUv.x);
    a = x * x * (1.0 - y) * (1.0 - y) * mix(0.6, 0.42, uDay) * smoothstep(4.0, 12.0, vDist) * (0.8 + 0.2 * breath);
    col = vec3(1.0, 0.88, 0.6);
  } else {
    // the drum: an ink ring that widens and fades
    float w = mix(0.1, 0.025, vLife);
    float ring = 1.0 - smoothstep(0.0, w, abs(r - 0.82));
    a = ring * (1.0 - vLife) * (1.0 - vLife) * 0.6;
    col = vec3(0.17, 0.14, 0.12);
  }
  a *= 1.0 - smoothstep(uFog.x, uFog.y, vDist);
  if (a < 0.004) discard;
  gl_FragColor = vec4(mix(col, uFogColor, smoothstep(uFog.x, uFog.y, vDist) * 0.6), min(a, 1.0));
  ${NORMAL_OUT.neutral}
  #include <colorspace_fragment>
}`;

class Glow {
  constructor(scene) {
    const g = this.geo = new THREE.InstancedBufferGeometry();
    g.setAttribute('corner', new THREE.BufferAttribute(new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), 2));
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3));
    for (const k of ['gA', 'gB']) { const a = new THREE.InstancedBufferAttribute(new Float32Array(CAP * 4), 4); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(k, a); }
    g.instanceCount = 0;
    this.u = { uT: { value: 0 }, uDay: { value: 1 }, uFogColor: { value: new THREE.Color() }, uFog: { value: new THREE.Vector2(45, 230) } };
    const m = new THREE.ShaderMaterial({ name: 'interact_glow', uniforms: this.u, vertexShader: GLOW_VS, fragmentShader: GLOW_FS,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const mesh = this.mesh = new THREE.Mesh(g, m);
    mesh.name = 'interact_glow';
    mesh.frustumCulled = false;
    mesh.renderOrder = 1002; // after the sky (1000) and the ambient particles (1001)
    mesh.visible = false;
    scene.add(mesh);
    this.items = []; // { p: Vector3, kind, size, seed, t0, life }
  }
  set(items) {
    this.items = items.slice(0, CAP);
    const A = this.geo.attributes.gA, B = this.geo.attributes.gB;
    this.items.forEach((x, i) => { A.array.set([x.p.x, x.p.y, x.p.z, x.kind], i * 4); B.array.set([x.size, x.seed, x.t0 || 0, x.life || 0], i * 4); });
    A.needsUpdate = B.needsUpdate = true;
    this.geo.instanceCount = this.items.length;
    this.mesh.visible = this.items.length > 0;
  }
}

// ---------------------------------------------------------------- the prompt (the talk's look, its own words)
function promptEl({ touch, label, en, glyph, onTap }) {
  const gloss = bi() && en ? h('span', 'qm-gloss qm-en qm-ix-en', { text: en }) : null;
  if (touch) {
    const b = h('button', 'qm-prompt', { type: 'button', 'aria-label': en || label, title: en || label }, [seal(glyph)]);
    const go = (e) => { e.preventDefault(); e.stopPropagation(); onTap(); };
    b.addEventListener('pointerdown', (e) => e.stopPropagation());
    b.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    b.addEventListener('click', go);
    return h('div', 'qm-prompt-touch-wrap qm-ix-prompt', {}, [b, h('span', '', { text: label }), gloss]);
  }
  return h('div', 'qm-prompt qm-ix-prompt', { 'aria-label': `${en || label} (E)` }, [h('kbd', 'qm-kbd', { text: 'E' }), h('span', '', { text: label }), gloss]);
}

export class Interact {
  // o: { scene, camera, player, sections() (loaded: name -> sec), views (the scene.json spots), people(), avatar(),
  //      birdseye, ambient(), sound(), ui (createUI's), hour(), blocked() (another screen is up), touch, query }
  constructor(o) {
    this.o = o;
    // on by default since the user's sign-off (2026-10-13); ?interact=0 turns it off, ?interact=1 forces it on
    const q = o.query?.get('interact');
    this.off = q === '0' || (q !== '1' && !DEFAULT_ON);
    this.data = null;
    this.t = 0;
    this.acc = 0;
    this.glow = this.off ? null : new Glow(o.scene);
    this.glowKey = '';
    this.ripples = []; // { p, t0, life }
    this.steady = new Steady({ max: 1, showAfter: 0.1, hideAfter: 0.3, minOn: 0.6, minOff: 0.5, stick: 0.75 });
    this.cands = []; // the scan's offers: { key, kind, score, ok, keep, anchor, label, en, glyph, go }
    this.shown = null; // the offer the prompt is for
    this.prompt = null; // { key, anchor (DOM), el }
    this.spots = new Map(); // viewpoint id -> { v, sec, p (Vector3 of the orb), seed }
    this.vista = null; // the viewpoint showing
    this.pose = null; // the pose you hold
    this.drum = { last: -1e9, birds: -1e9, strikes: 0, mesh: null, centre: null, sec: null, pulse: 0, shake: 0 };
    this.shake = new THREE.Vector3();
    this.log = [];
    this._v = new THREE.Vector3(); this._w = new THREE.Vector3(); this._q = new THREE.Quaternion(); this._m = new THREE.Matrix4();
    if (this.off) return;
    this.ready = fetch('assets/interact.json').then((r) => (r.ok ? r.json() : null)).then((d) => { this.data = d; if (d) this.o.ui?.deeds?.(() => this.deeds()); })
      .catch((err) => console.warn('interact off:', err));
    // E and Esc: in the capture phase, so the near talk (ui/index.js) has not acted yet: when its prompt or a
    // conversation is up, the key is the talk's
    addEventListener('keydown', (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || typing() || this.o.blocked?.()) return;
      const talk = this.o.ui?.talk?.();
      if (e.code === 'KeyE') { if (talk?.host || talk?.conv) return; this.interact(); }
      else if (e.code === 'Escape' && this.pose) this.standUp('esc');
    }, { capture: true });
  }

  // ---------------------------------------------------------------- places
  sec(name) { return this.o.sections().get(name) || null; }
  // a place in a loaded section: 'view:<name>', a map ID (an entity or a figure), [X, D] or [X, D, H]; page frame
  placeOf(ref, sec, out = new THREE.Vector3()) {
    if (Array.isArray(ref)) return this.ground(ref[0], ref[1], ref[2], out);
    if (typeof ref !== 'string' || !sec?.layout) return null;
    if (ref.startsWith('view:')) {
      const v = this.o.views?.[`${sec.name}:${ref.slice(5)}`] || this.o.views?.[ref.slice(5)];
      return v ? this.ground(v.X, v.D, v.H, out) : null;
    }
    const L = sec.layout, e = L.entities?.[ref] || L.figures?.find((f) => f.id === ref || f.map_id === ref) || L.trees?.find((t) => t.map_id === ref || t.id === ref);
    if (!e) return null;
    const [X, D] = e.pos || [e.X, e.D];
    return out.set(X, e.H || 0, -D);
  }
  // the walkable surface under (X, D), from H (or the page's ground) up
  ground(X, D, H = null, out = new THREE.Vector3()) {
    const bvh = this.o.player.bvh;
    out.set(X, (H ?? 0) + 2.2, -D);
    if (bvh) {
      const hit = bvh.raycastFirst(new THREE.Ray(out.clone(), new THREE.Vector3(0, -1, 0)), THREE.DoubleSide);
      if (hit && hit.distance < 6) { out.y -= hit.distance; return out; }
    }
    out.y = H ?? 0;
    return out;
  }

  // ---------------------------------------------------------------- per frame (after the page's cameras)
  update(dt) {
    if (this.off || !this.data) return;
    this.t += dt;
    this.acc += dt;
    if (this.acc >= SCAN_S) { this.acc = 0; this.scan(); }
    this.vistaFrame(dt);
    if (this.pose && this.o.birdseye?.active) this.standUp('sky'); // 鳥瞰 (C) over a pose: you stand up, the sky view takes the camera
    if (!this.o.birdseye?.active) this.poseCamera(dt);
    this.drumFrame(dt);
    this.glowFrame();
    this.placePrompt();
  }

  // the offers in reach, the prompt's choice, the viewpoints underfoot
  scan() {
    const D = this.data, pl = this.o.player, P = pl.pos;
    const busy = this.pose || this.vista || this.o.birdseye?.active || this.o.blocked?.();
    const talk = this.o.ui?.talk?.();
    const cands = [];
    if (!busy) {
      const fx = -Math.sin(pl.yaw), fz = -Math.cos(pl.yaw); // where you look
      const facing = (x, z) => { const dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz); return d < 0.3 ? 1 : (dx * fx + dz * fz) / d; };
      // the drum
      const dr = D.drum && this.drumReady();
      if (dr) {
        const S = D.drum.strike, av = this.o.avatar?.();
        if (S?.clip && av && !this.drum.asked?.has(av.model)) { (this.drum.asked ||= new Set()).add(av.model); if (this.hasClip(av, S.clip)) av.model.fetchClip?.(S.clip); } // the stroke comes in as you climb
        this.warm([D.drum.sound, D.drum.startle?.sound, D.drum.startle?.more, D.drum.startle?.leaves]); // and its sounds (sound.js loads on first use)
        const c = this.drum.centre, d = Math.hypot(c.x - P.x, c.z - P.z), dy = Math.abs(c.y - 1.3 - P.y), cos = facing(c.x, c.z);
        if (d < DRUM.keep + 1 && dy < 1.8) cands.push({ key: 'drum', kind: 'drum', score: d, ok: d < DRUM.reach && cos > Math.cos(deg(DRUM.face)),
          keep: d < DRUM.keep && cos > Math.cos(deg(DRUM.faceKeep)), anchor: this._a('drum', c.x, c.y + 0.95, c.z),
          label: D.drum.prompt, en: D.drum.prompt_en, glyph: D.drum.seal, go: () => this.strike() });
      }
      // the poses
      const who = this.o.avatar?.()?.model?.name;
      for (const j of D.join || []) {
        const at = this.joinSpot(j, P, who);
        if (!at) continue;
        const d = Math.hypot(at.p.x - P.x, at.p.z - P.z), dy = Math.abs(at.p.y - P.y);
        if (d > JOIN.keep + 0.5 || dy > 1.0) continue;
        // facing the way they face (the water, the storyteller), or the spot itself
        const fy = at.yaw, ax = Math.sin(fy), az = Math.cos(fy), cosWay = ax * fx + az * fz, cosSpot = facing(at.p.x, at.p.z);
        const cos = Math.max(cosWay, cosSpot);
        cands.push({ key: `join:${j.id}`, kind: 'join', score: d + 0.5, ok: d < JOIN.reach && cos > Math.cos(deg(JOIN.face)),
          keep: d < JOIN.keep && cos > Math.cos(deg(JOIN.faceKeep)), anchor: this._a(`join:${j.id}`, at.p.x, at.p.y + 2.05, at.p.z),
          label: j.prompt, en: j.prompt_en, glyph: j.seal, go: () => this.join(j, at) });
      }
    }
    this.spotOffers(P, busy ? null : cands);
    if (this.pose?.kind === 'drum' && this.pose.phase !== 'out' && !this.o.blocked?.()) {
      const c = this.drum.centre;
      cands.push({ key: 'drum', kind: 'drum', score: 0, ok: true, keep: true, anchor: this._a('drum', c.x, c.y + 0.95, c.z),
        label: D.drum.prompt, en: D.drum.prompt_en, glyph: D.drum.seal, go: () => this.strike() });
    }
    if (this.pose && this.pose.kind === 'join' && this.pose.phase !== 'out') {
      const a = this.o.avatar?.(), q = a?.root.position || P;
      cands.push({ key: 'stand', kind: 'stand', score: 0, ok: true, keep: true, anchor: this._a('stand', q.x, q.y + 2.05, q.z),
        label: D.words?.stand || '起身', en: D.words?.stand_en || 'Stand up', glyph: D.words?.stand_seal || '起', go: () => this.standUp('e') });
    }
    // the near talk wins: its prompt up, ours goes now
    if (talk?.host || talk?.conv) for (const c of cands) c.drop = true; // (holding a pose, a walk or Esc stands you up)
    this.cands = cands;
    const [key] = this.steady.update(this.t, cands);
    this.setPrompt(key ? cands.find((c) => c.key === key) || (this.shown?.key === key ? this.shown : null) : null);
  }
  warm(names) { const sd = this.o.sound?.(); if (sd?.ctx) for (const n of names) if (n) sd.buf(n); }
  _a(key, x, y, z) { const m = (this._anchors ||= new Map()); const v = m.get(key) || new THREE.Vector3(); m.set(key, v); return v.set(x, y, z); }

  setPrompt(c) {
    if ((c?.key || null) === (this.prompt?.key || null) && (!c || c.label === this.prompt.label)) { if (c) this.shown = c; return; }
    this.prompt?.anchor.remove();
    this.prompt = null;
    this.shown = c;
    if (!c) return;
    const el = promptEl({ touch: this.o.touch, label: c.label, en: c.en, glyph: c.glyph, onTap: () => this.interact() });
    const anchor = h('div', 'qm-anchor');
    anchor.style.visibility = 'hidden';
    anchor.append(el);
    this.layer().append(anchor);
    this.prompt = { key: c.key, label: c.label, anchor };
  }
  layer() { return this.o.ui?.root?.querySelector('.qm-anchors') || document.body; }

  placePrompt() {
    const pr = this.prompt, c = this.shown;
    if (!pr || !c) return;
    if (this.pose?.react?.t >= 0) { pr.anchor.style.visibility = 'hidden'; return; } // the drum's cut outside
    const cam = this.o.camera;
    cam.updateMatrixWorld();
    const v = this._v.copy(c.anchor);
    if (v.applyMatrix4(cam.matrixWorldInverse).z > -0.1) { pr.anchor.style.visibility = 'hidden'; return; }
    v.copy(c.anchor).project(cam);
    const TOP = this.o.touch || innerWidth < 640 ? 150 : 112;
    const x = Math.min(innerWidth - 68, Math.max(94, ((v.x + 1) / 2) * innerWidth)), y = Math.min(innerHeight - 30, Math.max(TOP + 40, ((1 - v.y) / 2) * innerHeight));
    if (pr.anchor.style.visibility) pr.anchor.style.visibility = '';
    const tf = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    if (pr.anchor._tf !== tf) { pr.anchor.style.transform = tf; pr.anchor._tf = tf; }
  }

  // E, or a tap on the prompt
  interact() {
    if (this.off || !this.data) return false;
    const c = this.shown;
    if (!c || !this.steady.isOn(c.key)) return false;
    c.go();
    return true;
  }

  // ---------------------------------------------------------------- 擊鼓 the drum
  drumReady() {
    const D = this.data.drum, sec = this.sec(D.section);
    if (!sec) { this.drum.mesh = null; this.drum.sec = null; return false; }
    if (this.drum.sec !== sec) {
      // its mesh in the section's model (the builder's own group for the drum), else its map place
      let mesh = null;
      sec.root?.traverse((o) => { if (!mesh && o.isMesh && o.name === D.mesh) mesh = o; });
      const box = mesh ? new THREE.Box3().setFromObject(mesh) : null;
      this.drum.sec = sec;
      this.drum.mesh = mesh;
      this.drum.centre = box ? box.getCenter(new THREE.Vector3()) : this.placeOf(D.at, sec)?.add(new THREE.Vector3(0, 1.3, 0));
      this.drum.base = mesh ? { p: mesh.position.clone(), s: mesh.scale.clone() } : null;
      this.drum.pivot = box && mesh.parent ? mesh.parent.worldToLocal(box.getCenter(new THREE.Vector3())) : null; // in the mesh's own parent frame
    }
    return !!this.drum.centre;
  }

  // E at the drum: the first press takes you to its nearer skin (a short walk, the camera drawing back inside the hall),
  // then every press is a stroke; a walk takes you away again
  strike() {
    const D = this.data.drum, av = this.o.avatar?.();
    if (!av) return;
    if (this.pose?.kind !== 'drum') {
      if (this.pose) return;
      const P = this.o.player.pos, who = av.model?.name;
      // the nearer skin, at the spot where this character's stick meets it (the clip round, per character)
      const spotOf = (x) => x.spots?.[who] || x.spots?.official || x;
      const st = (D.stands || []).map((x) => ({ x, d: Math.hypot(spotOf(x).X - P.x, -spotOf(x).D - P.z) })).sort((a, b) => a.d - b.d)[0]?.x;
      if (!st) { this.stroke(); return; }
      const sp = spotOf(st);
      const at = { p: new THREE.Vector3(sp.X, sp.H ?? 12.06, -sp.D), yaw: yawOfFacing(st.facing_deg), where: st.side, cam: st.cam, exact: true };
      this.begin('drum', D, at, 'idle');
      this.pose.queue = 1; // the stroke once you are there
      return;
    }
    if (this.pose.phase === 'in') { this.pose.queue = 1; return; }
    this.stroke();
  }

  // one stroke: with the strike clip (the clip round, gen/interact/slots.json "drum") the boom lands when the stick
  // meets the skin; without it, at once
  stroke() {
    const D = this.data.drum, dr = this.drum, now = this.t;
    if (now - dr.last < DRUM.cool) return;
    dr.last = now;
    dr.strikes++;
    const av = this.o.avatar?.(), S = D.strike, P = this.pose;
    const clip = S?.clip && av && P?.kind === 'drum' && av.model.clips.some((c) => c.name === S.clip) ? S.clip : null;
    if (clip) {
      av.play(clip, { fade: 0.08 }); // from the top, however far the last stroke got
      P.strikeT = 0;
      P.strikeLen = S.length || 1.8;
      this.prop(av, S.prop, true);
      clearTimeout(this._boomT);
      this._boomT = setTimeout(() => this.boom(), Math.max(0, (S.hit_by?.[av.model?.name] ?? S.hit_s ?? 0.5) * 1000));
    } else this.boom();
    this.log.push([+now.toFixed(2), 'strike', dr.strikes, clip || '-']);
  }

  boom() {
    const D = this.data.drum, dr = this.drum, c = dr.centre, sd = this.o.sound?.();
    try { if (sd?.ctx && sd.on) sd.voice(D.sound || 'drum_hit', { pos: c, r: 60, group: 'event', gain: 1, rate: 0.97 + Math.random() * 0.06 }); } catch { /* sound is optional */ }
    dr.pulse = 1;
    dr.shake = 1;
    this.stamp('drum');
    const T = performance.now() / 1000;
    for (let i = 0; i < 2; i++) this.ripples.push({ p: c.clone(), t0: T + i * 0.18, life: 1.5 });
    this.glowKey = '';
    WIND.shake(c.x, c.z, D.startle?.radius ?? 60);
    // the birds go once till they are home
    if (this.t - dr.birds > (D.startle?.again_s ?? DRUM.birdsAgain)) {
      dr.birds = this.t;
      setTimeout(() => this.startle(), 180);
      // a cut outside to see them go (the hall's walls hide the trees), and back
      if (D.react && this.pose?.kind === 'drum') this.pose.react = { t: -(D.react.after ?? 0.2), dur: D.react.hold ?? 4 };
    }
    // the watchman calls out (after the first stroke of a while)
    if (!(this.t - (dr.called ?? -1e9) < 25)) { dr.called = this.t; setTimeout(() => this.bark(), 1300); }
  }

  startle() {
    const D = this.data.drum, c = this.drum.centre, amb = this.o.ambient?.(), sd = this.o.sound?.();
    const st = D.startle || {};
    const roof = st.roof ? [{ x: c.x, y: c.y + (st.roof.up ?? 4.5), z: c.z, sp: st.roof.sp || 'pigeon', n: st.roof.n ?? 6 }] : [];
    const n = amb?.startle?.(c, { radius: st.radius ?? 60, trees: st.trees ?? 9, sources: roof }) || 0;
    // the rush of wings and the leaves, from the nearest crowns
    try {
      if (sd?.ctx && sd.on) {
        const trees = this.treesNear(c, st.radius ?? 60).slice(0, 3);
        // the flock at the nearest crown, single birds off the next ones, the leaves' rustle under it
        trees.forEach((t, i) => sd.voice(i === 0 ? st.sound || 'bird_takeoff' : st.more || 'bird_takeoff',
          { pos: t, r: 30, group: 'event', gain: i === 0 ? 1 : 0.7, rate: 0.92 + Math.random() * 0.16, when: 0.1 + i * 0.25 }));
        if (trees[0] && st.leaves) sd.voice(st.leaves, { pos: trees[0], r: 25, group: 'event', gain: 0.55, when: 0.05 });
        if (!trees.length) sd.voice(st.sound || 'bird_takeoff', { pos: c, r: 30, group: 'event', gain: 0.9 });
      }
    } catch { /* sound is optional */ }
    this.log.push([+this.t.toFixed(2), 'startle', n]);
  }

  // a carried part of the avatar's model (prop_<name>: the drumstick), shown only while its clip plays
  prop(av, name, on) { if (name) av.root.traverse((o) => { if (o.isMesh && o.name === `prop_${name}`) o.visible = on; }); }

  treesNear(c, radius) {
    const out = [];
    for (const [, sec] of this.o.sections()) for (const t of sec.layout?.trees || []) {
      if (!(t.height_m >= 3)) continue;
      const p = new THREE.Vector3(t.X, (t.H || 0) + t.height_m * 0.7, -t.D), d = Math.hypot(p.x - c.x, p.z - c.z);
      if (d < radius) out.push([d, p]);
    }
    return out.sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  }

  // the watchman (gate people, tower_watchman) has his say, by the hour
  bark() {
    const D = this.data.drum, B = D.bark, ui = this.o.ui, talk = ui?.talk?.();
    if (!B || !talk || talk.conv) return;
    const sec = this.sec(D.section), p = personsOf(sec)?.get(B.fig);
    if (!p) return;
    const h = this.o.hour?.() ?? 12;
    const set = h >= 5 && h < 17.5 ? B.day : h < 19.5 && h >= 17.5 ? B.dusk : B.night;
    const i = Math.floor(Math.random() * set.say.length), text = set.say[i], en = set.say_en?.[i] || '';
    const bb = talk.bubbles;
    bb.show({ key: 'interact:watchman', owner: 'chat', head: (out) => headOf(p, out), text, en, name: B.name, nameEn: B.name_en, until: bb.t + readSecs(text) + 1.2 });
    this.log.push([+this.t.toFixed(2), 'bark', text]);
  }

  drumFrame(dt) {
    const dr = this.drum;
    // the skin swells and settles
    if (dr.mesh && dr.base && (dr.pulse > 0 || dr._was)) {
      dr.pulse = Math.max(0, dr.pulse - dt * 2.2);
      const k = 1 + 0.035 * dr.pulse * Math.cos((1 - dr.pulse) * 18);
      const m = dr.mesh, c = dr.pivot;
      m.scale.copy(dr.base.s).multiplyScalar(k);
      // about the drum's own middle: p' = c + (p - c) * k
      m.position.copy(dr.base.p).sub(c).multiplyScalar(k).add(c);
      m.updateMatrixWorld();
      dr._was = dr.pulse > 0;
    }
    // the camera jolts (a few centimetres, gone in half a second); never during a viewpoint
    if (dr.shake > 0) {
      dr.shake = Math.max(0, dr.shake - dt * 2.4);
      const near = dr.centre ? 1 - ss(4, 25, this.o.camera.position.distanceTo(dr.centre)) : 0;
      const a = 0.035 * dr.shake * dr.shake * near, t = this.t * 45;
      if (a > 1e-4 && !this.vista) {
        this.o.camera.position.add(this._v.set(Math.sin(t) * a, Math.sin(t * 1.3 + 1) * a * 0.7, Math.cos(t * 0.9) * a));
        this.o.camera.updateMatrixWorld();
      }
    }
    if (this.ripples.length) {
      const T = performance.now() / 1000, n = this.ripples.length;
      this.ripples = this.ripples.filter((r) => T < r.t0 + r.life + 0.1);
      if (this.ripples.length !== n) this.glowKey = '';
    }
  }

  // ---------------------------------------------------------------- 觀景 viewpoints
  // the spots of the loaded sections (their glow), and E offered on the one you stand on (cands: null while busy)
  spotOffers(P, cands) {
    const D = this.data;
    for (const v of D.vistas || []) {
      const sec = this.sec(v.section);
      let s = this.spots.get(v.id);
      if (!sec) { if (s) { this.spots.delete(v.id); this.glowKey = ''; } continue; }
      if (!s || s.sec !== sec) {
        const p = this.placeOf(v.at, sec);
        if (!p) continue;
        s = { v, sec, p, seed: Math.random() };
        this.spots.set(v.id, s);
        this.glowKey = '';
      }
      if (!cands) continue;
      const d = Math.hypot(s.p.x - P.x, s.p.z - P.z), dy = Math.abs(s.p.y - P.y);
      if (d < SPOT.r + 0.6 && dy < SPOT.dy) cands.push({ key: `vista:${v.id}`, kind: 'vista', score: d, ok: d < SPOT.r, keep: d < SPOT.r + 0.4,
        anchor: this._a(`vista:${v.id}`, s.p.x, s.p.y + 1.7, s.p.z), label: D.words?.vista_prompt || '觀景', en: D.words?.vista_prompt_en || 'Take in the view',
        glyph: v.seal, go: () => this.startVista(s) });
    }
  }

  startVista(s) {
    const v = s.v, be = this.o.birdseye;
    if (!be || this.vista || this.pose) return;
    const target = (v.around ? this.placeOf(v.around, s.sec) : s.p.clone()) || s.p.clone();
    target.y += v.look_up ?? 1.2;
    const ok = be.vista({ target, el: deg(v.el_deg ?? 30), dist: v.dist ?? 30, fov: v.fov ?? 40, spin: v.spin ?? 0.8,
      az: v.from_deg != null ? azOfBearing(v.from_deg) : null, seconds: v.seconds ?? 18, onEnd: () => this.endVista() });
    if (!ok) return;
    this.vista = { s, t: 0, banner: null };
    document.documentElement.classList.add('qm-vista');
    this.o.player.frozen = true; // the walk that brought you here stops here (a fresh one ends the view)
    this.setPrompt(null);
    // the place's name in brush (the region banner's look) and the landmark found (the 圖志)
    const el = h('div', 'qm-banner qm-ix-vista', { role: 'status', 'aria-live': 'polite', 'aria-label': `${v.name} ${v.sub || ''}`.trim() }, [
      h('div', 'qm-banner-wash'), h('p', 'qm-banner-name', { text: v.name }), v.seal ? seal(v.seal) : null, v.sub ? h('p', 'qm-banner-sub', { text: v.sub }) : null,
      bi() && v.name_en ? h('span', 'qm-gloss qm-en qm-banner-en', { text: [v.name_en, v.sub_en].filter(Boolean).join(' · ') }) : null]);
    const hint = h('div', 'qm-ix-vista-hint', {}, [h('span', '', { text: this.data.words?.vista_back || '移步即返' }),
      bi() ? h('span', 'qm-gloss', { text: this.data.words?.vista_back_en || 'walk to come back' }) : null]);
    const box = h('div', 'qm-ix-vista-layer', {}, [h('div', 'qm-ix-bar qm-ix-bar-top'), h('div', 'qm-ix-bar qm-ix-bar-bottom'), el, hint]);
    document.body.append(box); // beside the ink UI, which 鳥瞰 fades out (ui/hud.css html.qm-sky .qm-ui)
    this.vista.banner = box;
    requestAnimationFrame(() => box.classList.add('qm-on'));
    if (v.landmark) { const pl = this.o.ui?.places?.(); const m = pl?.byId?.get(v.landmark); if (m) pl.reached(m); }
    this.glowKey = '';
    this.log.push([+this.t.toFixed(2), 'vista', v.id]);
  }

  vistaFrame(dt) {
    const V = this.vista;
    if (!V) return;
    V.t += dt;
    const be = this.o.birdseye;
    // free again once the keys that walked you here are let go (birdseye.js arms the view the same way)
    if (this.o.player.frozen && be?.focus?.armed) this.o.player.frozen = false;
    if (V.banner && !be?.on && !V.leaving) { V.leaving = true; V.banner.classList.remove('qm-on'); }
  }

  endVista() {
    const V = this.vista;
    if (!V) return;
    this.vista = null;
    this.o.player.frozen = false;
    document.documentElement.classList.remove('qm-vista');
    this.glowKey = '';
    this.stamp(`vista:${V.s.v.id}`); // its seal once the view is over (鳥瞰 hides the ink UI, the note with it)
    const b = V.banner;
    if (b) { b.classList.remove('qm-on'); setTimeout(() => b.remove(), 900); }
  }

  // ---------------------------------------------------------------- 同姿 joining a pose
  // where you would stand to join `j` from P: a rail's standing line (the nearest free point on it), a slot, a ring
  // who: the avatar's character (the clip round measured each one's own line, spot and clip: gen/interact/slots.json)
  joinSpot(j, P, who) {
    const sec = this.sec(j.section);
    if (!sec) return null;
    if (j.kind === 'rail') {
      let best = null;
      for (const r of j.rails || []) {
        const [a, b] = r.lines?.[who] || r.line, ax = a[0], az = -a[1], bx = b[0], bz = -b[1];
        const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
        let u = THREE.MathUtils.clamp(((P.x - ax) * dx + (P.z - az) * dz) / L2, 0, 1);
        // inside a free range (along X), else its nearest end
        const X = ax + u * dx, free = r.free_by?.[who] || r.free || [[Math.min(ax, bx), Math.max(ax, bx)]];
        let fx = null, fd = Infinity;
        for (const [x0, x1] of free) { const q = THREE.MathUtils.clamp(X, x0 + 0.05, x1 - 0.05), dd = Math.abs(q - X); if (dd < fd) { fd = dd; fx = q; } }
        if (fx == null) continue;
        u = THREE.MathUtils.clamp((fx - ax) / (dx || 1e-6), 0, 1);
        const x = ax + u * dx, z = az + u * dz, d = Math.hypot(x - P.x, z - P.z);
        if (!best || d < best.d) best = { d, X: x, D: -z, H: r.H, facing: r.facing_deg, clip: r.clip, rail: r.id };
      }
      if (!best) return null;
      // the root held at the rail's own H (the clip's elbows sit on the rail there; a plank would lift them), else grounded
      const p = best.H != null ? new THREE.Vector3(best.X, best.H, -best.D) : this.ground(best.X, best.D, 0);
      return { p, yaw: yawOfFacing(best.facing), facing: best.facing, clip: best.clip, where: best.rail, exact: best.H != null };
    }
    if (j.kind === 'slots') {
      let best = null;
      for (const s of j.slots || []) { const d = Math.hypot(s.X - P.x, -s.D - P.z); if (!best || d < best.d) best = { d, s }; }
      if (!best || best.d > 8) return null;
      const s = who === 'child' && best.s.child ? { ...best.s.child, id: best.s.id } : best.s; // the child holds the rail top on a tread of its own
      const p = s.H != null ? new THREE.Vector3(s.X, s.H, -s.D) : this.ground(s.X, s.D, P.y); // no H: the ground there
      return { p, yaw: yawOfFacing(s.facing_deg), facing: s.facing_deg, clip: s.clip, where: s.id, exact: s.H != null };
    }
    if (j.kind === 'ring') {
      const c = this.placeOf(j.around, sec, new THREE.Vector3());
      if (!c) return null;
      const dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz);
      const [r0, r1] = j.ring || [1.8, 5];
      if (d < r0 - 0.4 || d > r1 + 0.6) return null;
      const r = THREE.MathUtils.clamp(d, r0, r1), k = r / Math.max(d, 1e-3);
      const p = this.ground(c.x + dx * k, -(c.z + dz * k), P.y);
      return { p, yaw: Math.atan2(c.x - p.x, c.z - p.z), clip: j.clip, where: 'ring', free: true };
    }
    return null;
  }

  hasClip(av, name) { const m = av.model; return !!(name && (m.clips.some((c) => c.name === name) || m.lazy?.has(name))); }
  // the clip the avatar plays at `j`: the spot's own (a child's, if it has one), else the first of the fallbacks it has
  clipFor(j, at, av) {
    const kind = av.model?.name;
    const list = [j.clips?.[kind], at.clip, j.clip, ...(j.fallback || []), 'look', 'idle'].filter(Boolean);
    return list.find((c) => this.hasClip(av, c)) || 'idle';
  }

  join(j, at) {
    const av = this.o.avatar?.();
    if (!av || this.pose) return;
    const clip = this.clipFor(j, at, av);
    this.begin('join', j, at, clip);
    this.stamp(`join:${j.id}`);
    this.log.push([+this.t.toFixed(2), 'join', j.id, at.where, clip, av.model?.name]);
  }

  // the 圖志's seal for this interaction, the first time (ui/index.js stamp: a note slip, then the journal's 印譜 leaf)
  stamp(key) { const d = this.deeds().find((x) => x.key === key); if (d) this.o.ui?.stamp?.(d); }
  // the eight, in the journal's order (the drum, the viewpoints west to east as the data lists them, the poses)
  deeds() {
    const D = this.data;
    if (!D) return [];
    const one = (key, it) => ({ key, seal: it.seal, name: it.deed || it.name, name_en: it.deed_en || it.name_en || '', line: it.deed_line || '', line_en: it.deed_line_en || '',
      section: it.section });
    return [one('drum', D.drum), ...(D.vistas || []).map((v) => one(`vista:${v.id}`, v)), ...(D.join || []).map((j) => one(`join:${j.id}`, j))];
  }

  // a pose begins: a short walk onto its spot (GLIDE_S), then its clip; the camera draws back to show you there
  begin(kind, j, at, clip) {
    const av = this.o.avatar?.(), pl = this.o.player;
    this.pose = { kind, j, at, clip, p: at.p.clone(), yaw: at.yaw, from: av.root.position.clone(), fromYaw: av.root.rotation.y,
      t: 0, phase: 'in', w: 0, yaw0: pl.yaw, pitch0: pl.pitch, armed: pl.input().lengthSq() < 0.01 };
    pl.vel?.set(0, 0, 0);
    this.setPrompt(null);
    this.steady.reset();
    // a clip still on its way (per-clip files): ask now, the walk covers most of the wait
    if (!av.model.clips.some((c) => c.name === clip)) av.model.fetchClip?.(clip);
  }

  standUp(why) {
    const P = this.pose;
    if (!P || P.phase === 'out') return;
    P.phase = 'out';
    P.tOut = 0;
    clearTimeout(this._boomT);
    this.log.push([+this.t.toFixed(2), 'stand', why]);
  }

  // world.js updateAvatar: while a pose holds, it places and poses the avatar (true), else the page does (false)
  drive(av, dt) {
    const P = this.pose;
    if (!P || this.off) return false;
    const pl = this.o.player;
    P.t += dt;
    // the head shows while the camera stands back (first person hides it)
    if (av.first) { av.first = false; av.head?.scale.setScalar(1); av.root.traverse((o) => { if (o.isMesh) o.castShadow = true; }); }
    const moving = pl.input().lengthSq() > 0.01;
    if (!P.armed && !moving) P.armed = true;
    if (P.armed && moving && P.phase !== 'out') this.standUp('walk');
    const hold = () => {
      // at the drum: the stroke while it lasts, then standing ready
      if (P.kind === 'drum' && P.strikeT != null) { if ((P.strikeT += dt) < P.strikeLen) return null; P.strikeT = null; this.prop(av, this.data.drum.strike?.prop, false); }
      return P.clip;
    };
    if (P.phase === 'in') {
      // a short walk onto the spot, turning to face the way they face
      const k = Math.min(1, P.t / GLIDE_S), e = ease(k);
      av.root.position.lerpVectors(P.from, P.p, e);
      av.root.rotation.y = P.fromYaw + wrap(P.yaw - P.fromYaw) * e;
      pl.pos.copy(av.root.position);
      pl.vel?.set(0, 0, 0);
      const want = k < 1 && P.from.distanceTo(P.p) > 0.25 ? 'walk' : P.clip;
      if (av.clip !== want && !(av.pending && av.pending.name === want)) av.play(want, { fade: want === 'walk' ? 0.15 : 0.35 });
      if (k >= 1) {
        P.phase = 'on';
        if (av.clip !== P.clip) av.play(P.clip, { fade: 0.35 });
        if (P.queue) { P.queue = 0; this.stroke(); }
      }
    } else if (P.phase === 'on') {
      if (P.at.free) P.p.copy(pl.pos); // in a ring: where the crowd lets you stand (people.js pushOut)
      else if (!P.at.exact) P.p.y = pl.pos.y; // on a rail's line the floor is the walker's own
      av.root.position.copy(P.p);
      av.root.rotation.y = P.yaw;
      if (!moving && !P.at.free && pl.pos.distanceToSquared(P.p) > 1e-4) { pl.pos.x = P.p.x; pl.pos.z = P.p.z; }
      const want = hold();
      if (want && av.clip !== want && !(av.pending && av.pending.name === want)) av.play(want, { fade: 0.35 });
      av.keepLooping?.();
    } else {
      // standing up: the walk's own animation takes over once the camera is back
      if (av.clip !== 'idle') av.play('idle', { fade: 0.3 });
      av.root.position.copy(pl.pos);
      if (P.kind === 'drum') this.prop(av, this.data.drum.strike?.prop, false);
      if ((P.tOut += dt) > CAM_OUT) this.pose = null;
    }
    av.mixer.update(dt);
    return true;
  }

  // the camera while you hold a pose: drawn back beside you, looking past you the way you face (the water, the
  // storyteller), or at the drum from inside the hall (its own spot: the hall's walls are not colliders); a drag still
  // turns it. It blends in from the walking view the page placed this frame, and back out to it.
  poseCamera(dt) {
    const P = this.pose;
    if (!P) return;
    const cam = this.o.camera, pl = this.o.player, av = this.o.avatar?.();
    if (!av) return;
    const turn = wrap(pl.yaw - P.yaw0), tilt = THREE.MathUtils.clamp(pl.pitch - P.pitch0, -0.5, 0.4);
    let wantP, tgt;
    const R = P.react;
    if (R) R.t += dt;
    if (R && R.t >= 0 && R.t < R.dur && P.phase !== 'out') {
      // the cut outside: held, with a slow push toward the tower
      const c = this.data.drum.react, k = 0.08 * (R.t / R.dur);
      const a = new THREE.Vector3(c.at[0], c.at[2], -c.at[1]), l = new THREE.Vector3(c.look[0], c.look[2], -c.look[1]);
      cam.position.copy(a).lerp(l, k);
      cam.lookAt(l);
      cam.updateMatrixWorld();
      return;
    }
    if (R && R.t >= R.dur) P.react = null;
    if (P.at.cam?.at) {
      const c = P.at.cam;
      wantP = new THREE.Vector3(c.at[0], c.at[2], -c.at[1]);
      tgt = new THREE.Vector3(c.look[0], c.look[2], -c.look[1]);
      // a drag turns the look a little about the camera
      const d = tgt.sub(wantP), k = THREE.MathUtils.clamp(turn, -0.6, 0.6);
      d.applyAxisAngle(new THREE.Vector3(0, 1, 0), k).y -= tilt * d.length();
      tgt = wantP.clone().add(d);
    } else {
      const C = P.j.cam || {};
      const dist = C.dist ?? 3.4, up = C.up ?? 1.1;
      // bearing_deg: where the camera stands round you, 0 in front of your face .. 180 behind you; a drag turns it
      const face = P.yaw;
      P.side ??= this.clearSide(P, C); // the side of you with no tree crown where the camera would stand
      const az = face + deg(C.bearing_deg ?? 150) * P.side + turn;
      tgt = this._w.copy(av.root.position).add(this._v.set(Math.sin(face) * (C.ahead ?? 0.8), C.look_h ?? 1.0, Math.cos(face) * (C.ahead ?? 0.8))).clone();
      const el = Math.atan2(up, dist) - tilt;
      const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
      let r = dist;
      if (pl.bvh) {
        // the rail you lean on is right in front of you: what is nearer than `clear` m doesn't count
        const hit = pl.bvh.raycastFirst(new THREE.Ray(tgt.clone(), dir.clone()), THREE.DoubleSide, C.clear ?? 0.2);
        if (hit && hit.distance < r + 0.3) r = Math.max(0.8, hit.distance - 0.3);
      }
      P._r = P._r == null ? r : r < P._r ? r : THREE.MathUtils.lerp(P._r, r, lerpK(0.05, dt));
      wantP = tgt.clone().addScaledVector(dir, P._r);
    }
    const wantQ = new THREE.Quaternion().setFromRotationMatrix(this._m.lookAt(wantP, tgt, cam.up));
    // the walking view this frame <-> the pose's: in over CAM_IN, out over CAM_OUT
    const e = P.phase === 'out' ? 1 - ease(Math.min(1, P.tOut / CAM_OUT)) : ease((P.w = Math.min(1, P.w + dt / CAM_IN)));
    cam.position.lerp(wantP, e);
    cam.quaternion.slerp(wantQ, e);
    cam.updateMatrixWorld();
  }

  // the pose camera stands on whichever side of you (bearing_deg or its mirror) keeps it out of the trees' crowns
  // (the 3D trees are not colliders: a camera inside one sees only twigs)
  clearSide(P, C) {
    const face = P.yaw, dist = C.dist ?? 3.4, up = C.up ?? 1.1, p = P.p;
    const cost = (sign) => {
      const az = face + deg(C.bearing_deg ?? 150) * sign, el = Math.atan2(up, dist);
      const x = p.x + Math.sin(face) * (C.ahead ?? 0.8) + Math.sin(az) * Math.cos(el) * dist;
      const z = p.z + Math.cos(face) * (C.ahead ?? 0.8) + Math.cos(az) * Math.cos(el) * dist;
      const y = p.y + (C.look_h ?? 1) + Math.sin(el) * dist;
      let c = 0;
      for (const [, sec] of this.o.sections()) for (const t of sec.layout?.trees || []) {
        const r = Math.max(1, (t.crown_m || t.height_m * 0.45) * 0.5) + 0.6, d = Math.hypot(t.X - x, -t.D - z);
        if (d < r && y < (t.H || 0) + t.height_m + 0.5) c += r - d;
      }
      return c;
    };
    return cost(1) <= cost(-1) ? 1 : -1;
  }

  // ---------------------------------------------------------------- the glow's instances
  glowFrame() {
    if (!this.glow) return;
    const g = this.glow, T = performance.now() / 1000;
    g.u.uT.value = T;
    const h = this.o.hour?.() ?? 12;
    g.u.uDay.value = ss(5.2, 7, h) * (1 - ss(17.8, 19.4, h));
    const fog = this.o.scene.fog;
    if (fog) { g.u.uFogColor.value.copy(fog.color); g.u.uFog.value.set(fog.near, fog.far); }
    // a spot dims while its view shows
    const showing = this.vista?.s || null;
    const key = [...this.spots.values()].map((s) => `${s.v.id}${s === showing ? 0 : 1}`).join() + `|${this.ripples.length}`;
    if (key === this.glowKey) return;
    this.glowKey = key;
    const items = [];
    for (const s of this.spots.values()) {
      const on = s !== showing, p = s.p;
      items.push({ p: new THREE.Vector3(p.x, p.y + 0.75, p.z), kind: 0, size: on ? 0.5 : 0.275, seed: s.seed });
      items.push({ p: new THREE.Vector3(p.x, p.y + 0.03, p.z), kind: 1, size: 1.15, seed: s.seed });
      if (on) items.push({ p: new THREE.Vector3(p.x, p.y, p.z), kind: 2, size: 4.5, seed: s.seed });
    }
    for (const r of this.ripples) items.push({ p: r.p, kind: 3, size: 1.1, seed: 0, t0: r.t0, life: r.life });
    g.set(items);
  }

  state() {
    return {
      ready: !!this.data, off: this.off,
      prompt: this.prompt ? { key: this.prompt.key, label: this.prompt.label, shown: this.prompt.anchor.style.visibility !== 'hidden' } : null,
      offers: this.cands.map((c) => ({ key: c.key, ok: c.ok, keep: c.keep, score: +c.score.toFixed(2) })),
      pose: this.pose ? { kind: this.pose.kind, clip: this.pose.clip, phase: this.pose.phase, where: this.pose.at?.where, p: this.pose.p.toArray().map((v) => +v.toFixed(3)), yaw: +this.pose.yaw.toFixed(3) } : null,
      vista: this.vista ? { id: this.vista.s.v.id, t: +this.vista.t.toFixed(2) } : null,
      spots: [...this.spots.values()].map((s) => ({ id: s.v.id, p: s.p.toArray().map((v) => +v.toFixed(2)) })),
      drum: { ready: !!this.drum.centre, centre: this.drum.centre?.toArray().map((v) => +v.toFixed(2)) ?? null, strikes: this.drum.strikes, mesh: !!this.drum.mesh },
      glow: this.glow?.geo.instanceCount ?? 0, log: this.log.slice(-20),
    };
  }
}
