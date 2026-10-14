---
name: deploy-web
description: Put the qingming web world (qingming/web) live on Cloudflare, production, with one command - build -> guard what goes up -> headless load check -> deploy -> live check. Use when new content has landed (a section, characters, trees, people.json) and should go live, or when asked for the public URL or what is deployed.
---

# Deploy the web world (qingming/)

**Live:** https://qingming.infinityopus.com (`/` opens `world.html`, all eight sections from S7 to S1 since v1,
2026-10-12; `gate.html`, `chars.html`, `creatures.html`, `boats.html` and `world.html?sections=…` work as on the dev
server). Since 2026-10-14 it is a Cloudflare Worker with static assets only, `qingming` (`deploy/wrangler.jsonc`), in
the Cloudflare account that holds `infinityopus.com` (free plan; static-asset requests are free and unlimited, no
bandwidth charge; caps 20,000 files a version and 25 MiB a file). The domain is the Worker's custom domain: Cloudflare
owns its DNS record (proxied) and certificate. https://qingming.infinityopus.workers.dev serves the same version.
**Traffic:** Cloudflare Web Analytics (dashboard → Analytics & Logs → Web Analytics, automatic setup on the proxied
hostname: referrers, countries, devices, paths, Core Web Vitals; no query strings or UTM) and the zone's own traffic
analytics. **Before** (2026-10-12 to 10-14): Vercel Hobby, project `qingming` in scope `blueif16s-projects`, its own
name https://qingming-delta.vercel.app; Hobby's 1M requests a month meant only about 1,200-2,000 new visitors (a cold
visit is about 490 requests, 30 MB). The Vercel steps are kept, commented out, in `tools/deploy_web.sh`.

## The one command

From `qingming/`, once the new content is in `web/public/assets/` (`tools/export_web_scene.mjs`, `tools/character.mjs`,
`tools/tree_cards.mjs` … ship there) and looks right on the dev server:

```
tools/deploy_web.sh            # --no-check skips the headless load
```

1. **Build:** `vite build` of `web/` (every page in `vite.config.js` plus all of `web/public/`) into
   `deploy/site`, outside `web/`, so the dev server on 5180 is never touched. `tools/cf_site.mjs` then writes
   Cloudflare's `_headers` (content-hashed files cached for a year, immutable; Cloudflare matches with splats and
   placeholders, not regexes, so it checks its rules against every file and gives a directory holding a plain name
   with two dots, such as `assets/ui/places/`, a no-cache rule) and `_redirects` (`/` → `world.html`, a rewrite).
2. **Guard:** stops on any path named reference, gen, messenger, .env or a key file, on any file byte-identical to a
   file in `reference/messenger_study/`, and on any Meshy or shyfai key in the files (it prints only file names).
   It prints the file count and size.
3. **Check:** serves the build on 127.0.0.1:5182 (`vite preview`) and loads `world.html` in WSL Chrome
   (`tools/check_deploy.mjs`). It loads every section (`?window=all` unless the URL or `--window` says otherwise) and
   FAILs on any 4xx/5xx or failed request, any console error, or a section that never comes in (each section's state
   from `__test.sections`); it reports the boats loaded. A FAIL deploys nothing.
4. **Deploy:** `wrangler deploy` from `deploy/` (`wrangler.jsonc`: assets `./site`, `html_handling: none` so
   `/world.html` isn't redirected to `/world`), which uploads only the files of `deploy/site` whose bytes changed, then
   switches all traffic to the new version. wrangler is the one WSL npm global install (4.151.0 on 2026-10-14), logged in
   with `wrangler login --device` (the account holding infinityopus.com; the script checks the account ID). Its login
   can't edit DNS, so a DNS change is a dashboard step.
5. **Live:** curls `/`, `world.html`, `characters.json` and `gate.glb` on the production URL. Each must return 200.

## What goes up, and what never does

- **Up:** the built pages, their JS (three.js and friends, about 1 MB) and `web/public/` as it stands: section GLBs,
  layout/people/scene/backdrop JSON, the scroll indexes, characters, animals, tree cards, kit textures, the sundial,
  the street-B1 test's files; the KTX2 copies (`.ktx2` beside the webps and `assets/ktx2/emb/`, about 15 MB) with the
  Basis transcoder (`basis/`, 0.58 MB, fetched only when a copy is used); the scroll HUD's tile pyramid
  (`assets/scroll/`, 410 files, 21.9 MB, nothing fetched until the HUD opens; the lead's call: ship it whole); each
  river section's boats (`<name>_boats.glb`, `<name>/boats.json`) and the water tile (`assets/water/`); the test pages
  (`boats.html` with `assets/boats_test*`, about 1.2 MB, like `creatures.html`). v1 (2026-10-12 ~19:40): 762 files,
  81.9 MB (the morning's deploy was 118 files, 26.1 MB).
- **Content-hashed copies** (perf batch 2, `web/vite_asset_hashes.js`): the build holds a hashed copy (hard link) of
  each file the pages fetch, `<name>.<8 hex>.<ext>`, and `asset_hashes.json` at its root; each page carries the map
  inline and fetches through it. The guard's "N files, X MB" counts the links twice; wrangler uploads each set of bytes
  once. After the deploy, the live step also checks that `/assets/gate.<hash>.glb` is served `immutable` (it fails
  after the deploy is live if the `_headers` rule didn't take). The first visit after a deploy fetches changed files
  under their new names; unchanged files keep their names and stay cached (the first hashed deploy, batch 2's,
  refetches everything once).
- **Before deploying new content:** `node tools/ktx2.mjs check` must PASS. The page takes a texture's KTX2 copy by URL,
  so a stale copy shows the old picture live.
- **Never:** the project tree, `reference/` (`messenger_study` is third-party and study-only), `gen/`, `map/`,
  `sections/`, sources, keys (`~/.meshy_keys`, `~/.shyfai_key`). The scroll tiles are webp tiles cut from the Commons scan
  in `reference/scroll/` (Palace Museum, via Wikimedia Commons; the HUD carries the credit); the scan itself never
  goes up. Anything the page needs must be
  shipped into `web/public/` first. The deploy never reads anything else.

## Checking the result

- `node tools/check_deploy.mjs https://qingming.infinityopus.com/ [--shot out.png] [--window <n>]`: the same headless
  load against the live site, every section (v1: PASS, 8 sections, 34 boats, 897 people, 242 requests, 60.8 MB, 58 s).
  Its Chrome runs with `--disable-quic`: from this WSL (mirrored networking), HTTP/3 transfers from Cloudflare break
  off under load (`ERR_QUIC_PROTOCOL_ERROR`, on cdnjs as much as on ours), while Windows Chrome loads the world over
  HTTP/3 cleanly (2026-10-14). Any other WSL browser tool aimed at the live site needs the same flag.
  `performance` resource entries stop at 250, so its request count and MB are a floor; for the real cold-visit bytes
  count CDP `Network.loadingFinished` (2026-10-14: `/` about 490 requests, 30 MB; `?window=all` about 830, 49 MB).
- Versions and rollback: `wrangler versions list`, `wrangler deployments list`, `wrangler rollback [<version id>]`
  (from `deploy/`), or the Worker's Deployments tab in the dashboard.
- The Vercel project (Hobby) is no longer deployed to; https://qingming-delta.vercel.app redirects to the domain.
