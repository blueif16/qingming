#!/usr/bin/env node
// A listening page for a sound set: every unit by group, with where it plays, its prompt, and the files as shipped
// (gen/sounds/<set>/ship/*.webm, tools/sound_cut.mjs), so what you judge is what the world downloads. Loops loop.
//   node tools/sound_page.mjs <spec.json>   -> gen/sounds/<set>/audition.html (open it from Windows:
//   \\wsl.localhost\Ubuntu\home\ran\3d_director\qingming\gen\sounds\<set>\audition.html)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const specPath = process.argv[2];
const SPEC = JSON.parse(fs.readFileSync(path.resolve(specPath), 'utf8'));
const SET = path.basename(specPath, '.json');
const DIR = path.join(ROOT, 'gen/sounds', SET);
const sizes = JSON.parse(fs.readFileSync(path.join(DIR, 'ship.json'), 'utf8'));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
const ORDER = ['player', 'animal', 'cart', 'trade', 'time', 'water', 'boat', 'bed', 'ui'];
const groups = {};
for (const [id, u] of Object.entries(SPEC.units)) if (u.kind === 'sfx') (groups[u.group || 'other'] ||= []).push([id, u]);
const files = Object.keys(sizes);
let total = 0, html = '';
for (const g of [...ORDER, ...Object.keys(groups).filter((g) => !ORDER.includes(g))].filter((g) => groups[g])) {
  html += `<h2>${esc(g)}</h2><table>`;
  for (const [id, u] of groups[g]) {
    const mine = files.filter((f) => f === id || (f.startsWith(`${id}_`) && /^\d+$/.test(f.slice(id.length + 1)))).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    const kb = mine.reduce((s, f) => s + sizes[f], 0) / 1024;
    total += kb;
    const players = mine.map((f) => `<audio controls preload="none"${u.loop ? ' loop' : ''} src="ship/${f}.webm"></audio>`).join('');
    html += `<tr><td class="id"><b>${esc(id)}</b><br><span class="k">${kb.toFixed(0)} KB${u.loop ? ' · loop' : ''}${mine.length > 1 ? ` · ${mine.length} hits` : ''}</span></td>
<td><div class="use">${esc(u.use)}</div><div class="players">${players || '<i>not shipped</i>'}</div><div class="p">${esc(u.prompt)}${u.from ? ` <i>(${esc(u.from)})</i>` : ''}</div></td></tr>`;
  }
  html += '</table>';
}
const page = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sounds: ${esc(SET)}</title>
<style>body{font:14px system-ui,sans-serif;margin:16px;max-width:1100px;color:#222;background:#faf8f3}h2{margin:28px 0 6px;text-transform:capitalize}
table{border-collapse:collapse;width:100%}td{padding:8px;border-bottom:1px solid #ddd;vertical-align:top}td.id{width:190px}.k{color:#777;font-size:12px}
.use{font-weight:600}.p{color:#666;font-size:12px;margin-top:4px}.players{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}audio{height:30px;width:220px}</style>
<h1>Sounds: ${esc(SET)}</h1><p>${esc(SPEC.about)}</p><p>Played exactly as shipped: Opus in WebM, mono, loudness-matched at -20 LUFS (the world mixes them by group).
Total <b>${total.toFixed(0)} KB</b> for ${files.length} files. Loops repeat so you can hear the join.</p>${html}`;
fs.writeFileSync(path.join(DIR, 'audition.html'), page);
console.log(`${path.join(DIR, 'audition.html')}: ${files.length} files, ${total.toFixed(0)} KB`);
