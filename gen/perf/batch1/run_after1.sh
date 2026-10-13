#!/usr/bin/env bash
# after steps 1-5 (snapshot s345b on 5198): look, A/B benches against the before build (5195), memory, first load
set -u
cd /home/ran/3d_director/qingming
O=gen/perf/batch1/after1
mkdir -p $O
S=tools/chrome_slot.sh
gen/perf/batch1/look_tiers.sh $O/look storyteller,crown,under_arch,grain_wharf,moorings_bank,farmsteads http://127.0.0.1:5198 > $O/look.log 2>&1
gen/perf/batch1/ab_bench.sh $O/ab http://127.0.0.1:5195 http://127.0.0.1:5198 high phone > $O/ab.out 2>&1
timeout 1800 $S node gen/perf/probe.mjs memory "http://127.0.0.1:5198/world.html?gpumem=1&tier=low&adapt=0" $O/memory_phone --viewport 390x844x3 --views crown,grain_wharf > $O/memory_phone.log 2>&1
timeout 1800 $S node gen/perf/probe.mjs memory "http://127.0.0.1:5198/world.html?gpumem=1&tier=high&adapt=0" $O/memory_desk --views crown > $O/memory_desk.log 2>&1
timeout 2400 $S node gen/perf/probe.mjs load "http://127.0.0.1:5198/world.html?tier=low" $O/load_fast4g --viewport 390x844x3 --net fast4g --throttle 4 --warm 1 > $O/load_fast4g.log 2>&1
timeout 2400 $S node gen/perf/probe.mjs load "http://127.0.0.1:5195/world.html" $O/load_fast4g_before --viewport 390x844x3 --net fast4g --throttle 4 --warm 1 > $O/load_fast4g_before.log 2>&1
echo "== $(date +%T) after1 done"
