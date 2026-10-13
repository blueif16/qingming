#!/usr/bin/env bash
# the page regression (gen/expand/round2/page_qa/regress.sh) at each tier: gen/perf/batch1/regress_tiers.sh <step tag> [tiers]
set -u
cd /home/ran/3d_director/qingming
step=$1; shift; tiers=("$@"); [ ${#tiers[@]} -gt 0 ] || tiers=(high mid low)
for t in "${tiers[@]}"; do
  WORLD_URL="http://127.0.0.1:5190/world.html?tier=$t" BOATS_URL="http://127.0.0.1:5190/boats.html?tier=$t" \
    tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh "b1_${step}_$t"
done
for t in "${tiers[@]}"; do echo "== $t"; cat "gen/expand/round2/page_qa/b1_${step}_$t/summary.txt"; done
