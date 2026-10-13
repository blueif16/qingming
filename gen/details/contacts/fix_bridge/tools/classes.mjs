// FAILs by class of a contact_check result: node classes.mjs <result.json>
import fs from 'node:fs';
const s = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const m = {};
for (const r of s.results) for (const f of r.fails) { const k = f.class === 'contact:seat' && f.note?.startsWith('no seat') ? 'contact:seat (no seat)' : f.cause ? `${f.class} (${f.cause})` : f.class; m[k] = (m[k] || 0) + 1; }
console.log(`${s.section}: ${s.people} people, ${s.figures_failing} failing, ${s.fails} FAILs`);
for (const [k, v] of Object.entries(m).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);
