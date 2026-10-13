#!/usr/bin/env bash
# ab_bench.sh with whole page URLs (so one build can be benched against itself with a switch, e.g. ?shadowcache=0):
#   gen/perf/batch2/framerate/ab_q.sh <out_dir> "<url A ending in ? or &>" "<url B ...>" [high|phone ...]
# each side gets tier=low&adapt=0 (phone, 390 x 844 at DPR 3) or tier=high&adapt=0 (high) appended; A B A B, each run
# waiting up to 2 minutes for a quiet machine (no other check Chrome, load under 6).
set -u
QM=/home/ran/3d_director/qingming
cd "$QM"
out=$1 A=$2 B=$3; shift 3; kinds=("$@"); [ ${#kinds[@]} -gt 0 ] || kinds=(phone)
mkdir -p "$out"
quiet() {
  for _ in $(seq ${QUIET_TRIES:-8}); do
    st=$(tools/machine.sh status)
    others=$(echo "$st" | grep -c "slot  *chrome [0-9] taken")
    ld=$(echo "$st" | sed -n 's/.*load \([0-9.]*\) .*/\1/p')
    if [ "$others" -eq 0 ] && awk "BEGIN{exit !($ld < 6)}"; then echo "quiet (load $ld)"; return 0; fi
    sleep 15
  done
  echo "NOT quiet: $others other Chromes, load $ld"
}
for k in "${kinds[@]}"; do
  if [ "$k" = high ]; then q="tier=high&adapt=0"; vp=""; else q="tier=low&adapt=0"; vp="--viewport 390x844x3"; fi
  for rep in 1 2; do
    for side in A B; do
      url=$([ $side = A ] && echo "$A$q" || echo "$B$q")
      st=$(quiet)
      echo "== $(date +%T) $k $side rep $rep ($st) $url" | tee -a "$out/ab.log"
      timeout 2400 tools/chrome_slot.sh node tools/bench_page.mjs "$url" "$out/${k}_${side}_$rep" --configs gen/perf/batch1/bench_$k.json --secs 3 $vp > "$out/${k}_${side}_$rep.log" 2>&1
      grep -v "^warm" "$out/${k}_${side}_$rep.log" | grep "fps" | tee -a "$out/ab.log"
    done
  done
done
echo "== $(date +%T) done" | tee -a "$out/ab.log"
