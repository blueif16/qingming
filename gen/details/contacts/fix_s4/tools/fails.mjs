// one line per failing person of a contact_check result file: node fails.mjs <result.json>
import fs from 'node:fs';
const s = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
for (const r of s.results) if (r.fails.length) console.log(r.id.padEnd(34), r.fails.map((f) => `${f.class}${f.cause ? `(${f.cause})` : ''}${f.clip ? ' ' + f.clip : ''}${f.site ? ' ' + f.site : ''} ${f.value}`).join('; '));
