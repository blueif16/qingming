// Cloudflare's routing files for a built site (deploy/site): _headers and _redirects, the Workers static-assets
// equivalents of the Vercel routes in web/vercel.json. Usage: node tools/cf_site.mjs <site dir>. tools/deploy_web.sh
// runs it after the build; skill deploy-web.
// - Content-hashed files (web/vite_asset_hashes.js copies <name>.<8 hex>.<ext>, Vite's <name>-<8>.js|css|wasm) are
//   cached for a year, immutable; everything else keeps Cloudflare's default (public, max-age=0, must-revalidate +
//   ETag), so a plain name is never stale.
// - _headers matches with a splat (*, any characters) and placeholders (:x, anything but "/"), never a regex, so a rule
//   like /assets/*.:h.webp also catches plain names with two dots (assets/ui/places/S5.bld.tax_office.webp). Each
//   directory holding such a name gets a no-cache rule (Cloudflare joins the two Cache-Control values; no-cache
//   wins: revalidate). The rules are checked here against every file: a plain name that would come out immutable,
//   or more than 100 rules (Cloudflare's cap), fails.
// - / serves world.html (a 200 rewrite; the address stays /, so ?window= etc. reach the page).
import fs from 'node:fs';
import path from 'node:path';

const site = process.argv[2];
if (!site || !fs.existsSync(path.join(site, 'world.html'))) { console.error('usage: node cf_site.mjs <site dir with world.html>'); process.exit(2); }
const die = (m) => { console.error(`cf_site: ${m}`); process.exit(1); };

const IMMUTABLE = 'public, max-age=31536000, immutable';
// what counts as content-hashed (as in web/vercel.json)
const HASHED = [
  /^\/assets\/[^/]+-[A-Za-z0-9_-]{8}\.(?:js|css|wasm)$/,
  /^\/(?:assets|basis)\/.+\.[0-9a-f]{8}\.(?:glb|json|ktx2|webp|webm|svg|css|js|wasm)$/,
];
const isHashed = (f) => HASHED.some((r) => r.test(f));
// a _headers pattern as Cloudflare matches it
const toRe = (p) => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace('*', '.*').replace(/:[A-Za-z]\w*/g, '[^/]+') + '$');

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else files.push('/' + path.relative(site, p).split(path.sep).join('/'));
  }
})(site);
const hashed = files.filter(isHashed);

// candidate rules; keep those that catch a hashed file no earlier rule does (two matching rules repeat the value)
const exts = ['glb', 'json', 'ktx2', 'webp', 'webm', 'svg', 'css', 'js', 'wasm'];
const cand = [
  ...['js', 'css', 'wasm'].map((x) => `/assets/*-:h.${x}`),
  ...['assets', 'basis'].flatMap((d) => exts.map((x) => `/${d}/*.:h.${x}`)),
];
const rules = [];
const caught = (f) => rules.some((r) => r.re.test(f));
for (const p of cand) {
  const re = toRe(p);
  if (hashed.some((f) => re.test(f) && !caught(f))) rules.push({ p, re });
}

const missed = hashed.filter((f) => !caught(f));
if (missed.length) die(`${missed.length} hashed file(s) no rule catches, e.g. ${missed[0]}`);
const plain = files.filter((f) => !isHashed(f) && caught(f));
const noCache = [...new Set(plain.map((f) => f.slice(0, f.lastIndexOf('/') + 1)))].sort();
// a no-cache directory must not also hold a deeper plain file another rule misses: its splat covers subdirectories
for (const f of plain) if (!noCache.some((d) => f.startsWith(d))) die(`plain file would be immutable: ${f}`);
if (rules.length + noCache.length > 100) die(`${rules.length + noCache.length} header rules (Cloudflare allows 100)`);

const lines = ['# written by tools/cf_site.mjs: content-hashed files immutable; plain names revalidate (the default)'];
for (const r of rules) lines.push(r.p, `  Cache-Control: ${IMMUTABLE}`);
if (noCache.length) lines.push('# plain names with two dots match a rule above: revalidate everything in these directories');
for (const d of noCache) lines.push(`${d}*`, '  Cache-Control: no-cache');
fs.writeFileSync(path.join(site, '_headers'), lines.join('\n') + '\n');
fs.writeFileSync(path.join(site, '_redirects'), '/ /world.html 200\n');

const slow = hashed.filter((f) => noCache.some((d) => f.startsWith(d))).length;
console.log(`  _headers: ${rules.length} immutable rules (${hashed.length - slow} of ${hashed.length} hashed files)` +
  `${noCache.length ? `, ${noCache.length} no-cache dir(s) (${noCache.join(' ')}; ${plain.length} plain names)` : ''}; _redirects: / -> /world.html`);
