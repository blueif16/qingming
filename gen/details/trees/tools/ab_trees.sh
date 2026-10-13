#!/usr/bin/env bash
# Cards (A: ?trees=cards) against 3D trees (B), interleaved A B A B per tier, each run in a fresh Chrome slot with the
# settings the numbers need pinned by the config's first entry (shadows on, toon): gen/details/trees/tools/ab_trees.sh <out> [high|mid|phone ...]
set -u
QM=/home/ran/3d_director/qingming
cd "$QM"
out=$1; shift; kinds=("$@"); [ ${#kinds[@]} -gt 0 ] || kinds=(high mid phone)
mkdir -p "$out"
B=http://127.0.0.1:5190/world.html
for k in "${kinds[@]}"; do
  case $k in
    high) q="start=0&tier=high&adapt=0"; vp="" ;;
    mid) q="start=0&tier=mid&adapt=0"; vp="" ;;
    phone) q="start=0&tier=low&adapt=0"; vp="--viewport 390x844x3" ;;
    phonelong) q="start=0&tier=low&adapt=0"; vp="--viewport 390x844x3" ;;
    phonegate) q="start=0&tier=low&adapt=0&sections=inner_city,gate,outer_road"; vp="--viewport 390x844x3" ;;
  esac
  for rep in $(seq 1 ${REPS:-2}); do
    for side in A B; do
      url="$B?$q$([ $side = A ] && echo "&trees=cards" || echo "&trees=3d")"
      echo "== $(date +%T) $k $side rep $rep $url" | tee -a "$out/ab.log"
      timeout 2400 tools/chrome_slot.sh node tools/bench_page.mjs "$url" "$out/${k}_${side}_$rep" --configs gen/details/trees/bench/ab/bench_$k.json --secs 3 $vp > "$out/${k}_${side}_$rep.log" 2>&1
      grep -v "^warm" "$out/${k}_${side}_$rep.log" | grep "fps" | tee -a "$out/ab.log"
    done
  done
done
echo "== $(date +%T) done" | tee -a "$out/ab.log"
