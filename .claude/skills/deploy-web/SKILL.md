---
name: deploy-web
description: Put the qingming web world (qingming/web) live on Vercel, production, with one command - build -> guard what goes up -> headless load check -> deploy -> live check. Use when new content has landed (a section, characters, trees, people.json) and should go live, or when asked for the public URL or what is deployed.
---

# Deploy the web world (qingming/)

**Live:** https://qingming.infinityopus.com (`/` opens `world.html`, all eight sections from S7 to S1 since v1,
2026-10-12; `gate.html`, `chars.html`, `creatures.html`, `boats.html` and `world.html?sections=…` work as on the dev
server). Vercel project `qingming` in scope `blueif16s-projects`. The domain (since 2026-10-13) is a Cloudflare CNAME
`qingming` → `1121220d54c2349a.vercel-dns-017.com`, DNS only (grey cloud), added in the Cloudflare dashboard; Vercel
issues the certificate. https://qingming-delta.vercel.app (Vercel's own name for the project, since
`qingming.vercel.app` belongs to someone else) serves the same deployment. Each deploy updates both.

## The one command

From `qingming/`, once the new content is in `web/public/assets/` (`tools/export_web_scene.mjs`, `tools/character.mjs`,
`tools/tree_cards.mjs` … ship there) and looks right on the dev server:

```
tools/deploy_web.sh            # about 35 s; --no-check skips the headless load
```

1. **Build:** `vite build` of `web/` (every page in `vite.config.js` plus all of `web/public/`) into
   `deploy/.vercel/output/static`, outside `web/`, so the dev server on 5180 is never touched. `config.json` beside it
   rewrites `/` to `world.html`.
2. **Guard:** stops on any path named reference, gen, messenger, .env or a key file, on any file byte-identical to a
   file in `reference/messenger_study/`, and on any Meshy or shyfai key in the files (it prints only file names).
   It prints the file count and size.
3. **Check:** serves the build on 127.0.0.1:5182 (`vite preview`) and loads `world.html` in WSL Chrome
   (`tools/check_deploy.mjs`). It loads every section (`?window=all` unless the URL or `--window` says otherwise) and
   FAILs on any 4xx/5xx or failed request, any console error, or a section that never comes in (each section's state
   from `__test.sections`); it reports the boats loaded. A FAIL deploys nothing.
4. **Deploy:** `vercel deploy --prebuilt --prod` from `deploy/`, which uploads only `deploy/.vercel/output`. It needs
   Vercel CLI 47.2.2 or later. The CLI is the one Windows npm install on PATH (63.1.2 on 2026-10-12). From WSL the
   script points it at the Windows login with `-Q`, unless WSL has a login of its own.
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
  inline and fetches through it. The guard's "N files, X MB" counts the links twice; Vercel uploads each set of bytes
  once. After the deploy, the live step also checks that `/assets/gate.<hash>.glb` is served `immutable` (it fails
  after the deploy is live if the route didn't reach the CDN). The first visit after a deploy fetches changed files
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
- The production URL is public. The per-deploy URLs the script also prints (`qingming-<hash>-blueif16s-projects…`)
  sit behind Vercel login by default.
- What Vercel holds: `vercel -Q /mnt/c/Users/ran/AppData/Roaming/com.vercel.cli/Data --scope blueif16s-projects api
  /v6/deployments/<dpl_id>/files` (`.vercel/output/config.json` plus `static/`, nothing else).
- Roll back: `vercel rollback` with the same `-Q … --scope …`, or promote an older deployment in the dashboard
  (the script prints its inspect link).
