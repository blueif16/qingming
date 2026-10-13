// Content-hashed names for the files the pages fetch from public/ (perf batch 2, "First load"), so the CDN can cache
// them for a year, immutable (web/vercel.json): a second visit then asks the network for nothing but the page, and a
// redeploy refetches only the files whose bytes changed. Build only (the dev and check servers keep the plain names).
// After the build has copied public/ into the output, every GLB, JSON, KTX2, WebP, WebM, SVG and CSS under assets/ (and
// the Basis transcoder in basis/) that has no hash in its name yet gets a second name, <name>.<8 hex of its sha256>.<ext>
// (a hard link, so it costs no disk and Vercel uploads the bytes once); the plain name stays, for anything that links
// a file from outside and for code that loads a file some other way. The map (directory -> file -> hash) is written
// into each built page, where a small inline script, run before any module, wraps window.fetch: a same-origin URL that
// the map knows is fetched under its hashed name. three's FileLoader (GLTFLoader, KTX2Loader) and ImageBitmapLoader
// fetch through it, so do the pages' own fetch() calls; a hashed name that 404s (a page loaded before a redeploy) is
// fetched again under its plain name. The pages' own src/href attributes are rewritten here. What an <img> loads from
// script (TextureLoader: Safari's small tree cards) and what CSS links (fonts.css's fonts) keep the plain name.
// The map is also written to the output as asset_hashes.json (tools/deploy_web.sh checks a hashed file's header live).
// Files are hashed as they are in public/ when the build runs: other sessions re-export sections at any time, and the
// build takes whatever is there.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DIRS = { assets: /\.(?:glb|json|ktx2|webp|webm|svg|css)$/, basis: /\.(?:js|wasm)$/ };
const HASHED = /\.[0-9a-f]{8}\.[A-Za-z0-9]+$/; // already content-hashed (assets/tex/*.<hash>.webp|ktx2)
const MARK = '/*QM_ASSET_HASHES*/null';

// the page side: inline, before any module script; without a map (dev, check server) it does nothing
const PAGE = `(() => {
  const M = ${MARK};
  if (!M) return;
  const root = new URL('./', document.baseURI);
  const hashed = (u) => {
    const x = new URL(u, document.baseURI);
    if (x.origin !== root.origin || !x.pathname.startsWith(root.pathname)) return null;
    const rel = decodeURIComponent(x.pathname.slice(root.pathname.length)), i = rel.lastIndexOf('/') + 1;
    const h = M[rel.slice(0, i)]?.[rel.slice(i)];
    if (!h) return null;
    x.pathname = root.pathname + rel.slice(0, i) + rel.slice(i).replace(/(\\.[^.]*)$/, '.' + h + '$1');
    return x.href;
  };
  window.__qmAsset = (u) => { try { return hashed(String(u)) || u; } catch { return u; } };
  const f = window.fetch;
  // a page loaded before a redeploy may ask for a hashed name the new deployment no longer has: then the plain name
  window.fetch = function (input, init) {
    let to = null;
    try {
      if (input instanceof Request) { const u = hashed(input.url); if (u) to = new Request(u, input); }
      else { const u = hashed(String(input)); if (u) to = u; }
    } catch { /* a URL it can't read goes out as given */ }
    if (!to) return f.call(window, input, init);
    return f.call(window, to, init).then((r) => (r.status === 404 ? f.call(window, input, init) : r));
  };
})();`;

export default function assetHashes() {
  let outDir = null;
  const emitted = new Set(); // Vite's own outputs (already hashed by Vite)
  return {
    name: 'qm-asset-hashes',
    apply: 'build',
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir); },
    // at the end of <head>: <meta charset> stays in the first 1024 bytes, and the module scripts (deferred) run after it
    transformIndexHtml: { order: 'post', handler: () => [{ tag: 'script', children: PAGE, injectTo: 'head' }] },
    writeBundle(_, bundle) { for (const k of Object.keys(bundle)) emitted.add(k); },
    closeBundle() {
      const map = {};
      let n = 0;
      for (const [dir, re] of Object.entries(DIRS)) {
        const walk = (rel) => {
          const abs = path.join(outDir, rel);
          if (!fs.existsSync(abs)) return;
          for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
            const r = `${rel}/${ent.name}`;
            if (ent.isDirectory()) { walk(r); continue; }
            if (!ent.isFile() || !re.test(ent.name) || HASHED.test(ent.name) || emitted.has(r)) continue;
            const h = crypto.createHash('sha256').update(fs.readFileSync(path.join(outDir, r))).digest('hex').slice(0, 8);
            const to = path.join(outDir, `${rel}/${ent.name.replace(/(\.[^.]*)$/, `.${h}$1`)}`);
            fs.rmSync(to, { force: true });
            try { fs.linkSync(path.join(outDir, r), to); } catch { fs.copyFileSync(path.join(outDir, r), to); }
            (map[`${rel}/`] ||= {})[ent.name] = h;
            n++;
          }
        };
        walk(dir);
      }
      // the pages: the map, and their own src/href to a hashed file (the start screen's band, the logo, fonts.css)
      const named = (rel) => { const i = rel.lastIndexOf('/') + 1, h = map[rel.slice(0, i)]?.[rel.slice(i)]; return h ? rel.slice(0, i) + rel.slice(i).replace(/(\.[^.]*)$/, `.${h}$1`) : null; };
      for (const f of fs.readdirSync(outDir).filter((f) => f.endsWith('.html'))) {
        const p = path.join(outDir, f);
        const html = fs.readFileSync(p, 'utf8').replace(MARK, JSON.stringify(map))
          .replace(/((?:src|href)=")(\/?)((?:assets|basis)\/[^"?#]+)"/g, (m, a, slash, rel) => (named(rel) ? `${a}${slash}${named(rel)}"` : m));
        fs.writeFileSync(p, html);
      }
      fs.writeFileSync(path.join(outDir, 'asset_hashes.json'), JSON.stringify(map));
      this.info?.(`asset hashes: ${n} files`);
    },
  };
}
