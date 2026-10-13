#!/usr/bin/env bash
# The perf study's runs, one Chrome slot at a time (gen/perf/probe.mjs; the machine rules of the skill
# scroll-section, "Machine resources"). Each bench waits for a quiet machine before it measures a view, measures with
# the scene's time frozen (all per-frame work still done, dt = 0) and reads every experiment A/B against the bases
# right beside it (3 pairs; noop = the noise floor).
set -u
QM=/home/ran/3d_director/qingming
cd "$QM"
U=http://127.0.0.1:5190/world.html
AB="--reps 3 --settle 1500 --freeze 1"
run() { echo "== $(date +%T) $*"; timeout 5400 tools/chrome_slot.sh node gen/perf/probe.mjs "$@"; }
# 1. a phone: 390x844 at DPR 3 (the page caps it at 1.5), touch (1024 shadow map), CPU 4x slower (6x for the base)
run bench $U gen/perf/phone_4x --viewport 390x844x3 --views crown,grain_wharf,storyteller --secs 2.5 $AB --throttle 4 --extra-throttle 6 \
  --exps noop,mrt,mrt_nomsaa,boats_plain,ink_off,shadows_off,shadow_cache,shadow_people_only,crowd_hidden,crowd_radius_30,world_hidden,msaa_off,res_100 > gen/perf/phone_4x.log 2>&1
# 2. the GPU side: the 4070 at 3840x2160 (pixel-heavy; on this GPU the frame is still partly CPU-fed, see proposal)
run bench $U gen/perf/gpu_4k --viewport 1920x1080x2 --cap 2 --views crown,grain_wharf,storyteller --secs 1.5 $AB --throttle 1 --profile 0 --overdraw 0 \
  --exps noop,mrt,mrt_nomsaa,msaa_off,color_u8,boats_plain,ink_off,shadows_off,shadow_cache,crowd_hidden,crowd_quarter_tris,crowd_cheap_skin,cell_cull_8m,res_075 > gen/perf/gpu_4k.log 2>&1
# 3. desktop 1080p at full CPU speed, the same list (and the per-pass split)
run bench $U gen/perf/desk_frozen --views crown,grain_wharf --secs 1.5 $AB --throttle 1 --extra-throttle 4 \
  --exps noop,mrt,mrt_nomsaa,boats_plain,ink_off,shadows_off,shadow_cache,shadow_people_only,crowd_hidden,crowd_quarter_tris,world_hidden,msaa_off > gen/perf/desk_frozen.log 2>&1
# 4. peaks while streaming on a phone viewport (GPU bytes counted at the GL calls)
run stream "$U?gpumem=1" gen/perf/stream_phone --viewport 390x844x3 > gen/perf/stream_phone.log 2>&1
# 5. first visit on fast 4G, a phone, CPU 4x: the live deployment (brotli, CDN)
run load https://qingming-delta.vercel.app/world.html gen/perf/load_fast4g --viewport 390x844x3 --net fast4g --throttle 4 > gen/perf/load_fast4g.log 2>&1
# 6. where a section load's main-thread time goes at CPU 4x (S1 countryside coming in)
run loadprofile $U gen/perf/loadprof_4x --viewport 390x844x3 --from crown --to grain_wharf --throttle 4 > gen/perf/loadprof_4x.log 2>&1
# 7. memory on a phone viewport with the heap split (JS objects vs ArrayBuffers) and the people in view by distance
run memory "$U?gpumem=1" gen/perf/memory_phone --viewport 390x844x3 --views crown,grain_wharf,storyteller > gen/perf/memory_phone.log 2>&1
echo "== $(date +%T) all done"
