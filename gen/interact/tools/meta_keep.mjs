#!/usr/bin/env node
// Keep every existing clip_meta.json entry as it was (interactions round, 2026-10-13: only additions). After a
// clip_ground --write-meta pass, the entries of clips that are not this round's new clips (on the 8 playable
// characters) are put back to their values in <before.json> (clip_ground's convergence flips some other characters'
// sole_m by 1 mm). Run under the charbuild flock.
//   node gen/interact/tools/meta_keep.mjs <before.json>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const QM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const NEW = /^(crane|lean_chin|lean_over|strike_drum)$|~(moat_rail|moat_rail_child|player_crown_[ab]|player_crown_[ab]_child)$/;
const PLAY = new Set(['official', 'scholar', 'monk', 'woman', 'child', 'soldier', 'porter', 'sightseer']);
const mf = path.join(QM, 'web/public/assets/clip_meta.json');
const before = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), meta = JSON.parse(fs.readFileSync(mf, 'utf8'));
const put = [];
for (const [f, A] of Object.entries(before)) {
  if (!A || typeof A !== 'object') continue;
  const ch = path.basename(f, '.glb');
  for (const [c, e] of Object.entries(A)) {
    if (PLAY.has(ch) && NEW.test(c)) continue;
    if (JSON.stringify(meta[f]?.[c]) !== JSON.stringify(e)) { (meta[f] ||= {})[c] = e; put.push(`${ch} ${c}`); }
  }
}
fs.writeFileSync(mf, JSON.stringify(meta));
console.log(`meta_keep: ${put.length} entries put back${put.length ? ': ' + put.join(', ') : ''}`);
