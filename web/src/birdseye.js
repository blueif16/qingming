// 鳥瞰, the bird's-eye view (the user, 2026-10-13: "a camera view that you can switch on almost at every setting, in
// every place ... that just switches to a camera view that's on top and captures. It sort of rotates to give you the
// feeling"): the games' viewpoint sweep. The camera cranes up from wherever it is to a high oblique view over you, near
// the scroll's own angle (the painting looks down on the town from about 40 degrees), and circles slowly round you.
// It is a layer over the view you walk in: first or third person places the camera as always, then update() takes
// it from that pose to the high one (the crane up takes ENTER s, the way back EXIT s), so coming down lands exactly in
// that view. Positions blend round you (distance, angle, bearing), so the crane is an arc, never a cut through a roof.
// The circle's bearing is the walker's yaw (the circling turns it): a drag turns the circle by hand, and the view you
// come back to faces the way the high one looked. A vertical drag tilts it; the wheel or a pinch brings it nearer or
// further. Walking (keys, the left thumb), C, V, Esc or the tile bring you back down. The camera keeps a clear line to
// you: blocked, it climbs to a steeper angle first, then comes nearer; under a roof it stays under it.
// A longer lens than walking (FOV) flattens the town a little towards the painting's parallel view.
// Off, update() returns at once.
// A viewpoint (vista(): the glowing spots of interact.js, the user, 2026-10-13: "when the character walks to the place,
// it's going to automatically trigger the ... view, so that we get a pretty cool feel, just like rotating around"):
// the same crane and circle, round a chosen point (a bridge's crown, the gate tower) at that place's own angle,
// distance, lens and pace, for a set time, then back down. The walk that brought you there doesn't end it: only a
// fresh one (the keys let go first), C, V, Esc or the tile.
import * as THREE from 'three';

const ENTER = 2.4, EXIT = 1.2; // seconds of the crane up and of the way back down
const SPIN = (2 * Math.PI) / 110; // rad/s: once round in 110 s
const EL = [0.3, 1.3]; // the angle above level (rad), 17 to 75 degrees
const DIST = [7, 55]; // metres from you
const FOV = 40; // degrees (walking: 55)
const CLEAR = 0.6; // metres the camera keeps from anything between it and you
const HEAD = 1.2; // the point circled: this far above your feet
const lerpK = (k, dt) => 1 - Math.pow(1 - k, dt * 60); // k per 60 Hz frame, as followcam.js
const ease = (x) => x * x * x * (x * (x * 6 - 15) + 10); // smootherstep
const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
const typing = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');

// o: { camera, player, dom (the canvas), fov() (the walking FOV), blocked() (another screen is up), onChange(on) }
export class BirdsEye {
  constructor(o) {
    this.o = o;
    this.camera = o.camera;
    this.player = o.player;
    this.on = false;
    this.w = 0; // 0: the walking view, 1: the high view
    this.el = 0.7; // the wanted angle and distance: set by drags, the wheel, a pinch; kept for the visit
    this.dist = 24;
    this.spin = 1; // the circling's speed (1 = SPIN; 0 holds still, -1 the other way)
    this._el = this.el; // what the camera uses, after the line-of-sight checks
    this._dist = this.dist;
    this.target = new THREE.Vector3();
    this._pitch0 = 0;
    this._ray = new THREE.Ray();
    this._d = new THREE.Vector3();
    this._v = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._fwd = new THREE.Vector3();
    this.focus = null; // a viewpoint's circle (vista()), till the way down ends

    addEventListener('keydown', (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || typing()) return;
      if (e.code === 'KeyC' && !o.blocked?.()) this.toggle();
      else if (e.code === 'Escape' && this.on && !o.blocked?.()) this.set(false);
    });
    addEventListener('wheel', (e) => {
      if (!this.on) return;
      this.dist = THREE.MathUtils.clamp(this.dist * (e.deltaY > 0 ? 1.1 : 0.91), ...DIST);
    }, { passive: true });
    // a pinch (two fingers) brings it nearer or further; the player's own touch handling still turns the circle
    let pinch = 0;
    const span = (e) => (e.touches.length < 2 ? 0 : Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY));
    o.dom?.addEventListener('touchstart', (e) => { pinch = span(e); }, { passive: true });
    o.dom?.addEventListener('touchmove', (e) => {
      const d = span(e);
      if (this.on && pinch > 0 && d > 0) this.dist = THREE.MathUtils.clamp(this.dist * (pinch / d), ...DIST);
      pinch = d;
    }, { passive: true });
  }

  // in the high view, or on the way up or down (the avatar shows whole meanwhile)
  get active() { return this.w > 0; }
  // your whole body shows once the camera is clear of your head (first person hides the head)
  get body() { return this.w > 0 && this.r > 0.9; }

  set(on) {
    on = !!on;
    if (on === this.on) return;
    if (on && this.o.blocked?.()) return;
    this.on = on;
    const pl = this.player;
    if (on) {
      this._pitch0 = this._pitchSeen = pl.pitch;
      if (this.w === 0) this._first = true;
    } else {
      pl.pitch = this._pitch0; // the view you come back to looks as it did (the tilt was the circle's)
    }
    document.documentElement.classList.toggle('qm-sky', on);
    this.o.onChange?.(on);
  }

  toggle() { this.set(!this.on); }

  // a viewpoint: circle `target` (a Vector3) at el (rad) and dist (m), lens fov, pace spin (1 = SPIN), from bearing az
  // (rad, the camera's side of the target; default: where the camera is now), for `seconds`; onEnd() once back down
  vista({ target, el = 0.6, dist = 30, fov = FOV, spin = 1, az = null, seconds = 18, onEnd = null }) {
    if (this.on || this.o.blocked?.()) return false;
    const pl = this.player, cam = this.camera;
    const now = Math.atan2(cam.position.x - target.x, cam.position.z - target.z);
    this.focus = { target: target.clone(), fov, spin, seconds, onEnd, t: 0, armed: pl.input().lengthSq() < 0.01,
      off: wrap((az ?? now) - pl.yaw), keep: { el: this.el, dist: this.dist, spin: this.spin } };
    this.el = THREE.MathUtils.clamp(el, ...EL);
    this.dist = THREE.MathUtils.clamp(dist, ...DIST);
    this.spin = spin;
    this.set(true);
    return true;
  }

  // after the walking view has placed the camera this frame
  update(dt) {
    const pl = this.player, cam = this.camera, F = this.focus;
    const walking = pl.input().lengthSq() > 0.01;
    if (F && !F.armed) { if (!walking) F.armed = true; } // the walk that brought you to a viewpoint: let go first
    else if (this.on && walking) this.set(false); // walking takes you back down
    if (F && this.on && (F.t += dt) > F.seconds) this.set(false); // a viewpoint's time is up
    if (!this.on && this.w === 0) {
      if (F) { this.focus = null; Object.assign(this, F.keep); F.onEnd?.(); }
      return;
    }
    this.w = THREE.MathUtils.clamp(this.w + (this.on ? dt / ENTER : -dt / EXIT), 0, 1);
    const e = ease(this.w);
    const want = F ? this._v.copy(F.target) : this._v.set(pl.pos.x, pl.pos.y + HEAD, pl.pos.z);
    if (this._first || F) this.target.copy(want);
    else this.target.lerp(want, lerpK(0.12, dt)); // a little lag (a deck carries you)
    const T = this.target;

    // the circling turns the bearing, easing in and out with the crane; a vertical drag tilts the circle
    pl.yaw += SPIN * this.spin * e * e * dt;
    if (this.on) {
      this.el = THREE.MathUtils.clamp(this.el - (pl.pitch - this._pitchSeen), ...EL);
      pl.pitch = this._pitchSeen = this._pitch0;
    }
    const az = pl.yaw + (F ? F.off : 0);

    // the high pose: the wanted angle if its line to you is clear, else the lowest steeper one that is, else as near
    // as the first thing in the way allows (under a roof)
    let el = this.el, dist = this.dist;
    if (pl.bvh) {
      let clear = false;
      for (let a = this.el; a <= EL[1] + 1e-6; a += 0.12) {
        const hit = this._cast(T, az, a, this.dist + CLEAR);
        if (!hit) { el = a; clear = true; break; }
      }
      if (!clear) {
        const hit = this._cast(T, az, this.el, this.dist + CLEAR);
        dist = hit ? Math.max(1.2, hit.distance - CLEAR) : this.dist;
      }
    }
    if (this._first) { this._el = el; this._dist = dist; }
    // climb and come in quickly, settle back slowly
    this._el = THREE.MathUtils.lerp(this._el, el, lerpK(el > this._el ? 0.2 : 0.03, dt));
    this._dist = dist < this._dist ? THREE.MathUtils.lerp(this._dist, dist, lerpK(0.35, dt)) : THREE.MathUtils.lerp(this._dist, dist, lerpK(0.03, dt));

    // the walking pose, in the circle's terms: distance, angle and bearing from the target
    const off = this._d.copy(cam.position).sub(T);
    const r0 = Math.max(0.05, off.length());
    const el0 = Math.asin(THREE.MathUtils.clamp(off.y / r0, -1, 1));
    const az0 = Math.atan2(off.x, off.z);
    this._fwd.set(0, 0, -1).applyQuaternion(cam.quaternion);
    const look0 = this._look.copy(cam.position).addScaledVector(this._fwd, Math.max(2, r0));
    // blend: distance in log steps (an even zoom), angle and bearing straight, the look point from the walking view's
    // to you
    const r = Math.exp(THREE.MathUtils.lerp(Math.log(r0), Math.log(this._dist), e));
    let elB = THREE.MathUtils.lerp(el0, this._el, e);
    const azB = az0 + wrap(az - az0) * e;
    let rB = r;
    if (pl.bvh && e < 1) { // on the way the arc keeps clear too (from the walking pose, which is clear by its own rules)
      const hit = this._cast(T, azB, elB, r + CLEAR);
      if (hit) rB = Math.min(r, Math.max(r0 * (1 - e), hit.distance - CLEAR));
    }
    this.r = rB;
    this._dir(azB, elB, this._d);
    cam.position.copy(T).addScaledVector(this._d, rB);
    look0.lerp(T, e);
    cam.lookAt(look0);
    const fov = THREE.MathUtils.lerp(this.o.fov(), F ? F.fov : FOV, e);
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    this._first = false;
  }

  _dir(az, el, out) { return out.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)); }
  _cast(from, az, el, far) {
    this._ray.origin.copy(from);
    this._dir(az, el, this._ray.direction);
    const hit = this.player.bvh.raycastFirst(this._ray, THREE.DoubleSide);
    return hit && hit.distance < far ? hit : null;
  }
}
