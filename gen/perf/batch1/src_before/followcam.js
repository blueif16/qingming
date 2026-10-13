// Third-person follow camera, modelled on Messenger's (reference/messenger_study, 2026-10-10 bundle read):
// the camera sits on a sphere around the player's head and looks at it; mouse/touch turns the sphere (yaw, pitch
// limited to 45 deg up/down); the target follows the player with a short lag; a wall between player and camera
// pulls the camera in at once (to 90% of the hit), then the camera keeps a minimum clearance from the collider,
// and eases back out slowly when the way is clear. Lerps are frame-rate independent.
import * as THREE from 'three';

const lerpK = (k, dt) => 1 - Math.pow(1 - k, dt * 60); // Messenger's lerpCoefFPS: k per 60 Hz frame

export class FollowCam {
  constructor(camera, player, opts = {}) {
    this.camera = camera;
    this.player = player;
    this.distance = opts.distance ?? 3.2; // wanted distance from the head
    this.height = opts.height ?? 1.55; // look-at point above the feet
    this.clearance = opts.clearance ?? 0.25; // minimum distance from walls (Messenger 0.75 at its scale)
    this.minDistance = 0.45;
    this.radius = this.distance;
    this.target = new THREE.Vector3();
    this._ray = new THREE.Ray();
    this._dir = new THREE.Vector3();
    this._p = new THREE.Vector3();
    this._first = true;
  }

  update(dt) {
    const pl = this.player;
    const want = this._p.set(pl.pos.x, pl.pos.y + this.height, pl.pos.z);
    if (this._first) { this.target.copy(want); this._first = false; }
    this.target.lerp(want, lerpK(0.35, dt)); // Messenger 0.175 at 60 Hz; a little tighter for walking speed
    // direction from the target back to the camera, from the walker's yaw and pitch
    const yaw = pl.yaw, pitch = pl.pitch;
    this._dir.set(Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).normalize();
    let r = this.distance;
    let blocked = false;
    if (pl.bvh) {
      this._ray.set(this.target, this._dir);
      const hit = pl.bvh.raycastFirst(this._ray, THREE.DoubleSide);
      if (hit && hit.distance < r + this.clearance) { r = Math.max(this.minDistance, hit.distance * 0.9 - this.clearance); blocked = true; }
      // keep clear of walls beside the camera too: step in by 5% of the distance, up to 10 times
      const step = this.distance * 0.05;
      for (let i = 0; i < 10 && r > this.minDistance; i++) {
        const p = this._p.copy(this.target).addScaledVector(this._dir, r);
        const near = pl.bvh.closestPointToPoint(p, {}, 0, this.clearance);
        if (!near || near.distance >= this.clearance) break;
        r = Math.max(this.minDistance, r - step);
        blocked = true;
      }
    }
    // pull in at once, ease back out
    this.radius = blocked || r < this.radius ? r : THREE.MathUtils.lerp(this.radius, r, lerpK(0.06, dt));
    this.camera.position.copy(this.target).addScaledVector(this._dir, this.radius);
    this.camera.lookAt(this.target);
  }
}
