#!/usr/bin/env bash
# the first view('crown') after load: which change drops the player? (lead, batch 2)
cd /home/ran/3d_director/qingming
B=$1; out=gen/perf/batch2/bisect/log.txt
python3 gen/perf/batch2/serve.py $B 5194 web/vercel.json >/dev/null 2>&1 & SP=$!
sleep 1
E='({cur: __test.stream.stats().cur, loaded: __test.stream.stats().loaded.join(","), pos: __test.player.pos.toArray().map(v=>+v.toFixed(2))})'
Q='tier=low&adapt=0&hour=11&start=0'
for v in "5194 $Q" "5194 $Q&smallcards=0" "5194 $Q&shadowcache=0" "5194 $Q&boatflow=moored" "5194 $Q&cells=0&smallcards=0&shadowcache=0&boatflow=moored" "5195 $Q"; do
  set -- $v
  echo "== $1 $2" >> $out
  timeout 400 tools/chrome_slot.sh node gen/perf/batch2/cells/page_eval.mjs "http://127.0.0.1:$1/world.html?$2" "$E" --views crown,crown 2>&1 | grep -v "^\[" | tr -d '\n' >> $out; echo >> $out
done
kill $SP
echo "== done $(date +%T)" >> $out
