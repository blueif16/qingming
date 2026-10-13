#!/usr/bin/env bash
# batch 2's pre-deploy checks on the final snapshot (5199): load check, the regression at the default tier and at low
cd /home/ran/3d_director/qingming
U=http://127.0.0.1:5199
O=gen/perf/batch2/final
mkdir -p $O
timeout 900 tools/chrome_slot.sh node tools/check_deploy.mjs "$U/world.html" --shot $O/check_shot.png > $O/check_deploy.log 2>&1; tail -3 $O/check_deploy.log
WORLD_URL="$U/world.html" BOATS_URL="$U/boats.html" timeout 3600 tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh b2_final_default > $O/regress_default.out 2>&1
cat gen/expand/round2/page_qa/b2_final_default/summary.txt
WORLD_URL="$U/world.html?tier=low" BOATS_URL="$U/boats.html?tier=low" timeout 3600 tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh b2_final_low world people > $O/regress_low.out 2>&1
cat gen/expand/round2/page_qa/b2_final_low/summary.txt
echo "== done $(date +%T)"
