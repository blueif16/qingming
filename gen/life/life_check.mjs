#!/usr/bin/env node
// The life pass's page check (gen/life/progress.md): numbers, not looks.
//   tools/chrome_slot.sh node gen/life/life_check.mjs <tag> [--views a,b] [--secs 24] [--phone] [--desktop] [--shots] [--lang zh_en]
// At each view (world.html?start=0, a section's scene.json views), with chatter on, it samples the bubbles every
// 250 ms for --secs seconds and records:
//   - the most bubbles open at once (must be <= 2), and any two on-screen bubble boxes that overlap (must be none);
//   - the chat and bark lines shown, the plot-line steps heard;
// then (desktop) the near talks: each scene of the views' sections is played for three kinds of player (official,
// scholar, child) and its beats are read back, so a line that depends on who you play is seen to change; and the
// second talk with a host plays its `again` set.
// --shots: a screenshot whenever two bubbles are on screen (the first per view), and one of the 圖志's 見聞 leaf.
// Writes gen/life/check/<tag>.json (and shots in gen/life/shots/<tag>/).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const Q = '/home/ran/3d_director/qingming';
const { chromium } = createRequire(`${Q}/tools/package.json`)('playwright-core');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const tag = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))) || 'run';
const base = opt('--url', 'http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&talk=1');
const views = opt('--views', 'outer_road:carts,stalls,sedans,post,fortune').split(',');
const secs = +opt('--secs', 24);
const lang = opt('--lang', null);
const shots = args.includes('--shots');
const vps = [...(args.includes('--phone') || !args.includes('--desktop') ? ['phone'] : []), ...(args.includes('--desktop') || !args.includes('--phone') ? ['desktop'] : [])];
const outDir = path.join(Q, 'gen/life/shots', tag);
if (shots) fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0];
const result = { tag, date: new Date().toISOString(), url: base, views, secs, lang, runs: [], talks: [], fails: [] };
const fail = (m) => { result.fails.push(m); console.log('FAIL', m); };

const overlap = (a, b) => a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1 && a.y0 < b.y1 - 1 && b.y0 < a.y1 - 1;

for (const vp of vps) {
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  if (vp === 'phone') {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  } else await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  // a clean memory (the slot's Chrome profile keeps localStorage between runs), and the language asked for
  await page.addInitScript((l) => { try { const k = 'qingming-ui-prefs-v1'; const v = JSON.parse(localStorage.getItem(k) || '{}'); v.discovered = []; v.helpSeen = true; if (l) v.lang = l; else delete v.lang; localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } }, lang);
  await page.goto(base);
  await page.waitForFunction(() => window.__test, null, { timeout: 240000 });
  await page.evaluate(async () => { const t = window.__test; t.set('hour', 10); t.ui.help(false); await t.ui.ready(); t.ui.chatter(true); });
  result.viewNames = await page.evaluate(() => window.__test.views);
  for (const v of views) if (!result.viewNames.includes(v)) fail(`no view named ${v} (see viewNames)`);
  for (const view of views) {
    await page.evaluate((v) => window.__test.view(v), view);
    // the window round the view in, its people placed (they come after the section), nothing baking
    await page.waitForFunction(() => { const s = window.__test.stream.stats(); return !s.loading.length && s.baking === 0; }, null, { timeout: 120000 }).catch(() => {});
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.__test.ui.chatterStats(true));
    const run = { vp, view, samples: 0, maxOpen: 0, twoOnScreen: 0, overlaps: 0, lines: [], heard: [] };
    let shot = false;
    const t0 = Date.now();
    while (Date.now() - t0 < secs * 1000) {
      const b = await page.evaluate(() => window.__test.ui.bubbles());
      run.samples++;
      run.maxOpen = Math.max(run.maxOpen, b.open);
      if (b.boxes.length >= 2) {
        run.twoOnScreen++;
        for (let i = 0; i < b.boxes.length; i++) for (let j = i + 1; j < b.boxes.length; j++) if (overlap(b.boxes[i], b.boxes[j])) { run.overlaps++; run.lastOverlap = [b.boxes[i], b.boxes[j]]; }
        if (shots && !shot) { shot = true; await page.waitForTimeout(1300); await page.screenshot({ path: path.join(outDir, `${vp}_${view.replace(':', '_')}.png`) }); } // the glyphs have stepped in
      } else if (shots && !shot && vp === 'phone' && b.boxes.length === 1 && Date.now() - t0 > secs * 500) {
        // the light tier shows one chat bubble at a time: a shot of one, after the first half of the window
        shot = true; await page.waitForTimeout(1300); await page.screenshot({ path: path.join(outDir, `${vp}_${view.replace(':', '_')}.png`) });
      }
      await page.waitForTimeout(250);
    }
    const st = await page.evaluate(() => ({ chat: window.__test.ui.chatterState(), b: window.__test.ui.bubbles(), found: JSON.parse(localStorage.getItem('qingming-ui-prefs-v1') || '{}').discovered || [] }));
    run.lines = st.chat.log.filter((l) => l[0] >= 0).map((l) => `${l[1]} ${l[2]}:${l[3]} ${l[4]}`);
    run.stats = st.chat.stats;
    run.awake = st.chat.awake.length;
    run.maxSeenEver = st.b.maxSeen;
    run.heard = st.found.filter((k) => k.startsWith('h:'));
    run.detail = await page.evaluate(() => window.__test.details?.()?.talk ?? null); // detail.js stats (the tier contract)
    run.marks = st.chat.marks;
    if (run.maxOpen > 2 || st.b.maxSeen > 2) fail(`${vp} ${view}: ${Math.max(run.maxOpen, st.b.maxSeen)} bubbles open at once`);
    if (run.overlaps) fail(`${vp} ${view}: ${run.overlaps} samples with overlapping bubbles ${JSON.stringify(run.lastOverlap)}`);
    console.log(`${vp} ${view}: shown ${st.chat.stats.shown}, lines ${st.chat.stats.lines}, skipped ${st.chat.stats.skipped}, awake ${run.awake}, maxOpen ${run.maxOpen}, two on screen ${run.twoOnScreen}/${run.samples}, overlaps ${run.overlaps}, scan ${st.chat.stats.scanMsMean} ms, heard ${run.heard.join(' ')}`);
    result.runs.push(run);
  }
  // near talks, by who you play (desktop only)
  if (vp === 'desktop') {
    await page.evaluate(() => window.__test.ui.loadTalk());
    const only = opt('--scenes', null)?.split(',');
    const ids = (await page.evaluate(() => window.__test.ui.scenes().map((s) => s.id))).filter((id) => !only || only.some((p) => id.startsWith(p)));
    for (const id of ids) {
      // stand by the host (a talk closes when you are more than a few metres from it)
      const at = await page.evaluate((id) => window.__test.ui.scenes().find((s) => s.id === id), id);
      if (at.X == null) continue;
      await page.evaluate(async ([X, D]) => { await window.__test.goto(X + 1.2, D - 1.2); }, [at.X, at.D]);
      await page.waitForFunction(() => window.__test.stream.stats().baking === 0, null, { timeout: 90000 }).catch(() => {});
      await page.waitForTimeout(600);
      // can you walk up to it? the nearest walkable spot round the host (the page's own ground and colliders)
      const reach = await page.evaluate(async (id) => {
        const t = window.__test, h = t.ui.hostOf(id);
        if (!h) return null;
        let best = null;
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          await t.goto(h.x + Math.cos(ang) * 1.4, -(h.z) + Math.sin(ang) * 1.4);
          const r = t.ui.hostOf(id);
          if (r && (!best || r.dist + Math.abs(r.dh) < best.dist + Math.abs(best.dh))) best = { ...r, a };
          if (r && r.dist <= 3.2 && Math.abs(r.dh) <= 1.6) break;
        }
        return best;
      }, id);
      const row = { id, kinds: {}, reach: reach && { dist: +reach.dist.toFixed(2), dh: +reach.dh.toFixed(2), ok: reach.dist <= 3.2 && Math.abs(reach.dh) <= 1.6 } };
      if (!row.reach?.ok) console.log(`talk ${id}: host not reachable on foot (${JSON.stringify(row.reach)})`);
      for (const av of ['official', 'scholar', 'child']) {
        const r = await page.evaluate(async ([id, av]) => {
          const t = window.__test;
          t.s.avatar = av; // the kind is read from the setting; the body need not change for this check
          t.ui.close();
          const out = [];
          for (let visit = 0; visit < 2; visit++) {
            if (!t.ui.talk(id)) return { error: 'could not start' };
            const lines = [];
            for (let k = 0; k < 8; k++) {
              const s = t.ui.state().talk;
              if (!s.conv) break;
              for (const o of s.conv.open) if (o.text && !lines.includes(o.text)) lines.push(o.text);
              t.ui.next(); t.ui.next();
              await new Promise((r) => setTimeout(r, 60));
            }
            t.ui.close();
            await new Promise((r) => setTimeout(r, 1100));
            out.push(lines);
          }
          return { kind: t.ui.kind(), visits: out };
        }, [id, av]);
        row.kinds[av] = r;
      }
      const first = Object.values(row.kinds).map((k) => JSON.stringify(k.visits?.[0]));
      row.variesByKind = new Set(first).size > 1;
      row.again = row.kinds.official.visits?.[1] && JSON.stringify(row.kinds.official.visits[0]) !== JSON.stringify(row.kinds.official.visits[1]);
      console.log(`talk ${id}: reach ${row.reach?.ok ? 'ok' : 'NO'}, by kind ${row.variesByKind ? 'varies' : 'same'}, again ${row.again ? 'differs' : 'same'}, beats ${(row.kinds.official.visits?.[0] || []).length}; official: ${(row.kinds.official.visits?.[0] || []).slice(0, 2).join(' / ')}`);
      if (!row.variesByKind) result.notes = [...(result.notes || []), `${id}: the same for official, scholar, child`];
      if ((row.kinds.official.visits?.[0] || []).length < 2) fail(`talk ${id}: fewer than two lines played`);
      result.talks.push(row);
    }
    await page.evaluate(() => { window.__test.s.avatar = 'official'; });
    if (shots) {
      await page.evaluate(() => window.__test.ui.journal.open('talk'));
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(outDir, `${vp}_journal_talk.png`) });
      await page.evaluate(() => window.__test.ui.journal.close());
    }
  }
  result[`logs_${vp}`] = logs.slice(0, 30);
  if (logs.some((l) => /ui stopped|chatter|talk\.js|bubbles/.test(l))) fail(`${vp}: UI errors in the console: ${logs.join(' | ').slice(0, 400)}`);
  await page.close();
}
fs.mkdirSync(path.join(Q, 'gen/life/check'), { recursive: true });
fs.writeFileSync(path.join(Q, 'gen/life/check', `${tag}.json`), JSON.stringify(result, null, 1));
console.log(result.fails.length ? `FAIL (${result.fails.length})` : 'PASS', '->', `gen/life/check/${tag}.json`);
await browser.close();
