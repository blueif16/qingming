# Lessons from the loading agent (perf batch 2), for the skills

## web-scene, "Loading" bullet: replace its last sub-bullet ("Hashed files ... are the next step.") with

  - Everything the pages fetch from `public/` has a content-hashed name in the build, cached a year, immutable, so a
    second visit asks the network only for the page itself. `web/vite_asset_hashes.js` (a Vite plugin, build only)
    gives each un-hashed GLB, JSON, KTX2, WebP, WebM, SVG and CSS under `assets/` (and `basis/`) a second name,
    `<name>.<8 hex sha256>.<ext>`: a hard link, with the plain name kept. Each built page carries the map inline and
    wraps `fetch`, which covers three's FileLoader and ImageBitmapLoader and the pages' own `fetch()` calls. A hashed
    name that 404s (a page loaded before a redeploy) is fetched again under its plain name. The pages' own `src`/`href`
    attributes are rewritten at build time. The dev and check servers have no map and use the plain names. So never
    put a hash into a file name in an exporter: the build hashes whatever is in `public/` when it runs. Code that
    needs the URL a built page will really fetch uses `window.__qmAsset(url)`. Don't map three's loaders with a
    LoadingManager URL modifier: it bypasses the wrapper's 404 fallback. `web/vercel.json`'s routes carry the header
    for `assets/*-<hash>.js|css|wasm` and for every `.<8 hex>.<ext>` name; `tools/deploy_web.sh` copies them into
    `config.json` and checks a hashed GLB's header live. What still revalidates: images three loads through an `<img>`
    (Safari's TextureLoader) and fonts.css's fonts.
  - Tree cards come first at 256 px (`tools/tree_cards.mjs small`, also run after every ship:
    `assets/trees/small/<card>.webp`, `trees.json` `small`). They are swapped for the full card when the stream has
    nothing else to load, nearest first, three at a time (`world.js` `sharpenCards`). At the first window the trees
    cost 0.77 MB instead of 7.4 MB, and the window was in 6 s sooner on fast 4G. `settle()` waits for the swaps, so
    the tools see full cards; the page's own first `settle(false)` doesn't. `?smallcards=0` turns it off;
    `?smallcards=only` shows what a slow link sees first.

## web-scene, "Checking a change for every device": add

  - `performance.getEntriesByType('resource')` stops at 250 entries by default, and a world load makes more than
    that. A probe that counts requests or bytes past the first window must call
    `performance.setResourceTimingBufferSize(...)` in an init script (`gen/perf/batch2/loading/load_detail.mjs` does).
  - `pkill -f` / `pgrep -f` also match the shell whose command line holds the pattern: a `pkill -f` kills your own
    command, and an `until ! pgrep -f ...` loop never ends. Kill by PID, and wait on the background job itself.

## deploy-web skill: add to what the deploy does

  - The build holds a content-hashed copy (hard link) of each file the pages fetch, and `asset_hashes.json` at its
    root. The guard's "N files, X MB" counts the links twice; Vercel uploads each set of bytes once. After the deploy,
    the live step also checks that `/assets/gate.<hash>.glb` is served `immutable`.

## web-scene, "Checking a change for every device": also add

  - A Chrome slot's profile keeps its HTTP cache between runs. Immutable hashed files cached by an earlier check are
    reused without a request (correct: the same name means the same bytes). A "cold" measurement or a test that
    must see requests clears the cache first (`Network.clearBrowserCache`, as `probe.mjs load` does).
