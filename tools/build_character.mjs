// Merge a Meshy rigged character with the clips from its animation GLBs into one GLB.
// Clips are matched to the character's bones by node name (all Meshy rigs share bone names).
// Usage: node build_character.mjs <out.glb> <rigged.glb> <clipName>=<anim.glb> [<clipName>=<anim.glb> ...]
//        [--recolour <rules.json>]
// --recolour (a variant: another character's body with part of its texture recoloured, characters/<name>.json
// "recolour"): rules [{mask, to}], applied in order to the body texture. mask: texels whose colour matches (hue
// [h0, h1] degrees, sat [s0, s1], val [v0, v1]) and, optionally, that lie on faces of a part of the body in the rest
// pose: y [f0, f1] (height as a fraction of the body's, every vertex of the face inside) and radial_min (distance
// from the head's vertical axis, as a fraction of the height: a hat's brim). to: {hue (set, degrees), hue_shift,
// sat_mul, val_mul, val_add, ramp [[value, "#rrggbb"], ...] (the texel's value mapped to a colour)}.
import { NodeIO } from '@gltf-transform/core';
import { prune } from '@gltf-transform/functions';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const argv = process.argv.slice(2);
const ri = argv.indexOf('--recolour');
const recolourFile = ri >= 0 ? argv.splice(ri, 2)[1] : null;
const [out, riggedFile, ...clipArgs] = argv;
const io = new NodeIO();
const doc = await io.read(riggedFile);
const root = doc.getRoot();
const buffer = root.listBuffers()[0];
const byName = new Map(root.listNodes().map((n) => [n.getName(), n]));

// drop whatever clips came with the rigged file; we add named ones below
root.listAnimations().forEach((a) => a.dispose());

for (const arg of clipArgs) {
  const [clipName, file] = arg.split('=');
  const src = await io.read(file);
  const srcAnims = src.getRoot().listAnimations();
  if (!srcAnims.length) throw new Error(`${file}: no animations`);
  const anim = doc.createAnimation(clipName);
  let channels = 0, missing = new Set();
  for (const ch of srcAnims[0].listChannels()) {
    const target = byName.get(ch.getTargetNode()?.getName());
    if (!target) { missing.add(ch.getTargetNode()?.getName()); continue; }
    const s = ch.getSampler();
    const copy = (acc) => doc.createAccessor().setType(acc.getType()).setArray(acc.getArray().slice()).setBuffer(buffer);
    const sampler = doc.createAnimationSampler().setInput(copy(s.getInput())).setOutput(copy(s.getOutput()))
      .setInterpolation(s.getInterpolation());
    anim.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(target)
      .setTargetPath(ch.getTargetPath()).setSampler(sampler));
    channels++;
  }
  const dur = Math.max(...anim.listSamplers().map((s) => s.getInput().getMax([])[0]));
  console.log(`clip ${clipName}: ${channels} channels, ${dur.toFixed(2)} s${missing.size ? `, unmatched: ${[...missing]}` : ''}`);
}
if (recolourFile) await recolour(JSON.parse(fs.readFileSync(recolourFile, 'utf8')));
await doc.transform(prune());
await io.write(out, doc);

async function recolour(rules) {
  const sharp = createRequire(import.meta.url)('sharp');
  const body = root.listMeshes().find((m) => !/^prop_/.test(m.getName()));
  const prim = body.listPrimitives()[0];
  const tex = prim.getMaterial().getBaseColorTexture();
  const { data, info } = await sharp(Buffer.from(tex.getImage())).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const P = prim.getAttribute('POSITION').getArray(), T = prim.getAttribute('TEXCOORD_0').getArray();
  const idx = prim.getIndices() ? prim.getIndices().getArray() : Array.from({ length: P.length / 3 }, (_, i) => i);
  let y0 = Infinity, y1 = -Infinity;
  for (let i = 1; i < P.length; i += 3) { y0 = Math.min(y0, P[i]); y1 = Math.max(y1, P[i]); }
  const Hh = y1 - y0, yf = (i) => (P[i * 3 + 1] - y0) / Hh;
  // the head's vertical axis: the middle of the vertices in the top 8% (the head or the hat on it)
  let cx = 0, cz = 0, n = 0;
  for (let i = 0; i < P.length / 3; i++) if (yf(i) > 0.92) { cx += P[i * 3]; cz += P[i * 3 + 2]; n++; }
  cx /= n || 1; cz /= n || 1;
  const rad = (i) => Math.hypot(P[i * 3] - cx, P[i * 3 + 2] - cz) / Hh;
  const hsv = (r, g, b) => {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d > 1e-6) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [((h * 60) + 360) % 360, mx > 0 ? d / mx : 0, mx];
  };
  const rgb = (h, s, v) => {
    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [r + m, g + m, b + m];
  };
  const hex = (c) => [1, 3, 5].map((k) => parseInt(c.replace('#', '').padStart(7, '#').slice(k, k + 2), 16) / 255);
  for (const rule of rules) {
    const m = rule.mask || {};
    let geo = null;
    if (m.y || m.radial_min != null) {
      // the faces of that part of the body, rasterised in UV space (glTF v runs down the image)
      geo = new Uint8Array(W * H);
      for (let f = 0; f < idx.length; f += 3) {
        const v = [idx[f], idx[f + 1], idx[f + 2]];
        if (m.y && !v.every((i) => yf(i) >= m.y[0] && yf(i) <= m.y[1])) continue;
        if (m.radial_min != null && !v.every((i) => rad(i) >= m.radial_min || yf(i) >= (m.crown ?? 2))) continue;
        const uv = v.map((i) => [T[i * 2] * W, T[i * 2 + 1] * H]);
        const xs = uv.map((q) => q[0]), ys = uv.map((q) => q[1]);
        const [ax, ay] = uv[0], [bx, by] = uv[1], [qx, qy] = uv[2];
        const den = (by - qy) * (ax - qx) + (qx - bx) * (ay - qy);
        if (Math.abs(den) < 1e-9) continue;
        for (let y = Math.max(0, Math.floor(Math.min(...ys)) - 1); y <= Math.min(H - 1, Math.ceil(Math.max(...ys)) + 1); y++) {
          for (let x = Math.max(0, Math.floor(Math.min(...xs)) - 1); x <= Math.min(W - 1, Math.ceil(Math.max(...xs)) + 1); x++) {
            const px = x + 0.5, py = y + 0.5;
            const l1 = ((by - qy) * (px - qx) + (qx - bx) * (py - qy)) / den, l2 = ((qy - ay) * (px - qx) + (ax - qx) * (py - qy)) / den;
            if (l1 >= -0.02 && l2 >= -0.02 && 1 - l1 - l2 >= -0.02) geo[y * W + x] = 1;   // a pixel's margin: no seams
          }
        }
      }
    }
    const to = rule.to || {};
    const ramp = to.ramp ? to.ramp.map(([a, c]) => [a, hex(c)]).sort((p, q) => p[0] - q[0]) : null;
    let count = 0;
    for (let i = 0; i < W * H; i++) {
      if (geo && !geo[i]) continue;
      const r = data[i * 3] / 255, g = data[i * 3 + 1] / 255, b = data[i * 3 + 2] / 255;
      let [h, sat, val] = hsv(r, g, b);
      if (m.hue && !(m.hue[0] <= m.hue[1] ? h >= m.hue[0] && h <= m.hue[1] : h >= m.hue[0] || h <= m.hue[1])) continue;
      if (m.sat && (sat < m.sat[0] || sat > m.sat[1])) continue;
      if (m.val && (val < m.val[0] || val > m.val[1])) continue;
      let out;
      if (ramp) {
        let k = 0;
        while (k < ramp.length - 2 && val > ramp[k + 1][0]) k++;
        const [a0, c0] = ramp[k], [a1, c1] = ramp[k + 1], t = Math.min(1, Math.max(0, (val - a0) / Math.max(1e-6, a1 - a0)));
        out = c0.map((c, j) => c + (c1[j] - c) * t);
      } else {
        if (to.hue != null) h = to.hue;
        if (to.hue_shift) h = (h + to.hue_shift + 360) % 360;
        sat = Math.min(1, sat * (to.sat_mul ?? 1));
        val = Math.min(1, Math.max(0, val * (to.val_mul ?? 1) + (to.val_add ?? 0)));
        out = rgb(h, sat, val);
      }
      for (let j = 0; j < 3; j++) data[i * 3 + j] = Math.round(Math.min(1, Math.max(0, out[j])) * 255);
      count++;
    }
    console.log(`recolour: ${count} texels (${((100 * count) / (W * H)).toFixed(1)}%)${geo ? ' on the masked faces' : ''}`);
  }
  tex.setImage(await sharp(data, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer()).setMimeType('image/png');
}
console.log('wrote', out);
