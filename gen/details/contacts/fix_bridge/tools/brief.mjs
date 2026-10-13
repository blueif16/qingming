// per failing figure of a contact_check result: its fails, its people.json cast and its map line
//   node brief.mjs <result.json> [ids...]
import fs from 'node:fs';
const [res, ...ids] = process.argv.slice(2);
const s = JSON.parse(fs.readFileSync(res, 'utf8'));
const P = JSON.parse(fs.readFileSync('sections/rainbow_bridge/people.json', 'utf8'));
const txt = fs.readFileSync('map/text/S3.md', 'utf8').split('\n');
for (const r of s.results) {
  if (ids.length ? !ids.includes(r.id) : !r.fails.length) continue;
  const f = P.figures[r.id] || {};
  const line = txt.find((l) => l.startsWith('- **') && l.includes(`S3.fig.${r.id}\``)) || '';
  console.log(`\n## ${r.id}  [${r.model}] do=${JSON.stringify(f.do)} nudge=${JSON.stringify(f.nudge)} facing=${f.facing_deg} root_h=${f.root_h ?? ''}`);
  console.log('  FAILS: ' + r.fails.map((x) => `${x.class}${x.cause ? `(${x.cause})` : ''} ${x.clip || ''} ${x.site || ''} ${x.value}${x.with ? ' with ' + x.with.join(',') : ''}${x.note ? ' :: ' + x.note : ''}`).join(' | '));
  console.log('  MAP: ' + line.slice(0, 900));
  if (P.nudge_why?.[r.id]) console.log('  NUDGE_WHY: ' + P.nudge_why[r.id].slice(0, 400));
  if (P.cast_why?.[r.id]) console.log('  CAST_WHY: ' + P.cast_why[r.id].slice(0, 300));
}
