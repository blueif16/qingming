#!/usr/bin/env bash
# The batch's look check in one page load per view set: the old pipeline (separate normal pass, 4x MSAA half float)
# as the base, then high, mid and low as the batch draws them, then the base again (the noise floor).
#   gen/perf/batch1/look_tiers.sh <out_dir> [views] [base_url]
set -u
QM=/home/ran/3d_director/qingming
cd "$QM"
out=$1 views=${2:-storyteller,crown,under_arch,grain_wharf,moorings_bank,farmsteads} base=${3:-http://127.0.0.1:5190}
LEG="__test.tiers.apply('high','look'); __test.post.configure({mrt:false, samples:4, hdr:true, fxaa:false}); __test.legacy?.(true)"
HIGH="__test.legacy?.(false); __test.tiers.apply('high','look'); __test.post.configure({mrt:true, samples:4, hdr:true, fxaa:false})"
MID="__test.legacy?.(false); __test.post.configure({mrt:true}); __test.tiers.apply('mid','look')"
LOW="__test.legacy?.(false); __test.tiers.apply('low','look')"
timeout 1800 tools/chrome_slot.sh node gen/perf/batch1/look.mjs "$base/world.html?hour=11&tier=high&adapt=0&window=1" "$out" --views "$views" \
  --setup "$LEG" --variant "high=$HIGH" --variant "mid=$MID" --variant "low=$LOW" --reset "$LEG"
