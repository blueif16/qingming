// The world in cells, the middle version (perf batch 2, gen/perf/batch2/cells.md; Messenger's world drawn in spatial
// cells, our own code). tools/cells.mjs sorts a section GLB's render meshes into 8 m ground cells at export (each mesh's
// triangles cell by cell, its node's extras `cells: [cell, first triangle, triangles, ...]`, the cells' boxes in the
// scene's extras). Here every material's meshes of all the loaded sections are one THREE.BatchedMesh: one draw per
// material a pass, drawing only its ranges in the cells that are in view.
//   - One test per cell, not per range: a camera's cells are tested once against its frustum (box against frustum) and
//     sorted near to far, and every batch draws its ranges in those cells in that order (front to back for opaque
//     materials). The shadow pass does the same with the sun's shadow box.
//   - Nothing is re-uploaded per pass: the geometry is baked into the page frame, so every range draws with the one
//     identity matrix (the batch's indirect texture stays all zeros) and only the multi-draw lists change; three's own
//     per-instance cull and sort (which re-uploads that texture every pass) are off, as on the boats' batches.
//   - A batch with nothing to draw this frame is hidden (update(), once a frame before the page renders).
// The section's own meshes stay in its root, hidden, with their names, extras and the collider the page built from the
// __col ones (world.js fetchSection); their geometry is dropped once copied (each keeps its bounding box). Meshes without
// cells (the cloth, the water, the hidden colliders, a GLB shipped before cells) are drawn as before.
// ?cells=0 draws the meshes as before, for A/B.
import * as THREE from 'three';

const _pv = new THREE.Matrix4(), _f = new THREE.Frustum(), _b = new THREE.Box3(), _v = new THREE.Vector3(), _n3 = new THREE.Matrix3();
const IDENTITY = new THREE.Matrix4();

export class Cells {
  constructor({ renderer, onBatch, enabled = true }) {
    this.onBatch = onBatch; // the page shades a batch while it lives (world.js: its material's variant, the scene)
    this.enabled = enabled;
    this.multiDraw = renderer.extensions.has('WEBGL_multi_draw'); // without it three draws range by range: join neighbours
    this.pool = new Map(); // material key -> { key, bm, parts: Set, lists: Map(camera -> list), ready }
    this.tables = []; // the loaded sections' cells
    this.views = new Map(); // camera -> { pv, version, sec: [], cell: Int32Array, n }
    this.version = 0; // bumped when sections join or leave (every view is tested again)
  }

  // a fetched section's cell meshes as world-frame geometry waiting for its batches (world.js fetchSection, after the
  // collider is built from the __col meshes)
  prepare(sec) {
    const info = sec.root.userData.cells;
    if (!this.enabled || !info?.boxes) return;
    const n = info.boxes.length / 6, boxes = Float32Array.from(info.boxes), centre = new Float32Array(n * 3);
    for (let c = 0; c < n; c++) for (let a = 0; a < 3; a++) centre[c * 3 + a] = (boxes[c * 6 + a] + boxes[c * 6 + 3 + a]) / 2;
    const table = { name: sec.name, n, boxes, centre, parts: [] };
    for (const o of sec.meshes) {
      const ranges = o.userData.cells;
      if (!ranges || !o.visible || !o.isMesh || o.isBatchedMesh || !o.geometry.index) continue;
      const g = o.geometry, pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv, uv1 = g.attributes.uv1, nv = pos.count;
      const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), U = new Float32Array(nv * 2), U1 = uv1 ? new Float32Array(nv * 2) : null;
      _n3.getNormalMatrix(o.matrixWorld);
      for (let i = 0; i < nv; i++) {
        _v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).toArray(P, i * 3);
        if (nor) _v.fromBufferAttribute(nor, i).applyMatrix3(_n3).normalize().toArray(N, i * 3); else N[i * 3 + 1] = 1;
        if (uv) { U[i * 2] = uv.getX(i); U[i * 2 + 1] = uv.getY(i); }
        if (U1) { U1[i * 2] = uv1.getX(i); U1[i * 2 + 1] = uv1.getY(i); }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(U, 2));
      if (U1) geo.setAttribute('uv1', new THREE.BufferAttribute(U1, 2));
      geo.setIndex(new THREE.BufferAttribute(Uint32Array.from(g.index.array), 1));
      // which of its ranges lies in each cell (-1: none), and the ranges as [first triangle, triangles]
      const slot = new Int32Array(n).fill(-1), first = new Int32Array(ranges.length / 3), count = new Int32Array(ranges.length / 3);
      for (let r = 0; r < ranges.length / 3; r++) { slot[ranges[r * 3]] = r; first[r] = ranges[r * 3 + 1]; count[r] = ranges[r * 3 + 2]; }
      table.parts.push({ std: o.material, geo, slot, first, count, table, mesh: o.name });
      // drawn by its batch from now on; its own geometry goes (its box stays: the ground's extent, world.js)
      g.computeBoundingBox();
      const keep = new THREE.BufferGeometry();
      keep.boundingBox = g.boundingBox;
      g.dispose();
      o.geometry = keep;
      o.visible = false;
      o.userData.inCells = true;
    }
    if (table.parts.length) sec.cellTable = table;
  }

  key(std, geo) { return [std.name, std.map?.source?.uuid || '', std.side, std.transparent, std.alphaTest, geo.attributes.uv1 ? 'uv1' : ''].join('|'); }

  // the section joins the batches (world.js addSection); returns the batches made for it, hidden until compiled
  join(sec) {
    const table = sec.cellTable, fresh = [];
    if (!table) return fresh;
    for (const part of table.parts) {
      const key = this.key(part.std, part.geo), nv = part.geo.attributes.position.count, ni = part.geo.index.count;
      let e = this.pool.get(key);
      if (!e) {
        // the batch's own copy of the material: a batched and a plain mesh need different programs, and a section
        // shipped before cells still draws this material on plain meshes (the boats' batches do the same)
        const std = part.std.clone();
        // sized for this section's part; the neighbours' grow it as they join (a little room first, then by half)
        const bm = new THREE.BatchedMesh(1, Math.ceil(nv * 1.1) + 64, Math.ceil(ni * 1.1) + 192, std);
        bm.name = `cells_${std.name}`;
        bm.frustumCulled = false;
        bm.perObjectFrustumCulled = false;
        bm.sortObjects = false;
        bm.castShadow = bm.receiveShadow = true;
        bm.visible = false;
        // one identity matrix for every range, an indirect texture of zeros (every draw reads matrix 0), uploaded once
        bm._matricesTexture.image.data.set(IDENTITY.elements, 0);
        bm._matricesTexture.needsUpdate = true;
        bm._indirectTexture.needsUpdate = true;
        e = { key, bm, parts: new Set(), lists: new Map(), ready: false, size: 0 };
        bm.onBeforeRender = (r, s, camera) => this.use(e, camera);
        bm.onBeforeShadow = (r, o, camera, shadowCamera) => this.use(e, shadowCamera);
        this.pool.set(key, e);
        this.onBatch(bm, true);
        fresh.push(e);
      }
      const bm = e.bm;
      // room: freed space packed first (optimize), then the buffers grown
      if (bm.unusedVertexCount < nv || bm.unusedIndexCount < ni) bm.optimize();
      if (bm.unusedVertexCount < nv || bm.unusedIndexCount < ni) {
        bm.setGeometrySize(Math.ceil((bm._maxVertexCount - bm.unusedVertexCount + nv) * 1.5), Math.ceil((bm._maxIndexCount - bm.unusedIndexCount + ni) * 1.5));
      }
      part.gid = bm.addGeometry(part.geo);
      part.geo.dispose(); // copied into the batch
      part.geo = null;
      part.entry = e;
      e.parts.add(part);
      e.size += part.first.length;
      for (const l of e.lists.values()) l.version = -1;
    }
    this.tables.push(table);
    this.version++;
    for (const e of new Set(table.parts.map((p) => p.entry))) this.bounds(e);
    return fresh.map((e) => e.bm);
  }

  // compiled: its batches may draw (world.js addSection)
  ready(batches) { for (const e of this.pool.values()) if (batches.includes(e.bm)) e.ready = true; }

  leave(sec) {
    const table = sec.cellTable;
    if (!table || !this.tables.includes(table)) return;
    this.tables.splice(this.tables.indexOf(table), 1);
    this.version++;
    for (const part of table.parts) {
      const e = part.entry;
      if (!e) continue;
      e.bm.deleteGeometry(part.gid);
      e.parts.delete(part);
      e.size -= part.first.length;
      part.entry = null;
      for (const l of e.lists.values()) l.version = -1;
      if (e.parts.size) { this.bounds(e); continue; }
      this.pool.delete(e.key);
      this.onBatch(e.bm, false); // out of the scene, its material and variant disposed (world.js)
      e.bm.dispose(); // its geometry, matrix and index textures
    }
  }

  // the batch's sphere round the cells it holds (three sorts objects by it)
  bounds(e) {
    _b.makeEmpty();
    for (const p of e.parts) for (let r = 0; r < p.slot.length; r++) if (p.slot[r] >= 0) {
      const b = p.table.boxes;
      _b.expandByPoint(_v.set(b[r * 6], b[r * 6 + 1], b[r * 6 + 2])).expandByPoint(_v.set(b[r * 6 + 3], b[r * 6 + 4], b[r * 6 + 5]));
    }
    e.bm.boundingSphere = _b.isEmpty() ? new THREE.Sphere() : _b.getBoundingSphere(e.bm.boundingSphere || new THREE.Sphere());
  }

  // the cells a camera sees, near to far (an orthographic camera, the shadow's: in row order); tested again only when the
  // camera or the loaded sections changed
  view(camera) {
    _pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    let v = this.views.get(camera);
    if (!v) this.views.set(camera, (v = { pv: new Float64Array(16), version: 0, tables: -1, sec: [], cell: new Int32Array(64), d: [], n: 0 }));
    const el = _pv.elements;
    let same = v.tables === this.version;
    for (let i = 0; same && i < 16; i++) if (v.pv[i] !== el[i]) same = false;
    if (same) return v;
    v.pv.set(el);
    v.tables = this.version;
    _f.setFromProjectionMatrix(_pv, camera.coordinateSystem, camera.reversedDepth);
    const sort = camera.isPerspectiveCamera && this.multiDraw;
    const cx = camera.matrixWorld.elements[12], cy = camera.matrixWorld.elements[13], cz = camera.matrixWorld.elements[14];
    const hits = [];
    for (const t of this.tables) {
      const B = t.boxes;
      for (let c = 0; c < t.n; c++) {
        _b.min.set(B[c * 6], B[c * 6 + 1], B[c * 6 + 2]);
        _b.max.set(B[c * 6 + 3], B[c * 6 + 4], B[c * 6 + 5]);
        if (!_f.intersectsBox(_b)) continue;
        const C = t.centre;
        hits.push([t, c, sort ? (C[c * 3] - cx) ** 2 + (C[c * 3 + 1] - cy) ** 2 + (C[c * 3 + 2] - cz) ** 2 : 0]);
      }
    }
    if (sort) hits.sort((a, b) => a[2] - b[2]);
    // the same cells in the same order as before: the batches' lists still hold
    let changed = hits.length !== v.n;
    for (let i = 0; !changed && i < hits.length; i++) if (v.sec[i] !== hits[i][0] || v.cell[i] !== hits[i][1]) changed = true;
    if (!changed) return v;
    if (v.cell.length < hits.length) v.cell = new Int32Array(hits.length * 2);
    v.sec.length = hits.length;
    hits.forEach(([t, c], i) => { v.sec[i] = t; v.cell[i] = c; });
    v.n = hits.length;
    v.version++;
    v.sorted = sort;
    return v;
  }

  // a batch's multi-draw list for a camera: its ranges in the cells the camera sees (rebuilt when they change)
  list(e, camera) {
    const v = this.view(camera);
    let l = e.lists.get(camera);
    if (!l) e.lists.set(camera, (l = { version: -1, view: null, starts: new Int32Array(8), counts: new Int32Array(8), n: 0, tris: 0 }));
    if (l.version === v.version && l.view === v && l.size === e.size) return l;
    l.version = v.version; l.view = v; l.size = e.size;
    if (l.starts.length < e.size) { l.starts = new Int32Array(e.size); l.counts = new Int32Array(e.size); }
    const bm = e.bm, bpe = bm.geometry.index.array.BYTES_PER_ELEMENT, info = bm._geometryInfo;
    const back = bm.material.transparent;
    let n = 0, tris = 0;
    const push = (p, r) => {
      const start = (info[p.gid].start + p.first[r] * 3) * bpe, count = p.count[r] * 3;
      tris += p.count[r];
      if (n && !v.sorted && l.starts[n - 1] + l.counts[n - 1] * bpe === start) { l.counts[n - 1] += count; return; } // a neighbour in the buffer: one range
      l.starts[n] = start; l.counts[n] = count; n++;
    };
    if (v.sorted) {
      // near to far, cell by cell (far to near for a transparent material)
      for (let k = 0; k < v.n; k++) {
        const i = back ? v.n - 1 - k : k, t = v.sec[i], c = v.cell[i];
        for (const p of e.parts) if (p.table === t && p.slot[c] >= 0) push(p, p.slot[c]);
      }
    } else {
      // buffer order, neighbouring cells joined
      for (const p of e.parts) for (let i = 0; i < v.n; i++) if (v.sec[i] === p.table && p.slot[v.cell[i]] >= 0) push(p, p.slot[v.cell[i]]);
    }
    l.n = n; l.tris = tris;
    return l;
  }

  use(e, camera) {
    const l = this.list(e, camera), bm = e.bm;
    bm._multiDrawStarts = l.starts;
    bm._multiDrawCounts = l.counts;
    bm._multiDrawCount = l.n;
  }

  // once a frame before the page renders: which batches draw at all (the camera's cells, and the shadow's when the
  // shadow map is redrawn this frame)
  update(camera, sun) {
    if (!this.pool.size) return;
    camera.updateMatrixWorld();
    let sc = null;
    if (sun) {
      sun.updateMatrixWorld();
      sun.target.updateMatrixWorld();
      sun.shadow.updateMatrices(sun);
      sc = sun.shadow.camera;
    }
    for (const e of this.pool.values()) e.bm.visible = e.ready && (this.list(e, camera).n > 0 || (!!sc && this.list(e, sc).n > 0));
  }

  stats(camera) {
    const out = { batches: this.pool.size, sections: this.tables.map((t) => t.name), cells: this.tables.reduce((a, t) => a + t.n, 0), drawn: 0, ranges: 0, tris: 0, multiDraw: this.multiDraw };
    for (const e of this.pool.values()) { const l = e.lists.get(camera); if (e.bm.visible && l) { out.drawn++; out.ranges += l.n; out.tris += l.tris; } }
    return out;
  }
}
