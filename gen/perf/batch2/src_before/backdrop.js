// The painted backdrop (map/BUILDING.md): where the scroll paints nothing for the loaded sections, the world shows
// painting, never models.
//  - Mist: the ink post pass (post.js) veils everything outside the walkable area in pale mist, the scroll's blank
//    silk. The walkable area is the painted area plus what each section carries past the silk's top and bottom
//    edges (walkableBoxes below). The painted area is the union of the loaded sections' painted areas (layout.json
//    painted_area): they share one frame (map/README.md, Frames) and sit side by side along the scroll, so the union
//    is one four-sided area from the westmost section's west seam to the eastmost section's east seam.
//  - A misty floor carries the ground out to the ring, so no hole shows under the horizon.
//  - A ring of painted panels (sections/<name>/backdrop.json, made by tools/backdrop.mjs) shows what lies past each
//    outer edge: the neighbouring sections as paintings until they are built, the far ground past the silk's top
//    edge. A panel on a seam with a loaded neighbour is dropped (the neighbour is there in 3D), and so is a panel
//    held back for review (panel.hold). South, below the silk's bottom edge, there is mist only.
// The ring is an ellipse round the union: as deep as one section's ring (backdrop.json ring.radius) north-south, and
// stretched east-west to keep the same margin past the outer seams. Alone, a section keeps its own ring and angles.
// Each panel keeps its painting's aspect over the arc it spans, with its painted horizon at the viewer's eye (below).
// The floor and the panels' ground mist take the fog colour; the panels take the page's own light (sky fill and sun
// or moon), so at dusk they dim and at night they go dark with the town.
import * as THREE from 'three';
import { lightAt } from './daylight.js';
import { MIST_BOXES } from './post.js';

// The walkable area past one section's painted area, as boxes [x0, x1, d0, d1] (X east, D north) beyond the silk's
// top and bottom edges: the mist starts there, not at the raw painted rectangle (the restart brief, page item 3).
// It reaches as far as
//  - the things the section's build_choices moved (layout.json `moved`: a far bank carried north, rafted boats moved
//    out over the water), each point padded by PAD_THING for its hull's beam, roof or crown, and
//  - its edge walls past the silk's top edge (`edges` in build_choices: the north and shore walls, as built:
//    g_edge_<side>_hidden__col; a cove's shore, the walk round a bridge's foot),
// grouped along X (a gap over GAP starts a new box). Below the silk's bottom edge only moved things count: south of
// it the scroll paints nothing and the page shows mist only (the gate's south wall, moved down so its lower flight
// can be climbed, would otherwise clear 44 m of unpainted ground and moat). A box reaches no further than its section's ground runs on past
// that edge minus the mist's own depth (`fullAt`) and a margin, so the ground's end still lies in full mist.
// walls: { side: { pos: world positions (x, y, z = -D), index } } (a wall's triangles are sampled every metre along
// their edges: a long wall has vertices only at its ends); ground: { d0, d1 } (the ground's D range) or null.
const PAD_THING = 1.5, PAD_WALL = 0.5, GAP = 6, OVERLAP = 1;
export function walkableBoxes(layout, walls, ground, fullAt = 9) {
  const c = layout?.painted_area?.corners;
  if (!c) return [];
  const dS = Math.min(c[0][1], c[1][1]), dN = Math.max(c[2][1], c[3][1]);
  const sides = { north: [], south: [] };
  const add = (X, D, pad) => {
    if (D > dN + 0.3) sides.north.push([X, D - dN, pad]);
    else if (D < dS - 0.3) sides.south.push([X, dS - D, pad]);
  };
  // every [X, D] pair in a moved thing's record (pos, pts, footprint, front, rear, beams ...)
  const walk = (v) => {
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v) && v.length >= 2 && v.length <= 3 && v.every((x) => typeof x === 'number')) { add(v[0], v[1], PAD_THING); return; }
    for (const x of Array.isArray(v) ? v : Object.values(v)) if (x && typeof x === 'object') walk(x);
  };
  const byId = new Map();
  for (const t of layout.trees || []) byId.set(t.map_id, t);
  for (const f of layout.figures || []) byId.set(f.map_id, f);
  for (const id of Object.keys(layout.moved || {})) {
    const e = layout.entities?.[id] || byId.get(id);
    if (!e) continue;
    if (typeof e.X === 'number' && typeof e.D === 'number') add(e.X, e.D, PAD_THING);
    for (const k of ['pos', 'pts', 'footprint', 'front', 'rear', 'wheels', 'beam_n', 'beam_s', 'bow_top', 'stern_top']) walk(e[k]);
  }
  for (const side of ['north', 'shore']) {
    const w = walls?.[side];
    if (!w) continue;
    const { pos, index } = w, n = index ? index.length : pos.length / 3;
    const vx = (k) => pos[3 * (index ? index[k] : k)], vd = (k) => -pos[3 * (index ? index[k] : k) + 2];
    for (let t = 0; t + 2 < n; t += 3) {
      for (let e = 0; e < 3; e++) {
        const a = t + e, b = t + ((e + 1) % 3), len = Math.hypot(vx(b) - vx(a), vd(b) - vd(a)), steps = Math.max(1, Math.ceil(len));
        for (let i = 0; i < steps; i++) {
          const D = vd(a) + ((vd(b) - vd(a)) * i) / steps;
          if (D > dN) add(vx(a) + ((vx(b) - vx(a)) * i) / steps, D, PAD_WALL);
        }
      }
    }
  }
  const out = [];
  for (const [side, pts] of Object.entries(sides)) {
    if (!pts.length) continue;
    const cap = ground ? (side === 'north' ? ground.d1 - dN : dS - ground.d0) - fullAt - 0.5 : 0;
    if (cap <= 0) continue;
    pts.sort((a, b) => a[0] - b[0]);
    let box = null;
    const flush = () => {
      if (!box) return;
      const depth = Math.min(box.over, cap);
      out.push(side === 'north' ? [box.x0, box.x1, dN - OVERLAP, dN + depth] : [box.x0, box.x1, dS - depth, dS + OVERLAP]);
      box = null;
    };
    for (const [X, over, pad] of pts) {
      if (box && X - pad > box.x1 + GAP) flush();
      if (!box) box = { x0: X - pad, x1: X + pad, over: over + pad };
      else { box.x0 = Math.min(box.x0, X - pad); box.x1 = Math.max(box.x1, X + pad); box.over = Math.max(box.over, over + pad); }
    }
    flush();
  }
  return out.map((b) => b.map((v) => +v.toFixed(2)));
}

// painted_area corners [[X, D] sw, se, ne, nw] -> four edge lines in three's x/z (z = -D), as (a, b, c) with the
// outward distance a*x + b*z + c
function edges(corners) {
  const out = [];
  for (let i = 0; i < 4; i++) {
    const [ax, ad] = corners[i], [bx, bd] = corners[(i + 1) % 4];
    const len = Math.hypot(bx - ax, bd - ad);
    const nX = (bd - ad) / len, nD = -(bx - ax) / len; // right-hand normal of a counter-clockwise ring: outward
    out.push(new THREE.Vector3(nX, -nD, -(nX * ax + nD * ad)));
  }
  return out;
}

const centreOf = (corners) => [corners.reduce((a, c) => a + c[0], 0) / 4, corners.reduce((a, c) => a + c[1], 0) / 4];

// sections: [{ name, layout, cfg (backdrop.json or null), base (url folder) }] in scroll order west -> east, all
// loaded. seams: Set of "<name>:east|west" edges that touch a loaded neighbour. extent: the ground meshes' box.
// textures: { get(url) -> Promise<Texture>, release(url) } (world.js's shared cache, so a rebuild reuses the panels
// it keeps); without it each panel is loaded here and disposed with the ring.
// world: [corners per section] of every section of the world in scroll order, loaded or not (world.js streams them):
// the ring stands round the whole world, so the world's own outer edges look the same whichever sections are loaded;
// the mist and the panels follow the loaded ones. Without it, the ring is round the loaded sections.
// walkable: boxes [x0, x1, d0, d1] of walkable area past the loaded sections' painted areas (walkableBoxes), where
// the mist starts instead.
export async function setupBackdrop(scene, post, sections, { seams = new Set(), extent, textures = null, world = null, walkable = [] } = {}) {
  const west = sections[0], east = sections[sections.length - 1];
  const [wsw, , , wnw] = west.layout.painted_area.corners, [, ese, ene] = east.layout.painted_area.corners;
  const corners = [wsw, ese, ene, wnw];
  const cfg0 = sections.find((s) => s.cfg)?.cfg;
  if (!cfg0) return null;
  const ringSecs = world || sections.map((s) => s.layout.painted_area.corners);
  const ringCorners = [ringSecs[0][0], ringSecs[ringSecs.length - 1][1], ringSecs[ringSecs.length - 1][2], ringSecs[0][3]];
  const [cx, cd] = centreOf(ringCorners);
  // the ring: alone, the section's own circle; joined, an ellipse with the same margin past the outer seams
  const R = cfg0.ring.radius;
  let A = R, B = R;
  if (ringSecs.length > 1) {
    const one = ringSecs[0], halfOne = (Math.max(...one.map((c) => c[0])) - Math.min(...one.map((c) => c[0]))) / 2;
    const half = (Math.max(...ringCorners.map((c) => c[0])) - Math.min(...ringCorners.map((c) => c[0]))) / 2;
    A = Math.max(R, half + Math.max(R - halfOne, 25));
  }
  const u = post.material.uniforms;
  u.mistOn.value = 1;
  u.mistEdges.value = edges(corners);
  u.mistStart.value = cfg0.mist.start;
  u.mistFull.value = cfg0.mist.full;
  u.mistCentre.value.set(cx, -cd);
  u.mistRingAB.value.set(A, B);
  // the biggest boxes first, if there are ever more than the shader takes
  const boxes = [...walkable].sort((a, b) => (b[1] - b[0]) * (b[3] - b[2]) - (a[1] - a[0]) * (a[3] - a[2])).slice(0, MIST_BOXES);
  boxes.forEach(([x0, x1, d0, d1], i) => u.mistBoxes.value[i].set(x0, x1, -d1, -d0));
  u.mistBoxN.value = boxes.length;

  const group = new THREE.Group();
  group.name = 'backdrop';
  // the misty floor: an elliptical disc well past the ring (its rim beyond the ink pass's reach, so no line is drawn
  // round it, and the misty ground runs on to the horizon where no panel stands), with a hole where the scene's own
  // ground is (slightly inset)
  const floorMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: true });
  if (extent) {
    const shape = new THREE.Shape();
    shape.absellipse(cx, cd, A + 90, B + 90, 0, Math.PI * 2, false, 0);
    const hole = new THREE.Path();
    const [x0, x1, d0, d1] = [extent.x0 + 1, extent.x1 - 1, extent.y0 + 1, extent.y1 - 1];
    hole.moveTo(x0, d0); hole.lineTo(x0, d1); hole.lineTo(x1, d1); hole.lineTo(x1, d0); hole.lineTo(x0, d0);
    shape.holes.push(hole);
    const g = new THREE.ShapeGeometry(shape, 64);
    g.rotateX(-Math.PI / 2); // shape x/y -> world x/-z: X stays, D becomes -z
    const floor = new THREE.Mesh(g, floorMat);
    floor.position.y = -0.12;
    floor.name = 'backdrop_floor';
    group.add(floor);
  }
  // the panels: arcs of the ring (parametric angle t: X = cx + A cos t, D = cd + B sin t), facing the centre; u runs
  // from the panel's left (its larger angle) to its right, evenly along the arc.
  // Height (tools/backdrop.mjs measures each panel): the image keeps its own aspect over the arc's length, and its
  // painted horizon (backdrop.json panel.horizon, a fraction of the image from its top) stands at the viewer's eye
  // level, wherever the eye is (the panel follows the camera's height, like any far view). If that would sink the
  // painted ground's front (panel.foot) more than SINK below the misty floor, the panel is lifted that far instead.
  // Its foot stands in ground mist: over MIST_H above the floor the panel's colour turns to the floor's (the fog
  // colour), so floor and panel meet without a line and the painting rises out of the mist.
  // A panel shipped without those measurements keeps the ring's bottom and top.
  const EYE = 1.6, SINK = 2.5, MIST_H = 2.5;
  const loader = new THREE.TextureLoader();
  const panels = [], held = []; // held: the panel URLs taken from `textures`, given back on dispose
  const getTex = async (url) => { if (!textures) return loader.loadAsync(url); const t = await textures.get(url); held.push(url); return t; };
  const deg = THREE.MathUtils.degToRad;
  const angleOfX = (X) => Math.acos(THREE.MathUtils.clamp((X - cx) / A, -1, 1));
  const floorY = -0.12;
  const groundMist = (mat) => {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.floorY = { value: floorY };
      sh.uniforms.mistH = { value: MIST_H };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vPanelY;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvPanelY = (modelMatrix * vec4(transformed, 1.0)).y;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vPanelY;\nuniform float floorY, mistH;')
        .replace('#include <map_fragment>', '#include <map_fragment>\n#ifdef USE_FOG\ndiffuseColor.rgb = mix(diffuseColor.rgb, fogColor, 1.0 - smoothstep(floorY, floorY + mistH, vPanelY));\n#endif\ndiffuseColor.a *= smoothstep(floorY - 0.02, floorY + 0.3, vPanelY);');
    };
    mat.customProgramCacheKey = () => 'backdrop_ground_mist';
  };
  for (const sec of sections) {
    if (!sec.cfg) continue;
    for (const p of sec.cfg.panels) {
      if ((p.side === 'east' || p.side === 'west') && seams.has(`${sec.name}:${p.side}`)) continue; // the neighbour is built
      if (p.hold) continue; // its painting has not passed review yet: mist only
      let a0 = deg(p.angle + p.width / 2), a1 = deg(p.angle - p.width / 2);
      if (ringSecs.length > 1 && p.side === 'north') {
        // joined: each section's far ground stands behind that section, over its own top edge
        const [, , ne, nw] = sec.layout.painted_area.corners;
        const pad = 0.12 * (ne[0] - nw[0]);
        a0 = angleOfX(nw[0] - pad); a1 = angleOfX(ne[0] + pad);
      }
      let tex;
      try { tex = await getTex(`${sec.base}backdrop_${p.side}.webp`); } catch { continue; }
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const [imgW, imgH] = tex.userData.srcSize || [tex.image.width, tex.image.height]; // a KTX2 copy may be padded
      const n = 64;
      const pts = [];
      for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([cx + A * Math.cos(a), cd + B * Math.sin(a)]); }
      const run = [0];
      for (let i = 1; i <= n; i++) run.push(run[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const L = run[n];
      // heights relative to the panel's origin, which follows the eye
      let yb = cfg0.ring.bottom, yt = cfg0.ring.top, lift = 0, follow = false;
      if (p.horizon != null) {
        const Hm = L * (imgH / imgW);
        yt = p.horizon * Hm; yb = yt - Hm;
        const foot = -(p.foot ?? 1) * Hm + yt; // the painted ground's front, below the horizon
        lift = Math.max(0, floorY - SINK - (EYE + foot));
        follow = true;
      }
      const pos = [], uv = [], idx = [];
      for (let i = 0; i <= n; i++) {
        const [X, D] = pts[i], t = run[i] / L;
        pos.push(X, yb, -D, X, yt, -D);
        uv.push(t, 0, t, 1);
        if (i < n) idx.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 1, 2 * i + 2, 2 * i + 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, fog: true, depthWrite: false });
      groundMist(mat);
      const m = new THREE.Mesh(g, mat);
      m.name = `backdrop_${sec.name}_${p.side}`;
      m.renderOrder = -1;
      m.frustumCulled = false;
      if (follow) {
        m.position.y = EYE + lift;
        m.onBeforeRender = (renderer, scn, cam) => {
          const y = cam.matrixWorld.elements[13] + lift;
          if (m.position.y !== y) { m.position.y = y; m.updateMatrixWorld(); }
        };
      }
      m.userData.backdrop = { length: +L.toFixed(1), height: +(yt - yb).toFixed(2), lift: +lift.toFixed(2) };
      group.add(m);
      panels.push(m);
    }
  }
  scene.add(group);
  const tint = new THREE.Color(), lit = new THREE.Color(), tmp = new THREE.Color();
  let hemi = null, sunLight = null;
  scene.traverse((o) => { if (o.isHemisphereLight && !hemi) hemi = o; if (o.isDirectionalLight && !sunLight) sunLight = o; });
  // the same sum at 10:00 (daylight.js), where the panels show their painted colours
  const HEMI_W = 0.6, SUN_W = 0.25, l10 = lightAt(10);
  const REF = new THREE.Color().copy(l10.hemiSky).multiplyScalar(l10.hemiIntensity * HEMI_W).add(new THREE.Color().copy(l10.sunColor).multiplyScalar(l10.sunIntensity * SUN_W));
  return {
    group,
    meshes: [...group.children],
    corners,
    // the hour's light: the mist is the haze at the horizon, so the misty ground dissolves into the sky. The panels
    // are painted in full daylight, so they take the scene's own light relative to 10:00's: the sky fill and the
    // sun (or the moon), read from the page's lights (set just before this is called), so at dusk they dim and warm
    // and at night they go dark blue like the town. Without those lights: as bright as the fog allows.
    update(fogColor) {
      u.mistColor.value.copy(fogColor);
      floorMat.color.copy(fogColor);
      if (hemi && sunLight) {
        lit.copy(hemi.color).multiplyScalar(hemi.intensity * HEMI_W).add(tmp.copy(sunLight.color).multiplyScalar(sunLight.intensity * SUN_W));
        tint.setRGB(Math.min(1.1, lit.r / REF.r), Math.min(1.1, lit.g / REF.g), Math.min(1.1, lit.b / REF.b));
      } else {
        const lum = 0.2126 * fogColor.r + 0.7152 * fogColor.g + 0.0722 * fogColor.b;
        const k = THREE.MathUtils.clamp(lum / 0.55, 0.12, 1);
        tint.setRGB(k, k, k).lerp(fogColor, 0.15);
      }
      for (const m of panels) m.material.color.copy(tint);
    },
    dispose() {
      scene.remove(group);
      group.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); if (!textures) o.material.map?.dispose(); o.material.dispose(); } });
      for (const url of held) textures.release(url);
      held.length = 0;
    },
  };
}
