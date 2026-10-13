// The walker: mouse (pointer lock) + WASD on desktop, two-thumb touch on phones.
// Collision: a capsule pushed out of the street's collider triangles via three-mesh-bvh shapecast,
// the same approach Messenger uses; then out of the people around it (pushOut hook).
// mode 'first' puts the camera at the eyes; in 'third' a FollowCam (followcam.js) places it and the walker only
// moves. velocity is the horizontal movement of the last update, for the avatar's animation and facing.
// Moving platforms (boats.js): `platforms` steps the boats with each walker update (so tools that call update()
// themselves move the boats too) and says which boat deck is underfoot; standing on one, the walker is carried
// with it (position and turn) before its own move. Ground friction: standing still on ground no steeper than 40
// degrees, the push out of the ground is taken straight up, so nobody creeps downhill (before: 0.1 m/s at 10
// degrees, 0.23 m/s at 33, on a gently rocking deck too); walking, and steeper faces, push as before.
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

const RADIUS = 0.3;
const HEIGHT = 1.75;
const GRAVITY = -30;
const STEP = 0.35; // highest ledge the walker steps up without jumping
const _e = new THREE.Vector3(), _mi = new THREE.Matrix4();
// ground friction on slopes up to this (the world's walk limit is 34 degrees: the gate's flights; steeper faces push
// as before, so they stay walls)
const FRICTION_DEG = 40, FRICTION_COS = Math.cos(THREE.MathUtils.degToRad(FRICTION_DEG));

// the colliders of the loaded sections as one: what player.bvh offers the page and the tools (shapecast, raycastFirst)
export class MultiBVH {
  constructor(list) { this.list = list; }
  shapecast(callbacks) { for (const b of this.list) if (b.shapecast(callbacks)) return true; return false; }
  raycastFirst(ray, side, near, far) {
    let best = null;
    for (const b of this.list) { const h = b.raycastFirst(ray, side, near, far); if (h && (!best || h.distance < best.distance)) best = h; }
    return best;
  }
  raycast(ray, side, near, far) { return this.list.flatMap((b) => b.raycast(ray, side, near, far)); }
  closestPointToPoint(point, target = {}, min = 0, max = Infinity) {
    let found = false;
    const tmp = this._tmp || (this._tmp = {});
    for (const b of this.list) {
      const r = b.closestPointToPoint(point, tmp, min, max);
      if (!r || r.distance >= max) continue;
      found = true;
      max = r.distance;
      (target.point ||= new THREE.Vector3()).copy(r.point);
      target.distance = r.distance;
      target.faceIndex = r.faceIndex;
    }
    return found ? target : null;
  }
}

export class Player {
  constructor(camera, dom, settings) {
    this.camera = camera;
    this.s = settings;
    this.pos = new THREE.Vector3(0, 0.2, 1);
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.frozen = false;
    this.keys = new Set();
    this.move = new THREE.Vector2(); // touch joystick
    this.bvh = null;
    this._seg = new THREE.Line3();
    this._box = new THREE.Box3();
    this._tri = new THREE.Vector3();
    this._cap = new THREE.Vector3();
    this.isTouch = matchMedia('(pointer: coarse)').matches;
    this.mode = 'first';
    this.pushOut = null; // (feetPosition, radius) => moves feetPosition out of other bodies
    this.velocity = new THREE.Vector3();
    this.running = false;
    this.platforms = null; // { step(dt), supportOf(pos) -> MovingBVH | null } (boats.js)
    this.ride = null; // the platform underfoot: { mover, local (feet in its frame), yaw (its heading), at (feet then) }
    this.friction = true; // ground friction (below); false restores the old slide, for A/B

    addEventListener('keydown', (e) => this.keys.add(e.code));
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    dom.addEventListener('click', () => { if (!this.isTouch && !this.frozen) dom.requestPointerLock(); });
    addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== dom || this.frozen) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * 0.0022, ...this.pitchRange());
    });
    this._touches = new Map();
    dom.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) this._touches.set(t.identifier, { x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY, left: t.clientX < innerWidth / 2 });
      e.preventDefault();
    }, { passive: false });
    dom.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        const s = this._touches.get(t.identifier);
        if (!s) continue;
        if (!s.left && !this.frozen) {
          this.yaw -= (t.clientX - s.x) * 0.006;
          this.pitch = THREE.MathUtils.clamp(this.pitch - (t.clientY - s.y) * 0.006, ...this.pitchRange());
        }
        s.x = t.clientX; s.y = t.clientY;
      }
      e.preventDefault();
    }, { passive: false });
    const end = (e) => { for (const t of e.changedTouches) this._touches.delete(t.identifier); };
    dom.addEventListener('touchend', end);
    dom.addEventListener('touchcancel', end);
  }

  // third person keeps the camera within 45 degrees of level, as Messenger does
  pitchRange() { return this.mode === 'third' ? [-0.8, 0.45] : [-1.4, 1.4]; }

  setCollider(geometry) {
    this.bvh = new MeshBVH(geometry);
  }

  // several colliders (world.js: one BVH per loaded section, one for the edge walls), behind one bvh interface
  setColliders(list) {
    this.bvh = list.length === 1 ? list[0] : new MultiBVH(list);
  }

  input() {
    const k = this.keys;
    let x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    let y = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    for (const s of this._touches.values()) {
      if (!s.left) continue;
      x += THREE.MathUtils.clamp((s.x - s.x0) / 60, -1, 1);
      y += THREE.MathUtils.clamp(-(s.y - s.y0) / 60, -1, 1);
    }
    const v = new THREE.Vector2(x, y);
    if (v.length() > 1) v.normalize();
    return v;
  }

  // push a capsule standing at feet position p out of the collider; returns the corrected feet position
  resolve(p) {
    const seg = this._seg, box = this._box;
    seg.start.set(p.x, p.y + RADIUS, p.z);
    seg.end.set(p.x, p.y + HEIGHT - RADIUS, p.z);
    box.makeEmpty().expandByPoint(seg.start).expandByPoint(seg.end);
    box.min.addScalar(-RADIUS); box.max.addScalar(RADIUS);
    this.bvh.shapecast({
      intersectsBounds: (b) => b.intersectsBox(box),
      intersectsTriangle: (tri) => {
        const d = tri.closestPointToSegment(seg, this._tri, this._cap);
        if (d < RADIUS) {
          const dir = this._cap.sub(this._tri).normalize();
          seg.start.addScaledVector(dir, RADIUS - d);
          seg.end.addScaledVector(dir, RADIUS - d);
        }
      },
    });
    return new THREE.Vector3(seg.start.x, seg.start.y - RADIUS, seg.start.z);
  }

  update(dt) {
    this.platforms?.step(dt);
    if (this.frozen) { this.ride = null; return; }
    const s = this.s;
    // carried by the deck you stand on: where its last step took the spot you stood on, turned as it turned
    // (a teleport since then, by the page or a tool, ends the ride)
    const ride = this.ride;
    if (ride && ride.at.distanceToSquared(this.pos) < 1e-6) {
      const M = ride.mover.matrix;
      this.pos.copy(ride.local).applyMatrix4(M);
      _e.set(1, 0, 0).transformDirection(M);
      const yaw = Math.atan2(-_e.z, _e.x);
      this.yaw += yaw - ride.yaw;
    }
    const inp = this.input();
    const run = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    this.running = run;
    const speed = s.walkSpeed * (run ? s.runMultiplier : 1);
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const move = fwd.multiplyScalar(inp.y * speed * dt).addScaledVector(right, inp.x * speed * dt);

    this.vel.y = this.onGround ? GRAVITY * dt : this.vel.y + GRAVITY * dt;
    const target = this.pos.clone().add(move);
    target.y += this.vel.y * dt;

    const before = this.pos.clone();
    if (this.bvh) {
      let fixed = this.resolve(target);
      const wanted = Math.hypot(move.x, move.z);
      // ground friction: standing still on ground no steeper than FRICTION_DEG, the push out of it goes straight up
      // (the height that clears the same surface), so gravity's sink into a slope never becomes a slide down it.
      // Walking is untouched (its pace up a flight, its steps, its slide along walls are as before)
      const px = fixed.x - target.x, py = fixed.y - target.y, pz = fixed.z - target.z, pl = Math.hypot(px, py, pz);
      if (this.friction && wanted < 1e-4 && py > 1e-6 && py > FRICTION_COS * pl) fixed.set(target.x, target.y + (pl * pl) / py, target.z);
      const flat = (p) => Math.hypot(p.x - this.pos.x, p.z - this.pos.z);
      if (this.onGround && wanted > 1e-4 && flat(fixed) < wanted * 0.6) {
        // blocked: retry the same move lifted by a step height (curbs, thresholds); gravity settles it after
        const lifted = target.clone();
        lifted.y = this.pos.y + STEP;
        const stepped = this.resolve(lifted);
        if (flat(stepped) > flat(fixed) + 0.005) {
          // a real step lands on a ledge: drop back down and require support at most STEP above us
          // (rejects sliding up leaning trunks or onto jars and benches)
          // settle in small drops so the capsule rests on the ledge top instead of being pushed off its edge
          let landed = stepped;
          for (let i = 0; i < 5; i++) {
            landed = landed.clone();
            landed.y -= (STEP + 0.05) / 5;
            landed = this.resolve(landed);
          }
          const rise = landed.y - this.pos.y;
          if (rise > 0.02 && rise <= STEP + 0.02 && flat(landed) > flat(fixed) + 0.005) fixed = landed;
        }
      }
      const dy = fixed.y - target.y;
      this.onGround = dy > Math.abs(dt * this.vel.y * 0.25);
      // other people have volume: step out of them, then make sure that didn't push us into a wall
      if (this.pushOut && this.pushOut(fixed, RADIUS)) fixed = this.resolve(fixed);
      this.pos.copy(fixed);
      if (this.onGround) this.vel.y = 0;
    } else {
      this.pos.copy(target);
    }
    if (this.pos.y < -10) { this.pos.set(0, 1, 1); this.vel.set(0, 0, 0); }
    if (dt > 0) this.velocity.set((this.pos.x - before.x) / dt, 0, (this.pos.z - before.z) / dt);
    // standing on a deck: remember the spot in its frame, for its next step
    const mover = this.onGround && this.platforms ? this.platforms.supportOf(this.pos) : null;
    if (mover) {
      const M = mover.matrix;
      _e.set(1, 0, 0).transformDirection(M);
      this.ride = { mover, local: (this.ride?.local || new THREE.Vector3()).copy(this.pos).applyMatrix4(_mi.copy(M).invert()), yaw: Math.atan2(-_e.z, _e.x), at: (this.ride?.at || new THREE.Vector3()).copy(this.pos) };
    } else this.ride = null;

    if (this.mode === 'first') {
      this.camera.position.set(this.pos.x, this.pos.y + s.eyeHeight, this.pos.z);
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    }
  }
}
