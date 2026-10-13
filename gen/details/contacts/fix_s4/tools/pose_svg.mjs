// Stick-figure sheet of a shipped character clip (no GPU): bones from the page's own loader (tools/lib/three_node.mjs),
// side view (z right, y up) and front view (x left, y up) at a few times, the contact sites marked, a grid every 0.1 m.
//   node gen/details/contacts/fix_s4/tools/pose_svg.mjs <character> <clip> <out.png> [--times 0,2,4] [--plane y=0.8]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { QM, THREE, loadModels } from '../../../../../tools/lib/three_node.mjs';
import { defineSites, sampleSites } from '../../../../../tools/lib/body_sites.mjs';
const sharp = createRequire(path.join(QM, 'tools/package.json'))('sharp');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [name, clipName, out] = args;
const reg = JSON.parse(fs.readFileSync(path.join(QM, 'web/public/assets/chars/characters.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(QM, 'web/public/assets/clip_meta.json'), 'utf8'));
const m = (await loadModels([name], reg, meta, { engine: opt('--engine') || 'page' }))[name];
const scene = m.scene; scene.updateMatrixWorld(true);
const S = defineSites(scene);
const clip = m.clips.find((c) => c.name === clipName);
const times = (opt('--times') || [0, 0.25, 0.5, 0.75].map((f) => (f * clip.duration).toFixed(2)).join(',')).split(',').map(Number);
const mixer = new THREE.AnimationMixer(scene), act = mixer.clipAction(clip).play();
const bones = []; scene.traverse((o) => { if (o.isBone) bones.push(o); });
const PX = 160, W = 2.0, H = 2.0; // metres per panel
const panels = [];
for (const t of times) {
  act.time = Math.min(t, clip.duration - 1e-4); mixer.update(0); scene.updateMatrixWorld(true);
  const segs = [];
  for (const b of bones) if (b.parent?.isBone) segs.push([b.parent.getWorldPosition(new THREE.Vector3()), b.getWorldPosition(new THREE.Vector3())]);
  const sites = {}; sampleSites(S, (s, p) => { sites[s] = p.clone(); });
  panels.push({ t, segs, sites });
}
const plane = opt('--plane');
const svgPanel = (pn, view, ox) => {
  const X = (p) => ox + (view === 'side' ? (p.z + W / 2) : (W / 2 - p.x)) * PX, Y = (p) => (H - p.y) * PX;
  let s = '';
  for (let g = 0; g <= W * 10; g++) s += `<line x1="${ox + g * PX / 10}" y1="0" x2="${ox + g * PX / 10}" y2="${H * PX}" stroke="#333" stroke-width="${g % 10 === 0 ? 1.5 : 0.5}"/>`;
  for (let g = 0; g <= H * 10; g++) s += `<line x1="${ox}" y1="${g * PX / 10}" x2="${ox + W * PX}" y2="${g * PX / 10}" stroke="#333" stroke-width="${g % 10 === 0 ? 1.5 : 0.5}"/>`;
  if (plane) { const y = +plane.split('=')[1]; s += `<line x1="${ox}" y1="${(H - y) * PX}" x2="${ox + W * PX}" y2="${(H - y) * PX}" stroke="#0a0" stroke-width="2"/>`; }
  for (const [a, b] of pn.segs) s += `<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="#ddd" stroke-width="3"/>`;
  const col = { palm_L: '#f44', palm_R: '#f80', shoulder_R: '#4af', shoulder_L: '#48f', seat: '#ff0', sole_L: '#0f0', sole_R: '#0c8', forearm_L: '#f4f', forearm_R: '#c4c', head_top: '#fff' };
  for (const [k, c] of Object.entries(col)) if (pn.sites[k]) s += `<circle cx="${X(pn.sites[k])}" cy="${Y(pn.sites[k])}" r="4" fill="${c}"/>`;
  s += `<text x="${ox + 6}" y="16" fill="#fff" font-size="14" font-family="monospace">${view} t=${pn.t}</text>`;
  return s;
};
let body = '';
panels.forEach((pn, i) => { body += svgPanel(pn, 'side', i * 2 * W * PX); body += svgPanel(pn, 'front', (i * 2 + 1) * W * PX); });
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${panels.length * 2 * W * PX}" height="${H * PX + 20}"><rect width="100%" height="100%" fill="#111"/>${body}<text x="6" y="${H * PX + 16}" fill="#aaa" font-size="13" font-family="monospace">${name} ${clipName}: side view (z forward to the right), front view (the figure's left on the right of the panel); palm L red, R orange; shoulders blue; seat yellow; soles green; forearms magenta; grid 0.1 m</text></svg>`;
await sharp(Buffer.from(svg)).png().toFile(path.resolve(QM, out));
console.log('wrote', out);
