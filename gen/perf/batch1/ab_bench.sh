#!/usr/bin/env bash
# Before/after benches, interleaved (A B A B), each run waiting for a quiet machine (no other check Chrome, no Blender,
# load under 6) for up to 10 minutes: gen/perf/batch1/ab_bench.sh <out_dir> <before_base_url> <after_base_url> [high|phone ...]
#   before: no query (QA_HIGH / QA_PHONE env to give one); after: ?tier=high&adapt=0 (high) or ?tier=low&adapt=0 (phone proxy)
set -u
QM=/home/ran/3d_director/qingming
cd "$QM"
out=$1 A=$2 B=$3; shift 3; kinds=("$@"); [ ${#kinds[@]} -gt 0 ] || kinds=(high phone)
mkdir -p "$out"
quiet() {
  for _ in $(seq ${QUIET_TRIES:-40}); do
    st=$(tools/machine.sh status)
    others=$(echo "$st" | grep -c "slot  *chrome [0-9] taken")
    bl=$(echo "$st" | sed -n 's/.*blender.exe *\([0-9]*\) running.*/\1/p')
    ld=$(echo "$st" | sed -n 's/.*load \([0-9.]*\) .*/\1/p')
    if [ "$others" -eq 0 ] && [ "${bl:-0}" -eq 0 ] && awk "BEGIN{exit !($ld < 6)}"; then echo "quiet (load $ld)"; return 0; fi
    sleep 15
  done
  echo "NOT quiet: $others other Chromes, ${bl:-0} Blenders, load $ld"
}
for k in "${kinds[@]}"; do
  if [ "$k" = high ]; then qa="${QA_HIGH:-}"; qb="tier=high&adapt=0"; vp=""; else qa="${QA_PHONE:-}"; qb="tier=low&adapt=0"; vp="--viewport 390x844x3"; fi
  for rep in 1 2; do
    for side in A B; do
      url=$([ $side = A ] && echo "$A/world.html?$qa" || echo "$B/world.html?$qb")
      q=$(quiet)
      echo "== $(date +%T) $k $side rep $rep ($q) $url" | tee -a "$out/ab.log"
      timeout 2400 tools/chrome_slot.sh node tools/bench_page.mjs "$url" "$out/${k}_${side}_$rep" --configs gen/perf/batch1/bench_$k.json --secs 3 $vp > "$out/${k}_${side}_$rep.log" 2>&1
      grep -v "^warm" "$out/${k}_${side}_$rep.log" | grep "fps" | tee -a "$out/ab.log"
    done
  done
done
echo "== $(date +%T) done" | tee -a "$out/ab.log"
