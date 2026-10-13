// A tiny orthographic z-buffer rasteriser for the carried children's numeric work (tools/carry_pose.mjs --preview,
// tools/carry_check.mjs --preview): flat-shaded silhouettes from fixed views, so a pose can be looked at in a second
// without a Blender slot. The textured look is char_props.py review's job.
// render(png, meshes [{P (metres, Armature axes), idx, color [r,g,b]}], dots [{p, color}], {views, size, center, extent})
import sharp from 'sharp';
// f points from the subject to the camera; r = (-f) x u (screen right), so no view is mirrored
const VIEWS = {
  left: { r: [0, 0, -1], u: [0, 1, 0], f: [1, 0, 0] },   // camera on the character's left (+X); screen right = his back
  right: { r: [0, 0, 1], u: [0, 1, 0], f: [-1, 0, 0] },
  front: { r: [1, 0, 0], u: [0, 1, 0], f: [0, 0, 1] },   // camera in front (+Z); his left on screen right
  back: { r: [-1, 0, 0], u: [0, 1, 0], f: [0, 0, -1] },
  top: { r: [1, 0, 0], u: [0, 0, -1], f: [0, 1, 0] },
  q3: { r: [0.57, 0, -0.82], u: [0, 1, 0], f: [0.82, 0, 0.57] },     // front-left three-quarter
  q3b: { r: [-0.57, 0, 0.82], u: [0, 1, 0], f: [-0.82, 0, -0.57] },  // back-right three-quarter
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export async function render(file, meshes, dots = [], { views = ['left', 'front', 'top'], size = 420, center = null, extent = 1.2 } = {}) {
  const tiles = [];
  for (const vn of views) {
    const V = VIEWS[vn];
    const W = size, H = size, img = new Float32Array(W * H * 3).fill(0.93), zb = new Float32Array(W * H).fill(-Infinity);
    const c = center || [0, 1, 0];
    const proj = (p) => { const d = [p[0] - c[0], p[1] - c[1], p[2] - c[2]]; return [W / 2 + (dot(d, V.r) / extent) * W, H / 2 - (dot(d, V.u) / extent) * H, dot(d, V.f)]; };
    for (const m of meshes) {
      const n = m.P.length / 3;
      const S = new Array(n);
      for (let i = 0; i < n; i++) S[i] = proj([m.P[i * 3], m.P[i * 3 + 1], m.P[i * 3 + 2]]);
      for (let t = 0; t < m.idx.length; t += 3) {
        const ia = m.idx[t], ib = m.idx[t + 1], ic = m.idx[t + 2];
        const a = S[ia], b = S[ib], cc = S[ic];
        // world normal for shading
        const pa = [m.P[ia * 3], m.P[ia * 3 + 1], m.P[ia * 3 + 2]], pb = [m.P[ib * 3], m.P[ib * 3 + 1], m.P[ib * 3 + 2]], pc = [m.P[ic * 3], m.P[ic * 3 + 1], m.P[ic * 3 + 2]];
        const e1 = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]], e2 = [pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]];
        let nn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        const L = Math.hypot(...nn) || 1; nn = nn.map((x) => x / L);
        const shade = 0.45 + 0.55 * Math.abs(dot(nn, [0.3 * V.f[0] + 0.5 * V.u[0] - 0.4 * V.r[0], 0.3 * V.f[1] + 0.5 * V.u[1] - 0.4 * V.r[1], 0.3 * V.f[2] + 0.5 * V.u[2] - 0.4 * V.r[2]].map((x, _, arr) => x / Math.hypot(...arr))));
        const col = (m.colors ? m.colors[ia] : m.color).map((x) => x * shade);
        const tex = m.tex && m.uv ? m.tex : null;   // {data (RGB bytes), w, h}: textured by the mesh's UVs
        const minx = Math.max(0, Math.floor(Math.min(a[0], b[0], cc[0]))), maxx = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0], cc[0])));
        const miny = Math.max(0, Math.floor(Math.min(a[1], b[1], cc[1]))), maxy = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1], cc[1])));
        const den = (b[1] - cc[1]) * (a[0] - cc[0]) + (cc[0] - b[0]) * (a[1] - cc[1]);
        if (Math.abs(den) < 1e-9) continue;
        for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
          const l1 = ((b[1] - cc[1]) * (x + 0.5 - cc[0]) + (cc[0] - b[0]) * (y + 0.5 - cc[1])) / den;
          const l2 = ((cc[1] - a[1]) * (x + 0.5 - cc[0]) + (a[0] - cc[0]) * (y + 0.5 - cc[1])) / den;
          const l3 = 1 - l1 - l2;
          if (l1 < 0 || l2 < 0 || l3 < 0) continue;
          const z = l1 * a[2] + l2 * b[2] + l3 * cc[2];
          const k = y * W + x;
          if (z <= zb[k]) continue;
          zb[k] = z;
          if (tex) {
            const u = l1 * m.uv[ia * 2] + l2 * m.uv[ib * 2] + l3 * m.uv[ic * 2], v = l1 * m.uv[ia * 2 + 1] + l2 * m.uv[ib * 2 + 1] + l3 * m.uv[ic * 2 + 1];
            const tx = Math.min(tex.w - 1, Math.max(0, Math.floor((u - Math.floor(u)) * tex.w))), ty = Math.min(tex.h - 1, Math.max(0, Math.floor((v - Math.floor(v)) * tex.h)));
            const o = (ty * tex.w + tx) * 3, sh = 0.55 + 0.45 * shade;
            img[k * 3] = (tex.data[o] / 255) * sh; img[k * 3 + 1] = (tex.data[o + 1] / 255) * sh; img[k * 3 + 2] = (tex.data[o + 2] / 255) * sh;
          } else { img[k * 3] = col[0]; img[k * 3 + 1] = col[1]; img[k * 3 + 2] = col[2]; }
        }
      }
    }
    for (const d of dots) {
      const s = proj(d.p);
      for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
        const X = Math.round(s[0]) + x, Y = Math.round(s[1]) + y;
        if (X < 0 || Y < 0 || X >= W || Y >= H || x * x + y * y > 9) continue;
        const k = Y * W + X; img[k * 3] = d.color[0]; img[k * 3 + 1] = d.color[1]; img[k * 3 + 2] = d.color[2];
      }
    }
    const buf = Buffer.alloc(W * H * 3);
    for (let i = 0; i < W * H * 3; i++) buf[i] = Math.max(0, Math.min(255, Math.round(img[i] * 255)));
    tiles.push(await sharp(buf, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer());
  }
  const comp = tiles.map((t, i) => ({ input: t, left: i * (size + 4), top: 0 }));
  await sharp({ create: { width: tiles.length * (size + 4), height: size, channels: 3, background: '#666' } }).composite(comp).png().toFile(file);
}
