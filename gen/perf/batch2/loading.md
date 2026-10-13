# Perf batch 2: loading (proposal rank 8, "First load")

The loading engine agent, 2026-10-13. Two items landed: content-hashed names for everything the page fetches from
`public/` (so all of it is cached immutably), and small tree cards first. Per-clip animation files (item 3) were held,
as the brief said (the details session is rebuilding the characters). My folder: `gen/perf/batch2/loading/`. Not
deployed: deploys go through the lead.

## 1. Content-hashed names (landed)

- **`web/vite_asset_hashes.js`** (new; `web/vite.config.js` adds it to `plugins`, build only). After Vite has
  copied `public/` into the output, it gives every un-hashed file under `assets/` (GLB, JSON, KTX2, WebP, WebM,
  SVG, CSS) and under `basis/` (the transcoder's JS and wasm) a second name, `<name>.<8 hex of its sha256>.<ext>`. The
  second name is a hard link, so it takes no disk, and Vercel uploads the bytes only once. The plain names stay, so
  nothing linked from outside breaks. It hashes whatever is in `public/` when the build runs, so the other agents'
  re-exports need nothing extra. A build gets about 920 hashed copies.
- **The page side.** Each built HTML page gets a small inline script at the end of `<head>` (after `<meta charset>`;
  the module scripts are deferred, so it runs before any of them). It holds the map, `{ "assets/canal/": { "people.json":
  "1a2b3c4d", ... } }`, and wraps `window.fetch`: a same-origin URL the map knows is fetched under its hashed name.
  That covers three's FileLoader (GLTFLoader, KTX2Loader, the transcoder) and ImageBitmapLoader, plus every
  `fetch()` in the pages (people, boats, the scroll HUD's tiles, sounds, the UI's JSON). If a hashed name returns 404
  (a page loaded before a redeploy asks for a file the new deployment renamed), the script fetches the plain name.
  The pages' own `src`/`href` attributes are rewritten at build time: the start screen's band, the logo and
  `fonts.css`. The map also goes to the output root as `asset_hashes.json`, and `window.__qmAsset(url)` gives the
  mapped URL. Without a map (the dev server, the check server on 5190) the script does nothing and the page uses the
  plain names.
- **Two things keep their plain names** and are still revalidated on a second visit (a 304 each). First, what three
  loads through an `<img>`: TextureLoader, which Safari uses for the small tree cards. A LoadingManager URL modifier
  was tried, but it skips the 404 fallback, so it was dropped. Second, what CSS links: `fonts.css`'s woff2 fonts,
  which already carry `?v=<hash>`.
- **`web/vercel.json`**: a new route, `^/(?:assets|basis)/.+\.[0-9a-f]{8}\.(?:glb|json|ktx2|webp|webm|svg|css|js|wasm)$`,
  serves `Cache-Control: public, max-age=31536000, immutable`. `tools/deploy_web.sh` already copies vercel.json's
  routes into `.vercel/output/config.json`. Its live step now also checks that `/assets/gate.<hash>.glb` (the hash
  read from the build's `asset_hashes.json`) comes back `immutable`.
- **Cost.** `world.html` grows from 3.5 to 13.7 KB gzipped (the map: ~920 entries, 409 of them the scroll HUD's tiles).
  On slow 4G that is about 50 ms, once per first visit. The build has ~1930 files instead of ~1005, because of the
  hard links. The guard's "N files, X MB" line in `deploy_web.sh` counts each link as a separate file, so it shows
  about twice the real size.

## 2. Small tree cards first (landed)

- **The problem.** At the first window (S4b with its neighbours) the trees were 7.4 MB of the 36 MB loaded, with
  52 cards at 768 px tall. The KTX2 copies are UASTC, about twice the size of their webps, at 100-600 KB a card.
- **`tools/tree_cards.mjs small`** (new step; it also runs after every `ship`, because ship rewrites `trees.json`).
  It makes a 256 px tall copy of each card from the card's own webp, `web/public/assets/trees/small/<card>.webp`
  (lanczos3, q82, `exact`). It records the copy as `small` in `trees.json` and makes it again when the card is
  newer. The 52 copies come to 1144 KB (3-61 KB each). The copies are not a KTX2 kind: `tools/ktx2.mjs` lists only
  `trees/*.webp`. A 256 px webp on the GPU is about 200 KB, and it is freed after the swap.
- **`web/src/world.js`**:
  - `cardKind` loads the small copy, and the kind remembers `full`.
  - When the stream has nothing to load, `streamUpdate` calls `sharpenCards()`. It loads the full cards, nearest
    first, three at a time, and swaps `.map` on the card's material and its shading variant. The geometry and UVs
    stay as they are, since the copy has the card's aspect. Then it gives the small texture back to the cache.
  - `removeTrees` marks a kind `gone`, so that a full card arriving after its section has left is released at once.
  - `settle()` now waits for the swaps too, so the tools' views and shots see the full cards. The page's own first
    `settle(false)` doesn't wait, so `__test` (the probe's "first window in") appears as soon as the window is in.
  - `?smallcards=0` loads the full cards from the start. `?smallcards=only` never swaps, to see what a slow link
    shows first.
- **Look** (`loading/look/cmp_*.jpg`: before, after, small only; `?hour=11&tier=low&adapt=0&window=1`). The
  storyteller, the grain wharf and the farmsteads look the same before and after; the only differences are the
  people, who move between page loads. Small only shows the same trees in the same places, softer up close (the near
  trunk at the farmsteads), the same from 10 m on.

## Numbers

All runs are local static servers with `web/vercel.json`'s headers (`gen/perf/batch2/serve.py`): before is
`before_build` on 5195, after is my snapshot on 5197. Phone viewport (390 x 844, DPR 3, touch), CPU 4x, `?tier=low`.
"Can walk" means the loading screen is gone; "first window in" means `__test` exists; "cards full" means no small
card is left. Cold = empty cache; warm = a second visit right after the cold one. Sizes are raw: the local server
doesn't use brotli.

`loading/load_detail.mjs` (probe.mjs's load run, plus "cards full" and which requests touched the network), on
fast 4G (60 ms, 9 Mbps), interleaved A B A B (`loading/run_ab.sh`; `loading/ab/fast4g_*.json`):

| | before rep 1 / rep 2 | after rep 1 / rep 2 |
|---|---|---|
| cold: can walk | 10.7 / 12.5 s, 8.6 MB | 10.5 / 10.9 s, 8.6 MB |
| cold: first window in | 37.7 / 38.9 s, 36.0 MB (trees 7.4 MB) | **30.8 / 33.2 s, 29.3 MB (trees 0.77 MB)** |
| cold: cards full | (they are full at the window) | 39.5 / 39.7 s |
| warm: can walk | 4.5 / 5.8 s; 79-92 requests touched the network | **3.5 / 4.0 s; 2 requests** |
| warm: first window in | 8.9 / 10.9 s; 212 network requests, 67 KB | **8.3 / 9.5 s; 6 requests, 7 KB** |

The 6 warm requests that still go to the network: `fonts.css` and `logo_v.svg` (both hashed in the final build) and
`bubble_tap_0-3.webm`, which both builds fetch in full on every visit (see below).

`gen/perf/probe.mjs load` (batch 1's measurement: fast 4G, `--throttle 4 --warm 1`), single runs:

| | before (5195) | after (5197, first snapshot) | after (final snapshot, `&start=0`) |
|---|---|---|---|
| cold: can walk | 12.7 s (69 req, 9.4 MB) | 11.9 s (66, 8.6 MB) | 12.4 s (68, 9.0 MB) |
| cold: first window in | 39.7 s (247 req, 36.0 MB) | 32.3 s (244, 29.3 MB) | 33.0 s (243, 29.7 MB) |
| warm: can walk | 3.2 s (105 req, 23 KB transferred) | 4.2 s (105, **1 KB**) | 4.7 s (107, **0 KB**) |
| warm: first window in | 7.1 s (239 req, 67 KB) | 10.6 s (241, **7 KB**) | 11.6 s (244, 28 KB) |

The single runs' warm times swing by ±2 s with what else the machine runs (another agent's Chrome was up for the
first after run). The interleaved table above is the comparison to trust. On the warm visit every request except the
late bubble-tap sounds is served from the cache: 0-28 KB transferred against 23-67 KB.

Slow 4G (150 ms, 1.6 Mbps), `load_detail.mjs`, one run each (`loading/ab/slow4g_*.json`):

| | before | after (5197, before the 404 fallback) |
|---|---|---|
| cold: can walk | 48.8 s, 8.6 MB | 50.9 s, 9.0 MB (see below) |
| cold: first window in | 194 s, 36.1 MB (trees 7.4 MB) | **162 s, 29.8 MB (trees 0.77 MB)** |
| cold: cards full | (full at the window) | 200 s, 37.3 MB (the full cards come after the window) |
| warm: can walk | 5.7 s; 80 requests touched the network | **4.9 s; none** |
| warm: first window in | 12.5 s; 211 network requests, 67 KB | **9.2 s; 4 requests, 7 KB** |

The after build's extra 0.4 MB before walking is not from these items. It is the start screen's band (243 KB: the
HTML loads it even when `?start=0` removes the screen) and other sessions' code, which my snapshot includes.

On both builds the 4 warm requests left are `bubble_tap_0-3.webm` (7 KB). They are fetched in full on every visit.
The sound is first used late (a bubble's tap), and the cold visit had not cached it yet; this is not related to
caching headers.

On the live site (Vercel's CDN, brotli, real round trips) a second visit gains more than these local numbers show.
Before, it made 80-212 conditional requests, each a full round trip (150 ms or more on 4G); now it makes none.

## The start screen (added by another session during this batch)

`web/src/ui/start.js` waits for a press on 入畫 before anything heavy loads. It skips itself under headless Chrome
(HeadlessChrome UA, `navigator.webdriver`) and with `?start=0`. So every probe, bench and check in a Chrome slot
measures without the start screen, as if the visitor pressed at once. "Can walk" is then the time from navigation to
walking, and it includes fetching the code and the small JSON files.

For a real visitor, the code, the band and a few small JSON files arrive while they look at the start screen. The
heavy part (their section, its kit, their character, about 7 MB) starts at the press. So a visitor who waits a few
seconds before pressing walks sooner after the press than "can walk" says, by about the code's time (about 1.3 MB).
A visitor who presses at once sees about the measured time.

The band (`assets/scroll/band.webp`, 7359 x 360, 243 KB) is now hashed: the build rewrites the `<img src>` in
`world.html`. It is the largest file before the press, but small-first ordering doesn't fit it. On a phone the band
is 16-24 vh tall, 400-600 device pixels, and the 360 px image is already below that, so a smaller copy would look
blurred. The browser fetches it as an image, behind the module scripts in priority, so it doesn't hold back the code.
What would gain more, and is the user's or the lead's decision: start the first section's download at low priority
while the start screen waits. That wastes data for visitors who leave without pressing, and saves several seconds
for everyone who presses.

## Checks (final snapshot)

- `check_deploy` PASS on 5197 (every section streams in, no 404s, no console errors).
- The 404 fallback (`loading/fallback_check.mjs`, `fallback_check.out`). I removed the hashed copies of
  `trees/trees.json`, `gate/people.json` and `gate.glb` from the snapshot and loaded the page with an empty cache.
  The three hashed names returned 404, the page fetched the plain names, and the window came up whole (city_end,
  inner_city, gate, 31 card kinds) with no errors.
- Regression on the final snapshot (`b2_loading_final`): world 211/211, boats 12/12, rides 5/5. People fail only on
  the two stale gate spots (X 7 D 3.9, X -8 D 4.1); sizes 0 (adults shrunk without a scale: 0). Its new `contacts`
  step reports on the check server (5190), not on my snapshot; it rewrote `gen/details/contacts/summary.json` as part
  of the script. An earlier run (`b2_loading`, an intermediate snapshot) got 207/211: the known flakes (S4b
  ashore, both S2 north-bank yard walks) and S5 "through the painted crowd". That S5 walk then passed 3/3 on 5197 and
  3/3 on 5195 alone (`loading/walk_s5.json`).
- Phone-proxy bench (`gen/perf/batch2/ab_bench.sh ... phone`, `loading/bench/ab.log`; the machine was never quiet,
  with 2-3 other check Chromes up). Before 5195, rep 1 / rep 2: crown 20 / 16 fps, grain wharf 24 / 16, storyteller
  64 / 39. My snapshot 5197: crown 24 / 26, grain wharf 15 / 36, storyteller 31 / 42. The snapshot is the whole live
  tree plus my items, so the other sessions' changes are in it too (fewer calls and triangles at the crown, more
  animation time), and the spread is the machine's. Neither of my items changes what is drawn once the cards are
  full, since the views wait in `settle()`. Per frame, the idle check is one loop over at most 53 card kinds, with no
  allocations unless a card is waiting.
- A Chrome slot's profile keeps its HTTP cache between runs. With immutable hashed names, a check reuses files cached
  by an earlier snapshot whose bytes are the same: that is correct, but a "cold" measurement must clear the cache
  (`probe.mjs load` and `load_detail.mjs` do; my first fallback test didn't, and saw no request at all).

## Deploy-time effects (for the lead)

1. **New header route** in `web/vercel.json` (hashed names under `assets/` and `basis/`, a year, immutable).
   `deploy_web.sh` carries it into `config.json` as before.
2. **The build has ~920 hashed copies** (hard links) next to the plain files, and `asset_hashes.json` at its root.
   The guard's file count and MB roughly double; the upload doesn't, because Vercel dedupes by SHA.
3. **Each built page carries the map inline** (world.html +10 KB gzipped).
4. **`deploy_web.sh`'s live step** also checks `/assets/gate.<hash>.glb` for `immutable`. It fails the script if the
   route didn't reach the CDN (the deploy is live by then).
5. **First visits after the deploy** download everything once under the new names. The browser cache from earlier
   deploys (plain names) is not reused once.
6. **Small tree cards ship**: `web/public/assets/trees/small/` (52 webps, 1.1 MB) and the `small` fields in
   `assets/trees/trees.json`.

## Next

- The fonts: `fonts.css` links its woff2 files with `?v=<hash>`. A Vercel route with `has: [{ type: 'query', key: 'v' }]`
  could make them immutable too (`serve.py` would need `has` support to check it locally).
- Safari's small cards (TextureLoader): load them through ImageBitmapLoader-style fetch + `createImageBitmap` without
  options (or an `<img>` with the mapped URL and a 404 fallback) so they get hashed names too.
- Prefetch the first section during the start screen (the user's or the lead's call, above).
- Per-clip animation files (proposal rank 8, held this batch): the cast is 14.6 MB of the first window's 29 MB.
