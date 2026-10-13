// contact_check on a given page dump (tools/people_dump.mjs --out), without touching the shared
// gen/details/placements.json: node check_dump.mjs <dump.json> <section> <out.json>
import fs from 'node:fs';
import { setup, checkPerson } from '../../../../../tools/contact_check.mjs';
const [dumpF, section, outF] = process.argv.slice(2);
setup({ placements: JSON.parse(fs.readFileSync(dumpF, 'utf8')) });
const dump = JSON.parse(fs.readFileSync(dumpF, 'utf8'));
const results = dump.people.filter((p) => p.section === section && p.kind !== 'animal').map(checkPerson);
const sec = { section, dump: dumpF, people: results.length, fails: results.reduce((a, r) => a + r.fails.length, 0), figures_failing: results.filter((r) => r.fails.length).length, results };
fs.writeFileSync(outF, JSON.stringify(sec, null, 1));
console.log(`${section}: ${sec.people} people, ${sec.figures_failing} failing, ${sec.fails} FAILs -> ${outF}`);
