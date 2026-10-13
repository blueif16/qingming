// FAILs per class (as contact_check's summary: "contact:seat (no seat)", "<class> (<cause>)") of a contact_check result
// file, figures only or crews apart: node classes.mjs <result.json>
import fs from 'node:fs';
const s = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const cls = (f) => (f.class === 'contact:seat' && f.note?.startsWith('no seat') ? 'contact:seat (no seat)' : f.cause ? `${f.class} (${f.cause})` : f.class);
const t = {}, tc = {};
let ff = 0, fF = 0, cf = 0, cF = 0;
for (const r of s.results) {
  if (!r.fails.length) continue;
  const crew = r.kind === 'crew';
  if (crew) { cf++; cF += r.fails.length; } else { ff++; fF += r.fails.length; }
  for (const f of r.fails) { const m = crew ? tc : t; m[cls(f)] = (m[cls(f)] || 0) + 1; }
}
console.log(JSON.stringify({ figures_failing: ff, fails: fF, by_class: t, crew_failing: cf, crew_fails: cF, crew_by_class: tc }));
