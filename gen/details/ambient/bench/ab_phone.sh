#!/usr/bin/env bash
# ambient off (?ambient=0) against on, page loads interleaved A B A B, the phone proxy at the low tier
# (tools/bench_page.mjs, gen/details/ambient/bench/bench_phone.json), each in a Chrome slot on the check server
set -u
QM=/home/ran/3d_director/qingming; cd "$QM"
O=gen/details/ambient/bench/ab_${1:-phone}; mkdir -p $O
B="http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&gpumem=1"
for rep in 1 2; do
  for side in off on; do
    q=$([ $side = off ] && echo "" || echo "&ambient=1") # opt-in since 2026-10-13 03:40
    echo "== $(date +%T) $side rep $rep" | tee -a $O/ab.log
    timeout 2400 tools/chrome_slot.sh node tools/bench_page.mjs "$B$q" "$O/${side}_$rep" --configs gen/details/ambient/bench/bench_phone.json --secs 3 --viewport 390x844x3 > "$O/${side}_$rep.log" 2>&1
    grep -v "^warm" "$O/${side}_$rep.log" | grep "fps" | tee -a $O/ab.log
  done
done
echo "== $(date +%T) done" | tee -a $O/ab.log
