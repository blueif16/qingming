#!/usr/bin/env node
// The ambient sites of every section, from its layout.json and people.json (web/src/ambient_sites.js, the page's own
// function), written to gen/details/ambient/sites/<folder>.json with one summary line each. Every site names the map
// ID it is placed from.  node gen/details/ambient/tools/sites.mjs [folder ...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const { sitesOf } = await import(path.join(QM, 'web/src/ambient_sites.js'));
const folders = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(QM, 'sections')).filter((f) => fs.existsSync(path.join(QM, 'sections', f, 'layout.json')));
for (const f of folders) {
  const L = JSON.parse(fs.readFileSync(path.join(QM, 'sections', f, 'layout.json'), 'utf8'));
  const pp = path.join(QM, 'sections', f, 'people.json'), P = fs.existsSync(pp) ? JSON.parse(fs.readFileSync(pp, 'utf8')) : null;
  const s = sitesOf(L, P);
  fs.writeFileSync(path.join(QM, 'gen/details/ambient/sites', `${f}.json`), JSON.stringify(s, null, 1));
  const n = Object.entries(s).filter(([, v]) => Array.isArray(v)).map(([k, v]) => `${k} ${v.length}`).join(', ');
  console.log(`${f.padEnd(15)} ${s.section.padEnd(4)} ${n}`);
}
