// the late path (cast_clips.js settlePending): a person starts a clip its split model hasn't fetched; it plays idle,
// then the clip once it is in, for a crowd person and for your own character (an ordinary skinned Person)
//   tools/chrome_slot.sh node gen/perf/batch2/clips/late_test.mjs http://127.0.0.1:5196
import { chromium } from 'playwright-core';
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9223'));
const ctx = browser.contexts()[0] || await browser.newContext();
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${process.argv[2]}/world.html?tier=low&adapt=0&sound=0`, { timeout: 300000 });
await page.waitForFunction(() => window.__test, null, { timeout: 300000 });
const r = await page.evaluate(async () => {
  const T = window.__test, out = [];
  const tryOne = async (p, label) => {
    const m = p.model, lazy = [...(m.lazy?.keys() || [])].find((n) => !m.clips.some((c) => c.name === n));
    if (!lazy) return out.push(`${label}: no clip left to fetch`);
    p.play(lazy, { offset: 0.5 });
    const now = { clip: p.clip, pending: p.pending?.name };
    for (let i = 0; i < 50 && p.pending; i++) await new Promise((r) => setTimeout(r, 100));
    out.push(`${label} ${m.name}/${lazy}: right after play ${JSON.stringify(now)}, then ${JSON.stringify({ clip: p.clip, pending: p.pending?.name || null, has: m.clips.some((c) => c.name === lazy) })}`);
  };
  await tryOne(T.people.all.find((q) => q.batch && q.model.lazy), 'crowd person');
  await tryOne(T.avatar, 'your character');
  out.push(`lateClips ${JSON.stringify(T.stream.stats().lateClips)}`);
  return out;
});
console.log(r.join('\n'), errors.length ? `\nerrors: ${errors.join(' | ')}` : '\nno page errors');
await browser.close().catch(() => {});
