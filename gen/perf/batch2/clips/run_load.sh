#!/usr/bin/env bash
# First load, A B C interleaved (the clips agent, perf batch 2): before = 5195 (the batch's start), full = this snapshot
# with ?clipfiles=0 (the same build, the full character GLBs), split = this snapshot. Phone viewport, CPU 4x, fast 4G,
# a cold visit then a second one with the cache (gen/perf/probe.mjs load).
#   bash gen/perf/batch2/clips/run_load.sh [reps] [net]
cd "$(dirname "$0")/../../../.."
reps=${1:-2} net=${2:-fast4g} O=gen/perf/batch2/clips/load
mkdir -p $O
for i in $(seq $reps); do
  for side in "before|http://127.0.0.1:5195/world.html?tier=low" "full|http://127.0.0.1:5196/world.html?tier=low&clipfiles=0" "split|http://127.0.0.1:5196/world.html?tier=low"; do
    n=${side%%|*} u=${side#*|}
    echo "== $n rep $i ($net)"
    timeout 1800 tools/chrome_slot.sh node gen/perf/probe.mjs load "$u" $O/${net}_${n}_$i --viewport 390x844x3 --net $net --throttle 4 --warm 1 2>&1 | grep -E "can walk|first window"
  done
done
