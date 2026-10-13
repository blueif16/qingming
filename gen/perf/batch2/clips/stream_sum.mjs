// the stream events of probe.mjs stream runs (full vs split): per load, its time, its stall (longest frame), the models
// step and the bakes; then the medians and the worst
import fs from 'node:fs';
const runs = process.argv.slice(2);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };
for (const r of runs) {
  const o = JSON.parse(fs.readFileSync(`${r}/stream.json`, 'utf8'));
  const loads = o.events.filter((e) => e.kind === 'load' && !e.failed);
  const st = loads.map((e) => e.stallMs), mo = loads.map((e) => e.steps?.models || 0), ms = loads.map((e) => e.ms), bk = loads.map((e) => e.maxBakeMs || 0), lt = loads.map((e) => e.longestTaskMs || 0);
  console.log(`${r.split('/').pop().padEnd(9)} ${loads.length} loads | stall median ${med(st)} max ${Math.max(...st)} ms | longest task median ${med(lt)} max ${Math.max(...lt)} | load median ${med(ms)} ms | models step median ${med(mo)} max ${Math.max(...mo)} ms | max bake in a frame ${Math.max(...bk)} ms`);
  for (const e of loads) console.log(`    ${e.name.padEnd(36)} ${String(e.ms).padStart(6)} ms  stall ${String(e.stallMs).padStart(5)}  task ${String(e.longestTaskMs).padStart(5)}  models ${String(e.steps?.models ?? '-').padStart(5)}  bake ${e.bakeMs}/${e.maxBakeMs}`);
}
