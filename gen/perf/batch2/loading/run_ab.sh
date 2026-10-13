#!/usr/bin/env bash
# before (5195) and after (5197) first loads, interleaved A B A B: bash gen/perf/batch2/loading/run_ab.sh <tag> [net] [reps]
cd "$(dirname "$0")/../../../.."
tag=$1 net=${2:-fast4g} reps=${3:-2} O=gen/perf/batch2/loading/ab
mkdir -p $O
for i in $(seq $reps); do
  for side in before:5195 after:5197; do
    n=${side%%:*} p=${side##*:}
    echo "== $tag $n rep $i ($net)"
    timeout 1800 tools/chrome_slot.sh node gen/perf/batch2/loading/load_detail.mjs "http://127.0.0.1:$p/world.html?tier=low" $O/${tag}_${n}_$i.json --net $net 2>&1 | grep -v chrome_slot
  done
done
