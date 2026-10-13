// Each boat's contacts on the page (world X, D, H): which rim piece opens, onto what (bank, which boat, the plank),
// the bridge's ends, the deck height at rest, the boat's state. Adapted from S4b QA's contacts.mjs.
// node contacts.mjs <url> [X D] (goto spot; default the section's middle)
import { chromium } from 'playwright-core';
const [url, gx, gd] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:' + (process.env.CDP_PORT || '9244'));
const page = await browser.contexts()[0].newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
try {
  await page.goto(url);
  await page.waitForFunction(() => window.__test && window.__test.boats, null, { timeout: 120000 });
  const r = await page.evaluate(async ([gx, gd]) => {
    const t = window.__test, B = t.boats;
    if (t.goto) await t.goto(gx, gd);
    await new Promise((res) => setTimeout(res, 3000));
    const w = (v) => v ? [+v.x.toFixed(2), +(-v.z).toFixed(2), +v.y.toFixed(2)] : null;
    return B.list.map((b) => ({
      slug: b.slug, kind: b.info.kind, lw: b.info.lw, deck: b.info.deck_z ?? b.info.deck, motion: b.info.motion, state: b.state,
      pos: w(b.roots[0].position), open: b.openPieces, npieces: b.pieces.length,
      plank: b.plank ? { A: w(b.plank.A.clone().applyMatrix4(b.rest)), B: w(b.plank.B.clone().applyMatrix4(b.rest)) } : null,
      contacts: b.contacts.map((c) => ({ piece: c.piece, other: c.other ? c.other.slug : (c.plank ? 'PLANK' : 'bank'), d: +c.d.toFixed(2), from: w(c.from), to: w(c.to) })),
    }));
  }, [+(gx || 218), +(gd || 15)]);
  console.log(JSON.stringify(r));
} finally { await page.close(); await browser.close(); }
console.error(errs.length ? errs.join('\n') : 'no page errors');
