#!/usr/bin/env bash
# One measurement set of the batch (before or after a step), each run in a Chrome slot:
#   gen/perf/batch1/run_set.sh <tag> <base_url> [<query for high>] [<query for the phone proxy>] [parts...]
# parts: look bench_high bench_phone memory load (default all). Results in gen/perf/batch1/<tag>/.
set -u
QM=/home/ran/3d_director/qingming
cd "$QM"
tag=$1 base=$2 qh=${3:-} qp=${4:-}; shift 4 2>/dev/null || shift $#
parts=("$@"); [ ${#parts[@]} -gt 0 ] || parts=(look bench_high bench_phone memory load)
O=gen/perf/batch1/$tag
mkdir -p "$O"
S=tools/chrome_slot.sh
for p in "${parts[@]}"; do
  echo "== $(date +%T) $tag $p" | tee -a "$O/run.log"
  tools/machine.sh status >> "$O/run.log" 2>&1
  case $p in
    look) timeout 1800 $S node gen/perf/batch1/look.mjs "$base/world.html?hour=11$qh" "$O/look" > "$O/look.log" 2>&1 ;;
    bench_high) timeout 1800 $S node tools/bench_page.mjs "$base/world.html?$qh" "$O/bench_high" --configs gen/perf/batch1/bench_high.json --secs 3 > "$O/bench_high.log" 2>&1 ;;
    bench_phone) timeout 2400 $S node tools/bench_page.mjs "$base/world.html?$qp" "$O/bench_phone" --configs gen/perf/batch1/bench_phone.json --secs 3 --viewport 390x844x3 > "$O/bench_phone.log" 2>&1 ;;
    memory) timeout 1800 $S node gen/perf/probe.mjs memory "$base/world.html?gpumem=1$qp" "$O/memory_phone" --viewport 390x844x3 --views crown,grain_wharf > "$O/memory_phone.log" 2>&1
            timeout 1800 $S node gen/perf/probe.mjs memory "$base/world.html?gpumem=1$qh" "$O/memory_desk" --views crown > "$O/memory_desk.log" 2>&1 ;;
    load) timeout 2400 $S node gen/perf/probe.mjs load "$base/world.html?x=1$qp" "$O/load_fast4g" --viewport 390x844x3 --net fast4g --throttle 4 --warm 1 > "$O/load_fast4g.log" 2>&1 ;;
  esac
  tail -3 "$O/$p.log" 2>/dev/null | tee -a "$O/run.log"
done
echo "== $(date +%T) $tag done" | tee -a "$O/run.log"
