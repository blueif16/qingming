#!/usr/bin/env node
// Per-clip files, the same people as with the full GLBs (perf batch 2, clips agent): loads world.html with every
// section in (?window=all) twice, with the split (clips.json) and with ?clipfiles=0 (the full GLBs), and compares
//   - every person: same id, character and the clips its routine asked for and had (CrowdPerson.clips: what is baked);
//   - clips started before they came (lateClips: should be none);
//   - each clip's measured grounding, stride, speed and hips height (?clipmeta=0: the page samples every clip itself, so
//     equal numbers mean equal key data);
//   - what the character files cost: requests and bytes under assets/chars/.
//   tools/chrome_slot.sh node gen/perf/batch2/clips/split_probe.mjs http://127.0.0.1:5196 <out.json> [--meta]
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const [base, out] = args;
const meta = args.includes('--meta') ? '&clipmeta=0' : '';
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0] || await browser.newContext();
const res = {};
for (const mode of ['split', 'full']) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 800, height: 600 });
  const errors = [];
  // every response under assets/chars/ (the resource timing buffer stops at 250 entries, so not from the page)
  const chars = { requests: 0, bytes: 0 };
  page.on('requestfinished', async (q) => { if (!/\/assets\/chars\//.test(q.url())) return; chars.requests++; try { chars.bytes += (await q.sizes()).responseBodySize; } catch { /* gone */ } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const t0 = Date.now();
  await page.goto(`${base}/world.html?window=all&tier=low&adapt=0&sound=0&start=0${meta}${mode === 'full' ? '&clipfiles=0' : ''}`, { timeout: 300000 });
  await page.waitForFunction(() => window.__test, null, { timeout: 600000, polling: 500 });
  await page.waitForFunction(() => window.__test.stream.stats().baking === 0 && !window.__test.stream.stats().loading.length, null, { timeout: 300000, polling: 500 });
  await page.waitForTimeout(3000);
  const r = await page.evaluate(() => {
    const T = window.__test, st = T.stream.stats();
    const people = T.people.all.map((p) => ({ id: p.id, model: p.model.name, clips: [...(p.clips || [])].sort(), clip: p.clip, pending: p.pending?.name || null, drawn: !!p.drawn }));
    return { split: st.split, lateClips: st.lateClips, loaded: st.loaded, people, clipMeta: T.clipMeta,
      models: Object.fromEntries(Object.entries(T.stream.internals.models).map(([n, m]) => [n, m.clips.map((c) => c.name).sort()])) };
  });
  res[mode] = { ...r, chars, errors, secs: (Date.now() - t0) / 1000 };
  await page.close();
}
await browser.close().catch(() => {});

// compare
const S = res.split, F = res.full, diffs = [];
const keyed = (list) => { const m = new Map(), n = new Map(); for (const p of list) { const k = `${p.id}|${p.model}`; n.set(k, (n.get(k) || 0) + 1); m.set(`${k}|${n.get(k)}`, p); } return m; };
const sp = keyed(S.people), fp = keyed(F.people);
// people without an id (the boats' flowing copies' crews) come and go with the boats' timing: counted, not compared
const anon = (k) => k.startsWith('undefined|') || k.startsWith('null|');
for (const [k, p] of fp) {
  if (anon(k)) continue;
  const q = sp.get(k);
  if (!q) { diffs.push(`missing with the split: ${k}`); continue; }
  if (p.clips.join() !== q.clips.join()) diffs.push(`${k}: clips full [${p.clips}] split [${q.clips}]`);
  if (q.pending) diffs.push(`${k}: still waiting for ${q.pending}`);
}
for (const k of sp.keys()) if (!anon(k) && !fp.has(k)) diffs.push(`only with the split: ${k}`);
let metaCompared = 0;
for (const [file, clips] of Object.entries(S.clipMeta)) for (const [clip, m] of Object.entries(clips)) {
  const f = F.clipMeta[file]?.[clip];
  if (!f || !m) continue;
  metaCompared++;
  for (const k of ['n', 'duration', 'speed', 'locomotion', 'stride', 'hipsY', 'k', 'grounded']) if (JSON.stringify(m[k]) !== JSON.stringify(f[k])) diffs.push(`clip_meta ${file} ${clip} ${k}: full ${f[k]} split ${m[k]}`);
}
const summary = {
  people: { full: F.people.length, split: S.people.length }, splitModels: S.split.length, lateClips: S.lateClips, metaCompared,
  undrawn: { full: F.people.filter((p) => !p.drawn).length, split: S.people.filter((p) => !p.drawn).length },
  chars: { full: F.chars, split: S.chars }, errors: { full: F.errors.slice(0, 5), split: S.errors.slice(0, 5) }, secs: { full: F.secs, split: S.secs },
  diffs: diffs.length, firstDiffs: diffs.slice(0, 30),
};
fs.writeFileSync(out, JSON.stringify({ summary, res }, null, 1));
console.log(JSON.stringify(summary, null, 1));
