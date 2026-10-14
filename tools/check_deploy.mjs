// Load a world page (built or deployed) headless and FAIL on anything missing: a request that 4xx/5xx-es or
// fails, a console error, or a section that never streams in (window.__test appears once all are in).
// Every section of the world is loaded (?window=all is added unless the URL or --window says otherwise), so a broken
// file in a section far from the spawn (its GLB, boats GLB, layout, people, panels) fails the check too; each
// section's own state is read from __test.sections (loaded, or failed).
// Usage: node check_deploy.mjs <url> [--shot out.png] [--timeout s] [--window all|<n>]
// WSL Chrome with SwiftShader, as check_page.mjs: its frame rate means nothing.
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const url = args[0];
const opt = (k, d = null) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const shot = opt('--shot');
const timeout = +opt('--timeout', 300) * 1000;
if (!url) { console.log('usage: node check_deploy.mjs <url> [--shot out.png] [--timeout s] [--window all|<n>]'); process.exit(2); }
// every section, not only the start window
const target = new URL(url);
if (!target.searchParams.has('window')) target.searchParams.set('window', opt('--window', 'all'));

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  // no HTTP/3: in this WSL (mirrored networking) QUIC transfers from Cloudflare break off under load
  // (ERR_QUIC_PROTOCOL_ERROR, cdnjs as well as ours, 2026-10-14); Windows Chrome is fine. HTTP/2 tests the site.
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-quic'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const bad = [];
const errors = [];
page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
page.on('requestfailed', (r) => bad.push(`failed (${r.failure()?.errorText}) ${r.url()}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

const t0 = Date.now();
const main = await page.goto(target.href, { waitUntil: 'load' });
const state = await page.waitForFunction(() => (window.__test ? 'in'
  : document.getElementById('loading')?.textContent.startsWith('Failed') ? 'failed' : null), null, { timeout })
  .then((h) => h.jsonValue()).catch(() => 'timeout');
if (state === 'in') await page.waitForTimeout(2000); // late requests (textures, cards) after the hooks appear
const info = await page.evaluate(() => {
  const want = (new URLSearchParams(location.search).get('sections') || document.body.dataset.sections || '').split(',').filter(Boolean);
  const res = performance.getEntriesByType('resource');
  return {
    title: document.title,
    want,
    // a loaded section is its record (with its root); one that isn't is { name, state } ('out', 'loading', 'failed')
    loaded: window.__test ? [...window.__test.sections.entries()].filter(([, v]) => v.root).map(([k]) => k) : [],
    states: window.__test ? Object.fromEntries([...window.__test.sections.entries()].map(([k, v]) => [k, v.root ? 'in' : v.state])) : {},
    boats: window.__test?.boats ? window.__test.boats.list.length : 0,
    requests: res.length,
    mb: res.reduce((s, e) => s + (e.decodedBodySize || 0), 0) / 1e6,
    failed: document.getElementById('loading')?.textContent || '',
  };
});
if (shot) await page.screenshot({ path: shot });
await browser.close();

const secs = ((Date.now() - t0) / 1000).toFixed(0);
// with every section loaded, each must be in; with a smaller window, each must at least be known to the page
const all = target.searchParams.get('window') === 'all';
const missing = info.want.filter((n) => !(all ? info.loaded.includes(n) : n in info.states));
if (all) for (const [k, st] of Object.entries(info.states)) if (st !== 'in' && !missing.includes(k)) missing.push(k);
const ok = main?.status() === 200 && state === 'in' && !missing.length && !bad.length && !errors.length;
console.log(`${ok ? 'PASS' : 'FAIL'} ${target.href}`);
const notIn = Object.entries(info.states).filter(([, st]) => st !== 'in').map(([k, st]) => `${k} ${st}`);
console.log(`  page ${main?.status()} "${info.title}"; sections ${info.loaded.join(', ') || '-'} of ${info.want.join(', ')}` +
  `${notIn.length ? ` (not in: ${notIn.join(', ')})` : ''}; ${info.boats} boats` +
  `${missing.length ? ` (missing ${missing.join(', ')})` : ''}; ${info.requests} requests, ${info.mb.toFixed(1)} MB; ${secs} s` +
  `${state !== 'in' ? `; ${state}${info.failed ? `: ${info.failed}` : ''}` : ''}`);
for (const b of bad.slice(0, 40)) console.log(`  ${b}`);
for (const e of errors.slice(0, 20)) console.log(`  console: ${e}`);
process.exit(ok ? 0 : 1);
