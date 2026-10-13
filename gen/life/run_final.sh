#!/usr/bin/env bash
# The life pass's final runs, one after another (each takes a Chrome slot): the switch, the cost A/B on the phone proxy,
# the page regression, the look shots. Logs in gen/life/check and gen/life/perf.
cd /home/ran/3d_director/qingming
timeout 1500 tools/chrome_slot.sh node gen/life/off_check.mjs > gen/life/check/off_check.log 2>&1
timeout 2400 tools/chrome_slot.sh node gen/life/life_cost.mjs after_1 > gen/life/perf/after_1.log 2>&1
timeout 5400 tools/chrome_slot.sh bash gen/expand/round2/page_qa/regress.sh life1 > gen/life/check/regress_life1.log 2>&1
timeout 2400 tools/chrome_slot.sh node gen/life/life_check.mjs look_desk_en --desktop --url "http://127.0.0.1:5190/world.html?start=0&tier=high&adapt=0&talk=1" --views storyteller,crossroads,street,fortune,crown,grain_wharf,doctor --secs 20 --shots --lang zh_en --scenes V6.5,V4.2 > gen/life/check/look_desk_en.log 2>&1
timeout 2400 tools/chrome_slot.sh node gen/life/life_check.mjs look_phone --phone --url "http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&talk=1" --views storyteller,crossroads,street,fortune,crown,stall --secs 24 --shots > gen/life/check/look_phone.log 2>&1
echo done
