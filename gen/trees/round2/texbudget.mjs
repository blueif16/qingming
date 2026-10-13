// texture own MB of a section's panels + the cards its trees use per trees/assign/<S>.json, as tools/budget_check.mjs
// counts them (GPU bytes: RGBA8 + mips, or the adopted KTX2 copy: UASTC 1 byte a pixel, ETC1S alpha 1, opaque 0.5).
// node texbudget.mjs <S> <folder> [--alt assign.json]
import fs from 'node:fs';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming', A = `${Q}/web/public/assets`;
const sharp = createRequire(`${Q}/tools/package.json`)('sharp');
const [S, folder] = process.argv.slice(2);
const alt = process.argv.includes('--alt') ? process.argv[process.argv.indexOf('--alt') + 1] : null;
const ktx = JSON.parse(fs.readFileSync(`${A}/ktx2.json`, 'utf8'));
const reg = JSON.parse(fs.readFileSync(`${A}/trees/trees.json`, 'utf8'));
const asg = JSON.parse(fs.readFileSync(alt || `${Q}/trees/assign/${S}.json`, 'utf8'));
async function tex(rel) {
  const e = ktx.files[rel]; const m = await sharp(`${A}/${rel}`).metadata();
  const px = (m.width * m.height * 4) / 3;
  if (!e || !ktx.kinds[e.kind]?.adopt) return { mb: (px * 4) / 1048576, kind: 'rgba' };
  return { mb: (px * (e.mode === 'etc1s' && !e.alpha ? 0.5 : 1)) / 1048576, kind: e.mode };
}
let panels = 0, cards = 0;
const bd = fs.existsSync(`${A}/${folder}/backdrop.json`) ? JSON.parse(fs.readFileSync(`${A}/${folder}/backdrop.json`, 'utf8')) : { panels: [] };
for (const p of bd.panels || []) { if (p.hold) continue; const rel = `${folder}/backdrop_${p.side}.webp`; if (!fs.existsSync(`${A}/${rel}`)) continue; const t = await tex(rel); panels += t.mb; console.log(`panel ${rel} ${t.mb.toFixed(2)} MB (${t.kind})`); }
const set = [...new Set(Object.values(asg).map((a) => a.card).filter((c) => c !== 'kit'))].sort();
const rows = [];
for (const c of set) { const t = await tex(reg[c].file.replace(/^assets\//, '')); cards += t.mb; rows.push([c, reg[c].px.join('x'), t.mb.toFixed(2), t.kind]); }
for (const r of rows.sort((a, b) => b[2] - a[2])) console.log(`card ${r[0].padEnd(15)} ${r[1].padStart(9)} ${r[2]} MB ${r[3]}`);
console.log(`${S}: ${set.length} cards ${cards.toFixed(2)} MB + panels ${panels.toFixed(2)} MB = ${(cards + panels).toFixed(2)} MB (budget 24)`);
