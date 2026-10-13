#!/usr/bin/env bash
# The crowd agent's snapshot (perf batch 2): the live web/ tree built into gen/perf/batch2/crowd/build. Before the far
# bodies were in web/public's GLBs (they are since 07:11, 2026-10-13), `--lod` wrote them (tools/char_lod.mjs) into the snapshot's own copies of the
# character GLBs, their split bodies (chars/body/, tools/clip_split.mjs) and the animals, in place, so their
# content-hashed hard links carry them too; never into web/public. Serve it: serve.py ... 5197.
set -euo pipefail
Q="$(cd "$(dirname "$0")/../../../.." && pwd)"
B="$Q/gen/perf/batch2/crowd/build"; T="$Q/gen/perf/batch2/crowd/try"
(cd "$Q/web" && ./node_modules/.bin/vite build --outDir "$B" --emptyOutDir --logLevel warn) 2>&1 | grep -v optimizeDeps || true
[ "${1:-}" = "--lod" ] || exit 0
: > "$Q/gen/perf/batch2/crowd/lod_snapshot.log"
for d in chars chars/body animals; do
  rm -rf "$T"
  node "$Q/tools/char_lod.mjs" "$B/assets/$d"/*.glb --out "$T" >> "$Q/gen/perf/batch2/crowd/lod_snapshot.log"
  for f in "$T"/*.glb; do cp "$f" "$B/assets/$d/$(basename "$f")"; done
done
rm -rf "$T"
echo "snapshot built: $(grep -c ' -> ' "$Q/gen/perf/batch2/crowd/lod_snapshot.log") GLBs given a far body, $(grep -c ' has one' "$Q/gen/perf/batch2/crowd/lod_snapshot.log") had one"
