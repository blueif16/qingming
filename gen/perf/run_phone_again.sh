#!/usr/bin/env bash
# phone_4x again (the first try met web/src mid-edit by another session: boats.js imported a boatflow.js not yet written)
set -u
cd /home/ran/3d_director/qingming
until grep -q "all done" gen/perf/run_rest.log; do sleep 15; done
echo "== $(date +%T) phone_4x"
timeout 5400 tools/chrome_slot.sh node gen/perf/probe.mjs bench http://127.0.0.1:5190/world.html gen/perf/phone_4x --viewport 390x844x3 --views crown,grain_wharf,storyteller --secs 2.5 --reps 3 --settle 1500 --freeze 1 --throttle 4 --extra-throttle 6 \
  --exps noop,mrt,mrt_nomsaa,boats_plain,ink_off,shadows_off,shadow_cache,shadow_people_only,crowd_hidden,crowd_radius_30,world_hidden,msaa_off,res_100 > gen/perf/phone_4x.log 2>&1
echo "== $(date +%T) phone done"
