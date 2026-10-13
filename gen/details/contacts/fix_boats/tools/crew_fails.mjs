#!/usr/bin/env node
// The boat crews' FAILs in contact_check results (fix-boats): per crew member its boat, clip cycle and FAILs (class,
// clip, site, value, with, the instants it failed at), and a table of FAILs per section and class.
//   node gen/details/contacts/fix_boats/tools/crew_fails.mjs <dir with <section>.json> [sections...] [--brief]
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
const dir = args[0];
const brief = args.includes('--brief');
const secs = args.slice(1).filter((a) => !a.startsWith('--'));
const list = secs.length ? secs : ['outer_road_2', 'rainbow_bridge', 'canal', 'countryside'];
const table = {};
let nCrew = 0, nFail = 0, nF = 0;
for (const s of list) {
  const f = path.join(dir, `${s}.json`);
  if (!fs.existsSync(f)) continue;
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const crew = j.results.filter((r) => r.kind === 'crew');
  nCrew += crew.length;
  for (const r of crew) {
    if (r.fails.length) { nFail++; nF += r.fails.length; }
    for (const x of r.fails) { const k = x.class + (x.cause ? ` (${x.cause})` : ''); (table[s] ||= {})[k] = ((table[s] ||= {})[k] || 0) + 1; }
    if (brief || !r.fails.length) continue;
    console.log(`${s}/${r.id} [${r.model}] on ${r.boat || '-'} (${r.support || ''})`);
    for (const x of r.fails) console.log(`   ${x.class}${x.cause ? `(${x.cause})` : ''} ${x.clip || ''} ${x.site || ''} = ${x.value} ${(x.with || []).join(',')} ${x.note ? '| ' + x.note : ''} @${(x.at || []).length}/${(r.instants || []).length}`);
  }
}
console.log(`\ncrew: ${nCrew}, failing ${nFail}, FAILs ${nF}`);
const classes = [...new Set(Object.values(table).flatMap((t) => Object.keys(t)))].sort();
console.log(`| section | ${classes.join(' | ')} |`);
for (const [s, t] of Object.entries(table)) console.log(`| ${s} | ${classes.map((c) => t[c] || '').join(' | ')} |`);
