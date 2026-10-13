#!/usr/bin/env node
// Predicted contact check (tools/contact_check.mjs --predict) where every animal of the section plays a clip of its
// current people.json `do` (the dump's clip when it is still in it, else the first one): for a cycle changed since the
// last page dump. Prints one line per failing person (as fix_s4/tools/fails.mjs) and writes
// gen/details/contacts/fix_river/predicted/<section>.now.json.
//   node check_now.mjs <section> [ids...]   (ids: print those people's contact checks too)
import fs from 'node:fs';
import path from 'node:path';
import { QM } from '../../../../../tools/lib/owners_index.mjs';
import { setup, checkPerson } from '../../../../../tools/contact_check.mjs';
import { predictDump } from '../../../../../tools/place_predict.mjs';

const [section, ...ids] = process.argv.slice(2);
let ctx = setup({});
const dump = predictDump(ctx.dump, ctx.pred, { sections: [section] });
const pj = JSON.parse(fs.readFileSync(path.join(QM, `sections/${section}/people.json`), 'utf8'));
for (const p of dump.people) {
  if (p.section !== section || p.kind !== 'animal') continue;
  const sp = pj.animals?.[p.id];
  if (!sp) continue;
  const clips = (sp.do || [['idle', 8]]).map(([c]) => c);
  if (!sp.path && !clips.includes(p.clip)) p.clip = clips[0];
  p.do = sp.do || p.do;
}
ctx = setup({ placements: dump, worldIn: ctx.world });
const res = dump.people.filter((p) => p.section === section && p.kind !== 'animal').map(checkPerson);
const out = path.join(QM, `gen/details/contacts/fix_river/predicted/${section}.now.json`);
fs.writeFileSync(out, JSON.stringify({ section, results: res }, null, 1));
let nf = 0, nF = 0, nc = 0, nC = 0;
const crewOnly = !process.argv.includes('--crew');
for (const r of res) {
  if (r.kind === 'crew' && crewOnly) { if (r.fails.length) { nc++; nC += r.fails.length; } continue; }
  if (r.fails.length) { nf++; nF += r.fails.length; console.log(r.id.padEnd(34), r.fails.map((f) => `${f.class}${f.cause ? `(${f.cause})` : ''}${f.clip ? ' ' + f.clip : ''}${f.site ? ' ' + f.site : ''} ${f.value}`).join('; ')); }
  if (ids.includes(r.id)) for (const c of r.checks.filter((k) => k.class === 'contact')) console.log('   ', c.clip, c.site, '->', (c.with || []).join('+'), 'q', c.gap_q, '/', c.pen_q, c.status);
}
console.log(`${section}: ${res.length} people, ${nf} failing, ${nF} FAILs (predicted, animals on their current cycles)${crewOnly ? `; boat crews (fix-boats', not listed; --crew lists them): ${nc} failing, ${nC} FAILs` : ''}`);
